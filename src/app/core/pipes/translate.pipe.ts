import { Pipe, PipeTransform, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { LanguageService } from '../services/language.service';
import { effect } from '@angular/core';

/**
 * TranslatePipe — Reactive Angular pipe for HRMS i18n.
 *
 * Usage in template:
 *   {{ 'common.search' | translate }}
 *   {{ 'sidebar.trialHelper' | translate:{ days: 3, suffix: 's' } }}
 *
 * The pipe is IMPURE so Angular re-evaluates it on every change detection cycle.
 * Combined with the LanguageService signal, this guarantees instant UI updates
 * when the user switches language from the navbar dropdown.
 */
@Pipe({
  name: 'translate',
  standalone: true,
  pure: false, // impure = re-runs on every CD cycle, needed for signal reactivity
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private readonly languageService = inject(LanguageService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Track current language code to force re-render when it changes
  private currentLangCode = this.languageService.currentLanguage().code;
  private readonly cleanupEffect: ReturnType<typeof effect>;

  constructor() {
    // React to language signal changes and force change detection
    this.cleanupEffect = effect(() => {
      const newCode = this.languageService.currentLanguage().code;
      if (newCode !== this.currentLangCode) {
        this.currentLangCode = newCode;
        this.cdr.markForCheck();
      }
    });
  }

  transform(
    key: string,
    params?: Record<string, string | number | null | undefined>
  ): string {
    return this.languageService.t(key, params);
  }

  ngOnDestroy(): void {
    this.cleanupEffect.destroy();
  }
}
