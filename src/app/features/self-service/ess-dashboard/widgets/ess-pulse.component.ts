import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../../core/services/language.service';

export interface DashboardHighlight {
  id: string;
  name: string;
  message: string;
  tone: string;
}

export interface DashboardHighlight {
  id: string;
  name: string;
  message: string;
  tone: string;
}

@Component({
  selector: 'app-ess-pulse',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex h-full flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-2xl hover:shadow-slate-200/40">
      <div class="flex flex-col shrink-0 gap-4 p-8 border-b border-slate-50 bg-slate-50/20 sm:flex-row sm:items-center justify-between">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">{{ t('selfService.pulse.title') }}</h2>
          <p class="mt-1 text-sm font-bold text-slate-500">{{ t('selfService.pulse.subtitle') }}</p>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <div class="rounded-xl bg-emerald-50 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-600">
            {{ t('selfService.pulse.signals', { count: highlights().length }) }}
          </div>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div class="grid grid-cols-1 gap-4">
        @for (item of highlights(); track item.id) {
          <div class="group relative rounded-[2rem] bg-slate-50 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 ring-1 ring-transparent hover:ring-slate-100">
            <div class="flex items-start justify-between gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m12 3 1.912 5.886h6.19l-5.007 3.637 1.912 5.887L12 14.775l-5.007 3.635 1.912-5.887L3.898 8.886h6.19L12 3z"/></svg>
              </div>
              <div class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
            
            <div class="mt-6">
              <h3 class="text-lg font-black text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">{{ item.name }}</h3>
              <p class="text-sm font-bold text-slate-500 mt-2 leading-relaxed group-hover:text-slate-600 transition-colors">{{ item.message }}</p>
            </div>

            <div class="mt-6 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-600 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
               <span>{{ t('selfService.pulse.learnMore') }}</span>
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
  `]
})
export class EssPulseComponent {
  private languageService = inject(LanguageService);
  highlights = input<DashboardHighlight[]>([]);
  unreadCount = input<number>(0);
  readonly t = (key: string, params?: Record<string, string | number | null | undefined>) =>
    this.languageService.t(key, params);
}
