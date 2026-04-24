import { Component, input, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-ess-holidays',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="flex h-full flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-2xl hover:shadow-slate-200/40">
      <div class="flex flex-col shrink-0 gap-4 p-8 border-b border-slate-50 bg-slate-50/20 sm:flex-row sm:items-center justify-between">
        <div class="flex items-center gap-4">
           <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
             <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
           </div>
           <div>
             <h2 class="text-2xl font-black text-slate-900 tracking-tight">{{ t('selfService.holidaysWidget.title') }}</h2>
             <p class="text-sm font-bold text-slate-500 mt-1">{{ t('selfService.holidaysWidget.subtitle') }}</p>
           </div>
        </div>
      </div>
      <div class="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <div class="space-y-3">
          @for (holiday of holidays(); track holiday.date) {
            <div class="group flex items-center justify-between rounded-3xl bg-slate-50 p-5 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 ring-1 ring-transparent hover:ring-slate-100">
              <div class="flex items-center gap-4">
                <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-sm text-emerald-600 transition-transform group-hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                </div>
                <div>
                  <p class="text-sm font-black text-slate-900 truncate">{{ holiday.name }}</p>
                  <p class="mt-1 text-xs font-bold text-slate-400 truncate">{{ holiday.date | date:'dd MMM yyyy' }}</p>
                </div>
              </div>
              <div class="rounded-xl bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-sm ring-1 ring-slate-100 group-hover:bg-slate-900 group-hover:text-white group-hover:ring-slate-900 transition-all">
                {{ daysUntil(holiday.date) }}
              </div>
            </div>
          }
        </div>
        @if (holidays().length === 0) {
          <div class="flex h-full flex-col items-center justify-center text-center py-10">
             <p class="text-sm font-bold text-slate-400">{{ t('selfService.holidaysWidget.empty') }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `]
})
export class EssHolidaysComponent {
  private languageService = inject(LanguageService);
  holidays = input<any[]>([]);
  readonly t = (key: string, params?: Record<string, string | number | null | undefined>) =>
    this.languageService.t(key, params);

  daysUntil(date: string): string {
    const target = new Date(date);
    const diff = Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return this.t('selfService.holidaysWidget.today');
    if (diff === 1) return this.t('selfService.holidaysWidget.tomorrow');
    return this.t('selfService.holidaysWidget.dayCount', { count: diff });
  }
}
