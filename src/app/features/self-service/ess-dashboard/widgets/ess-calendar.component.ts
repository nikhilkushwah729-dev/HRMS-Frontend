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
    <div class="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div class="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <h2 class="text-lg font-black tracking-tight text-slate-900">{{ t('selfService.calendarWidget.title') }}</h2>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <button (click)="previousMonth.emit()" class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div class="min-w-[132px] text-center text-sm font-black text-slate-900 sm:min-w-[160px]">
              {{ monthLabel() }}
            </div>
            <button (click)="nextMonth.emit()" class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div class="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-5">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <button (click)="jumpToToday.emit()" class="rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-emerald-600">
            {{ t('selfService.holidaysWidget.today') }}
          </button>

          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            @for (stat of summary(); track stat.label) {
              <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                <p class="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">{{ stat.label }}</p>
                <p class="mt-1 text-sm font-black text-slate-900 sm:text-base">{{ stat.value }}</p>
              </div>
            }
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
          <div class="mb-2 grid grid-cols-7 gap-2">
            @for (dayName of weekdays(); track dayName) {
              <div class="flex items-center justify-center py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                {{ dayName }}
              </div>
            }
          </div>

          <div class="grid grid-cols-7 gap-2">
            @for (day of days(); track day.iso) {
              <button
                (click)="selectDay.emit(day)"
                class="relative mx-auto flex aspect-square w-full max-w-[44px] items-center justify-center rounded-lg text-xs font-bold transition sm:max-w-[50px] sm:text-sm"
                [attr.title]="calendarTooltip(day)"
                [ngClass]="[
                  day.inCurrentMonth ? calendarDayClasses(day) : 'pointer-events-none text-transparent'
                ]">
                @if (day.inCurrentMonth && day.dotClass) {
                  <span class="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-white" [ngClass]="day.dotClass"></span>
                }
                {{ day.inCurrentMonth ? day.dayNumber : '' }}
              </button>
            }
          </div>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          @for (legend of legends(); track legend.key) {
            <div class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
              <span class="h-2.5 w-2.5 rounded-full shrink-0" [ngClass]="legend.dotClass"></span>
              <span class="truncate">{{ legendDisplayLabel(legend.key, legend.label) }}</span>
            </div>
          }
        </div>

        <div class="mt-4 min-h-0 rounded-xl border border-slate-200 bg-white p-4">
          @if (selectedDay()) {
            <div class="flex h-full flex-col gap-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{{ t('selfService.calendarWidget.timelineEvent') }}</p>
                  <h3 class="mt-1 text-lg font-black text-slate-900">{{ selectedDayHeadline() }}</h3>
                </div>
                <button (click)="closeDetail.emit()" class="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition hover:text-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                  {{ selectedDay()?.label || t('selfService.calendarWidget.selectWorkday') }}
                </span>
                @if (selectedDay()?.sublabel) {
                  <span class="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                    {{ selectedDay()?.sublabel }}
                  </span>
                }
              </div>

              <div class="grid grid-cols-2 gap-3">
                @for (metric of selectedMetrics(); track metric.label) {
                  <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                    <p class="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">{{ metric.label }}</p>
                    <p class="mt-1 text-sm font-black text-slate-900">{{ metric.value }}</p>
                  </div>
                }
              </div>

              <div class="space-y-2">
                @for (note of selectedNotes(); track note) {
                  <div class="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-600">
                    <span class="mt-1 h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span>{{ note }}</span>
                  </div>
                }
              </div>

              <div class="mt-auto grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button (click)="navigate.emit('/self-service/attendance')" class="h-11 rounded-lg bg-slate-900 px-4 text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-emerald-600">
                  {{ t('selfService.calendarWidget.openRecords') }}
                </button>
                <button (click)="navigate.emit('/leaves')" class="h-11 rounded-lg border border-slate-200 bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-slate-900 transition hover:border-emerald-600">
                  {{ t('selfService.calendarWidget.requestDetail') }}
                </button>
              </div>
            </div>
          } @else {
            <div class="flex h-full min-h-[180px] flex-col items-center justify-center text-center">
              <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
              </div>
              <h3 class="text-base font-black text-slate-900">{{ t('selfService.calendarWidget.selectWorkday') }}</h3>
              <p class="mt-2 max-w-xs text-sm font-semibold text-slate-500">{{ t('selfService.calendarWidget.selectWorkdayHelp') }}</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
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

  calendarDayClasses(day: CalendarDay): string {
    if (day.isToday) {
      return 'bg-slate-900 text-white shadow-sm';
    }

    if (this.selectedDay()?.iso === day.iso) {
      return 'bg-emerald-500 text-white shadow-sm';
    }

    switch (day.statusKey) {
      case 'present':
        return 'bg-emerald-500 text-white';
      case 'late':
        return 'bg-amber-300 text-amber-950 ring-1 ring-amber-400';
      case 'absent':
        return 'bg-rose-500 text-white';
      case 'leave':
        return 'bg-yellow-300 text-yellow-950 ring-1 ring-yellow-400';
      case 'holiday':
        return 'bg-sky-500 text-white';
      case 'weekend':
        return 'bg-slate-300 text-slate-700';
      default:
        return 'bg-white text-slate-900 ring-1 ring-slate-200';
    }
  }

  legendDisplayLabel(key: string, fallback: string): string {
    switch (key) {
      case 'present':
        return 'Present';
      case 'late':
        return 'Late';
      case 'absent':
        return 'Absent';
      case 'leave':
        return 'Leave';
      case 'holiday':
        return 'Holiday';
      case 'weekend':
        return 'Weekly Off';
      default:
        return fallback;
    }
  }

  calendarTooltip(day: CalendarDay): string {
    if (!day.inCurrentMonth) {
      return '';
    }

    const dateLabel = new Intl.DateTimeFormat(this.languageService.currentLanguage().locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(day.date);

    const statusLabel = this.legendDisplayLabel(day.statusKey, day.label || 'Day');
    const detail = day.sublabel ? ` - ${day.sublabel}` : '';
    return `${dateLabel}: ${statusLabel}${detail}`;
  }

  previousMonth = output<void>();
  nextMonth = output<void>();
  jumpToToday = output<void>();
  selectDay = output<CalendarDay>();
  closeDetail = output<void>();
  navigate = output<string>();
}
