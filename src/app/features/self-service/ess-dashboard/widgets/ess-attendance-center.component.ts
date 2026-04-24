import { Component, input, computed, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-ess-attendance-center',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="flex h-full flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-2xl hover:shadow-slate-200/40">
      <div class="flex flex-col shrink-0 gap-4 p-8 border-b border-slate-50 bg-slate-50/20 sm:flex-row sm:items-center justify-between">
        <div class="flex items-center gap-4">
           <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
             <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
           </div>
           <div>
             <h2 class="text-2xl font-black text-slate-900 tracking-tight">{{ t('selfService.attendanceCenter.title') }}</h2>
             <p class="text-sm font-bold text-slate-500 mt-1">{{ t('selfService.attendanceCenter.subtitle') }}</p>
           </div>
        </div>
      </div>
      
      <div class="flex flex-1 flex-col justify-center gap-6 p-8">
        <div class="group relative flex flex-col items-center justify-center overflow-hidden rounded-[2.5rem] bg-slate-50 p-10 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 ring-1 ring-transparent hover:ring-slate-100">
          <div class="relative flex flex-col items-center text-center z-10">
            <div class="mb-6 h-24 w-24 flex items-center justify-center rounded-[2rem] shadow-2xl transition-all duration-500 group-hover:scale-105"
              [ngClass]="todayStatus()?.is_clocked_in ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-slate-200 text-slate-400 shadow-slate-100'">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              @if (todayStatus()?.is_clocked_in) {
                <div class="absolute inset-0 bg-white/20 animate-ping rounded-[2rem]"></div>
              }
            </div>
            
            <p class="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 mb-2">{{ t('selfService.attendanceCenter.liveStatus') }}</p>
            <h3 class="text-3xl font-black text-slate-900 tracking-tight">
              {{ todayStatus()?.is_clocked_in ? t('selfService.attendanceCenter.productiveSession') : t('selfService.readyToStart') }}
            </h3>
            
            <div class="mt-4 flex items-center gap-2">
              <div class="h-2.5 w-2.5 rounded-full" [ngClass]="todayStatus()?.is_clocked_in ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'"></div>
              <span class="text-sm font-black" [ngClass]="todayStatus()?.is_clocked_in ? 'text-emerald-600' : 'text-slate-400'">
                {{ todayStatus()?.is_clocked_in ? t('selfService.attendanceCenter.currentlyActive') : t('selfService.attendanceCenter.offline') }}
              </span>
            </div>
          </div>
          
          <div class="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-emerald-50/30 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          <div class="absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-slate-100/50 blur-3xl"></div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="rounded-3xl bg-emerald-50 p-6 ring-1 ring-emerald-100/50 transition-all hover:shadow-md">
            <p class="text-[10px] font-black uppercase tracking-widest text-emerald-600">{{ t('selfService.attendanceCenter.shiftStarted') }}</p>
            <p class="mt-4 text-2xl font-black text-slate-900">{{ (todayStatus()?.check_in | date:'hh:mm a') || '--:--' }}</p>
          </div>
          <div class="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-100 transition-all hover:shadow-md">
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ t('selfService.attendanceCenter.workingHours') }}</p>
            <p class="mt-4 text-2xl font-black text-slate-900">{{ formattedLiveHours() }}</p>
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
  private languageService = inject(LanguageService);
  todayStatus = input<any>(null);
  readonly t = (key: string, params?: Record<string, string | number | null | undefined>) =>
    this.languageService.t(key, params);

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
