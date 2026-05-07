import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-leave-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, RouterLink],
  template: `
    <div class="space-y-6">
      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p class="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-600">Leave Settings</p>
        <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Configure live leave masters and admin controls</h1>
        <p class="mt-2 max-w-3xl text-sm text-slate-500">
          This workspace is trimmed for production use. Only backend-backed leave setup remains editable here, while other operational flows are routed to their dedicated modules.
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
                <a routerLink="/settings/leave/leave-types" class="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">
                  Open Full Leave Type Master
                </a>
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
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 class="text-lg font-black text-slate-900">Holiday Calendar</h2>
                  <p class="mt-1 text-sm text-slate-500">Maintain company, national, and optional holidays that affect leave planning.</p>
                </div>
                <a routerLink="/settings/organisation/holiday" class="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">
                  Open Full Holiday Workspace
                </a>
              </div>

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
              <h2 class="text-lg font-black text-slate-900">Live Leave Governance</h2>
              <p class="mt-1 text-sm text-slate-500">Use only backend-backed setup flows for production leave operations.</p>

              <div class="mt-4 space-y-3">
                <a routerLink="/settings/leave/leave-types" class="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40">
                  <div>
                    <p class="text-sm font-black text-slate-900">Leave Type Master</p>
                    <p class="mt-1 text-xs leading-5 text-slate-500">Manage organization leave buckets from the dedicated backend-backed leave type screen.</p>
                  </div>
                  <span class="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">Live</span>
                </a>

                <a routerLink="/settings/organisation/holiday" class="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40">
                  <div>
                    <p class="text-sm font-black text-slate-900">Holiday Calendar Master</p>
                    <p class="mt-1 text-xs leading-5 text-slate-500">Review and maintain organization holidays from the central holiday settings workspace.</p>
                  </div>
                  <span class="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">Live</span>
                </a>

                <a routerLink="/settings/attendance/weekly-off" class="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40">
                  <div>
                    <p class="text-sm font-black text-slate-900">Weekly Off Policies</p>
                    <p class="mt-1 text-xs leading-5 text-slate-500">Open the weekly off policy workspace used by attendance and leave planning screens.</p>
                  </div>
                  <span class="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-amber-700">Review</span>
                </a>
              </div>
            </article>

            <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 class="text-lg font-black text-slate-900">Operational Admin Shortcuts</h2>
              <p class="mt-1 text-sm text-slate-500">Use real employee and leave workspaces for assignments, approvals, and reports.</p>

              <div class="mt-4 grid gap-3">
                <a routerLink="/leave" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-emerald-300 hover:bg-emerald-50/40">
                  <p class="text-sm font-black text-slate-900">Open Leave Management</p>
                  <p class="mt-1 text-xs leading-5 text-slate-500">Review requests, approvals, and organization leave operations in the main leave module.</p>
                </a>
                <a routerLink="/employees" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-emerald-300 hover:bg-emerald-50/40">
                  <p class="text-sm font-black text-slate-900">Open Employee Directory</p>
                  <p class="mt-1 text-xs leading-5 text-slate-500">Use employee records for assignment-linked workflows instead of local-only browser mappings.</p>
                </a>
                <a routerLink="/approval-center" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-emerald-300 hover:bg-emerald-50/40">
                  <p class="text-sm font-black text-slate-900">Open Approval Center</p>
                  <p class="mt-1 text-xs leading-5 text-slate-500">Track pending leave approvals and route actions from the shared approval queue.</p>
                </a>
              </div>
            </article>

            <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 class="text-lg font-black text-slate-900">Live Readiness Status</h2>
              <p class="mt-1 text-sm text-slate-500">This workspace now avoids browser-only leave policy saves for production safety.</p>

              <div class="mt-4 space-y-3">
                <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                  <p class="text-sm font-black text-emerald-900">Backend-backed on this page</p>
                  <p class="mt-1 text-xs leading-5 text-emerald-800">Leave types and holiday calendar changes save through real APIs.</p>
                </div>
                <div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                  <p class="text-sm font-black text-amber-900">Moved out of this page</p>
                  <p class="mt-1 text-xs leading-5 text-amber-800">Policy assignment, bulk adjustments, and weekly-off administration should run from dedicated working modules instead of local browser state.</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p class="text-sm font-black text-slate-900">Employees available</p>
                  <p class="mt-1 text-xs leading-5 text-slate-600">{{ employees().length }} employee records are currently available for leave-linked admin operations.</p>
                </div>
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
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly loading = signal(true);
  readonly leaveTypes = signal<LeaveTypeBalance[]>([]);
  readonly holidays = signal<OrganizationHoliday[]>([]);
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

  constructor() {
    if (!this.canManageSettings()) {
      this.router.navigate(['/self-service/leave']);
      return;
    }
    this.load();
  }

  private canManageSettings(): boolean {
    const user = this.authService.getStoredUser();
    const rawRole = user?.role;
    const role =
      typeof rawRole === 'string'
        ? rawRole.toLowerCase()
        : String(rawRole?.name ?? '').toLowerCase();
    return role.includes('admin') || role.includes('hr');
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
}
