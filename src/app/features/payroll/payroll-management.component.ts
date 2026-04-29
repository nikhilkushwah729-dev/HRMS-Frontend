import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { User } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { Department, OrganizationService } from '../../core/services/organization.service';
import { PayrollRun, PayrollService } from '../../core/services/payroll.service';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-payroll-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.24em] text-fuchsia-600">Payroll Management</p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Enterprise payroll control for HR and admin teams</h1>
            <p class="mt-2 max-w-3xl text-sm text-slate-500">
              Review payroll cycles, filter employee payroll data, manage salary operations, and keep salary processing separate from employee self-service.
            </p>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <a routerLink="/payroll/structure" class="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">
              Salary Structure
            </a>
            <a routerLink="/payroll/process" class="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800">
              Process Payroll
            </a>
          </div>
        </div>
      </section>

      @if (loading()) {
        <div class="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
          Loading payroll management data...
        </div>
      } @else {
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Payroll Runs</p><p class="mt-3 text-3xl font-black text-slate-900">{{ filteredRuns().length }}</p></article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Processed</p><p class="mt-3 text-3xl font-black text-emerald-600">{{ countByStatus('processed') }}</p></article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Locked</p><p class="mt-3 text-3xl font-black text-slate-900">{{ countByStatus('locked') }}</p></article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Pending</p><p class="mt-3 text-3xl font-black text-amber-500">{{ countByStatus('pending') }}</p></article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Net Payroll</p><p class="mt-3 text-2xl font-black text-sky-700">{{ totalNet() | currency:'INR':'symbol':'1.0-0' }}</p></article>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input [(ngModel)]="search" placeholder="Search month, cycle, comment" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400 xl:col-span-2" />
            <select [(ngModel)]="departmentId" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400">
              <option value="">All departments</option>
              @for (department of departments(); track department.id) {
                <option [value]="department.id">{{ department.name }}</option>
              }
            </select>
            <input [(ngModel)]="month" type="month" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400" />
            <select [(ngModel)]="status" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400">
              <option value="">All status</option>
              <option value="processed">Processed</option>
              <option value="pending">Pending</option>
              <option value="locked">Locked</option>
            </select>
          </div>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200">
              <thead>
                <tr class="text-left text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  <th class="px-4 py-4">Cycle</th>
                  <th class="px-4 py-4">Employees</th>
                  <th class="px-4 py-4">Gross</th>
                  <th class="px-4 py-4">Deductions</th>
                  <th class="px-4 py-4">Net</th>
                  <th class="px-4 py-4">Status</th>
                  <th class="px-4 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (run of filteredRuns(); track run.id) {
                  <tr>
                    <td class="px-4 py-4">
                      <p class="text-sm font-black text-slate-900">{{ run.cycleLabel }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ run.processedAt || run.createdAt | date:'medium' }}</p>
                    </td>
                    <td class="px-4 py-4 text-sm text-slate-600">{{ run.processedCount }} / {{ run.employeeCount }}</td>
                    <td class="px-4 py-4 text-sm text-slate-600">{{ run.totalGross | currency:'INR':'symbol':'1.0-0' }}</td>
                    <td class="px-4 py-4 text-sm text-rose-600 font-black">{{ run.totalDeductions | currency:'INR':'symbol':'1.0-0' }}</td>
                    <td class="px-4 py-4 text-sm font-black text-slate-900">{{ run.totalNet | currency:'INR':'symbol':'1.0-0' }}</td>
                    <td class="px-4 py-4"><span class="rounded-full px-3 py-1 text-xs font-black" [ngClass]="statusBadge(run.status)">{{ run.status }}</span></td>
                    <td class="px-4 py-4">
                      <div class="flex justify-end gap-2">
                        <button type="button" (click)="viewRun(run)" class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50">Preview</button>
                        @if (canManage()) {
                          <button type="button" (click)="lock(run)" [disabled]="run.locked" class="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white transition hover:bg-slate-800 disabled:opacity-50">Lock</button>
                          <button type="button" (click)="rerun(run)" [disabled]="run.locked" class="rounded-lg border border-fuchsia-200 px-3 py-2 text-xs font-black text-fuchsia-700 transition hover:bg-fuchsia-50 disabled:opacity-50">Re-run</button>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="7" class="px-4 py-12 text-center text-sm font-semibold text-slate-500">No payroll runs found for the selected filters.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        @if (selectedRun(); as run) {
          <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-lg font-black text-slate-900">Run Preview: {{ run.cycleLabel }}</h2>
                <p class="mt-1 text-sm text-slate-500">Employee-level payroll outcome for this run.</p>
              </div>
              <button type="button" (click)="selectedRun.set(null)" class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50">Close</button>
            </div>
            <div class="mt-5 overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr class="text-left text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    <th class="px-4 py-3">Employee</th>
                    <th class="px-4 py-3">Attendance</th>
                    <th class="px-4 py-3">LOP</th>
                    <th class="px-4 py-3">Overtime</th>
                    <th class="px-4 py-3">Gross</th>
                    <th class="px-4 py-3">Net</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (item of run.items; track item.employeeId) {
                    <tr>
                      <td class="px-4 py-3 text-sm font-black text-slate-900">{{ item.employeeName }}</td>
                      <td class="px-4 py-3 text-sm text-slate-600">{{ item.attendanceDays }} days</td>
                      <td class="px-4 py-3 text-sm text-rose-600">{{ item.lopDays }} days</td>
                      <td class="px-4 py-3 text-sm text-slate-600">{{ item.overtimeHours }} hrs</td>
                      <td class="px-4 py-3 text-sm text-slate-600">{{ item.grossSalary | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td class="px-4 py-3 text-sm font-black text-slate-900">{{ item.netSalary | currency:'INR':'symbol':'1.0-0' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }
      }
    </div>
  `,
})
export class PayrollManagementComponent {
  private readonly payrollService = inject(PayrollService);
  private readonly organizationService = inject(OrganizationService);
  private readonly permissionService = inject(PermissionService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly loading = signal(true);
  readonly runs = signal<PayrollRun[]>([]);
  readonly departments = signal<Department[]>([]);
  readonly currentUser = signal<User | null>(this.authService.getStoredUser());
  readonly selectedRun = signal<PayrollRun | null>(null);

  search = '';
  departmentId = '';
  month = '';
  status = '';

  readonly filteredRuns = computed(() => {
    const search = this.search.trim().toLowerCase();
    return this.runs().filter((run) => {
      if (this.status && run.status !== this.status) return false;
      if (this.month) {
        const period = `${run.year}-${String(run.month).padStart(2, '0')}`;
        if (period !== this.month) return false;
      }
      if (!search) return true;
      return [run.cycleLabel, run.comment, run.department].join(' ').toLowerCase().includes(search);
    });
  });

  readonly totalNet = computed(() => this.filteredRuns().reduce((sum, run) => sum + run.totalNet, 0));

  constructor() {
    if (!this.canManage() && !this.canViewTeamSummary()) {
      this.router.navigate(['/self-service/payroll']);
      return;
    }
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      runs: this.payrollService.getPayrollRuns(),
      departments: this.organizationService.getDepartments(),
    }).subscribe({
      next: ({ runs, departments }) => {
        this.runs.set(runs);
        this.departments.set(departments);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.show('Unable to load payroll management data.', 'error');
        this.loading.set(false);
      },
    });
  }

  canManage(): boolean {
    const user = this.currentUser();
    const role = this.permissionService.getRoleDisplayName(user).toLowerCase();
    return role.includes('admin') || role.includes('hr') || this.permissionService.hasPermission(user, 'payroll.update') || this.permissionService.hasPermission(user, 'payroll.approve');
  }

  canViewTeamSummary(): boolean {
    const role = this.permissionService.getRoleDisplayName(this.currentUser()).toLowerCase();
    return role.includes('manager');
  }

  countByStatus(status: PayrollRun['status']): number {
    return this.filteredRuns().filter((run) => run.status === status).length;
  }

  statusBadge(status: PayrollRun['status']): string {
    const map: Record<PayrollRun['status'], string> = {
      pending: 'bg-amber-50 text-amber-700',
      processed: 'bg-emerald-50 text-emerald-700',
      locked: 'bg-slate-100 text-slate-700',
    };
    return map[status];
  }

  viewRun(run: PayrollRun): void {
    this.selectedRun.set(run);
  }

  lock(run: PayrollRun): void {
    this.payrollService.lockPayroll(run.id).subscribe({
      next: () => {
        this.toastService.show('Payroll run locked successfully.', 'success');
        this.load();
      },
      error: () => this.toastService.show('Unable to lock payroll run.', 'error'),
    });
  }

  rerun(run: PayrollRun): void {
    this.payrollService.rerunPayroll(run.id).subscribe({
      next: (result) => {
        if (!result) {
          this.toastService.show('Locked payroll runs cannot be re-run.', 'error');
          return;
        }
        this.toastService.show('Payroll run re-processed successfully.', 'success');
        this.load();
      },
      error: () => this.toastService.show('Unable to re-run payroll.', 'error'),
    });
  }
}
