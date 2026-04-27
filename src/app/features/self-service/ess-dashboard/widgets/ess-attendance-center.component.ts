import { Component, input, computed, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-ess-attendance-center',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div class="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div class="flex items-center gap-4">
           <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-emerald-600">
             <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
           </div>
           <div>
             <h2 class="text-lg font-black tracking-tight text-slate-900">{{ t('selfService.attendanceCenter.title') }}</h2>
             <p class="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">{{ t('selfService.attendanceCenter.subtitle') }}</p>
           </div>
        </div>
      </div>
      
      <div class="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{{ t('selfService.attendanceCenter.liveStatus') }}</p>
              <h3 class="mt-2 text-xl font-black tracking-tight text-slate-900">
                {{ todayStatus()?.is_clocked_in ? t('selfService.attendanceCenter.productiveSession') : t('selfService.readyToStart') }}
              </h3>
              <div class="mt-3 flex items-center gap-2">
                <div class="h-2.5 w-2.5 rounded-full" [ngClass]="todayStatus()?.is_clocked_in ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'"></div>
                <span class="text-sm font-black" [ngClass]="todayStatus()?.is_clocked_in ? 'text-emerald-600' : 'text-slate-400'">
                  {{ todayStatus()?.is_clocked_in ? t('selfService.attendanceCenter.currentlyActive') : t('selfService.attendanceCenter.offline') }}
                </span>
              </div>
            </div>

            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              [ngClass]="todayStatus()?.is_clocked_in ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <p class="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">{{ t('selfService.attendanceCenter.shiftStarted') }}</p>
            <p class="mt-2 text-lg font-black text-slate-900">{{ (todayStatus()?.check_in | date:'hh:mm a') || '--:--' }}</p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p class="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{{ t('selfService.attendanceCenter.workingHours') }}</p>
            <p class="mt-2 text-lg font-black text-slate-900">{{ formattedLiveHours() }}</p>
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
