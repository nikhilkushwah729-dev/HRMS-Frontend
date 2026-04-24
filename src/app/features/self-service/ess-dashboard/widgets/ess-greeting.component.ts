import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-ess-greeting',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-12 gap-6">
      <!-- Welcome Card -->
      <div class="col-span-12">
        <div class="relative overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-xl hover:shadow-slate-200/40">
          <div class="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div class="flex items-center gap-6">
              <div class="relative group cursor-pointer" (click)="navigate.emit('/profile')">
                <div class="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-white shadow-2xl ring-1 ring-slate-100 transition-transform duration-500 group-hover:scale-105">
                  @if (user()?.avatar) {
                    <img [src]="user()?.avatar" class="h-full w-full object-cover">
                  } @else {
                    <div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-500 text-3xl font-black text-white">
                      {{ initials() }}
                    </div>
                  }
                </div>
                <div class="absolute bottom-1 right-1 h-6 w-6 rounded-full border-2 border-white bg-emerald-500 shadow-lg"></div>
              </div>

              <div class="space-y-1">
                <div class="flex items-center gap-2">
                   <div class="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600" [innerHTML]="weatherIcon()"></div>
                   <span class="text-xs font-black uppercase tracking-widest text-emerald-600">{{ greetingLabel() }}</span>
                   <span class="text-xs font-bold text-slate-300">•</span>
                   <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">{{ currentTime() }}</span>
                </div>
                <h2 class="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                  {{ t('selfService.greeting.welcomeBack') }}, <span class="text-emerald-600">{{ user()?.firstName }}!</span>
                </h2>
                <p class="text-base font-bold text-slate-500">{{ t('selfService.greeting.subtitle') || "Good to see you again. Check out what's happening today." }}</p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-4">
              <button (click)="navigate.emit('/attendance')" class="flex h-14 items-center gap-3 rounded-2xl bg-slate-900 px-8 text-sm font-black text-white shadow-xl shadow-slate-200 transition hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20"/></svg>
                {{ t('selfService.greeting.dailyPunch') }}
              </button>
            </div>
          </div>

          <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-50/30 blur-3xl transition-transform duration-700 group-hover:scale-110"></div>
        </div>
      </div>

      <!-- Special Messages / Banners -->
      @if (specialMessage().length > 0) {
        <div class="col-span-12">
          @for (msg of specialMessage(); track msg) {
            <div class="group relative overflow-hidden rounded-3xl bg-emerald-600 p-6 text-white shadow-lg shadow-emerald-200">
              <div class="relative z-10 flex items-center justify-between gap-6">
                <div class="flex items-center gap-4">
                  <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-lg font-black tracking-tight">{{ msg }}</h4>
                    <p class="text-sm font-bold text-emerald-100 opacity-80">This is an automated system update for your workspace.</p>
                  </div>
                </div>
                <button (click)="closeBanner.emit()" class="rounded-xl bg-white/10 p-2 transition hover:bg-white/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-transform duration-700 group-hover:scale-125"></div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
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
