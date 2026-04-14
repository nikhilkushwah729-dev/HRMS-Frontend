import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ess-team-engagement',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-surface-card h-full flex flex-col overflow-hidden p-0">
      <div class="shrink-0 border-b border-slate-100 bg-slate-50/40 p-6">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-black tracking-tight text-slate-900">Team Celebrations</h2>
            <p class="mt-1 text-xs font-medium text-slate-500">Birthdays and work anniversaries in your network.</p>
          </div>
          <div class="rounded-full bg-indigo-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 ring-1 ring-indigo-100/50">
            {{ occasions().length }} events
          </div>
        </div>
      </div>

      <div class="flex-1 space-y-4 overflow-y-auto p-6">
        @for (item of occasions(); track item.id) {
          <div class="group relative flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-4 ring-1 ring-slate-100 transition-all hover:border-indigo-300 hover:shadow-md">
            <div class="flex items-center gap-4 min-w-0">
              <div class="relative">
                <div class="h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm transition-transform duration-500 group-hover:scale-105">
                  @if (item.avatar) {
                    <img [src]="item.avatar" class="h-full w-full object-cover">
                  } @else {
                    <div class="flex h-full w-full items-center justify-center bg-indigo-50 text-lg font-black capitalize text-indigo-400">
                      {{ item.firstName?.[0] || '?' }}
                    </div>
                  }
                </div>
                <div class="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-lg bg-white text-[10px] font-black text-indigo-600 shadow-sm ring-2 ring-slate-50">
                  {{ item.isBirthday ? 'B' : 'A' }}
                </div>
              </div>

              <div class="min-w-0">
                <p class="truncate text-sm font-black text-slate-900 transition-colors group-hover:text-indigo-600">
                  {{ item.firstName }} {{ item.lastName }}
                </p>
                <p class="mt-1 truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {{ item.designation }}
                </p>
              </div>
            </div>

            <button class="translate-x-2 rounded-xl bg-indigo-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 hover:bg-slate-900">
              Wish Now
            </button>
          </div>
        }

        @if (occasions().length === 0) {
          <div class="flex h-48 flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-slate-50/30 p-8 text-center">
            <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-300 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4Z"/></svg>
            </div>
            <p class="text-sm font-black italic text-slate-400">No celebrations today</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `]
})
export class EssTeamEngagementComponent {
  occasions = input<any[]>([]);
}
