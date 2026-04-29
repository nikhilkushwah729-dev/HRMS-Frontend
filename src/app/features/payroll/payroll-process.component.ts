import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { User } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import {
  Department,
  OrganizationService,
} from '../../core/services/organization.service';
import {
  PayrollProcessPayload,
  PayrollRun,
  PayrollService,
} from '../../core/services/payroll.service';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-payroll-process',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.24em] text-fuchsia-600">Process Payroll</p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Run monthly payroll with attendance and leave integration</h1>
            <p class="mt-2 max-w-3xl text-sm text-slate-500">
              Process payroll month by month, apply LOP and half-day impact, include overtime and incentives, then generate employee payslips before the cycle is locked.
            </p>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <a routerLink="/payroll/manage" class="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">
              Payroll Dashboard
            </a>
            <a routerLink="/payroll/structure" class="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800">
              Salary Structure
            </a>
          </div>
        </div>
      </section>

      @if (loading()) {
        <div class="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
          Loading payroll cycle workspace...
        </div>
      } @else {
        <section class="grid gap-4 xl:grid-cols-4">
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Employees</p>
            <p class="mt-3 text-3xl font-black text-slate-900">{{ employees().length }}</p>
            <p class="mt-2 text-xs text-slate-500">Included in current processing scope.</p>
          </article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Processed Cycles</p>
            <p class="mt-3 text-3xl font-black text-emerald-600">{{ processedRuns().length }}</p>
            <p class="mt-2 text-xs text-slate-500">Runs completed before payroll lock.</p>
          </article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Locked Cycles</p>
            <p class="mt-3 text-3xl font-black text-slate-900">{{ lockedRuns().length }}</p>
            <p class="mt-2 text-xs text-slate-500">Immutable cycles safe for payroll records.</p>
          </article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Attendance Impact</p>
            <p class="mt-3 text-2xl font-black text-rose-600">LOP + OT</p>
            <p class="mt-2 text-xs text-slate-500">Absent, half-day, unpaid leave, and overtime are applied by backend/fallback processing.</p>
          </article>
        </section>

        <section class="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-lg font-black text-slate-900">Payroll Cycle Setup</h2>
                <p class="mt-1 text-sm text-slate-500">Choose the cycle and processing rules before running payroll.</p>
              </div>
              <span class="rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-black text-fuchsia-700">Backend Controlled</span>
            </div>

            <div class="mt-5 grid gap-3 md:grid-cols-2">
              <input [(ngModel)]="period" type="month" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400" />
              <select [(ngModel)]="departmentId" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400">
                <option value="">All departments</option>
                @for (department of departments(); track department.id) {
                  <option [value]="department.id">{{ department.name }}</option>
                }
              </select>
              <select [(ngModel)]="employeeId" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400 md:col-span-2">
                <option value="">All employees</option>
                @for (employee of filteredEmployees(); track employee.id) {
                  <option [value]="employee.id">{{ employee.firstName }} {{ employee.lastName }}</option>
                }
              </select>
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700"><input [(ngModel)]="includeAttendance" type="checkbox" /> Attendance-driven salary</label>
              <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700"><input [(ngModel)]="includeLeave" type="checkbox" /> Leave policy integration</label>
              <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700"><input [(ngModel)]="includeOvertime" type="checkbox" /> Include overtime earning</label>
              <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700"><input [(ngModel)]="includeBonus" type="checkbox" /> Include bonus / incentives</label>
            </div>

            <textarea
              [(ngModel)]="comment"
              rows="4"
              placeholder="Cycle notes, compliance comments, or special processing remarks"
              class="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
            ></textarea>

            <div class="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 class="text-sm font-black text-slate-900">Payroll Logic Preview</h3>
              <ul class="mt-3 space-y-2 text-sm text-slate-600">
                <li>Absent days create LOP deduction according to salary structure and payroll policy.</li>
                <li>Half-day punches create partial day deduction.</li>
                <li>Approved paid leave does not reduce net salary.</li>
                <li>Unpaid leave and outdoor duty policy are respected during cycle processing.</li>
                <li>Overtime adds earning when enabled at employee salary structure level.</li>
              </ul>
            </div>

            <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" (click)="exportReport()" class="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">
                Export Report
              </button>
              <button type="button" (click)="process()" [disabled]="processing()" class="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60">
                {{ processing() ? 'Processing Payroll...' : 'Run Payroll Cycle' }}
              </button>
            </div>
          </article>

          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-lg font-black text-slate-900">Recent Payroll Runs</h2>
                <p class="mt-1 text-sm text-slate-500">Review the latest processed and locked cycles.</p>
              </div>
              <a routerLink="/payroll/manage" class="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-600">Open full management</a>
            </div>

            <div class="mt-5 space-y-3">
              @for (run of recentRuns(); track run.id) {
                <div class="rounded-2xl border border-slate-200 p-4">
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <p class="text-sm font-black text-slate-900">{{ run.cycleLabel }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ run.employeeCount }} employees • {{ run.processedAt || run.createdAt | date:'mediumDate' }}</p>
                    </div>
                    <span class="rounded-full px-3 py-1 text-xs font-black" [ngClass]="statusBadge(run.status)">{{ run.status }}</span>
                  </div>
                  <div class="mt-4 grid gap-3 sm:grid-cols-3">
                    <div>
                      <p class="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Gross</p>
                      <p class="mt-1 text-sm font-black text-slate-900">{{ run.totalGross | currency:'INR':'symbol':'1.0-0' }}</p>
                    </div>
                    <div>
                      <p class="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Deductions</p>
                      <p class="mt-1 text-sm font-black text-rose-600">{{ run.totalDeductions | currency:'INR':'symbol':'1.0-0' }}</p>
                    </div>
                    <div>
                      <p class="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Net Pay</p>
                      <p class="mt-1 text-sm font-black text-emerald-700">{{ run.totalNet | currency:'INR':'symbol':'1.0-0' }}</p>
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm font-semibold text-slate-500">
                  No payroll cycles processed yet. Run your first payroll cycle from this screen.
                </div>
              }
            </div>
          </article>
        </section>
      }
    </div>
  `,
})
export class PayrollProcessComponent {
  private readonly payrollService = inject(PayrollService);
  private readonly organizationService = inject(OrganizationService);
  private readonly employeeService = inject(EmployeeService);
  private readonly permissionService = inject(PermissionService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly loading = signal(true);
  readonly processing = signal(false);
  readonly currentUser = signal<User | null>(this.authService.getStoredUser());
  readonly employees = signal<User[]>([]);
  readonly departments = signal<Department[]>([]);
  readonly runs = signal<PayrollRun[]>([]);

  period = new Date().toISOString().slice(0, 7);
  departmentId = '';
  employeeId = '';
  includeAttendance = true;
  includeLeave = true;
  includeOvertime = true;
  includeBonus = true;
  comment = '';

  readonly processedRuns = computed(() =>
    this.runs().filter((run) => run.status === 'processed'),
  );
  readonly lockedRuns = computed(() =>
    this.runs().filter((run) => run.status === 'locked'),
  );
  readonly recentRuns = computed(() =>
    [...this.runs()]
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )
      .slice(0, 4),
  );
  readonly filteredEmployees = computed(() => {
    const departmentId = Number(this.departmentId || 0);
    if (!departmentId) return this.employees();
    return this.employees().filter(
      (employee) => Number(employee.department?.id ?? 0) === departmentId,
    );
  });

  constructor() {
    if (!this.canProcess()) {
      this.router.navigate(['/self-service/payroll']);
      return;
    }
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      employees: this.employeeService.getEmployees(),
      departments: this.organizationService.getDepartments(),
      runs: this.payrollService.getPayrollRuns(),
    }).subscribe({
      next: ({ employees, departments, runs }) => {
        this.employees.set(employees);
        this.departments.set(departments);
        this.runs.set(runs);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.show('Unable to load payroll processing workspace.', 'error');
        this.loading.set(false);
      },
    });
  }

  canProcess(): boolean {
    const user = this.currentUser();
    const role = this.permissionService.getRoleDisplayName(user).toLowerCase();
    return (
      role.includes('admin') ||
      role.includes('hr') ||
      this.permissionService.hasPermission(user, 'payroll.update') ||
      this.permissionService.hasPermission(user, 'payroll.approve')
    );
  }

  statusBadge(status: PayrollRun['status']): string {
    const map: Record<PayrollRun['status'], string> = {
      pending: 'bg-amber-50 text-amber-700',
      processed: 'bg-emerald-50 text-emerald-700',
      locked: 'bg-slate-100 text-slate-700',
    };
    return map[status];
  }

  process(): void {
    if (!this.period) {
      this.toastService.show('Select a payroll month before processing.', 'error');
      return;
    }

    const payload: PayrollProcessPayload = {
      month: this.period.split('-')[1] || '',
      year: Number(this.period.split('-')[0] || new Date().getFullYear()),
      departmentId: this.departmentId ? Number(this.departmentId) : null,
      employeeIds: this.employeeId ? [Number(this.employeeId)] : undefined,
      includeAttendance: this.includeAttendance,
      includeLeave: this.includeLeave,
      includeOvertime: this.includeOvertime,
      includeBonus: this.includeBonus,
      comment: this.comment.trim() || undefined,
    };

    this.processing.set(true);
    this.payrollService.processPayroll(payload).subscribe({
      next: () => {
        this.toastService.show('Payroll cycle processed successfully.', 'success');
        this.comment = '';
        this.processing.set(false);
        this.load();
      },
      error: () => {
        this.processing.set(false);
        this.toastService.show('Unable to process payroll cycle.', 'error');
      },
    });
  }

  exportReport(): void {
    this.payrollService
      .exportPayrollReport({
        period: this.period,
        departmentId: this.departmentId || null,
        employeeId: this.employeeId || null,
      })
      .subscribe({
        next: () =>
          this.toastService.show('Payroll report export started successfully.', 'success'),
        error: () =>
          this.toastService.show('Unable to export payroll report.', 'error'),
      });
  }
}
