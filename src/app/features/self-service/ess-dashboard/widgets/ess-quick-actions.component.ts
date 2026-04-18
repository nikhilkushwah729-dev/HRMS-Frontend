import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LanguageService } from '../../../../core/services/language.service';

export interface QuickAction {
  title: string;
  description: string;
  route: string;
  icon: string;
  tone: 'primary' | 'success' | 'warning' | 'slate';
}

@Component({
  selector: 'app-ess-quick-actions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-glass-card flex h-full flex-col overflow-hidden rounded-md ring-1 ring-slate-100 transition-all shadow-sm hover:shadow-2xl hover:ring-indigo-100">
      <div class="flex items-center gap-3 border-b border-slate-100 bg-slate-50/40 p-4 sm:p-5">
        <div class="flex h-11 w-11 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100/50">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16"/><path d="M4 12h10"/><path d="M4 18h7"/><path d="M18 10l2 2 4-4"/></svg>
        </div>
        <div class="min-w-0">
          <h2 class="text-lg font-black tracking-tight text-slate-900 sm:text-xl">{{ t('selfService.quickActions.title') }}</h2>
          <p class="mt-1 text-[11px] font-medium text-slate-500 sm:text-xs">{{ t('selfService.quickActions.subtitle') }}</p>
        </div>
      </div>

      <div class="p-4 sm:p-5">
        <div class="mb-4 rounded-md border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{{ t('selfService.quickActions.title') }}</p>
          <p class="mt-1 text-sm font-medium text-slate-500">{{ t('selfService.quickActions.subtitle') }}</p>
        </div>

        <div class="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        @for (action of actions(); track action.title) {
          <button (click)="navigate.emit(action.route)" class="group relative flex h-full min-h-[188px] flex-col overflow-hidden rounded-md border border-slate-100 bg-white p-4 text-left shadow-sm ring-1 ring-slate-100/60 transition-all hover:-translate-y-1 hover:shadow-2xl sm:min-h-[198px] sm:p-5 lg:min-h-[210px]" [ngClass]="actionCardTone(action.tone)">
            <div class="absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-70 blur-2xl transition-transform duration-500 group-hover:scale-125" [ngClass]="actionGlowTone(action.tone)"></div>

            <div class="relative z-10 flex items-start justify-between gap-3">
              <div class="flex h-14 w-14 items-center justify-center rounded-md bg-white text-2xl shadow-md ring-1 ring-white/70 transition-transform duration-500 group-hover:scale-110 sm:h-16 sm:w-16 sm:text-3xl" [ngClass]="actionIconTone(action.tone)">
                <span [innerHTML]="getIcon(action.icon)"></span>
              </div>
              <span class="inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.22em]" [ngClass]="actionBadgeTone(action.tone)">
                {{ action.title }}
              </span>
            </div>

            <div class="relative z-10 mt-5 flex flex-1 flex-col">
              <h3 class="text-sm font-black tracking-tight text-slate-900 transition-colors group-hover:text-slate-700 sm:text-[15px] lg:text-base">{{ action.title }}</h3>
              <p class="mt-2 text-[11px] font-medium leading-relaxed text-slate-500 transition-colors group-hover:text-slate-600 sm:text-xs">{{ action.description }}</p>
            </div>

            <div class="relative z-10 mt-4 flex items-center justify-between border-t border-slate-100/80 pt-4">
              <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{{ t('selfService.workflow.accessModule') }}</p>
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 shadow-sm transition-all group-hover:bg-slate-900 group-hover:text-white">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
          </button>
        }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
  `]
})
export class EssQuickActionsComponent {
  private sanitizer = inject(DomSanitizer);
  private languageService = inject(LanguageService);
  actions = input<QuickAction[]>([]);
  navigate = output<string>();
  readonly t = (key: string, params?: Record<string, string | number | null | undefined>) =>
    this.languageService.t(key, params);

  actionCardTone(tone: QuickAction['tone']): string {
    const tones: Record<QuickAction['tone'], string> = {
      primary: 'hover:border-indigo-300 bg-gradient-to-br from-indigo-50/80 to-white',
      success: 'hover:border-emerald-300 bg-gradient-to-br from-emerald-50/80 to-white',
      warning: 'hover:border-amber-300 bg-gradient-to-br from-amber-50/80 to-white',
      slate: 'hover:border-slate-300 bg-gradient-to-br from-slate-50/90 to-white'
    };

    return tones[tone];
  }

  actionGlowTone(tone: QuickAction['tone']): string {
    const tones: Record<QuickAction['tone'], string> = {
      primary: 'bg-indigo-200/60',
      success: 'bg-emerald-200/60',
      warning: 'bg-amber-200/60',
      slate: 'bg-slate-200/70'
    };

    return tones[tone];
  }

  actionIconTone(tone: QuickAction['tone']): string {
    const tones: Record<QuickAction['tone'], string> = {
      primary: 'text-indigo-600',
      success: 'text-emerald-600',
      warning: 'text-amber-600',
      slate: 'text-slate-700'
    };

    return tones[tone];
  }

  actionBadgeTone(tone: QuickAction['tone']): string {
    const tones: Record<QuickAction['tone'], string> = {
      primary: 'border-indigo-200 bg-white/90 text-indigo-600',
      success: 'border-emerald-200 bg-white/90 text-emerald-600',
      warning: 'border-amber-200 bg-white/90 text-amber-700',
      slate: 'border-slate-200 bg-white/90 text-slate-600'
    };

    return tones[tone];
  }

  getIcon(iconKey: string): SafeHtml {
    const icons: Record<string, string> = {
      users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      'shield-check': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>',
      'clipboard-list': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 6h6"/><path d="M8 6H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-1"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>',
      settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V22a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H2a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1A1.7 1.7 0 0 0 10 2.2V2a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1A1.7 1.7 0 0 0 21.8 10H22a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1.0Z"/></svg>',
      'calendar-check': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>',
      'folder-check': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="m10 13 2 2 4-4"/></svg>',
      'chart-column': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M8 16V9"/><path d="M12 16V6"/><path d="M16 16v-4"/></svg>',
      folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
      'clock-3': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
      'calendar-plus': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M12 14v4"/><path d="M10 16h4"/></svg>',
      'user-circle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M6.5 19a8 8 0 0 1 11 0"/></svg>',
      heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
      lifebuoy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg>',
      spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m13 2-2 7h7l-7 13 2-8H6z"/></svg>',
    };

    return this.sanitizer.bypassSecurityTrustHtml(icons[iconKey] || icons['spark']);
  }
}
