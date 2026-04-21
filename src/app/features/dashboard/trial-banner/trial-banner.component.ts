import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription.service';

@Component({
  selector: 'app-trial-banner',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div *ngIf="subscriptionService.bannerVisible()" class="trial-banner-container mb-6 overflow-hidden rounded-[24px] border border-emerald-100 bg-[linear-gradient(135deg,#f0fdf4_0%,#ffffff_55%,#f0fdfa_100%)] shadow-lg shadow-emerald-100/40">
      <div class="relative px-6 py-6 sm:px-8 sm:py-8">
        <!-- Abstract Decoration -->
        <div class="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-50 opacity-50 blur-3xl"></div>
        <div class="absolute -bottom-8 right-16 h-32 w-32 rounded-full bg-teal-50 opacity-40 blur-3xl"></div>

        <div class="relative flex flex-col items-center justify-between gap-6 lg:flex-row">
          <div class="flex-1 space-y-4 text-center lg:text-left">
            <div class="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 shadow-sm">
              <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
              Subscription Status
            </div>
            
            <div class="space-y-1">
              <h2 class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                {{ headline() }}
              </h2>
              <p class="text-sm leading-6 text-slate-600 sm:text-base">
                {{ subline() }}
              </p>
            </div>

            <div class="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <div class="flex items-center gap-2 rounded-xl border border-white bg-white/80 px-4 py-2.5 shadow-sm shadow-emerald-100/60">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div>
                  <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Next Step</p>
                  <p class="text-sm font-bold text-slate-900">Unlock Full Access</p>
                </div>
              </div>
              <div class="flex items-center gap-2 rounded-xl border border-white bg-white/80 px-4 py-2.5 shadow-sm shadow-emerald-100/60" *ngIf="daysRemaining() !== null">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Countdown</p>
                  <p class="text-sm font-bold text-slate-900">{{ daysRemaining() }} Days Left</p>
                </div>
              </div>
            </div>
          </div>

          <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">
            <a routerLink="/billing" class="group relative inline-flex items-center justify-center overflow-hidden rounded-2xl bg-slate-900 px-8 py-4 font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]">
              <span class="relative z-10">Upgrade Workspace</span>
              <div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-emerald-600 to-teal-600 transition-transform duration-300 group-hover:translate-x-0"></div>
            </a>
            <button (click)="dismiss()" class="rounded-2xl border border-slate-200 bg-white/80 px-6 py-4 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-slate-900">
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TrialBannerComponent {
  readonly subscriptionService = inject(SubscriptionService);

  headline() {
    const status = this.subscriptionService.status();
    if (status?.organization.subscriptionStatus === 'grace') return 'Grace Period Active';
    if (status?.organization.subscriptionStatus === 'expired') return 'Subscription Expired';
    return 'Trial Plan Active';
  }

  subline() {
    const status = this.subscriptionService.status();
    if (status?.organization.subscriptionStatus === 'grace') return 'Your workspace is in read-only mode. Upgrade now to restore full write access for your team.';
    if (status?.organization.subscriptionStatus === 'expired') return 'Your access has been restricted. Select a plan to resume operations and keep your data active.';
    return 'Experience the power of HRNexus with full access to core modules. Upgrade anytime to avoid interruptions.';
  }

  daysRemaining() {
    return this.subscriptionService.status()?.trialDaysRemaining ?? null;
  }

  dismiss() {
    // Logic to hide for current session if needed
  }
}
