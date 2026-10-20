import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription.service';

@Component({
  selector: 'app-trial-banner',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div *ngIf="subscriptionService.bannerVisible()"
      [class]="isExpired() ? urgentClass : normalClass"
      class="trial-banner-container mb-6 overflow-hidden rounded-[24px] shadow-lg">
      <div class="relative px-6 py-5 sm:px-8 sm:py-6">

        <!-- Decorative blobs -->
        <div class="absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-40 blur-3xl"
             [class]="isExpired() ? 'bg-rose-200' : 'bg-emerald-50'"></div>
        <div class="absolute -bottom-8 right-16 h-32 w-32 rounded-full opacity-30 blur-3xl"
             [class]="isExpired() ? 'bg-red-100' : 'bg-teal-50'"></div>

        <div class="relative flex flex-col items-center justify-between gap-5 lg:flex-row">
          <div class="flex-1 space-y-3 text-center lg:text-left">

            <!-- Status badge -->
            <div [class]="isExpired()
              ? 'inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-700 shadow-sm'
              : 'inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 shadow-sm'">
              <span class="h-1.5 w-1.5 rounded-full"
                    [class]="isExpired() ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'"></span>
              {{ isExpired() ? 'Trial Expired' : 'Subscription Status' }}
            </div>

            <div class="space-y-1">
              <h2 class="text-2xl font-black tracking-tight sm:text-3xl"
                  [class]="isExpired() ? 'text-rose-900' : 'text-slate-900'">
                {{ headline() }}
              </h2>
              <p class="text-sm leading-6 sm:text-base"
                 [class]="isExpired() ? 'text-rose-700' : 'text-slate-600'">
                {{ subline() }}
              </p>
            </div>

            <!-- Stats row -->
            <div class="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <div class="flex items-center gap-2 rounded-xl border bg-white/80 px-4 py-2.5 shadow-sm"
                   [class]="isExpired() ? 'border-rose-200 shadow-rose-100/60' : 'border-white shadow-emerald-100/60'">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg"
                     [class]="isExpired() ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div>
                  <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Status</p>
                  <p class="text-sm font-bold" [class]="isExpired() ? 'text-rose-700' : 'text-slate-900'">
                    {{ isExpired() ? 'Access Locked' : 'Unlock Full Access' }}
                  </p>
                </div>
              </div>
              <div *ngIf="daysRemaining() !== null"
                   class="flex items-center gap-2 rounded-xl border bg-white/80 px-4 py-2.5 shadow-sm"
                   [class]="isExpired() ? 'border-rose-200 shadow-rose-100/60' : 'border-white shadow-amber-100/60'">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg"
                     [class]="isExpired() ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div>
                  <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Countdown</p>
                  <p class="text-sm font-bold" [class]="isExpired() ? 'text-rose-700' : 'text-slate-900'">
                    {{ daysRemaining() === 0 ? '0 Days — Expired' : daysRemaining() + ' Days Left' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- CTA Buttons -->
          <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">
            <a routerLink="/billing"
               [queryParams]="isExpired() ? {reason: 'trial_expired'} : {}"
               class="group relative inline-flex items-center justify-center overflow-hidden rounded-2xl px-8 py-4 font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
               [class]="isExpired()
                 ? 'bg-gradient-to-r from-rose-600 to-red-500 shadow-xl shadow-rose-500/30'
                 : 'bg-slate-900'">
              <span class="relative z-10">{{ isExpired() ? '🔓 Upgrade to Unlock' : 'Upgrade Workspace' }}</span>
              @if (!isExpired()) {
                <div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-emerald-600 to-teal-600 transition-transform duration-300 group-hover:translate-x-0"></div>
              }
            </a>
            <button *ngIf="!isExpired()" (click)="dismiss()"
              class="rounded-2xl border border-slate-200 bg-white/80 px-6 py-4 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-slate-900">
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class TrialBannerComponent {
  readonly subscriptionService = inject(SubscriptionService);

  readonly normalClass = 'border border-emerald-100 bg-[linear-gradient(135deg,#f0fdf4_0%,#ffffff_55%,#f0fdfa_100%)]';
  readonly urgentClass  = 'border border-rose-200 bg-[linear-gradient(135deg,#fff1f2_0%,#ffffff_55%,#fef2f2_100%)]';

  isExpired = computed(() => {
    const days = this.subscriptionService.status()?.trialDaysRemaining;
    const orgStatus = this.subscriptionService.status()?.organization?.subscriptionStatus;
    return (days !== null && days !== undefined && days <= 0) || orgStatus === 'expired';
  });

  headline() {
    const status = this.subscriptionService.status();
    if (status?.organization.subscriptionStatus === 'grace') return 'Grace Period Active';
    if (status?.organization.subscriptionStatus === 'expired') return 'Subscription Expired';
    const days = status?.trialDaysRemaining;
    if (days !== null && days !== undefined && days <= 0) return 'Free Trial Expired!';
    return 'Trial Plan Active';
  }

  subline() {
    const status = this.subscriptionService.status();
    const days = status?.trialDaysRemaining;
    if (status?.organization.subscriptionStatus === 'grace') return 'Your workspace is in read-only mode. Upgrade now to restore full write access for your team.';
    if (status?.organization.subscriptionStatus === 'expired') return 'Your access has been restricted. Select a plan to resume operations and keep your data active.';
    if (days !== null && days !== undefined && days <= 0) return 'Your 0-day trial is over. Upgrade now to regain access to all features and keep your data secure.';
    return 'Experience the power of HRNexus with full access to core modules. Upgrade anytime to avoid interruptions.';
  }

  daysRemaining() {
    return this.subscriptionService.status()?.trialDaysRemaining ?? null;
  }

  dismiss() {
    // Logic to hide for current session if needed
  }
}
