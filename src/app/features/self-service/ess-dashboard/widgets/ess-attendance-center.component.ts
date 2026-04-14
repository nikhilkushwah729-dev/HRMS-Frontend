import { Component, input, output, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-ess-attendance-center',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="app-glass-card h-full flex flex-col ring-1 ring-slate-100 hover:ring-indigo-100 transition-all shadow-sm hover:shadow-2xl overflow-hidden rounded-[32px]">
       <div class="p-5 border-b border-slate-100 bg-slate-50/40 flex items-center gap-4">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <h2 class="text-lg font-black text-slate-900 tracking-tight leading-none">Attendance Center</h2>
            <p class="text-[10px] font-medium text-slate-500 mt-1.5 uppercase tracking-wider opacity-70">Real-time Session Monitoring</p>
          </div>
       </div>
      
      <div class="flex-1 p-6 flex flex-col justify-center gap-8">
        <div class="flex-1 rounded-[32px] border border-slate-100 bg-white p-6 shadow-inner relative overflow-hidden group ring-1 ring-slate-200/50 flex flex-col justify-center">
          <div class="flex items-center gap-8 relative z-10">
            <div class="h-24 w-24 flex items-center justify-center rounded-[32px] shadow-2xl relative overflow-hidden transition-all duration-500 group-hover:scale-105 backdrop-blur-xl ring-4 ring-white/50"
              [ngClass]="todayStatus()?.is_clocked_in ? 'bg-emerald-500/80 text-white' : 'bg-amber-500/80 text-white'">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              @if (todayStatus()?.is_clocked_in) {
                <div class="absolute inset-0 bg-emerald-400 animate-pulse opacity-50"></div>
              }
            </div>
            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 mb-2">Live Status</p>
              <p class="text-3xl font-black text-slate-900 tracking-tight leading-none">
                {{ todayStatus()?.is_clocked_in ? 'Productive Session' : 'Ready to Start' }}
              </p>
              <div class="flex items-center gap-2 mt-4">
                <div class="h-2.5 w-2.5 rounded-full" [ngClass]="todayStatus()?.is_clocked_in ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]' : 'bg-amber-500'"></div>
                <span class="text-sm font-bold" [ngClass]="todayStatus()?.is_clocked_in ? 'text-emerald-600' : 'text-amber-600'">
                  {{ todayStatus()?.is_clocked_in ? 'Currently Active' : 'Offline' }}
                </span>
              </div>
            </div>
          </div>
          <div class="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-slate-50/50 blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
        </div>

        <div class="grid grid-cols-2 gap-5">
          <div class="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 ring-1 ring-emerald-100/50 group hover:bg-emerald-50 transition-all hover:shadow-md">
            <p class="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">Shift Started</p>
            <p class="mt-3 text-xl font-black text-emerald-900 tracking-tight">{{ (todayStatus()?.check_in | date:'hh:mm a') || '--:--' }}</p>
          </div>
          <div class="rounded-3xl border border-indigo-100 bg-indigo-50/40 p-5 ring-1 ring-indigo-100/50 group hover:bg-indigo-50 transition-all hover:shadow-md">
            <p class="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-600">Working Hours</p>
            <p class="mt-3 text-xl font-black text-indigo-900 tracking-tight">{{ formattedLiveHours() }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `]
})
export class EssAttendanceCenterComponent implements OnInit, OnDestroy {
  todayStatus = input<any>(null);

  private timer: any;
  private elapsedSeconds = signal<number>(0);

  ngOnInit() {
    this.startTimer();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  private startTimer() {
    this.timer = setInterval(() => {
      if (this.todayStatus()?.is_clocked_in) {
        this.elapsedSeconds.update(s => s + 1);
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timer) clearInterval(this.timer);
  }

  formattedLiveHours = computed(() => {
    const status = this.todayStatus();
    if (!status?.is_clocked_in || !status.check_in) {
      const h = Number(status?.total_work_hours || 0);
      return this.formatTime(h);
    }

    const checkInTime = new Date(status.check_in).getTime();
    const now = new Date().getTime();
    const diffMs = Math.max(0, now - checkInTime);
    const diffHours = diffMs / (1000 * 60 * 60);

    // Total = accumulated work hours + current session
    const baseHours = Number(status.total_work_hours || 0);
    return this.formatTime(baseHours + diffHours);
  });

  private formatTime(h: number): string {
    const safe = Number.isFinite(h) ? Math.max(h, 0) : 0;
    const hrs = Math.floor(safe);
    const mins = Math.floor((safe - hrs) * 60);
    const secs = Math.round(((safe - hrs) * 60 - mins) * 60);
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }

  formattedWorkHours = computed(() => {
    const hours = this.todayStatus()?.total_work_hours || 0;
    const value = Number(hours);
    const safeValue = Number.isFinite(value) ? Math.max(value, 0) : 0;
    const wholeHours = Math.floor(safeValue);
    const minutes = Math.round((safeValue - wholeHours) * 60);
    return `${wholeHours}h ${minutes.toString().padStart(2, '0')}m`;
  });
}
