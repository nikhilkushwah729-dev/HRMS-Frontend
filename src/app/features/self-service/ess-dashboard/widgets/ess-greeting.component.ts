import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-ess-greeting',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-12 gap-5">
      <!-- Banner Section / Special Occasions -->
      @if (specialMessage().length > 0) {
        <div class="col-span-12 animate-fade-in group">
          <div class="relative overflow-hidden rounded-md bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 shadow-2xl transition-all hover:shadow-indigo-200/50">
            <div class="relative z-10 flex items-center justify-between">
              <div class="flex items-center gap-5">
                <div class="flex h-16 w-16 items-center justify-center rounded-md bg-white/20 text-white backdrop-blur-xl ring-1 ring-white/30 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </div>
                <div class="min-w-0">
                  <h2 class="text-2xl font-black tracking-tight text-white m-0 truncate">{{ specialMessage()[0] }}</h2>
                  <p class="mt-2 text-lg font-medium text-indigo-50/80 m-0 line-clamp-2">{{ specialMessage()[1] }}</p>
                </div>
              </div>
              <button (click)="closeBanner.emit()" class="flex h-12 w-12 items-center justify-center rounded-md bg-white/10 text-white transition-all hover:bg-white/20 hover:rotate-90">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <!-- Decorative Sparks -->
            <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
            <div class="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
          </div>
        </div>
      }

      <!-- Greeting & User Profile Summary -->
      <div class="col-span-12">
        <div class="app-surface-card group flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-4 sm:gap-6">
            <div class="relative group cursor-pointer" (click)="navigate.emit('/profile')">
              <div class="h-24 w-24 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg transition-all group-hover:shadow-indigo-200">
                @if (user()?.avatar) {
                  <img [src]="user()?.avatar" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110">
                } @else {
                  <div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-3xl font-black text-white">
                    {{ initials() }}
                  </div>
                }
              </div>
              <div class="absolute -bottom-1 -right-1 h-8 w-8 rounded-full border-4 border-white bg-emerald-500 shadow-xl group-hover:scale-110 transition-transform"></div>
            </div>
            <div>
              <div class="flex items-center gap-3 mb-2">
                <div class="flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 ring-1 ring-indigo-100/50 transition-all hover:bg-white group-hover:shadow-sm">
                  <div class="h-4 w-4 text-indigo-600 mb-0.5" [innerHTML]="weatherIcon()"></div>
                  <span class="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">{{ greetingLabel() }}</span>
                </div>
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{{ currentTime() }}</span>
              </div>
              <h1 class="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                {{ t('selfService.greeting.welcomeBack') }}, <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{{ user()?.firstName }}</span>
              </h1>
              <p class="mt-2 max-w-lg text-sm font-medium leading-relaxed text-slate-500">{{ t('selfService.greeting.subtitle') }}</p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-3 md:justify-end">
            <button (click)="navigate.emit('/attendance')" class="group relative overflow-hidden rounded-md bg-slate-900 px-5 py-3 text-sm font-black text-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
              <span class="relative z-10 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M2 12h20"/></svg>
                {{ t('selfService.greeting.dailyPunch') }}
              </span>
              <div class="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            <button (click)="navigate.emit('/leaves')" class="rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 hover:shadow-xl">
              {{ t('selfService.greeting.applyLeave') }}
            </button>
            <button (click)="navigate.emit('/profile')" class="rounded-md border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-white hover:shadow-md">
              {{ t('selfService.greeting.viewProfile') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class EssGreetingComponent {
  private sanitizer = inject(DomSanitizer);
  private languageService = inject(LanguageService);
  user = input<any>(null);
  specialMessage = input<string[]>([]);
  currentTime = input<string>('');

  navigate = output<string>();
  closeBanner = output<void>();
  readonly t = (key: string, params?: Record<string, string | number | null | undefined>) =>
    this.languageService.t(key, params);

  greetingLabel = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return this.t('selfService.greeting.goodMorning');
    if (hour < 17) return this.t('selfService.greeting.goodAfternoon');
    return this.t('selfService.greeting.goodEvening');
  });

  weatherIcon = computed<SafeHtml>(() => {
    const hour = new Date().getHours();
    let svg = '';
    if (hour < 12) {
      svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
    } else if (hour < 17) {
      svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/></svg>';
    } else {
      svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6.364 6.364 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
    }
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  });

  initials = computed(() => {
    const user = this.user();
    if (!user) return '?';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  });
}
