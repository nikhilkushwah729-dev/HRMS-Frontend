import { Component, input, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-ess-announcements',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      @if (currentAnnouncement()) {
        <div class="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white">
          <div class="absolute inset-y-0 right-0 w-40 bg-white/10 blur-3xl"></div>
          <div class="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex min-w-0 items-start gap-4">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/16 ring-1 ring-white/25">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="inline-flex rounded-full border border-white/25 bg-white/14 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/95">
                    {{ t('selfService.announcements.title') }}
                  </span>
                  <span class="inline-flex rounded-full bg-slate-950/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/90">
                    {{ currentAnnouncement().target === 'all' ? t('selfService.announcements.organizationAlert') : t('selfService.announcements.targetedNotice') }}
                  </span>
                  @if (totalAnnouncements() > 1) {
                    <span class="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/90">
                      {{ activeIndex() + 1 }}/{{ totalAnnouncements() }}
                    </span>
                  }
                </div>

                <h2 class="mt-3 truncate text-xl font-black tracking-tight text-white sm:text-2xl">
                  {{ currentAnnouncement().title }}
                </h2>
                <p class="mt-2 max-w-3xl text-sm font-medium leading-6 text-emerald-50/95 line-clamp-2 sm:text-[15px]">
                  {{ currentAnnouncement().content }}
                </p>
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-3">
              <div class="flex items-center gap-3 rounded-2xl bg-slate-950/15 px-4 py-3 ring-1 ring-white/15">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/16 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                </div>
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">Published</p>
                  <p class="mt-1 text-sm font-black text-white">
                    {{ currentAnnouncement().published_at ? (currentAnnouncement().published_at | date:'dd MMM yyyy') : t('selfService.announcements.recently') }}
                  </p>
                </div>
              </div>

              @if (totalAnnouncements() > 1) {
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="previous()"
                    class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/14 text-white transition hover:bg-white/25"
                    aria-label="Previous announcement">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button
                    type="button"
                    (click)="next()"
                    class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/14 text-white transition hover:bg-white/25"
                    aria-label="Next announcement">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      } @else {
        <div class="flex min-h-[140px] items-center gap-4 p-5 sm:p-6">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
          </div>
          <div class="min-w-0">
            <h3 class="text-base font-black text-slate-900">{{ t('selfService.announcements.emptyTitle') }}</h3>
            <p class="mt-1 text-sm font-medium text-slate-500">{{ t('selfService.announcements.emptySubtitle') }}</p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `]
})
export class EssAnnouncementsComponent {
  private languageService = inject(LanguageService);
  announcement = input<any>(null);
  announcements = input<any[]>([]);
  activeIndex = signal(0);
  currentAnnouncement = computed(() => {
    const items = this.normalizedAnnouncements();
    return items[this.activeIndex()] ?? null;
  });
  totalAnnouncements = computed(() => this.normalizedAnnouncements().length);
  readonly t = (key: string, params?: Record<string, string | number | null | undefined>) =>
    this.languageService.t(key, params);

  private normalizedAnnouncements(): any[] {
    const items = this.announcements();
    if (Array.isArray(items) && items.length > 0) return items;
    return this.announcement() ? [this.announcement()] : [];
  }

  previous(): void {
    const total = this.totalAnnouncements();
    if (total <= 1) return;
    this.activeIndex.set((this.activeIndex() - 1 + total) % total);
  }

  next(): void {
    const total = this.totalAnnouncements();
    if (total <= 1) return;
    this.activeIndex.set((this.activeIndex() + 1) % total);
  }
}
