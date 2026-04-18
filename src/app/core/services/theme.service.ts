import { Injectable, computed, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly storageKey = 'hrms-theme';
  private readonly themeSignal = signal<AppTheme>('light');

  readonly currentTheme = computed(() => this.themeSignal());
  readonly isDark = computed(() => this.themeSignal() === 'dark');

  initialize(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const storedTheme = window.localStorage.getItem(this.storageKey);
    const theme = storedTheme === 'dark' || storedTheme === 'light'
      ? storedTheme
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    this.applyTheme(theme);
  }

  setTheme(theme: AppTheme): void {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(this.storageKey, theme);
    }

    this.applyTheme(theme);
  }

  toggleTheme(): void {
    this.setTheme(this.themeSignal() === 'dark' ? 'light' : 'dark');
  }

  private applyTheme(theme: AppTheme): void {
    this.themeSignal.set(theme);

    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    body?.setAttribute('data-theme', theme);

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#020617' : '#fdfbf8');
    }
  }
}
