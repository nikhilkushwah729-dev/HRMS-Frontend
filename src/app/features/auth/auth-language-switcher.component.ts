import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppLanguage, LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-auth-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white/90 backdrop-blur-sm">
      <span class="text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
        {{ t('common.language') }}
      </span>
      <div class="flex items-center gap-1">
        @for (language of languageOptions; track language.code) {
          <button
            type="button"
            (click)="switchLanguage(language)"
            class="rounded-full px-3 py-1.5 text-[11px] font-bold transition-all"
            [ngClass]="currentLanguage().code === language.code
              ? 'bg-white text-slate-900 shadow-sm'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'"
          >
            {{ language.nativeLabel }}
          </button>
        }
      </div>
    </div>
  `,
})
export class AuthLanguageSwitcherComponent {
  private readonly languageService = inject(LanguageService);

  readonly currentLanguage = this.languageService.currentLanguage;
  readonly languageOptions = this.languageService.languages;

  switchLanguage(language: AppLanguage): void {
    this.languageService.setLanguage(language.code);
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    return this.languageService.t(key, params);
  }
}
