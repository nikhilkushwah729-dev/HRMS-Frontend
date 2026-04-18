import { Component, input, output, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-ess-requests-ledger',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="app-glass-card h-full flex flex-col overflow-hidden rounded-md ring-1 ring-slate-100 shadow-sm transition-all hover:ring-indigo-100 hover:shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-100 bg-slate-50/30 p-5">
        <div>
          <h2 class="text-xl font-black tracking-tight text-slate-900">{{ t('selfService.requests.title') }}</h2>
          <p class="mt-1 text-xs font-medium text-slate-500">{{ t('selfService.requests.subtitle') }}</p>
        </div>
        <button
          (click)="viewAll.emit()"
          class="rounded-md bg-indigo-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 transition-colors ring-1 ring-indigo-200/50 hover:bg-indigo-100"
        >
          {{ t('selfService.requests.viewAll') }}
        </button>
      </div>

      <div class="flex-1 overflow-x-auto">
        <table class="w-full text-left">
          <thead class="border-b border-slate-100 bg-slate-50/30 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <tr>
              <th class="px-5 py-4">{{ t('selfService.requests.leavePortfolio') }}</th>
              <th class="px-5 py-4">{{ t('selfService.requests.durationRange') }}</th>
              <th class="px-5 py-4">{{ t('selfService.requests.metric') }}</th>
              <th class="px-5 py-4 text-center">{{ t('selfService.requests.outcome') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (req of requests(); track req.id) {
              <tr class="group transition-colors hover:bg-slate-50">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-400 transition-colors group-hover:bg-amber-100 group-hover:text-amber-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M2 22c6 0 10-3 14-8 2-3 4-8 6-12-6 0-10 3-14 8-2 3-4 8-6 12Z"/>
                        <path d="M8 16c2 0 5-1 8-4"/>
                      </svg>
                    </div>
                    <span class="text-sm font-bold text-slate-800">{{ req.leaveType?.typeName }}</span>
                  </div>
                </td>
                <td class="px-5 py-4 text-[11px] font-bold text-slate-400">
                  {{ req.startDate | date:'MMM dd' }} - {{ req.endDate | date:'MMM dd, yyyy' }}
                </td>
                <td class="px-5 py-4 font-mono text-sm font-black text-slate-900">{{ req.totalDays }}D</td>
                <td class="px-5 py-4">
                  <div class="flex justify-center">
                    <span
                      class="badge"
                      [ngClass]="{
                        'badge-warning': req.status === 'pending',
                        'badge-success': req.status === 'approved',
                        'badge-error': req.status === 'rejected'
                      }"
                    >
                      {{ statusLabel(req.status) }}
                    </span>
                  </div>
                </td>
              </tr>
            }

            @if (requests().length === 0) {
              <tr>
                <td colspan="4" class="py-10 text-center">
                  <div class="flex flex-col items-center justify-center p-6">
                    <p class="text-sm font-bold italic text-slate-400">{{ t('selfService.requests.empty') }}</p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.625rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .badge-warning { background: #fffbeb; color: #b45309; border: 1px solid #fef3c7; }
    .badge-success { background: #ecfdf5; color: #047857; border: 1px solid #d1fae5; }
    .badge-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2; }
  `]
})
export class EssRequestsLedgerComponent {
  private languageService = inject(LanguageService);
  requests = input<any[]>([]);
  viewAll = output<void>();
  readonly t = (key: string, params?: Record<string, string | number | null | undefined>) =>
    this.languageService.t(key, params);

  statusLabel(status: string): string {
    if (status === 'approved') return this.t('common.approved');
    if (status === 'rejected') return this.t('common.rejected');
    return this.t('common.pending');
  }
}
