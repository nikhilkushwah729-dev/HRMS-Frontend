import { Component, computed, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../../core/services/language.service';

export interface CalendarDay {
  date: Date;
  iso: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  statusKey: string;
  label: string;
  sublabel: string;
  dotClass: string;
  chipClass: string;
  cardClass: string;
}

@Component({
  selector: 'app-ess-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex h-full flex-col overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-2xl hover:shadow-slate-200/40">
      <div class="flex flex-col shrink-0 gap-6 p-8 border-b border-slate-50 bg-slate-50/20 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">{{ t('selfService.calendarWidget.title') }}</h2>
          <p class="text-sm font-bold text-slate-500 mt-1">{{ t('selfService.calendarWidget.subtitle') }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2 rounded-md bg-white p-2 shadow-sm ring-1 ring-slate-100">
          <button (click)="previousMonth.emit()" class="flex h-10 w-10 items-center justify-center rounded-md bg-slate-50 text-slate-400 hover:text-emerald-600 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div class="min-w-[140px] px-4 py-2 text-center">
             <p class="text-sm font-black text-slate-900">{{ monthLabel() }}</p>
          </div>
          <button (click)="nextMonth.emit()" class="flex h-10 w-10 items-center justify-center rounded-md bg-slate-50 text-slate-400 hover:text-emerald-600 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <button (click)="jumpToToday.emit()" class="px-5 py-2 text-[11px] font-black uppercase tracking-widest bg-slate-900 text-white rounded-md hover:bg-emerald-600 transition-all">
            {{ t('selfService.holidaysWidget.today') }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 border-b border-slate-50 p-8 lg:grid-cols-4">
        @for (stat of summary(); track stat.label) {
          <div class="rounded-md bg-slate-50 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 ring-1 ring-transparent hover:ring-slate-100">
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ stat.label }}</p>
            <p class="mt-3 text-3xl font-black text-slate-900">{{ stat.value }}</p>
            <p class="mt-2 text-xs font-bold text-slate-500">{{ stat.description }}</p>
          </div>
        }
      </div>

      <div class="flex-1 p-8">
        <div class="grid gap-8 xl:grid-cols-[1fr_360px]">
          <div>
            <div class="mb-4 grid grid-cols-7 gap-2">
              @for (dayName of weekdays(); track dayName) {
                <div class="flex items-center justify-center py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {{ dayName }}
                </div>
              }
            </div>
            <div class="grid grid-cols-7 gap-2">
              @for (day of days(); track day.iso) {
                <button
                  (click)="selectDay.emit(day)"
                  class="group relative flex min-h-[110px] flex-col rounded-md p-4 transition-all hover:shadow-xl hover:shadow-slate-200/40"
                  [ngClass]="[
                    day.inCurrentMonth ? 'bg-slate-50 hover:bg-white' : 'opacity-30 pointer-events-none',
                    selectedDay()?.iso === day.iso ? 'ring-2 ring-emerald-500 bg-white shadow-xl shadow-emerald-50' : ''
                  ]">
                  <div class="flex w-full items-start justify-between">
                    <span
                      class="flex h-8 w-8 items-center justify-center rounded-md text-sm font-black"
                      [ngClass]="day.isToday ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'text-slate-900'">
                      {{ day.dayNumber }}
                    </span>
                    @if (day.inCurrentMonth && day.dotClass) {
                       <div class="h-2 w-2 rounded-full" [ngClass]="day.dotClass"></div>
                    }
                  </div>
                  @if (day.inCurrentMonth && day.label) {
                    <div class="mt-auto">
                       <p class="text-[10px] font-black uppercase tracking-widest text-emerald-600 truncate">{{ day.label }}</p>
                    </div>
                  }
                </button>
              }
            </div>
          </div>

          <div class="rounded-md bg-slate-50 p-8 ring-1 ring-slate-100">
            @if (selectedDay()) {
              <div class="space-y-8">
                <div class="flex items-start justify-between">
                   <div>
                      <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ t('selfService.calendarWidget.timelineEvent') }}</p>
                      <h3 class="mt-2 text-2xl font-black text-slate-900">{{ selectedDayHeadline() }}</h3>
                   </div>
                   <button (click)="closeDetail.emit()" class="h-10 w-10 flex items-center justify-center rounded-md bg-white text-slate-400 hover:text-emerald-600 shadow-sm transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                   </button>
                </div>

                <div class="inline-flex rounded-md bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-sm ring-1 ring-slate-100">
                   {{ selectedDay()?.label }}
                </div>

                <div class="grid grid-cols-2 gap-3">
                   @for (metric of selectedMetrics(); track metric.label) {
                     <div class="rounded-md bg-white p-4 shadow-sm ring-1 ring-slate-100">
                        <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">{{ metric.label }}</p>
                        <p class="mt-2 text-base font-black text-slate-900">{{ metric.value }}</p>
                     </div>
                   }
                </div>

                <div class="space-y-4">
                   <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ t('selfService.calendarWidget.activityLogs') }}</p>
                   <div class="space-y-2">
                     @for (note of selectedNotes(); track note) {
                       <div class="flex items-start gap-3 rounded-md bg-white p-4 ring-1 ring-slate-100/50">
                         <div class="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200"></div>
                         <p class="text-xs font-bold text-slate-600">{{ note }}</p>
                       </div>
                     }
                   </div>
                </div>

                <div class="pt-4 flex flex-col gap-3">
                   <button (click)="navigate.emit('/attendance')" class="w-full h-14 rounded-md bg-slate-900 text-[11px] font-black uppercase tracking-widest text-white hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200">
                     {{ t('selfService.calendarWidget.openRecords') }}
                   </button>
                   <button (click)="navigate.emit('/leaves')" class="w-full h-14 rounded-md bg-white border border-slate-200 text-[11px] font-black uppercase tracking-widest text-slate-900 hover:border-emerald-600 transition-all">
                     {{ t('selfService.calendarWidget.requestDetail') }}
                   </button>
                </div>
              </div>
            } @else {
              <div class="flex h-full flex-col items-center justify-center text-center p-8">
                <div class="mb-6 h-16 w-16 flex items-center justify-center rounded-md bg-white text-slate-300 shadow-sm">
                   <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                </div>
                <h3 class="text-lg font-black text-slate-900">{{ t('selfService.calendarWidget.selectWorkday') }}</h3>
                <p class="mt-2 text-sm font-bold text-slate-500">{{ t('selfService.calendarWidget.selectWorkdayHelp') }}</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  `]
})
export class EssCalendarComponent {
  private languageService = inject(LanguageService);
  monthDate = input<Date | null>(null);
  summary = input<any[]>([]);
  legends = input<any[]>([]);
  days = input<CalendarDay[]>([]);
  selectedDay = input<CalendarDay | null>(null);
  selectedMetrics = input<any[]>([]);
  selectedNotes = input<string[]>([]);

  readonly monthLabel = computed(() => {
    const monthDate = this.monthDate();
    if (!monthDate) {
      return '';
    }

    return new Intl.DateTimeFormat(this.languageService.currentLanguage().locale, {
      month: 'long',
      year: 'numeric'
    }).format(monthDate);
  });

  readonly weekdays = computed(() => {
    const formatter = new Intl.DateTimeFormat(this.languageService.currentLanguage().locale, { weekday: 'short' });
    const baseSunday = new Date(Date.UTC(2024, 0, 7));
    return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(baseSunday.getTime() + index * 86400000)));
  });

  readonly selectedDayHeadline = computed(() => {
    const day = this.selectedDay();
    if (!day) {
      return this.t('selfService.calendarWidget.selectWorkday');
    }

    return new Intl.DateTimeFormat(this.languageService.currentLanguage().locale, {
      weekday: 'long',
      day: '2-digit',
      month: 'short'
    }).format(day.date);
  });

  readonly t = (key: string, params?: Record<string, string | number | null | undefined>) =>
    this.languageService.t(key, params);

  previousMonth = output<void>();
  nextMonth = output<void>();
  jumpToToday = output<void>();
  selectDay = output<CalendarDay>();
  closeDetail = output<void>();
  navigate = output<string>();
}
