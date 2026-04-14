import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

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
  imports: [CommonModule, DatePipe],
  template: `
    <div class="app-glass-card h-full flex flex-col ring-1 ring-slate-100 hover:ring-indigo-100 transition-all shadow-sm hover:shadow-2xl overflow-hidden rounded-[32px]">
      <div class="border-b border-slate-100 bg-slate-50/40 p-6">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-xl font-black tracking-tight text-slate-900 leading-tight">Attendance Calendar</h2>
            <p class="text-sm font-medium text-slate-500 mt-2">Monthly view of your attendance, leaves, and holidays.</p>
          </div>
          <div class="flex items-center gap-3 bg-white/50 p-2 rounded-2xl ring-1 ring-slate-200/50 backdrop-blur-sm self-start lg:self-auto">
            <button (click)="previousMonth.emit()" class="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm transition hover:text-indigo-600 ring-1 ring-slate-200/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div class="px-6 py-2 text-center min-w-[140px]">
              <p class="text-[9px] font-black uppercase tracking-[0.24em] text-slate-400 mb-1">Active View</p>
              <p class="text-sm font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">{{ monthLabel() }}</p>
            </div>
            <button (click)="nextMonth.emit()" class="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm transition hover:text-indigo-600 ring-1 ring-slate-200/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m9 18 6-6-6-6"/></svg>
            </button>
            <div class="w-px h-6 bg-slate-200 mx-1"></div>
            <button (click)="jumpToToday.emit()" class="px-5 py-2.5 rounded-xl bg-indigo-600 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-slate-900 hover:shadow-lg">
              Today
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 border-b border-slate-100 bg-slate-50/20 p-6">
        @for (stat of summary(); track stat.label) {
          <div class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm ring-1 ring-slate-100/50 group hover:ring-indigo-200 transition-all">
            <p class="text-[9px] font-black uppercase tracking-[0.24em] text-slate-400 group-hover:text-indigo-600 transition-colors">{{ stat.label }}</p>
            <p class="mt-3 text-3xl font-black tracking-tighter text-slate-900">{{ stat.value }}</p>
            <p class="mt-2 text-xs font-medium text-slate-500 leading-relaxed">{{ stat.description }}</p>
          </div>
        }
      </div>

      <div class="p-6">
        <div class="mb-5 flex flex-wrap gap-3">
          @for (legend of legends(); track legend.key) {
            <div class="inline-flex items-center gap-3 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] ring-1 ring-slate-100 shadow-sm" [ngClass]="legend.chipClass">
              <span class="h-2.5 w-2.5 rounded-full shadow-inner" [ngClass]="legend.dotClass"></span>
              <span>{{ legend.label }}</span>
            </div>
          }
        </div>

        <div class="grid gap-8 xl:grid-cols-[1fr_360px]">
          <div>
            <div class="grid grid-cols-7 gap-3">
              @for (weekday of weekdays; track weekday) {
                <div class="px-2 py-3 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{{ weekday }}</div>
              }
  
              @for (day of days(); track day.iso) {
                <button
                  type="button"
                  class="min-h-[120px] rounded-[24px] border p-4 text-left transition-all relative overflow-hidden group"
                  [disabled]="!day.inCurrentMonth"
                  [ngClass]="day.inCurrentMonth ? day.cardClass + ' hover:-translate-y-1 hover:shadow-xl hover:ring-2 hover:ring-white ring-1 ring-slate-100 cursor-pointer' : day.cardClass + ' opacity-50 cursor-default'"
                  (click)="selectDay.emit(day)"
                >
                  <div class="flex items-start justify-between gap-2 relative z-10">
                    <span class="text-base font-black tracking-tighter" [ngClass]="day.inCurrentMonth ? 'text-slate-900 group-hover:text-indigo-600 transition-colors' : 'text-slate-300'">{{ day.dayNumber }}</span>
                    @if (day.inCurrentMonth) {
                      <span class="h-3 w-3 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-125" [ngClass]="day.dotClass"></span>
                    }
                  </div>
                  @if (day.inCurrentMonth) {
                    <div class="mt-6 space-y-2 relative z-10">
                      <div class="inline-flex max-w-full rounded-full border border-white/50 bg-white/50 px-3 py-1 shadow-sm text-[9px] font-black uppercase tracking-[0.16em] backdrop-blur-sm" [ngClass]="day.chipClass">
                        <span class="truncate">{{ day.label }}</span>
                      </div>
                      <p class="line-clamp-2 text-[11px] font-bold leading-relaxed text-slate-500/80 group-hover:text-slate-600 transition-colors">{{ day.sublabel }}</p>
                    </div>
                  }
                  @if (day.isToday) {
                    <div class="absolute inset-0 ring-4 ring-indigo-500/20 pointer-events-none"></div>
                  }
                </button>
              }
            </div>
          </div>
  
          <div class="rounded-[32px] border border-slate-100 bg-slate-50/50 p-6 ring-1 ring-slate-200/50 shadow-inner group">
            @if (selectedDay()) {
              <div class="flex items-start justify-between gap-6 relative z-10">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 mb-3">Timeline Event</p>
                  <h3 class="text-2xl font-black tracking-tight text-slate-900">{{ selectedDay()?.date | date:'EEEE, dd MMM' }}</h3>
                  <p class="mt-2 text-sm font-medium text-slate-500 leading-relaxed">{{ selectedDay()?.sublabel }}</p>
                </div>
                <button (click)="closeDetail.emit()" class="h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div class="mt-8 inline-flex rounded-full border border-white bg-white/50 backdrop-blur-sm px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] shadow-sm ring-1 ring-slate-100" [ngClass]="selectedDay()?.chipClass">
                {{ selectedDay()?.label }}
              </div>

              <div class="mt-8 grid grid-cols-2 gap-4">
                @for (metric of selectedMetrics(); track metric.label) {
                  <div class="rounded-[24px] border border-white bg-white/80 p-5 shadow-sm ring-1 ring-slate-100">
                    <p class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{{ metric.label }}</p>
                    <p class="mt-3 text-base font-black text-slate-900">{{ metric.value }}</p>
                  </div>
                }
              </div>

              <div class="mt-8 rounded-[24px] border border-white bg-white/80 p-6 shadow-sm ring-1 ring-slate-100">
                <p class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Activity Logs</p>
                <div class="space-y-3">
                  @for (note of selectedNotes(); track note) {
                    <div class="flex items-start gap-4 rounded-2xl bg-slate-50/50 p-4 ring-1 ring-slate-100/50">
                      <div class="mt-1.5 h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                      <p class="text-[13px] font-medium leading-relaxed text-slate-600">{{ note }}</p>
                    </div>
                  }
                </div>
              </div>

              <div class="mt-10 flex flex-col gap-3">
                <button (click)="navigate.emit('/attendance')" class="w-full rounded-2xl bg-indigo-600 py-4 text-xs font-black uppercase tracking-widest text-white transition hover:bg-slate-900 hover:shadow-xl">
                  Open Records
                </button>
                <button (click)="navigate.emit('/leaves')" class="w-full rounded-2xl border border-slate-200 bg-white py-4 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:border-indigo-600 hover:text-indigo-600 hover:shadow-md">
                  Request Detail
                </button>
              </div>
            } @else {
              <div class="flex h-full min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/80 p-8 text-center">
                <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                </div>
                <h3 class="mt-4 text-base font-black text-slate-900">Select a workday</h3>
                <p class="mt-2 text-sm leading-6 text-slate-500">Pick any date from the calendar to review details or take action.</p>
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
  monthLabel = input<string | null>(null);
  summary = input<any[]>([]);
  legends = input<any[]>([]);
  days = input<CalendarDay[]>([]);
  selectedDay = input<CalendarDay | null>(null);
  selectedMetrics = input<any[]>([]);
  selectedNotes = input<string[]>([]);

  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  previousMonth = output<void>();
  nextMonth = output<void>();
  jumpToToday = output<void>();
  selectDay = output<CalendarDay>();
  closeDetail = output<void>();
  navigate = output<string>();
}
