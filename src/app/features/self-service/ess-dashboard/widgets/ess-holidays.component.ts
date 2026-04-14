import { Component, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-ess-holidays',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="app-glass-card h-full flex flex-col ring-1 ring-slate-100 hover:ring-indigo-100 transition-all shadow-sm hover:shadow-2xl overflow-hidden rounded-[40px]">
      <div class="p-5 border-b border-slate-100 bg-slate-50/30 flex items-center gap-4">
        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100/50">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
        </div>
        <div>
          <h2 class="text-lg font-black text-slate-900 tracking-tight leading-none">Upcoming Holidays</h2>
          <p class="text-[10px] font-medium text-slate-500 mt-1.5 uppercase tracking-wider opacity-70">Official Organization List</p>
        </div>
      </div>
      <div class="flex-1 p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
        @for (holiday of holidays(); track holiday.date) {
          <div class="flex items-center justify-between rounded-[24px] border border-slate-100 bg-white p-4 group hover:border-indigo-100 transition-colors shadow-sm">
            <div class="flex items-center gap-3 min-w-0">
              <div class="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-sky-50 text-sky-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-black text-slate-900 leading-none group-hover:text-indigo-600 transition-colors truncate">{{ holiday.name }}</p>
                <p class="mt-1.5 text-[10px] font-medium text-slate-400 truncate">{{ holiday.date | date:'dd MMM yyyy' }}</p>
              </div>
            </div>
            <div class="rounded-full bg-slate-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 ring-1 ring-slate-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:ring-indigo-600 transition-all">
              {{ daysUntil(holiday.date) }}
            </div>
          </div>
        }
        @if (holidays().length === 0) {
          <div class="flex-1 flex flex-col items-center justify-center p-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
             <p>No holidays scheduled</p>
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
  holidays = input<any[]>([]);

  daysUntil(date: string): string {
    const target = new Date(date);
    const diff = Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days`;
  }
}
