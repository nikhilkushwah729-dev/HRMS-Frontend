import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { User } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { Department, Designation, OrganizationService } from '../../core/services/organization.service';
import { PermissionService } from '../../core/services/permission.service';
import {
  LeaveRequest,
  LeaveService,
  LeaveTypeBalance,
} from '../../core/services/leave.service';
import { ToastService } from '../../core/services/toast.service';

type LeaveStatusFilter = 'all' | LeaveRequest['status'];

@Component({
  selector: 'app-leave-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe],
  template: `
    <div class="space-y-6">
      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-600">Leave Management</p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Manage leave operations without mixing employee self service</h1>
            <p class="mt-2 max-w-3xl text-sm text-slate-500">
              Review leave requests, apply filters by employee and organization structure, approve or reject with comments, and keep leave data ready for payroll and reporting.
            </p>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <a routerLink="/leave/settings" class="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">
              Leave Settings
            </a>
            <button type="button" (click)="exportCsv()" class="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800">
              Export CSV
            </button>
          </div>
        </div>
      </section>

      @if (loading()) {
        <div class="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
          Loading leave management data...
        </div>
      } @else {
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Requests</p>
            <p class="mt-3 text-3xl font-black text-slate-900">{{ visibleRequests().length }}</p>
          </article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Pending</p>
            <p class="mt-3 text-3xl font-black text-amber-500">{{ statusCount('pending') }}</p>
          </article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Approved</p>
            <p class="mt-3 text-3xl font-black text-emerald-600">{{ statusCount('approved') }}</p>
          </article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Rejected</p>
            <p class="mt-3 text-3xl font-black text-rose-600">{{ statusCount('rejected') }}</p>
          </article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Connected Payroll</p>
            <p class="mt-3 text-lg font-black text-sky-700">Ready</p>
            <p class="mt-2 text-sm text-slate-500">Approved leave and LOP can be consumed in payroll cycle.</p>
          </article>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <input [(ngModel)]="search" placeholder="Search employee or reason" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 xl:col-span-2" />
            <select [(ngModel)]="selectedEmployeeId" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400">
              <option value="">All employees</option>
              @for (employee of availableEmployees(); track employee.id) {
                <option [value]="employee.id">{{ employee.firstName }} {{ employee.lastName }}</option>
              }
            </select>
            <select [(ngModel)]="selectedDepartmentId" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400">
              <option value="">All departments</option>
              @for (department of departments(); track department.id) {
                <option [value]="department.id">{{ department.name }}</option>
              }
            </select>
            <select [(ngModel)]="selectedDesignationId" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400">
              <option value="">All designations</option>
              @for (designation of designations(); track designation.id) {
                <option [value]="designation.id">{{ designation.name }}</option>
              }
            </select>
            <select [(ngModel)]="statusFilter" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400">
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select [(ngModel)]="selectedLeaveTypeId" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400">
              <option value="">All leave types</option>
              @for (type of leaveTypes(); track type.id) {
                <option [value]="type.id">{{ type.typeName }}</option>
              }
            </select>
            <input [(ngModel)]="dateFrom" type="date" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400" />
            <input [(ngModel)]="dateTo" type="date" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400" />
          </div>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200">
              <thead>
                <tr class="text-left text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  <th class="px-4 py-4">Employee</th>
                  <th class="px-4 py-4">Type</th>
                  <th class="px-4 py-4">Dates</th>
                  <th class="px-4 py-4">Days</th>
                  <th class="px-4 py-4">Status</th>
                  <th class="px-4 py-4">Reason</th>
                  <th class="px-4 py-4">Comment</th>
                  <th class="px-4 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (item of visibleRequests(); track item.id) {
                  <tr>
                    <td class="px-4 py-4">
                      <p class="text-sm font-black text-slate-900">{{ employeeName(item) }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ employeeMeta(item) }}</p>
                    </td>
                    <td class="px-4 py-4 text-sm font-bold text-slate-700">{{ item.leaveType?.typeName || 'Leave' }}</td>
                    <td class="px-4 py-4 text-sm text-slate-600">{{ item.startDate | date:'mediumDate' }} - {{ item.endDate | date:'mediumDate' }}</td>
                    <td class="px-4 py-4 text-sm font-bold text-slate-700">{{ item.totalDays }}</td>
                    <td class="px-4 py-4">
                      <span class="rounded-full px-3 py-1 text-xs font-black" [ngClass]="statusBadge(item.status)">{{ item.status }}</span>
                    </td>
                    <td class="px-4 py-4 text-sm text-slate-500">
                      <p class="max-w-[18rem] truncate" [title]="item.reason">{{ item.reason || 'No reason' }}</p>
                    </td>
                    <td class="px-4 py-4">
                      <textarea
                        [ngModel]="reviewNotes()[item.id] || item.rejectionNote || ''"
                        (ngModelChange)="setReviewNote(item.id, $event)"
                        rows="2"
                        class="w-full min-w-[180px] rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-emerald-400"
                        placeholder="Approval / rejection comment"
                      ></textarea>
                    </td>
                    <td class="px-4 py-4">
                      <div class="flex justify-end gap-2">
                        @if (canProcess(item)) {
                          <button type="button" (click)="process(item, 'approved')" class="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-700">
                            Approve
                          </button>
                          <button type="button" (click)="process(item, 'rejected')" class="rounded-lg border border-rose-200 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-50">
                            Reject
                          </button>
                        } @else {
                          <span class="text-xs font-semibold text-slate-400">Locked</span>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="px-4 py-12 text-center text-sm font-semibold text-slate-500">
                      No leave requests match the selected filters.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>
  `,
})
export class LeaveManagementComponent {
  private readonly leaveService = inject(LeaveService);
  private readonly employeeService = inject(EmployeeService);
  private readonly organizationService = inject(OrganizationService);
  private readonly permissionService = inject(PermissionService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly currentUser = signal<User | null>(this.authService.getStoredUser());
  readonly loading = signal(true);
  readonly requests = signal<LeaveRequest[]>([]);
  readonly leaveTypes = signal<LeaveTypeBalance[]>([]);
  readonly employees = signal<User[]>([]);
  readonly departments = signal<Department[]>([]);
  readonly designations = signal<Designation[]>([]);
  readonly reviewNotes = signal<Record<number, string>>({});

  search = '';
  selectedEmployeeId = '';
  selectedDepartmentId = '';
  selectedDesignationId = '';
  selectedLeaveTypeId = '';
  statusFilter: LeaveStatusFilter = 'all';
  dateFrom = '';
  dateTo = '';

  readonly availableEmployees = computed(() => {
    const current = this.currentUser();
    const canSeeAll = this.canSeeAllOrganization();
    if (canSeeAll) return this.employees();
    if (this.isManagerScope()) {
      const managerId = Number(current?.employeeId ?? current?.id ?? 0);
      return this.employees().filter((employee) => Number(employee.managerId) === managerId || Number(employee.reportingManagerId) === managerId);
    }
    return [];
  });

  readonly visibleRequests = computed(() => {
    const term = this.search.trim().toLowerCase();
    return this.scopeFilteredRequests().filter((item) => {
      if (this.selectedEmployeeId && Number(this.selectedEmployeeId) !== Number(item.employeeId)) return false;
      if (this.selectedLeaveTypeId && Number(this.selectedLeaveTypeId) !== Number(item.leaveTypeId)) return false;
      if (this.statusFilter !== 'all' && item.status !== this.statusFilter) return false;
      if (this.selectedDepartmentId) {
        const employee = this.findEmployee(item.employeeId);
        if (Number(employee?.departmentId ?? 0) !== Number(this.selectedDepartmentId)) return false;
      }
      if (this.selectedDesignationId) {
        const employee = this.findEmployee(item.employeeId);
        if (Number(employee?.designationId ?? 0) !== Number(this.selectedDesignationId)) return false;
      }
      if (this.dateFrom && item.endDate < this.dateFrom) return false;
      if (this.dateTo && item.startDate > this.dateTo) return false;
      if (!term) return true;
      const haystack = [
        this.employeeName(item),
        item.leaveType?.typeName,
        item.reason,
        item.status,
      ].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  });

  constructor() {
    if (!this.canSeeAllOrganization() && !this.isManagerScope()) {
      this.router.navigate(['/self-service/leave']);
      return;
    }
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      requests: this.leaveService.getLeaveHistory(),
      leaveTypes: this.leaveService.getLeaveTypes(),
      employees: this.employeeService.getEmployees(),
      departments: this.organizationService.getDepartments(),
      designations: this.organizationService.getDesignations(),
    }).subscribe({
      next: ({ requests, leaveTypes, employees, departments, designations }) => {
        this.requests.set(requests);
        this.leaveTypes.set(leaveTypes.data);
        this.employees.set(employees);
        this.departments.set(departments);
        this.designations.set(designations);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.show('Unable to load leave management data.', 'error');
        this.loading.set(false);
      },
    });
  }

  private scopeFilteredRequests(): LeaveRequest[] {
    if (this.canSeeAllOrganization()) return this.requests();
    if (this.isManagerScope()) {
      const managerId = Number(this.currentUser()?.employeeId ?? this.currentUser()?.id ?? 0);
      return this.requests().filter((item) => {
        const employee = this.findEmployee(item.employeeId);
        return Number(employee?.managerId ?? employee?.reportingManagerId ?? 0) === managerId;
      });
    }
    return this.requests().filter((item) => Number(item.employeeId) === Number(this.currentUser()?.employeeId ?? this.currentUser()?.id ?? 0));
  }

  private canSeeAllOrganization(): boolean {
    const role = this.permissionService.getRoleDisplayName(this.currentUser()).toLowerCase();
    return (
      this.permissionService.hasPermission(this.currentUser(), 'leaves.approve') ||
      this.permissionService.hasPermission(this.currentUser(), 'leave.approve') ||
      role.includes('admin') ||
      role.includes('hr')
    );
  }

  private isManagerScope(): boolean {
    const role = this.permissionService.getRoleDisplayName(this.currentUser()).toLowerCase();
    return role.includes('manager') && !this.canSeeAllOrganization();
  }

  private findEmployee(employeeId: number): User | undefined {
    return this.employees().find((item) => Number(item.employeeId ?? item.id ?? 0) === Number(employeeId));
  }

  employeeName(item: LeaveRequest): string {
    return (
      item.employee?.fullName ||
      [item.employee?.firstName, item.employee?.lastName].filter(Boolean).join(' ') ||
      [this.findEmployee(item.employeeId)?.firstName, this.findEmployee(item.employeeId)?.lastName].filter(Boolean).join(' ') ||
      `Employee #${item.employeeId}`
    );
  }

  employeeMeta(item: LeaveRequest): string {
    const employee = this.findEmployee(item.employeeId);
    const department = employee?.department?.name || this.departments().find((entry) => entry.id === employee?.departmentId)?.name || 'No department';
    const designation = employee?.designation?.name || this.designations().find((entry) => entry.id === employee?.designationId)?.name || 'No designation';
    return `${department} • ${designation}`;
  }

  statusBadge(status: LeaveRequest['status']): string {
    const map: Record<LeaveRequest['status'], string> = {
      pending: 'bg-amber-50 text-amber-700',
      approved: 'bg-emerald-50 text-emerald-700',
      rejected: 'bg-rose-50 text-rose-700',
      cancelled: 'bg-slate-100 text-slate-600',
    };
    return map[status];
  }

  statusCount(status: LeaveRequest['status']): number {
    return this.scopeFilteredRequests().filter((item) => item.status === status).length;
  }

  canProcess(item: LeaveRequest): boolean {
    return item.status === 'pending' && (this.canSeeAllOrganization() || this.isManagerScope());
  }

  setReviewNote(id: number, value: string): void {
    this.reviewNotes.update((state) => ({ ...state, [id]: value }));
  }

  process(item: LeaveRequest, status: 'approved' | 'rejected'): void {
    const note = this.reviewNotes()[item.id] || '';
    this.leaveService.updateLeaveStatus(item.id, status, note).subscribe({
      next: () => {
        this.toastService.show(`Leave request ${status} successfully.`, 'success');
        this.load();
      },
      error: () => this.toastService.show(`Unable to ${status} this leave request.`, 'error'),
    });
  }

  exportCsv(): void {
    const lines = [
      ['Employee', 'Department', 'Designation', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason'],
      ...this.visibleRequests().map((item) => [
        this.employeeName(item),
        this.employeeMeta(item).split(' • ')[0] ?? '',
        this.employeeMeta(item).split(' • ')[1] ?? '',
        item.leaveType?.typeName || 'Leave',
        item.startDate,
        item.endDate,
        String(item.totalDays),
        item.status,
        (item.reason || '').replace(/\n/g, ' '),
      ]),
    ];
    const csv = lines
      .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'leave-management-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
