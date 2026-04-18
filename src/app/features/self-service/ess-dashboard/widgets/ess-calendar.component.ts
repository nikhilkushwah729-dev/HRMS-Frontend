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
    <div class="app-glass-card h-full flex flex-col ring-1 ring-slate-100 hover:ring-indigo-100 transition-all shadow-sm hover:shadow-2xl overflow-hidden rounded-md">
      <div class="border-b border-slate-100 bg-slate-50/40 p-4">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 class="text-xl font-black tracking-tight text-slate-900 leading-tight">{{ t('selfService.calendarWidget.title') }}</h2>
            <p class="mt-2 text-sm font-medium text-slate-500">{{ t('selfService.calendarWidget.subtitle') }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-3 rounded-md bg-white/60 p-2 ring-1 ring-slate-200/60 backdrop-blur-sm">
            <button (click)="previousMonth.emit()" class="flex h-11 w-11 items-center justify-center rounded-md bg-white text-slate-500 shadow-sm transition hover:text-indigo-600 ring-1 ring-slate-200/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div class="min-w-[170px] rounded-md bg-slate-50 px-5 py-2 text-center ring-1 ring-slate-200/70">
              <p class="text-[9px] font-black uppercase tracking-[0.24em] text-slate-400">{{ t('selfService.calendarWidget.activeView') }}</p>
              <p class="mt-1 text-sm font-black tracking-tight text-slate-900">{{ monthLabel() }}</p>
            </div>
            <button (click)="nextMonth.emit()" class="flex h-11 w-11 items-center justify-center rounded-md bg-white text-slate-500 shadow-sm transition hover:text-indigo-600 ring-1 ring-slate-200/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m9 18 6-6-6-6"/></svg>
            </button>
            <button (click)="jumpToToday.emit()" class="px-5 py-2.5 rounded-md bg-indigo-600 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-slate-900 hover:shadow-lg">
              {{ t('selfService.holidaysWidget.today') }}
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 border-b border-slate-100 bg-slate-50/20 p-4 lg:grid-cols-4">
        @for (stat of summary(); track stat.label) {
          <div class="rounded-md border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-slate-100/50 transition-all hover:ring-indigo-200" [ngClass]="stat.tone || ''">
            <p class="text-[9px] font-black uppercase tracking-[0.24em] text-slate-400">{{ stat.label }}</p>
            <p class="mt-3 text-3xl font-black tracking-tighter text-slate-900">{{ stat.value }}</p>
            <p class="mt-2 text-xs font-medium leading-relaxed text-slate-500">{{ stat.description }}</p>
          </div>
        }
      </div>

      <div class="p-4">
        <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{{ t('selfService.calendarWidget.legendTitle') }}</p>
            <p class="mt-1 text-sm font-medium text-slate-500">{{ monthFocusText() }}</p>
          </div>
          <div class="rounded-md border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
            <p class="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{{ t('selfService.calendarWidget.selectionTitle') }}</p>
            <p class="mt-1 text-sm font-bold text-slate-900">{{ selectedDayHeadline() }}</p>
          </div>
        </div>

        <div class="mb-5 flex flex-wrap gap-3">
          @for (legend of legends(); track legend.key) {
            <div class="inline-flex items-center gap-3 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] ring-1 ring-slate-100 shadow-sm" [ngClass]="legend.chipClass">
              <span class="h-2.5 w-2.5 rounded-full shadow-inner" [ngClass]="legend.dotClass"></span>
              <span>{{ legend.label }}</span>
            </div>
          }
        </div>

        <div class="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_330px] 2xl:gap-5">
          <div>
            <div class="mb-3 grid grid-cols-7 gap-1 px-1 sm:px-2">
              @for (dayName of weekdays(); track dayName) {
                <div class="flex min-w-0 items-center justify-center rounded-md bg-slate-50/80 px-1 py-2 text-center text-[9px] font-black tracking-[0.08em] text-slate-500 ring-1 ring-slate-100 sm:text-[10px]">
                  <span class="truncate">{{ dayName }}</span>
                </div>
              }
            </div>
            <div class="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-slate-100 bg-slate-100 shadow-sm ring-1 ring-slate-200/50">
              @for (day of days(); track day.iso) {
                <button
                  (click)="selectDay.emit(day)"
                  class="group relative flex min-h-[92px] flex-col overflow-hidden bg-white p-2 text-left transition-all hover:z-10 hover:shadow-2xl sm:min-h-[108px] sm:p-2.5 lg:min-h-[132px] lg:p-3"
                  [ngClass]="[day.cardClass || '', selectedDay()?.iso === day.iso ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50/5' : '']">
                  <div class="relative z-10 flex w-full items-center justify-between">
                    <span
                      class="flex h-7 min-w-[1.9rem] items-center justify-center rounded-md px-1 text-sm font-black shadow-sm ring-1 sm:h-8 sm:min-w-[2.1rem] sm:text-[15px] lg:h-9 lg:min-w-[2.3rem] lg:text-base"
                      [ngClass]="day.inCurrentMonth ? (day.isToday ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-slate-900 text-white ring-slate-900/10') : 'bg-slate-100 text-slate-400 ring-slate-200'">
                      {{ day.dayNumber }}
                    </span>
                    @if (day.inCurrentMonth) {
                      <span class="h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-125 sm:h-3 sm:w-3" [ngClass]="day.dotClass"></span>
                    }
                  </div>
                  @if (day.inCurrentMonth) {
                    <div class="relative z-10 mt-2 space-y-1.5 sm:mt-3 lg:mt-4 lg:space-y-2">
                      <div class="inline-flex max-w-full rounded-full border px-2 py-1 shadow-sm text-[8px] font-black uppercase tracking-[0.08em] backdrop-blur-sm sm:px-2.5 sm:text-[8.5px] lg:px-3 lg:text-[9px] lg:tracking-[0.16em]" [ngClass]="day.chipClass">
                        <span class="truncate">{{ day.label }}</span>
                      </div>
                      <p class="line-clamp-2 text-[9px] font-bold leading-snug text-slate-500/80 transition-colors group-hover:text-slate-600 sm:text-[10px] lg:text-[11px] lg:leading-relaxed">{{ day.sublabel }}</p>
                    </div>
                  }
                  @if (day.isToday) {
                    <div class="pointer-events-none absolute inset-0 ring-4 ring-indigo-500/20"></div>
                  }
                </button>
              }
            </div>
          </div>

          <div class="rounded-md border border-slate-100 bg-slate-50/50 p-3 ring-1 ring-slate-200/50 shadow-inner sm:p-4">
            @if (selectedDay()) {
              <div class="relative z-10 flex items-start justify-between gap-6">
                <div>
                  <p class="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{{ t('selfService.calendarWidget.timelineEvent') }}</p>
                  <h3 class="text-2xl font-black tracking-tight text-slate-900">{{ selectedDayHeadline() }}</h3>
                  <p class="mt-2 text-sm font-medium leading-relaxed text-slate-500">{{ selectedDay()?.sublabel }}</p>
                </div>
                <button (click)="closeDetail.emit()" class="flex h-10 w-10 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div class="mt-8 inline-flex rounded-full border border-white bg-white/60 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] shadow-sm ring-1 ring-slate-100" [ngClass]="selectedDay()?.chipClass">
                {{ selectedDay()?.label }}
              </div>

              <div class="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3">
                @for (metric of selectedMetrics(); track metric.label) {
                  <div class="rounded-md border border-white bg-white/90 p-3 shadow-sm ring-1 ring-slate-100 sm:p-4">
                    <p class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{{ metric.label }}</p>
                    <p class="mt-3 text-base font-black text-slate-900">{{ metric.value }}</p>
                  </div>
                }
              </div>

              <div class="mt-5 rounded-md border border-white bg-white/90 p-3 shadow-sm ring-1 ring-slate-100 sm:mt-6 sm:p-4">
                <p class="mb-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{{ t('selfService.calendarWidget.activityLogs') }}</p>
                <div class="space-y-3">
                  @for (note of selectedNotes(); track note) {
                    <div class="flex items-start gap-3 rounded-md bg-slate-50/60 p-3 ring-1 ring-slate-100/60 sm:gap-4 sm:p-4">
                      <div class="mt-1.5 h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                      <p class="text-[13px] font-medium leading-relaxed text-slate-600">{{ note }}</p>
                    </div>
                  }
                </div>
              </div>

              <div class="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:gap-3">
                <button (click)="navigate.emit('/attendance')" class="w-full rounded-md bg-indigo-600 py-3.5 text-xs font-black uppercase tracking-widest text-white transition hover:bg-slate-900 hover:shadow-xl sm:py-4">
                  {{ t('selfService.calendarWidget.openRecords') }}
                </button>
                <button (click)="navigate.emit('/leaves')" class="w-full rounded-md border border-slate-200 bg-white py-3.5 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:border-indigo-600 hover:text-indigo-600 hover:shadow-md sm:py-4">
                  {{ t('selfService.calendarWidget.requestDetail') }}
                </button>
              </div>
            } @else {
              <div class="flex h-full min-h-[280px] flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-white/85 p-6 text-center sm:min-h-[320px] sm:p-8">
                <div class="flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-400 sm:h-14 sm:w-14">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                </div>
                <h3 class="mt-4 text-base font-black text-slate-900">{{ t('selfService.calendarWidget.selectWorkday') }}</h3>
                <p class="mt-2 text-sm leading-6 text-slate-500">{{ t('selfService.calendarWidget.selectWorkdayHelp') }}</p>
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

  readonly monthFocusText = computed(() => {
    return this.selectedDay()
      ? this.t('selfService.calendarWidget.focusSelectedDay')
      : this.t('selfService.calendarWidget.focusMonthOverview');
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
