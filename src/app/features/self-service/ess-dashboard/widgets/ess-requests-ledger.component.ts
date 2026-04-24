import { Component, input, output, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-ess-requests-ledger',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="flex h-full flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-2xl hover:shadow-slate-200/40">
      <div class="flex flex-col shrink-0 gap-4 p-8 border-b border-slate-50 bg-slate-50/20 sm:flex-row sm:items-center justify-between">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">{{ t('selfService.requests.title') }}</h2>
          <p class="text-sm font-bold text-slate-500 mt-1">{{ t('selfService.requests.subtitle') }}</p>
        </div>
        <button
          (click)="viewAll.emit()"
          class="rounded-xl bg-slate-100 px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-emerald-50 hover:text-emerald-600"
        >
          {{ t('selfService.requests.viewAll') }}
        </button>
      </div>

      <div class="flex-1 overflow-x-auto">
        <table class="w-full text-left">
          <thead class="border-b border-slate-50 bg-slate-50/10 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <tr>
              <th class="px-8 py-5">{{ t('selfService.requests.leavePortfolio') }}</th>
              <th class="px-8 py-5">{{ t('selfService.requests.durationRange') }}</th>
              <th class="px-8 py-5">{{ t('selfService.requests.metric') }}</th>
              <th class="px-8 py-5 text-center">{{ t('selfService.requests.outcome') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (req of requests(); track req.id) {
              <tr class="group transition-all hover:bg-slate-50/50">
                <td class="px-8 py-5">
                  <div class="flex items-center gap-4">
                    <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm text-slate-400 transition-all group-hover:bg-emerald-50 group-hover:text-emerald-600 ring-1 ring-slate-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M2 22c6 0 10-3 14-8 2-3 4-8 6-12-6 0-10 3-14 8-2 3-4 8-6 12Z"/>
                        <path d="M8 16c2 0 5-1 8-4"/>
                      </svg>
                    </div>
                    <span class="text-sm font-black text-slate-900">{{ req.leaveType?.typeName }}</span>
                  </div>
                </td>
                <td class="px-8 py-5 text-xs font-bold text-slate-400">
                  {{ req.startDate | date:'MMM dd' }} - {{ req.endDate | date:'MMM dd, yyyy' }}
                </td>
                <td class="px-8 py-5">
                   <div class="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-slate-900">
                      {{ req.totalDays }} Days
                   </div>
                </td>
                <td class="px-8 py-5">
                  <div class="flex justify-center">
                    <span
                      class="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border"
                      [ngClass]="{
                        'bg-amber-50 text-amber-600 border-amber-100': req.status === 'pending',
                        'bg-emerald-50 text-emerald-600 border-emerald-100': req.status === 'approved',
                        'bg-rose-50 text-rose-600 border-rose-100': req.status === 'rejected'
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
                <td colspan="4" class="py-20 text-center">
                   <div class="flex flex-col items-center gap-3">
                      <div class="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-slate-300">
                         <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><line x1="10" x2="8" y1="9" y2="9"></line></svg>
                      </div>
                      <p class="text-sm font-bold text-slate-400">{{ t('selfService.requests.empty') }}</p>
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
