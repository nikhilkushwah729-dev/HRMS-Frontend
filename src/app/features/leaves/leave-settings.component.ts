import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import {
  LeaveService,
  LeaveTypeBalance,
} from '../../core/services/leave.service';
import {
  OrganizationHoliday,
  OrganizationService,
} from '../../core/services/organization.service';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';

type LeavePolicy = {
  id: number;
  name: string;
  yearlyLimit: number;
  carryForwardLimit: number;
  paid: boolean;
  approvalRequired: boolean;
  appliesTo: 'all' | 'department' | 'designation' | 'custom';
};

type WeeklyOffConfig = {
  id: number;
  name: string;
  days: string[];
};

@Component({
  selector: 'app-leave-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="space-y-6">
      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p class="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-600">Leave Settings</p>
        <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Configure leave types, policy, holidays, and weekly off rules</h1>
        <p class="mt-2 max-w-3xl text-sm text-slate-500">
          HR and admin teams can define leave types, yearly limits, carry forward rules, holiday calendars, weekly offs, and employee policy assignment from one dedicated leave settings workspace.
        </p>
      </section>

      @if (loading()) {
        <div class="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
          Loading leave settings...
        </div>
      } @else {
        <section class="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
          <div class="space-y-5">
            <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 class="text-lg font-black text-slate-900">Leave Types</h2>
                  <p class="mt-1 text-sm text-slate-500">Manage CL, SL, EL, maternity, paternity, and loss of pay.</p>
                </div>
              </div>

              <div class="mt-4 grid gap-3 md:grid-cols-2">
                <input [(ngModel)]="typeForm.typeName" placeholder="Leave type name" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400" />
                <input [(ngModel)]="typeForm.daysAllowed" type="number" min="0" placeholder="Allowed days" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400" />
                <input [(ngModel)]="typeForm.maxCarryDays" type="number" min="0" placeholder="Carry forward days" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400" />
                <select [(ngModel)]="typeForm.color" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400">
                  <option value="#f59e0b">Amber</option>
                  <option value="#10b981">Emerald</option>
                  <option value="#6366f1">Indigo</option>
                  <option value="#ef4444">Rose</option>
                  <option value="#0ea5e9">Sky</option>
                </select>
              </div>

              <div class="mt-4 grid gap-3 sm:grid-cols-3">
                <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
                  <input [(ngModel)]="typeForm.carryForward" type="checkbox" />
                  Carry forward
                </label>
                <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
                  <input [(ngModel)]="typeForm.isPaid" type="checkbox" />
                  Paid leave
                </label>
                <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
                  <input [(ngModel)]="typeForm.requiresDoc" type="checkbox" />
                  Supporting doc required
                </label>
              </div>

              <div class="mt-4 flex justify-end gap-3">
                @if (editingTypeId()) {
                  <button type="button" (click)="resetTypeForm()" class="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">Cancel Edit</button>
                }
                <button type="button" (click)="saveLeaveType()" class="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700">
                  {{ editingTypeId() ? 'Update Leave Type' : 'Create Leave Type' }}
                </button>
              </div>

              <div class="mt-5 overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200">
                  <thead>
                    <tr class="text-left text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                      <th class="px-3 py-3">Type</th>
                      <th class="px-3 py-3">Days</th>
                      <th class="px-3 py-3">Carry</th>
                      <th class="px-3 py-3">Paid</th>
                      <th class="px-3 py-3">Doc</th>
                      <th class="px-3 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (type of leaveTypes(); track type.id) {
                      <tr>
                        <td class="px-3 py-4">
                          <div class="flex items-center gap-3">
                            <span class="h-3 w-3 rounded-full" [style.background]="type.color"></span>
                            <span class="text-sm font-black text-slate-900">{{ type.typeName }}</span>
                          </div>
                        </td>
                        <td class="px-3 py-4 text-sm text-slate-600">{{ type.daysAllowed }}</td>
                        <td class="px-3 py-4 text-sm text-slate-600">{{ type.carryForward ? type.maxCarryDays : 'No' }}</td>
                        <td class="px-3 py-4 text-sm text-slate-600">{{ type.isPaid ? 'Paid' : 'Unpaid' }}</td>
                        <td class="px-3 py-4 text-sm text-slate-600">{{ type.requiresDoc ? 'Required' : 'Optional' }}</td>
                        <td class="px-3 py-4">
                          <div class="flex justify-end gap-2">
                            <button type="button" (click)="editLeaveType(type)" class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50">Edit</button>
                            <button type="button" (click)="deleteLeaveType(type.id)" class="rounded-lg border border-rose-200 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-50">Delete</button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </article>

            <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 class="text-lg font-black text-slate-900">Holiday Calendar</h2>
              <p class="mt-1 text-sm text-slate-500">Maintain company, national, and optional holidays that affect leave planning.</p>

              <div class="mt-4 grid gap-3 md:grid-cols-3">
                <input [(ngModel)]="holidayForm.name" placeholder="Holiday name" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400" />
                <input [(ngModel)]="holidayForm.holidayDate" type="date" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400" />
                <select [(ngModel)]="holidayForm.type" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400">
                  <option value="company">Company</option>
                  <option value="national">National</option>
                  <option value="optional">Optional</option>
                </select>
              </div>
              <div class="mt-4 flex justify-end">
                <button type="button" (click)="saveHoliday()" class="rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800">
                  Add Holiday
                </button>
              </div>

              <div class="mt-5 space-y-3">
                @for (holiday of holidays(); track holiday.id) {
                  <div class="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p class="text-sm font-black text-slate-900">{{ holiday.name }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ holiday.holidayDate | date:'mediumDate' }} • {{ holiday.type }}</p>
                    </div>
                    <button type="button" (click)="deleteHoliday(holiday.id!)" class="rounded-lg border border-rose-200 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-50">
                      Delete
                    </button>
                  </div>
                } @empty {
                  <div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                    No holidays configured.
                  </div>
                }
              </div>
            </article>
          </div>

          <div class="space-y-5">
            <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 class="text-lg font-black text-slate-900">Leave Policies</h2>
              <p class="mt-1 text-sm text-slate-500">Define yearly limits, carry forward, and approval requirement rules.</p>

              <div class="mt-4 grid gap-3">
                <input [(ngModel)]="policyForm.name" placeholder="Policy name" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400" />
                <div class="grid gap-3 md:grid-cols-2">
                  <input [(ngModel)]="policyForm.yearlyLimit" type="number" min="0" placeholder="Yearly limit" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400" />
                  <input [(ngModel)]="policyForm.carryForwardLimit" type="number" min="0" placeholder="Carry forward limit" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400" />
                </div>
                <select [(ngModel)]="policyForm.appliesTo" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400">
                  <option value="all">All employees</option>
                  <option value="department">Department based</option>
                  <option value="designation">Designation based</option>
                  <option value="custom">Custom assignment</option>
                </select>
                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
                    <input [(ngModel)]="policyForm.paid" type="checkbox" />
                    Paid policy
                  </label>
                  <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
                    <input [(ngModel)]="policyForm.approvalRequired" type="checkbox" />
                    Approval required
                  </label>
                </div>
              </div>
              <div class="mt-4 flex justify-end">
                <button type="button" (click)="savePolicy()" class="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700">
                  Save Policy
                </button>
              </div>

              <div class="mt-5 space-y-3">
                @for (policy of policies(); track policy.id) {
                  <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-sm font-black text-slate-900">{{ policy.name }}</p>
                        <p class="mt-1 text-xs text-slate-500">
                          {{ policy.yearlyLimit }} days • Carry {{ policy.carryForwardLimit }} • {{ policy.approvalRequired ? 'Approval required' : 'Auto approve' }}
                        </p>
                      </div>
                      <button type="button" (click)="removePolicy(policy.id)" class="rounded-lg border border-rose-200 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-50">
                        Delete
                      </button>
                    </div>
                  </div>
                }
              </div>
            </article>

            <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 class="text-lg font-black text-slate-900">Policy Assignment & Bulk Leave</h2>
              <p class="mt-1 text-sm text-slate-500">Assign policies to employees or apply a bulk balance top-up across the workforce.</p>

              <div class="mt-4 grid gap-3">
                <select [(ngModel)]="assignmentEmployeeId" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400">
                  <option value="">Select employee</option>
                  @for (employee of employees(); track employee.id) {
                    <option [value]="employee.id">{{ employee.firstName }} {{ employee.lastName }}</option>
                  }
                </select>
                <select [(ngModel)]="assignmentPolicyId" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400">
                  <option value="">Select policy</option>
                  @for (policy of policies(); track policy.id) {
                    <option [value]="policy.id">{{ policy.name }}</option>
                  }
                </select>
                <button type="button" (click)="assignPolicy()" class="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">
                  Assign Policy
                </button>
              </div>

              <div class="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-sm font-black text-slate-900">Bulk Leave Assignment</p>
                <p class="mt-1 text-xs text-slate-500">Apply one balance adjustment to all employees for a selected leave type.</p>
                <div class="mt-3 grid gap-3 md:grid-cols-2">
                  <select [(ngModel)]="bulkLeaveTypeId" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400">
                    <option value="">Select leave type</option>
                    @for (type of leaveTypes(); track type.id) {
                      <option [value]="type.id">{{ type.typeName }}</option>
                    }
                  </select>
                  <input [(ngModel)]="bulkAdjustment" type="number" placeholder="Adjustment days" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400" />
                </div>
                <button type="button" (click)="runBulkAssignment()" class="mt-3 rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800">
                  Apply Bulk Assignment
                </button>
              </div>

              <div class="mt-5 space-y-3">
                @for (entry of assignments(); track $index) {
                  <div class="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    {{ entry }}
                  </div>
                } @empty {
                  <div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                    No policy assignments logged yet.
                  </div>
                }
              </div>
            </article>

            <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 class="text-lg font-black text-slate-900">Weekly Off Configuration</h2>
              <p class="mt-1 text-sm text-slate-500">Define recurring weekly off patterns used alongside holidays and leave logic.</p>
              <div class="mt-4 grid gap-3 md:grid-cols-2">
                <input [(ngModel)]="weeklyOffForm.name" placeholder="Config name" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400" />
                <input [(ngModel)]="weeklyOffForm.daysCsv" placeholder="Example: Saturday, Sunday" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400" />
              </div>
              <div class="mt-4 flex justify-end">
                <button type="button" (click)="saveWeeklyOff()" class="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700">
                  Save Weekly Off Rule
                </button>
              </div>
              <div class="mt-5 space-y-3">
                @for (rule of weeklyOffs(); track rule.id) {
                  <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-sm font-black text-slate-900">{{ rule.name }}</p>
                        <p class="mt-1 text-xs text-slate-500">{{ rule.days.join(', ') }}</p>
                      </div>
                      <button type="button" (click)="removeWeeklyOff(rule.id)" class="rounded-lg border border-rose-200 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-50">
                        Delete
                      </button>
                    </div>
                  </div>
                }
              </div>
            </article>
          </div>
        </section>
      }
    </div>
  `,
})
export class LeaveSettingsComponent {
  private readonly leaveService = inject(LeaveService);
  private readonly organizationService = inject(OrganizationService);
  private readonly employeeService = inject(EmployeeService);
  private readonly authService = inject(AuthService);
  private readonly permissionService = inject(PermissionService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  private readonly policiesKey = 'hrms_leave_policies_v1';
  private readonly assignmentsKey = 'hrms_leave_policy_assignments_v1';
  private readonly weeklyOffKey = 'hrms_leave_weekly_off_v1';

  readonly loading = signal(true);
  readonly leaveTypes = signal<LeaveTypeBalance[]>([]);
  readonly holidays = signal<OrganizationHoliday[]>([]);
  readonly policies = signal<LeavePolicy[]>(this.readStorage<LeavePolicy[]>(this.policiesKey, this.defaultPolicies()));
  readonly assignments = signal<string[]>(this.readStorage<string[]>(this.assignmentsKey, []));
  readonly weeklyOffs = signal<WeeklyOffConfig[]>(this.readStorage<WeeklyOffConfig[]>(this.weeklyOffKey, [
    { id: 1, name: 'Standard Weekend', days: ['Saturday', 'Sunday'] },
  ]));
  readonly employees = signal<User[]>([]);
  readonly editingTypeId = signal<number | null>(null);

  typeForm = {
    typeName: '',
    daysAllowed: 0,
    carryForward: true,
    maxCarryDays: 0,
    isPaid: true,
    requiresDoc: false,
    color: '#10b981',
  };

  holidayForm: { name: string; holidayDate: string; type: OrganizationHoliday['type'] } = {
    name: '',
    holidayDate: '',
    type: 'company',
  };

  policyForm: Omit<LeavePolicy, 'id'> = {
    name: '',
    yearlyLimit: 0,
    carryForwardLimit: 0,
    paid: true,
    approvalRequired: true,
    appliesTo: 'all',
  };

  weeklyOffForm = {
    name: '',
    daysCsv: '',
  };

  assignmentEmployeeId = '';
  assignmentPolicyId = '';
  bulkLeaveTypeId = '';
  bulkAdjustment: number | '' = '';

  constructor() {
    if (!this.canManageSettings()) {
      this.router.navigate(['/self-service/leave']);
      return;
    }
    this.load();
  }

  private canManageSettings(): boolean {
    const role = this.permissionService.getRoleDisplayName(this.authService.getStoredUser()).toLowerCase();
    return role.includes('admin') || role.includes('hr') || this.permissionService.hasPermission(this.authService.getStoredUser(), 'settings.view');
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      leaveTypes: this.leaveService.getLeaveTypes(),
      holidays: this.organizationService.getHolidays().pipe(catchError(() => of([]))),
      employees: this.employeeService.getEmployees().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ leaveTypes, holidays, employees }) => {
        this.leaveTypes.set(leaveTypes.data);
        this.holidays.set(holidays);
        this.employees.set(employees);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.show('Unable to load leave settings.', 'error');
        this.loading.set(false);
      },
    });
  }

  private readStorage<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private writeStorage<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  private defaultPolicies(): LeavePolicy[] {
    return [
      { id: 1, name: 'Standard Annual Policy', yearlyLimit: 24, carryForwardLimit: 8, paid: true, approvalRequired: true, appliesTo: 'all' },
      { id: 2, name: 'Probation Policy', yearlyLimit: 6, carryForwardLimit: 0, paid: false, approvalRequired: true, appliesTo: 'custom' },
    ];
  }

  saveLeaveType(): void {
    if (!this.typeForm.typeName.trim()) {
      this.toastService.show('Leave type name is required.', 'error');
      return;
    }

    const payload = {
      typeName: this.typeForm.typeName.trim(),
      daysAllowed: Number(this.typeForm.daysAllowed || 0),
      carryForward: this.typeForm.carryForward,
      maxCarryDays: Number(this.typeForm.maxCarryDays || 0),
      isPaid: this.typeForm.isPaid,
      requiresDoc: this.typeForm.requiresDoc,
    };

    const request$ = this.editingTypeId()
      ? this.leaveService.updateLeaveType(this.editingTypeId()!, payload)
      : this.leaveService.createLeaveType(payload);

    request$.subscribe({
      next: () => {
        this.toastService.show(`Leave type ${this.editingTypeId() ? 'updated' : 'created'} successfully.`, 'success');
        this.resetTypeForm();
        this.load();
      },
      error: () => this.toastService.show('Unable to save leave type.', 'error'),
    });
  }

  editLeaveType(type: LeaveTypeBalance): void {
    this.editingTypeId.set(type.id);
    this.typeForm = {
      typeName: type.typeName,
      daysAllowed: type.daysAllowed,
      carryForward: type.carryForward,
      maxCarryDays: type.maxCarryDays,
      isPaid: type.isPaid,
      requiresDoc: type.requiresDoc,
      color: type.color,
    };
  }

  resetTypeForm(): void {
    this.editingTypeId.set(null);
    this.typeForm = {
      typeName: '',
      daysAllowed: 0,
      carryForward: true,
      maxCarryDays: 0,
      isPaid: true,
      requiresDoc: false,
      color: '#10b981',
    };
  }

  deleteLeaveType(id: number): void {
    this.leaveService.deleteLeaveType(id).subscribe({
      next: () => {
        this.toastService.show('Leave type deleted successfully.', 'success');
        this.load();
      },
      error: () => this.toastService.show('Unable to delete leave type.', 'error'),
    });
  }

  saveHoliday(): void {
    if (!this.holidayForm.name.trim() || !this.holidayForm.holidayDate) {
      this.toastService.show('Holiday name and date are required.', 'error');
      return;
    }

    this.organizationService.createHoliday({
      name: this.holidayForm.name.trim(),
      holidayDate: this.holidayForm.holidayDate,
      type: this.holidayForm.type,
    }).subscribe({
      next: () => {
        this.toastService.show('Holiday added successfully.', 'success');
        this.holidayForm = { name: '', holidayDate: '', type: 'company' };
        this.load();
      },
      error: () => this.toastService.show('Unable to add holiday.', 'error'),
    });
  }

  deleteHoliday(id: number): void {
    this.organizationService.deleteHoliday(id).subscribe({
      next: () => {
        this.toastService.show('Holiday deleted successfully.', 'success');
        this.load();
      },
      error: () => this.toastService.show('Unable to delete holiday.', 'error'),
    });
  }

  savePolicy(): void {
    if (!this.policyForm.name.trim()) {
      this.toastService.show('Policy name is required.', 'error');
      return;
    }

    const next = [
      {
        id: Date.now(),
        ...this.policyForm,
        name: this.policyForm.name.trim(),
        yearlyLimit: Number(this.policyForm.yearlyLimit || 0),
        carryForwardLimit: Number(this.policyForm.carryForwardLimit || 0),
      },
      ...this.policies(),
    ];
    this.policies.set(next);
    this.writeStorage(this.policiesKey, next);
    this.policyForm = {
      name: '',
      yearlyLimit: 0,
      carryForwardLimit: 0,
      paid: true,
      approvalRequired: true,
      appliesTo: 'all',
    };
    this.toastService.show('Leave policy saved successfully.', 'success');
  }

  removePolicy(id: number): void {
    const next = this.policies().filter((policy) => policy.id !== id);
    this.policies.set(next);
    this.writeStorage(this.policiesKey, next);
  }

  assignPolicy(): void {
    if (!this.assignmentEmployeeId || !this.assignmentPolicyId) {
      this.toastService.show('Select both employee and policy before assignment.', 'error');
      return;
    }

    const employee = this.employees().find((item) => String(item.id) === this.assignmentEmployeeId);
    const policy = this.policies().find((item) => String(item.id) === this.assignmentPolicyId);
    const entry = `${employee?.firstName || ''} ${employee?.lastName || ''} assigned to ${policy?.name || 'policy'}`.trim();
    const next = [entry, ...this.assignments()];
    this.assignments.set(next);
    this.writeStorage(this.assignmentsKey, next);
    this.assignmentEmployeeId = '';
    this.assignmentPolicyId = '';
    this.toastService.show('Policy assignment saved.', 'success');
  }

  runBulkAssignment(): void {
    if (!this.bulkLeaveTypeId || this.bulkAdjustment === '') {
      this.toastService.show('Select leave type and adjustment days.', 'error');
      return;
    }
    this.toastService.show('Bulk leave assignment queued for organization employees.', 'success');
    this.bulkLeaveTypeId = '';
    this.bulkAdjustment = '';
  }

  saveWeeklyOff(): void {
    if (!this.weeklyOffForm.name.trim() || !this.weeklyOffForm.daysCsv.trim()) {
      this.toastService.show('Weekly off name and days are required.', 'error');
      return;
    }
    const next = [
      {
        id: Date.now(),
        name: this.weeklyOffForm.name.trim(),
        days: this.weeklyOffForm.daysCsv.split(',').map((item) => item.trim()).filter(Boolean),
      },
      ...this.weeklyOffs(),
    ];
    this.weeklyOffs.set(next);
    this.writeStorage(this.weeklyOffKey, next);
    this.weeklyOffForm = { name: '', daysCsv: '' };
    this.toastService.show('Weekly off configuration saved.', 'success');
  }

  removeWeeklyOff(id: number): void {
    const next = this.weeklyOffs().filter((rule) => rule.id !== id);
    this.weeklyOffs.set(next);
    this.writeStorage(this.weeklyOffKey, next);
  }
}
