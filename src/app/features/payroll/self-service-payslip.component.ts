import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PayrollService, Payslip } from '../../core/services/payroll.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-self-service-payslip',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mx-auto max-w-5xl space-y-6">
      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.24em] text-fuchsia-600">Payslip Preview</p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {{ payslip()?.month }} {{ payslip()?.year }} payslip
            </h1>
            <p class="mt-2 text-sm text-slate-500">Company details, earnings, deductions, and net payable amount in one employee-only view.</p>
          </div>
          <div class="flex gap-2">
            <a routerLink="/self-service/payroll" class="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">Back</a>
            <button type="button" (click)="download()" class="rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800">
              Download PDF
            </button>
          </div>
        </div>
      </section>

      @if (loading()) {
        <div class="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
          Loading payslip...
        </div>
      } @else if (payslip()) {
        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div class="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div class="space-y-5">
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Company</p>
                <p class="mt-2 text-lg font-black text-slate-900">HRNexus Technologies</p>
                <p class="mt-1 text-sm text-slate-500">Payroll statement for employee self service</p>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Payslip Status</p>
                <span class="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black" [ngClass]="statusBadge(payslip()!.status)">
                  {{ payslip()!.status }}
                </span>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Net Pay</p>
                <p class="mt-2 text-3xl font-black text-slate-900">{{ payslip()!.net_salary | currency:'INR':'symbol':'1.0-0' }}</p>
              </div>
            </div>

            <div class="grid gap-5 md:grid-cols-2">
              <div class="rounded-2xl border border-slate-200 bg-white p-4">
                <h2 class="text-sm font-black text-slate-900">Earnings</h2>
                <div class="mt-4 space-y-3 text-sm text-slate-600">
                  <div class="flex items-center justify-between"><span>Basic Salary</span><span class="font-black text-slate-900">{{ payslip()!.basic_salary | currency:'INR':'symbol':'1.0-0' }}</span></div>
                  <div class="flex items-center justify-between"><span>HRA</span><span class="font-black text-slate-900">{{ payslip()!.hra || 0 | currency:'INR':'symbol':'1.0-0' }}</span></div>
                  <div class="flex items-center justify-between"><span>Allowances</span><span class="font-black text-slate-900">{{ payslip()!.allowances | currency:'INR':'symbol':'1.0-0' }}</span></div>
                  <div class="flex items-center justify-between"><span>Bonus / Incentives</span><span class="font-black text-slate-900">{{ payslip()!.bonus || 0 | currency:'INR':'symbol':'1.0-0' }}</span></div>
                  <div class="flex items-center justify-between"><span>Overtime</span><span class="font-black text-slate-900">{{ payslip()!.overtime || 0 | currency:'INR':'symbol':'1.0-0' }}</span></div>
                  <div class="flex items-center justify-between"><span>Reimbursements</span><span class="font-black text-slate-900">{{ payslip()!.reimbursements || 0 | currency:'INR':'symbol':'1.0-0' }}</span></div>
                </div>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-white p-4">
                <h2 class="text-sm font-black text-slate-900">Deductions</h2>
                <div class="mt-4 space-y-3 text-sm text-slate-600">
                  <div class="flex items-center justify-between"><span>PF</span><span class="font-black text-slate-900">{{ payslip()!.pf || 0 | currency:'INR':'symbol':'1.0-0' }}</span></div>
                  <div class="flex items-center justify-between"><span>ESI</span><span class="font-black text-slate-900">{{ payslip()!.esi || 0 | currency:'INR':'symbol':'1.0-0' }}</span></div>
                  <div class="flex items-center justify-between"><span>Professional Tax</span><span class="font-black text-slate-900">{{ payslip()!.professional_tax || 0 | currency:'INR':'symbol':'1.0-0' }}</span></div>
                  <div class="flex items-center justify-between"><span>TDS</span><span class="font-black text-slate-900">{{ payslip()!.tds || 0 | currency:'INR':'symbol':'1.0-0' }}</span></div>
                  <div class="flex items-center justify-between"><span>LOP</span><span class="font-black text-slate-900">{{ payslip()!.lop || 0 | currency:'INR':'symbol':'1.0-0' }}</span></div>
                  <div class="flex items-center justify-between"><span>Other</span><span class="font-black text-slate-900">{{ payslip()!.other_deductions || 0 | currency:'INR':'symbol':'1.0-0' }}</span></div>
                </div>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                <div class="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Gross Salary</p>
                    <p class="mt-2 text-xl font-black text-slate-900">{{ (payslip()!.gross_salary || payslip()!.basic_salary + payslip()!.allowances + (payslip()!.hra || 0) + (payslip()!.bonus || 0) + (payslip()!.overtime || 0)) | currency:'INR':'symbol':'1.0-0' }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Total Deductions</p>
                    <p class="mt-2 text-xl font-black text-rose-600">{{ payslip()!.deductions | currency:'INR':'symbol':'1.0-0' }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Net Payable</p>
                    <p class="mt-2 text-xl font-black text-emerald-600">{{ payslip()!.net_salary | currency:'INR':'symbol':'1.0-0' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      } @else {
        <div class="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
          Payslip not found for the selected period.
        </div>
      }
    </div>
  `,
})
export class SelfServicePayslipComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly payrollService = inject(PayrollService);
  private readonly toastService = inject(ToastService);

  readonly loading = signal(true);
  readonly payslip = signal<Payslip | null>(null);

  constructor() {
    const period = this.route.snapshot.paramMap.get('month') || '';
    this.payrollService.getPayslipByPeriod(period).subscribe({
      next: (item) => {
        this.payslip.set(item);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.show('Unable to load payslip.', 'error');
        this.loading.set(false);
      },
    });
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

  download(): void {
    const item = this.payslip();
    if (!item) return;
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
