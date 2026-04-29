import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PayrollDashboard, PayrollService, Payslip } from '../../core/services/payroll.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-self-service-payroll',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.24em] text-fuchsia-600">Self Service Payroll</p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">View your salary, payslips, tax, and reimbursements</h1>
            <p class="mt-2 max-w-3xl text-sm text-slate-500">
              This employee-only payroll workspace keeps your monthly payslip history, YTD values, and salary breakdown separate from HR payroll operations.
            </p>
          </div>
        </div>
      </section>

      @if (loading()) {
        <div class="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
          Loading payroll details...
        </div>
      } @else {
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Net Salary</p>
            <p class="mt-3 text-3xl font-black text-slate-900">{{ latestPayslip()?.net_salary || 0 | currency:'INR':'symbol':'1.0-0' }}</p>
            <p class="mt-2 text-sm text-slate-500">Latest published payslip amount</p>
          </article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">YTD Earnings</p>
            <p class="mt-3 text-3xl font-black text-emerald-600">{{ dashboard()?.ytdEarnings || 0 | currency:'INR':'symbol':'1.0-0' }}</p>
            <p class="mt-2 text-sm text-slate-500">Year-to-date taxable and non-taxable earnings</p>
          </article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">YTD Deductions</p>
            <p class="mt-3 text-3xl font-black text-rose-600">{{ dashboard()?.ytdDeductions || 0 | currency:'INR':'symbol':'1.0-0' }}</p>
            <p class="mt-2 text-sm text-slate-500">PF, ESI, TDS, professional tax, and LOP</p>
          </article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Tax Summary</p>
            <p class="mt-3 text-3xl font-black text-sky-600">{{ dashboard()?.taxSummary || 0 | currency:'INR':'symbol':'1.0-0' }}</p>
            <p class="mt-2 text-sm text-slate-500">TDS and yearly tax visibility</p>
          </article>
        </section>

        <section class="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div class="space-y-5">
            <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h2 class="text-lg font-black text-slate-900">Latest Salary Breakdown</h2>
                  <p class="mt-1 text-sm text-slate-500">Published component summary from the most recent payroll cycle.</p>
                </div>
                @if (latestPayslip()) {
                  <a
                    [routerLink]="['/self-service/payslip', payslipPeriod(latestPayslip()!)]"
                    class="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                  >
                    View Payslip
                  </a>
                }
              </div>

              <div class="mt-5 grid gap-4 md:grid-cols-2">
                @for (row of breakdownRows(); track row.label) {
                  <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{{ row.label }}</p>
                    <p class="mt-2 text-xl font-black" [ngClass]="row.tone">{{ row.value | currency:'INR':'symbol':'1.0-0' }}</p>
                  </div>
                }
              </div>
            </article>

            <article class="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div class="border-b border-slate-100 px-5 py-4">
                <h2 class="text-lg font-black text-slate-900">Payslip History</h2>
                <p class="mt-1 text-sm text-slate-500">Download or preview your monthly payslips only.</p>
              </div>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200">
                  <thead>
                    <tr class="text-left text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                      <th class="px-4 py-4">Month</th>
                      <th class="px-4 py-4">Gross</th>
                      <th class="px-4 py-4">Net</th>
                      <th class="px-4 py-4">Status</th>
                      <th class="px-4 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (item of dashboard()?.payslips || []; track item.id) {
                      <tr>
                        <td class="px-4 py-4 text-sm font-black text-slate-900">{{ item.month }} {{ item.year }}</td>
                        <td class="px-4 py-4 text-sm text-slate-600">{{ (item.gross_salary || item.basic_salary + item.allowances) | currency:'INR':'symbol':'1.0-0' }}</td>
                        <td class="px-4 py-4 text-sm font-black text-slate-900">{{ item.net_salary | currency:'INR':'symbol':'1.0-0' }}</td>
                        <td class="px-4 py-4">
                          <span class="rounded-full px-3 py-1 text-xs font-black" [ngClass]="statusBadge(item.status)">
                            {{ item.status }}
                          </span>
                        </td>
                        <td class="px-4 py-4">
                          <div class="flex justify-end gap-2">
                            <a [routerLink]="['/self-service/payslip', payslipPeriod(item)]" class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50">
                              Preview
                            </a>
                            <button type="button" (click)="download(item)" class="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white transition hover:bg-slate-800">
                              PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="5" class="px-4 py-10 text-center text-sm font-semibold text-slate-500">No payslips available yet.</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </article>
          </div>

          <div class="space-y-5">
            <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 class="text-lg font-black text-slate-900">Tax Summary</h2>
              <div class="mt-4 space-y-3">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">TDS</p>
                  <p class="mt-2 text-xl font-black text-slate-900">{{ latestPayslip()?.tds || 0 | currency:'INR':'symbol':'1.0-0' }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Professional Tax</p>
                  <p class="mt-2 text-xl font-black text-slate-900">{{ latestPayslip()?.professional_tax || 0 | currency:'INR':'symbol':'1.0-0' }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">PF & ESI</p>
                  <p class="mt-2 text-xl font-black text-slate-900">{{ ((latestPayslip()?.pf || 0) + (latestPayslip()?.esi || 0)) | currency:'INR':'symbol':'1.0-0' }}</p>
                </div>
              </div>
            </article>

            <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 class="text-lg font-black text-slate-900">Reimbursement Status</h2>
              <div class="mt-4 grid gap-3 sm:grid-cols-3">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Pending</p>
                  <p class="mt-2 text-2xl font-black text-amber-500">{{ dashboard()?.reimbursementStatus?.pending || 0 }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Approved</p>
                  <p class="mt-2 text-2xl font-black text-sky-600">{{ dashboard()?.reimbursementStatus?.approved || 0 }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Paid</p>
                  <p class="mt-2 text-2xl font-black text-emerald-600">{{ dashboard()?.reimbursementStatus?.paid || 0 }}</p>
                </div>
              </div>
            </article>
          </div>
        </section>
      }
    </div>
  `,
})
export class SelfServicePayrollComponent {
  private readonly payrollService = inject(PayrollService);
  private readonly toastService = inject(ToastService);

  readonly loading = signal(true);
  readonly dashboard = signal<PayrollDashboard | null>(null);
  readonly latestPayslip = computed(() => this.dashboard()?.latestPayslip ?? null);
  readonly breakdownRows = computed(() => {
    const latest = this.latestPayslip();
    return [
      { label: 'Basic Salary', value: latest?.basic_salary ?? 0, tone: 'text-slate-900' },
      { label: 'HRA', value: latest?.hra ?? 0, tone: 'text-slate-900' },
      { label: 'Allowances', value: latest?.allowances ?? 0, tone: 'text-emerald-600' },
      { label: 'Bonus / Incentives', value: (latest?.bonus ?? 0) + (latest?.overtime ?? 0), tone: 'text-emerald-600' },
      { label: 'Deductions', value: latest?.deductions ?? 0, tone: 'text-rose-600' },
      { label: 'Net Salary', value: latest?.net_salary ?? 0, tone: 'text-sky-700' },
    ];
  });

  constructor() {
    this.load();
  }

  private load(): void {
    this.payrollService.getMyPayrollDashboard().subscribe({
      next: (dashboard) => {
        this.dashboard.set(dashboard);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.show('Unable to load payroll details.', 'error');
        this.loading.set(false);
      },
    });
  }

  payslipPeriod(item: Payslip): string {
    return `${item.year}-${String(item.month).padStart(2, '0')}`;
  }

  statusBadge(status: Payslip['status']): string {
    const map: Record<Payslip['status'], string> = {
      published: 'bg-emerald-50 text-emerald-700',
      pending: 'bg-amber-50 text-amber-700',
      on_hold: 'bg-rose-50 text-rose-700',
      processed: 'bg-sky-50 text-sky-700',
      locked: 'bg-slate-100 text-slate-700',
    };
    return map[status];
  }

  download(item: Payslip): void {
    this.payrollService.downloadPayslipPdf(item).subscribe({
      next: (url) => {
        if (!url) {
          this.toastService.show('PDF is not available for this payslip yet.', 'error');
          return;
        }
        window.open(url, '_blank', 'noopener');
      },
      error: () => this.toastService.show('Unable to download the payslip right now.', 'error'),
    });
  }
}
