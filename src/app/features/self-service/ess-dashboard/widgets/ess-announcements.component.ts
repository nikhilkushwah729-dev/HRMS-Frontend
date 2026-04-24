import { Component, input, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-ess-announcements',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="flex h-full flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-2xl hover:shadow-slate-200/40">
      <div class="flex flex-col shrink-0 gap-4 p-8 border-b border-slate-50 bg-slate-50/20 sm:flex-row sm:items-center justify-between">
        <div class="flex items-center gap-4">
           <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
             <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
           </div>
           <div>
             <h2 class="text-2xl font-black text-slate-900 tracking-tight">{{ t('selfService.announcements.title') }}</h2>
             <p class="text-sm font-bold text-slate-500 mt-1">{{ t('selfService.announcements.subtitle') }}</p>
           </div>
        </div>
      </div>

      <div class="flex-1 p-8">
        @if (announcement()) {
          <div class="group relative flex h-full flex-col overflow-hidden rounded-[2.5rem] bg-slate-50 p-8 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 ring-1 ring-transparent hover:ring-slate-100">
            <div class="relative z-10 flex flex-1 flex-col">
              <div class="inline-flex rounded-xl bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 self-start">
                 {{ announcement().target === 'all' ? t('selfService.announcements.organizationAlert') : t('selfService.announcements.targetedNotice') }}
              </div>
              
              <h3 class="mt-8 text-3xl font-black text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">{{ announcement().title }}</h3>
              <p class="mt-6 text-base font-bold text-slate-500 leading-relaxed line-clamp-3">{{ announcement().content }}</p>
              
              <div class="mt-auto pt-8 flex items-center justify-between border-t border-slate-200/50">
                <div class="flex items-center gap-4">
                   <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-sm text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                   </div>
                   <div>
                      <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Published</p>
                      <p class="text-xs font-black text-slate-900">{{ announcement().published_at ? (announcement().published_at | date:'dd MMM yyyy') : t('selfService.announcements.recently') }}</p>
                   </div>
                </div>

                <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg transition-transform group-hover:scale-110">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>

            <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-50/30 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          </div>
        } @else {
          <div class="flex h-full flex-col items-center justify-center text-center p-8">
            <div class="mb-6 h-16 w-16 flex items-center justify-center rounded-3xl bg-slate-50 text-slate-300">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
            </div>
            <h3 class="text-lg font-black text-slate-900">{{ t('selfService.announcements.emptyTitle') }}</h3>
            <p class="mt-2 text-sm font-bold text-slate-500 max-w-xs">{{ t('selfService.announcements.emptySubtitle') }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `]
})
export class EssAnnouncementsComponent {
  private languageService = inject(LanguageService);
  announcement = input<any>(null);
  readonly t = (key: string, params?: Record<string, string | number | null | undefined>) =>
    this.languageService.t(key, params);
}
