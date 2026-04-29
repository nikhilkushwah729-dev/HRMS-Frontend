import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  AttendanceService,
  AttendanceShift,
} from '../../core/services/attendance.service';
import {
  OrganizationService,
  Department,
  Designation,
} from '../../core/services/organization.service';
import { EmployeeService } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { User } from '../../core/models/auth.model';
import { ToastService } from '../../core/services/toast.service';
import {
  UiSelectAdvancedComponent,
  SelectOption,
} from '../../core/components/ui/ui-select-advanced.component';

interface NormalizedAttendance {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  shiftName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | null;
  netWorkHours: number | null;
  status: string;
  lateMinutes: number;
  source: string;
  method: string;
  kioskName: string | null;
}

type AttendanceScope = 'self' | 'team' | 'organization' | 'monitoring';

@Component({
  selector: 'app-team-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    RouterLink,
    UiSelectAdvancedComponent,
  ],
  template: `
    <div class="mx-auto flex max-w-7xl flex-col gap-6 pb-10">
      <header class="sticky top-3 z-20 rounded-lg border border-slate-100 bg-white/95 p-4 shadow-lg shadow-slate-200/60 backdrop-blur sm:p-5">
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 xl:col-span-6">
            <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-600">Attendance Module</p>
            <h1 class="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">All employee attendance register</h1>
            <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              This screen is separate from self-service attendance. Use it for attendance review, late follow-up,
              regularization approvals, reports, and payroll-facing attendance control.
            </p>
          </div>

          <div class="col-span-12 grid grid-cols-1 gap-2 sm:grid-cols-3 xl:col-span-3">
            <div class="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Visible records</p>
              <p class="mt-2 text-xl font-black text-slate-900">{{ filteredAttendance().length }}</p>
            </div>
            <div class="rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-3">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-500">Working date</p>
              <p class="mt-2 text-sm font-black text-cyan-700">{{ selectedDate | date: 'dd MMM yyyy' }}</p>
            </div>
            <div class="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-500">Scope</p>
              <p class="mt-2 text-sm font-black text-emerald-700">{{ scopeLabel() }}</p>
            </div>
          </div>

          <div class="col-span-12 flex flex-col gap-3 xl:col-span-3 xl:items-end">
            <span class="rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em]" [ngClass]="scopeTone()">
              {{ scopeHelperHeadline() }}
            </span>
            <div class="flex flex-wrap justify-end gap-2">
              <button type="button" (click)="refreshData()" [disabled]="loading()"
                class="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                {{ loading() ? 'Refreshing...' : 'Refresh' }}
              </button>
              <button type="button" (click)="exportRegister()"
                class="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 transition hover:bg-emerald-100">
                Export Excel
              </button>
              <a routerLink="/attendance/reports"
                class="rounded-md border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-black text-sky-700 transition hover:bg-sky-100">
                Reports
              </a>
            </div>
          </div>
        </div>
      </header>

      <section class="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Module filters</p>
          <h2 class="mt-2 text-xl font-black text-slate-900">Search, segment, and review attendance records</h2>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            Filter by date, department, designation, shift, employee, status, and search keyword without opening self-service attendance screens.
          </p>

          <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Date</label>
              <input type="date" [(ngModel)]="selectedDate" (change)="scheduleLoadAttendance()"
                class="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-300" />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Department</label>
              <app-ui-select-advanced [(ngModel)]="selectedDepartment" (ngModelChange)="scheduleFilterAttendance()"
                [options]="departmentOptions()" placeholder="All Departments" size="sm" [searchable]="true"></app-ui-select-advanced>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Designation</label>
              <app-ui-select-advanced [(ngModel)]="selectedDesignation" (ngModelChange)="scheduleFilterAttendance()"
                [options]="designationOptions()" placeholder="All Designations" size="sm" [searchable]="true"></app-ui-select-advanced>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Shift</label>
              <app-ui-select-advanced [(ngModel)]="selectedShift" (ngModelChange)="scheduleFilterAttendance()"
                [options]="shiftOptions()" placeholder="All Shifts" size="sm" [searchable]="true"></app-ui-select-advanced>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Employee</label>
              <app-ui-select-advanced [(ngModel)]="selectedEmployee" (ngModelChange)="scheduleFilterAttendance()"
                [options]="employeeOptions()" placeholder="All Employees" size="sm" [searchable]="true"></app-ui-select-advanced>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Status</label>
              <app-ui-select-advanced [(ngModel)]="statusFilter" (ngModelChange)="scheduleFilterAttendance()"
                [options]="statusOptions" placeholder="All Status" size="sm" [searchable]="false" [showFooter]="false"></app-ui-select-advanced>
            </div>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Search</label>
              <input type="text" [(ngModel)]="searchQuery" (input)="scheduleFilterAttendance()"
                placeholder="Search employee name, code, department, designation..."
                class="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-300" />
            </div>

            <div class="flex items-end">
              <button type="button" (click)="resetFilters()"
                class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100">
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        <aside class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Role scope</p>
          <h2 class="mt-2 text-xl font-black text-slate-900">{{ scopeLabel() }} attendance access</h2>
          <p class="mt-3 text-sm leading-6 text-slate-500">{{ scopeDescription() }}</p>

          <div class="mt-5 space-y-3">
            <a routerLink="/self-service/attendance"
              class="block rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-white">
              Employee Self Service
            </a>
            <a routerLink="/attendance/regularizations"
              class="block rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 transition hover:bg-amber-100">
              Regularization Queue
            </a>
            <a routerLink="/attendance/workspace"
              class="block rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-800 transition hover:bg-cyan-100">
              Advanced Workspace
            </a>
          </div>
        </aside>
      </section>

      <section class="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
        <article class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Total</p><p class="mt-2 text-2xl font-black text-slate-900">{{ stats().total }}</p></article>
        <article class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm"><p class="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700/70">Present</p><p class="mt-2 text-2xl font-black text-emerald-700">{{ stats().present }}</p></article>
        <article class="rounded-lg border border-rose-200 bg-rose-50 p-4 shadow-sm"><p class="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-700/70">Absent</p><p class="mt-2 text-2xl font-black text-rose-700">{{ stats().absent }}</p></article>
        <article class="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm"><p class="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700/70">Late</p><p class="mt-2 text-2xl font-black text-amber-700">{{ stats().late }}</p></article>
        <article class="rounded-lg border border-orange-200 bg-orange-50 p-4 shadow-sm"><p class="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-700/70">Half Day</p><p class="mt-2 text-2xl font-black text-orange-700">{{ stats().halfDay }}</p></article>
        <article class="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm"><p class="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700/70">Leave</p><p class="mt-2 text-2xl font-black text-blue-700">{{ stats().onLeave }}</p></article>
        <article class="rounded-lg border border-violet-200 bg-violet-50 p-4 shadow-sm"><p class="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700/70">Holiday</p><p class="mt-2 text-2xl font-black text-violet-700">{{ stats().holiday }}</p></article>
        <article class="rounded-lg border border-slate-300 bg-slate-100 p-4 shadow-sm"><p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Week Off</p><p class="mt-2 text-2xl font-black text-slate-800">{{ stats().weekOff }}</p></article>
      </section>

      <section class="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div class="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Attendance register</p>
            <h2 class="mt-2 text-xl font-black text-slate-900">{{ selectedDate | date: 'mediumDate' }} attendance review</h2>
            <p class="mt-1 text-sm text-slate-500">
              Present, absent, late, half-day, leave, week-off, holiday, and attendance source details.
            </p>
          </div>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{{ filteredAttendance().length }} records</span>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-left">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Employee</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Department</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Designation</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Shift</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Check In</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Check Out</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Work Hours</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Marked Via</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 text-center">Status</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 text-right">Late</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 text-right">Actions</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-100">
              @if (loading()) {
                <tr><td colspan="11" class="px-4 py-12 text-center text-slate-400">Loading attendance data...</td></tr>
              } @else if (filteredAttendance().length === 0) {
                <tr><td colspan="11" class="px-4 py-12 text-center text-slate-400">No attendance records found for the selected filters.</td></tr>
              } @else {
                @for (record of filteredAttendance(); track record.id) {
                  <tr class="hover:bg-slate-50/60">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sm font-black text-sky-700">{{ getEmployeeInitials(record) }}</div>
                        <div class="min-w-0">
                          <p class="truncate text-sm font-bold text-slate-900">{{ record.employeeName }}</p>
                          <p class="text-[11px] text-slate-500">{{ record.employeeCode }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-600">{{ record.department }}</td>
                    <td class="px-4 py-3 text-sm text-slate-600">{{ record.designation }}</td>
                    <td class="px-4 py-3 text-sm text-slate-600">{{ record.shiftName }}</td>
                    <td class="px-4 py-3 text-sm font-semibold text-slate-700">{{ record.checkIn ? (record.checkIn | date: 'shortTime') : '--:--' }}</td>
                    <td class="px-4 py-3 text-sm font-semibold text-slate-700">{{ record.checkOut ? (record.checkOut | date: 'shortTime') : '--:--' }}</td>
                    <td class="px-4 py-3 text-sm font-semibold text-slate-700">{{ formatHours(record.netWorkHours ?? record.workHours) }}</td>
                    <td class="px-4 py-3">
                      <div class="flex flex-col gap-1">
                        <span class="text-xs font-black uppercase tracking-[0.16em] text-slate-700">{{ sourceLabel(record.source) }}</span>
                        <span class="text-[11px] text-slate-500">{{ methodLabel(record.method) }}{{ record.kioskName ? ' • ' + record.kioskName : '' }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span class="inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em]" [ngClass]="getStatusClass(record.status)">
                        {{ statusLabel(record.status) }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right text-sm font-bold text-slate-700">{{ record.lateMinutes || 0 }}m</td>
                    <td class="px-4 py-3">
                      <div class="flex items-center justify-end gap-2">
                        <button type="button" (click)="viewDetails(record)"
                          class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50">
                          View
                        </button>
                        <button *ngIf="canManualUpdate()" type="button" (click)="openManualUpdate(record)"
                          class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 transition hover:bg-amber-100">
                          Manual Update
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
})
export class TeamAttendanceComponent implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly employeeService = inject(EmployeeService);
  private readonly orgService = inject(OrganizationService);
  private readonly authService = inject(AuthService);
  private readonly permissionService = inject(PermissionService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  private filterDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly currentUser: User | null = this.authService.getStoredUser();

  loading = signal(false);
  attendanceRecords = signal<NormalizedAttendance[]>([]);
  filteredAttendance = signal<NormalizedAttendance[]>([]);
  employees = signal<User[]>([]);
  departments = signal<Department[]>([]);
  designations = signal<Designation[]>([]);
  shifts = signal<AttendanceShift[]>([]);
  scope = signal<AttendanceScope>('self');
  allowedEmployeeIds = signal<number[]>([]);

  selectedDate = new Date().toISOString().split('T')[0];
  selectedDepartment: number | null = null;
  selectedDesignation: number | null = null;
  selectedShift: number | null = null;
  selectedEmployee: number | null = null;
  statusFilter = '';
  searchQuery = '';

  stats = signal({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    onLeave: 0,
    holiday: 0,
    weekOff: 0,
  });

  readonly statusOptions: SelectOption[] = [
    { label: 'All Status', value: '' },
    { label: 'Present', value: 'present' },
    { label: 'Absent', value: 'absent' },
    { label: 'Late', value: 'late' },
    { label: 'Half Day', value: 'half_day' },
    { label: 'Leave', value: 'on_leave' },
    { label: 'Holiday', value: 'holiday' },
    { label: 'Week Off', value: 'weekend' },
  ];

  departmentOptions = computed<SelectOption[]>(() => [
    { label: 'All Departments', value: null },
    ...this.departments().map((department) => ({
      label: department.name,
      value: department.id,
    })),
  ]);

  designationOptions = computed<SelectOption[]>(() => [
    { label: 'All Designations', value: null },
    ...this.designations().map((designation) => ({
      label: designation.name,
      value: designation.id,
    })),
  ]);

  shiftOptions = computed<SelectOption[]>(() => [
    { label: 'All Shifts', value: null },
    ...this.shifts().map((shift) => ({
      label: shift.name,
      value: shift.id,
    })),
  ]);

  employeeOptions = computed<SelectOption[]>(() => [
    { label: 'All Employees', value: null },
    ...this.employees().map((employee) => ({
      label: `${this.employeeFullName(employee)}${employee.employeeCode ? ` (${employee.employeeCode})` : ''}`,
      value: this.resolveEmployeeId(employee),
    })),
  ]);

  scopeLabel = computed(() => {
    const labels: Record<AttendanceScope, string> = {
      self: 'Self',
      team: 'Manager Team',
      organization: 'Organization',
      monitoring: 'Organization Monitoring',
    };
    return labels[this.scope()];
  });

  scopeHelperHeadline = computed(() => {
    const labels: Record<AttendanceScope, string> = {
      self: 'Employee Scope',
      team: 'Team Scope',
      organization: 'All Employees',
      monitoring: 'Monitoring Scope',
    };
    return labels[this.scope()];
  });

  scopeTone = computed(() => {
    const tones: Record<AttendanceScope, string> = {
      self: 'bg-slate-100 text-slate-700',
      team: 'bg-cyan-100 text-cyan-700',
      organization: 'bg-emerald-100 text-emerald-700',
      monitoring: 'bg-violet-100 text-violet-700',
    };
    return tones[this.scope()];
  });

  scopeDescription = computed(() => {
    switch (this.scope()) {
      case 'monitoring':
        return 'Super Admin can review organization-level attendance visibility from this module without mixing into employee self-service. Use this as a monitoring and escalation surface.';
      case 'organization':
        return 'HR and organization admins can review all employee attendance, approvals, reporting, and payroll-facing attendance outcomes from one operational module.';
      case 'team':
        return 'Managers can review only their own attendance plus direct team attendance. Other departments and unrelated employees remain outside this scope.';
      default:
        return 'Employees should use self-service attendance only. This management module is not the main employee working surface.';
    }
  });

  canManualUpdate = computed(() =>
    this.permissionService.hasPermission(this.currentUser, 'attendance.update'),
  );

  ngOnInit(): void {
    this.loadReferenceData();
    this.configureScope();
  }

  ngOnDestroy(): void {
    if (this.filterDebounceTimer) {
      clearTimeout(this.filterDebounceTimer);
    }
  }

  private loadReferenceData(): void {
    this.orgService.getDepartments().subscribe({
      next: (departments) => this.departments.set(departments ?? []),
      error: () => this.departments.set([]),
    });

    this.orgService.getDesignations().subscribe({
      next: (designations) => this.designations.set(designations ?? []),
      error: () => this.designations.set([]),
    });

    this.attendanceService.getShifts().subscribe({
      next: (shifts) => this.shifts.set(shifts ?? []),
      error: () => this.shifts.set([]),
    });
  }

  private configureScope(): void {
    if (
      this.permissionService.isSuperAdminUser(this.currentUser) &&
      !this.permissionService.isOrganizationAdminUser(this.currentUser)
    ) {
      this.scope.set('monitoring');
      this.loadOrganizationEmployees();
      return;
    }

    if (
      this.permissionService.isOrganizationAdminUser(this.currentUser) ||
      this.permissionService.isHrManagerUser(this.currentUser) ||
      this.permissionService.isAdminUser(this.currentUser)
    ) {
      this.scope.set('organization');
      this.loadOrganizationEmployees();
      return;
    }

    if (this.permissionService.isManagerialUser(this.currentUser)) {
      this.scope.set('team');
      this.employeeService.getMyTeam().subscribe({
        next: (response) => {
          const currentUser = response.currentUser ?? null;
          const team = response.reportees?.length
            ? [currentUser, ...response.reportees]
            : response.members?.length
              ? response.members
              : [currentUser];
          const normalized = this.uniqueEmployees(team.filter(Boolean) as User[]);
          this.employees.set(normalized);
          this.allowedEmployeeIds.set(
            normalized.map((employee) => this.resolveEmployeeId(employee)).filter(Boolean),
          );
          this.loadAttendance();
        },
        error: () => {
          this.toastService.error('Unable to load manager team attendance scope.');
          this.loadFallbackSelfScope();
        },
      });
      return;
    }

    this.loadFallbackSelfScope();
  }

  private loadOrganizationEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (employees) => {
        const normalized = this.uniqueEmployees(employees ?? []);
        this.employees.set(normalized);
        this.allowedEmployeeIds.set(
          normalized.map((employee) => this.resolveEmployeeId(employee)).filter(Boolean),
        );
        this.loadAttendance();
      },
      error: () => {
        this.toastService.error('Unable to load employees for attendance register.');
        this.employees.set([]);
        this.allowedEmployeeIds.set([]);
        this.loadAttendance();
      },
    });
  }

  private loadFallbackSelfScope(): void {
    this.scope.set('self');
    const employee = this.currentUser ? [this.currentUser] : [];
    this.employees.set(employee);
    this.allowedEmployeeIds.set(
      employee.map((item) => this.resolveEmployeeId(item)).filter(Boolean),
    );
    this.loadAttendance();
  }

  private uniqueEmployees(employees: User[]): User[] {
    const seen = new Map<number, User>();
    employees.forEach((employee) => {
      const id = this.resolveEmployeeId(employee);
      if (!id) return;
      seen.set(id, employee);
    });
    return Array.from(seen.values());
  }

  scheduleLoadAttendance(): void {
    if (this.filterDebounceTimer) {
      clearTimeout(this.filterDebounceTimer);
    }
    this.filterDebounceTimer = setTimeout(() => this.loadAttendance(), 250);
  }

  scheduleFilterAttendance(): void {
    if (this.filterDebounceTimer) {
      clearTimeout(this.filterDebounceTimer);
    }
    this.filterDebounceTimer = setTimeout(() => this.filterAttendance(), 180);
  }

  loadAttendance(): void {
    this.loading.set(true);
    this.attendanceService
      .getAllAttendance({
        startDate: this.selectedDate,
        endDate: this.selectedDate,
      })
      .subscribe({
        next: (records) => {
          const allowedEmployeeIds = new Set(this.allowedEmployeeIds());
          const normalized = (records ?? [])
            .map((record) => this.normalizeRecord(record))
            .filter((record) =>
              allowedEmployeeIds.size > 0
                ? allowedEmployeeIds.has(record.employeeId)
                : true,
            );

          this.attendanceRecords.set(normalized);
          this.filterAttendance();
          this.loading.set(false);
        },
        error: () => {
          this.toastService.error('Failed to load attendance register.');
          this.attendanceRecords.set([]);
          this.filteredAttendance.set([]);
          this.recalculateStats([]);
          this.loading.set(false);
        },
      });
  }

  private normalizeRecord(record: any): NormalizedAttendance {
    const employeeId =
      Number(record?.employee_id ?? record?.employeeId ?? record?.employee?.id ?? 0) || 0;
    const employee = this.findEmployee(employeeId);
    const fullName =
      `${record?.employee?.firstName || employee?.firstName || ''} ${record?.employee?.lastName || employee?.lastName || ''}`
        .trim() ||
      this.employeeFullName(employee) ||
      'Unknown';
    const designationName =
      record?.employee?.designation?.name ||
      record?.employee?.designationName ||
      employee?.designation?.name ||
      this.designations().find((designation) => designation.id === employee?.designationId)?.name ||
      'Unassigned';
    const departmentName =
      record?.employee?.department?.name ||
      record?.employee?.department ||
      employee?.department?.name ||
      this.departments().find((department) => department.id === employee?.departmentId)?.name ||
      'General';
    const shiftId = Number(record?.shift_id ?? record?.shiftId ?? 0) || undefined;
    const shiftName =
      record?.shift?.name ||
      record?.shift_name ||
      this.shifts().find((shift) => shift.id === shiftId)?.name ||
      'General';
    const status = String(record?.status || 'absent')
      .toLowerCase()
      .replace(/[\s-]+/g, '_');

    return {
      id: Number(record?.id ?? 0) || employeeId || Date.now(),
      employeeId,
      employeeName: fullName,
      employeeCode: record?.employee_code || employee?.employeeCode || 'N/A',
      department: departmentName,
      designation: designationName,
      shiftName,
      date: record?.date || record?.attendance_date || this.selectedDate,
      checkIn: record?.check_in || null,
      checkOut: record?.check_out || null,
      workHours:
        typeof record?.work_hours === 'number'
          ? record.work_hours
          : Number(record?.work_hours ?? 0) || null,
      netWorkHours:
        typeof record?.net_work_hours === 'number'
          ? record.net_work_hours
          : Number(record?.net_work_hours ?? 0) || null,
      status,
      lateMinutes:
        Number(record?.late_minutes ?? 0) ||
        (record?.is_late ? 15 : 0),
      source: record?.source || 'web',
      method: record?.attendance_method || record?.method || record?.source || 'web',
      kioskName: record?.kiosk_name || record?.device_info?.kioskName || null,
    };
  }

  filterAttendance(): void {
    let filtered = [...this.attendanceRecords()];

    if (this.selectedDepartment) {
      filtered = filtered.filter((record) => {
        const employee = this.findEmployee(record.employeeId);
        return employee?.departmentId === this.selectedDepartment;
      });
    }

    if (this.selectedDesignation) {
      filtered = filtered.filter((record) => {
        const employee = this.findEmployee(record.employeeId);
        return employee?.designationId === this.selectedDesignation;
      });
    }

    if (this.selectedShift) {
      const targetShift =
        this.shifts().find((shift) => shift.id === this.selectedShift)?.name?.toLowerCase() || '';
      filtered = filtered.filter((record) =>
        targetShift ? record.shiftName.toLowerCase() === targetShift : true,
      );
    }

    if (this.selectedEmployee) {
      filtered = filtered.filter((record) => record.employeeId === this.selectedEmployee);
    }

    if (this.statusFilter) {
      filtered = filtered.filter((record) => record.status === this.statusFilter);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.trim().toLowerCase();
      filtered = filtered.filter((record) => {
        const haystack = [
          record.employeeName,
          record.employeeCode,
          record.department,
          record.designation,
          record.shiftName,
          this.sourceLabel(record.source),
          this.methodLabel(record.method),
          this.statusLabel(record.status),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    this.filteredAttendance.set(filtered);
    this.recalculateStats(filtered);
  }

  private recalculateStats(records: NormalizedAttendance[]): void {
    this.stats.set({
      total: records.length,
      present: records.filter((record) => record.status === 'present').length,
      absent: records.filter((record) => record.status === 'absent').length,
      late: records.filter((record) => record.status === 'late').length,
      halfDay: records.filter((record) => record.status === 'half_day').length,
      onLeave: records.filter((record) => record.status === 'on_leave').length,
      holiday: records.filter((record) => record.status === 'holiday').length,
      weekOff: records.filter((record) => record.status === 'weekend').length,
    });
  }

  refreshData(): void {
    this.loadAttendance();
  }

  resetFilters(): void {
    this.selectedDepartment = null;
    this.selectedDesignation = null;
    this.selectedShift = null;
    this.selectedEmployee = null;
    this.statusFilter = '';
    this.searchQuery = '';
    this.filterAttendance();
  }

  viewDetails(record: NormalizedAttendance): void {
    const message = [
      `Employee: ${record.employeeName}`,
      `Code: ${record.employeeCode}`,
      `Department: ${record.department}`,
      `Designation: ${record.designation}`,
      `Shift: ${record.shiftName}`,
      `Date: ${record.date}`,
      `Check In: ${record.checkIn || 'N/A'}`,
      `Check Out: ${record.checkOut || 'N/A'}`,
      `Status: ${this.statusLabel(record.status)}`,
      `Work Hours: ${this.formatHours(record.netWorkHours ?? record.workHours)}`,
      `Source: ${this.sourceLabel(record.source)}`,
      `Method: ${this.methodLabel(record.method)}`,
      `Late Minutes: ${record.lateMinutes || 0}`,
    ].join('\n');

    this.toastService.show(message, 'info');
  }

  openManualUpdate(record: NormalizedAttendance): void {
    this.toastService.info(
      'Open the regularization queue or attendance correction workflow to update this attendance record.',
    );
    void this.router.navigate(['/attendance/regularizations'], {
      queryParams: {
        employee: record.employeeCode,
        date: record.date,
        source: 'attendance-register',
      },
    });
  }

  exportRegister(): void {
    const records = this.filteredAttendance();
    if (!records.length) {
      this.toastService.error('No attendance records available to export.');
      return;
    }

    const rows = [
      [
        'Employee Name',
        'Employee Code',
        'Department',
        'Designation',
        'Shift',
        'Date',
        'Check In',
        'Check Out',
        'Work Hours',
        'Status',
        'Source',
        'Method',
        'Late Minutes',
      ],
      ...records.map((record) => [
        record.employeeName,
        record.employeeCode,
        record.department,
        record.designation,
        record.shiftName,
        record.date,
        record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '',
        record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '',
        this.formatHours(record.netWorkHours ?? record.workHours),
        this.statusLabel(record.status),
        this.sourceLabel(record.source),
        this.methodLabel(record.method),
        String(record.lateMinutes || 0),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance-register-${this.selectedDate}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    this.toastService.success('Attendance register export downloaded.');
  }

  getEmployeeInitials(record: NormalizedAttendance): string {
    const parts = record.employeeName.split(' ').filter(Boolean);
    const first = parts[0]?.[0] || '?';
    const second = parts[1]?.[0] || '';
    return `${first}${second}`.toUpperCase();
  }

  formatHours(hours: number | undefined | null): string {
    if (hours == null || Number.isNaN(hours)) return '--';
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  }

  getStatusClass(status: string | undefined): string {
    const classes: Record<string, string> = {
      present: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      absent: 'border-rose-200 bg-rose-50 text-rose-700',
      late: 'border-amber-200 bg-amber-50 text-amber-700',
      half_day: 'border-orange-200 bg-orange-50 text-orange-700',
      on_leave: 'border-blue-200 bg-blue-50 text-blue-700',
      holiday: 'border-violet-200 bg-violet-50 text-violet-700',
      weekend: 'border-slate-300 bg-slate-100 text-slate-700',
    };
    return classes[status || ''] || 'border-slate-200 bg-slate-50 text-slate-600';
  }

  statusLabel(status: string | undefined): string {
    const labels: Record<string, string> = {
      present: 'Present',
      absent: 'Absent',
      late: 'Late',
      half_day: 'Half Day',
      on_leave: 'Leave',
      holiday: 'Holiday',
      weekend: 'Week Off',
    };
    return labels[status || ''] || 'Unknown';
  }

  sourceLabel(source: string | undefined): string {
    const normalized = String(source || 'web')
      .replace(/_/g, ' ')
      .trim()
      .toLowerCase();
    if (normalized === 'geo fence') return 'Geo Fence';
    if (normalized === 'kiosk') return 'Kiosk';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  methodLabel(method: string | undefined): string {
    const normalized = String(method || 'web')
      .replace(/_/g, ' ')
      .trim()
      .toLowerCase();
    if (normalized === 'pin') return 'PIN';
    if (normalized === 'qr') return 'QR';
    if (normalized === 'face') return 'Face';
    if (normalized === 'camera') return 'Selfie';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  private findEmployee(employeeId: number): User | undefined {
    return this.employees().find(
      (employee) => this.resolveEmployeeId(employee) === employeeId,
    );
  }

  private resolveEmployeeId(employee: User | null | undefined): number {
    return Number(employee?.employeeId ?? employee?.id ?? 0) || 0;
  }

  private employeeFullName(employee: User | null | undefined): string {
    return `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim();
  }
}
