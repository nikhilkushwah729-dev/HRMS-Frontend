import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-ess-team-engagement',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex h-full flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-2xl hover:shadow-slate-200/40">
      <div class="flex flex-col shrink-0 gap-4 p-8 border-b border-slate-50 bg-slate-50/20 sm:flex-row sm:items-center justify-between">
        <div class="flex items-center gap-4">
           <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
             <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
           </div>
           <div>
             <h2 class="text-2xl font-black text-slate-900 tracking-tight">{{ t('selfService.team.title') }}</h2>
             <p class="text-sm font-bold text-slate-500 mt-1">{{ t('selfService.team.subtitle') }}</p>
           </div>
        </div>
        <div class="rounded-xl bg-emerald-50 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-600">
          {{ t('selfService.team.events', { count: occasions().length }) }}
        </div>
      </div>

      <div class="flex-1 space-y-4 overflow-y-auto p-8 custom-scrollbar">
        @for (item of occasions(); track item.id) {
          <div class="group relative flex items-center justify-between rounded-3xl bg-slate-50 p-5 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 ring-1 ring-transparent hover:ring-slate-100">
            <div class="flex items-center gap-5 min-w-0">
              <div class="relative">
                <div class="h-16 w-16 overflow-hidden rounded-2xl shadow-sm transition-transform duration-500 group-hover:scale-105">
                  @if (item.avatar) {
                    <img [src]="item.avatar" class="h-full w-full object-cover">
                  } @else {
                    <div class="flex h-full w-full items-center justify-center bg-white text-xl font-black capitalize text-slate-400">
                      {{ item.firstName?.[0] || '?' }}
                    </div>
                  }
                </div>
                <div class="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-[10px] font-black text-white shadow-lg ring-2 ring-white">
                  {{ item.isBirthday ? t('selfService.team.birthdayShort') : t('selfService.team.anniversaryShort') }}
                </div>
              </div>

              <div class="min-w-0">
                <h3 class="truncate text-base font-black text-slate-900 transition-colors group-hover:text-emerald-600">
                  {{ item.firstName }} {{ item.lastName }}
                </h3>
                <p class="mt-1 truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {{ item.designation }}
                </p>
              </div>
            </div>

            <button class="translate-x-4 rounded-xl bg-emerald-600 px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-white opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 hover:bg-slate-900 shadow-lg shadow-emerald-100">
              {{ t('selfService.team.wishNow') }}
            </button>
          </div>
        }

        @if (occasions().length === 0) {
          <div class="flex h-full flex-col items-center justify-center text-center py-10">
            <div class="mb-6 h-16 w-16 flex items-center justify-center rounded-3xl bg-slate-50 text-slate-300">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4Z"/></svg>
            </div>
            <p class="text-sm font-bold text-slate-400">{{ t('selfService.team.empty') }}</p>
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
  private languageService = inject(LanguageService);
  occasions = input<any[]>([]);
  readonly t = (key: string, params?: Record<string, string | number | null | undefined>) =>
    this.languageService.t(key, params);
}
