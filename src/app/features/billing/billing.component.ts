import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
declare var Razorpay: any;
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { LanguageService } from '../../core/services/language.service';
import {
  BillingPlan,
  SubscriptionStatusPayload,
  LegacyBillingContext,
  SubscriptionService,
} from '../../core/services/subscription.service';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, take } from 'rxjs/operators';

type CheckoutStep =
  | 'PLAN_SELECTION'
  | 'PAYMENT_SUCCESS'
  | 'BILLING_DETAILS'
  | 'INVOICE_GENERATED_SUCCESS'
  | 'INVOICE_VIEW';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe],
  template: `
<!-- billing.component.html -->
<div class="upgrade-plan-root min-h-screen bg-slate-50 relative overflow-hidden">
  
  <!-- Subtle Background Watermark -->
  <div class="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center overflow-hidden select-none">
    <img src="/hrnexus-logo.png" alt="" aria-hidden="true" class="w-[120%] max-w-6xl -rotate-12 scale-150 object-contain" />
  </div>

  <!-- Authentication Loading State -->
  <div *ngIf="isAuthenticating"
    class="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-white via-gray-50/95 to-white backdrop-blur-xl">
    <div
      class="mx-4 w-full max-w-md rounded-2xl border border-gray-100/50 bg-white/95 px-6 py-8 text-center shadow-xl backdrop-blur-sm">
      <div class="relative mb-6">
        <div class="absolute inset-0 -m-4">
          <div
            class="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-emerald-400/10 via-teal-400/10 to-green-400/10">
          </div>
        </div>
        <div class="relative mx-auto h-20 w-20">
          <div
            class="absolute inset-0 animate-spin rounded-full border-[4px] border-dashed border-emerald-100 border-t-emerald-500">
          </div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="text-white w-4 h-4">
                <path fill="currentColor"
                  d="M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.6 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0zm0 66.8V444.8C394 378 431.1 230.1 432 141.4L256 66.8l0 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <h3 class="mb-2 text-lg font-semibold text-gray-900">Verifying Access Credentials</h3>
      <p class="mb-4 text-xs text-gray-600">Securing your HRMS upgrade experience</p>
      <div class="mx-auto h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-gray-100">
        <div class="h-full animate-[pulse_2s_ease-in-out_infinite] bg-gradient-to-r from-emerald-400 via-teal-500 to-green-500"></div>
      </div>
    </div>
  </div>
  
  <!-- Session Expired State -->
  <div *ngIf="isSessionExpired"
    class="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-white via-gray-50/95 to-white backdrop-blur-xl">
    <div
      class="mx-4 w-full max-w-md rounded-2xl border border-red-100 bg-white/95 px-4 py-4 text-center shadow-2xl backdrop-blur-md animate__animated animate__zoomIn">
      <div class="relative mb-8 mx-auto w-24 h-24">
        <div class="absolute inset-0 animate-ping rounded-full bg-red-100/50"></div>
        <div class="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-xl shadow-red-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="text-white w-10 h-10">
            <path fill="currentColor" d="M464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM232 120V256c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"/>
          </svg>
        </div>
      </div>
      <h3 class="mb-3 text-2xl font-bold text-gray-900 leading-tight">Access Link Expired</h3>
      <p class="mb-8 text-sm text-gray-600 leading-relaxed px-4">
        This upgrade link has already been used or has expired for security reasons. Please initiate a new upgrade from your dashboard.
      </p>
      <button (click)="redirectToDashboard()" class="w-full rounded-xl bg-gray-900 py-3 text-white font-semibold">Go to Dashboard</button>
    </div>
  </div>

  <!-- Main Wrapper -->
  <div class="flex h-screen flex-col overflow-hidden" [ngClass]="{ 'overflow-hidden': isAuthenticating || isRedirecting }">

    <!-- Professional Header -->
    <header class="sticky top-0 z-50 flex-shrink-0 border-b border-gray-200/50 bg-white/95 shadow-sm shadow-gray-100/50 backdrop-blur-xl">
      <div class="mx-auto px-4">
        <div class="flex h-14 sm:h-16 items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="relative">
              <div class="h-11 w-11 overflow-hidden rounded-2xl bg-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-100">
                <img src="/hrnexus-brand-mark.png" alt="HRNexus" class="h-full w-full object-cover" loading="eager" />
              </div>
              <div class="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h1 class="text-lg font-bold text-gray-900 leading-tight tracking-tight">
                <span class="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent uppercase">
                  HRNexus Plan
                </span>
              </h1>
              <div class="flex items-center gap-1">
                <span class="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Enterprise Edition</span>
                <div class="w-1 h-1 bg-emerald-400 rounded-full"></div>
                <span class="text-[10px] text-gray-500">HRNexus Technology</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 sm:gap-4">
            <div class="hidden lg:flex items-center gap-2">
              <div [class]="getPlanStatusBadgeWithIcon().bgColor + ' rounded-lg border border-gray-200/50 px-3 py-1.5'">
                <div class="flex items-center gap-1.5">
                  <span [class]="getPlanStatusBadgeWithIcon().color + ' text-sm font-bold'">
                    {{ getPlanStatusBadgeWithIcon().text }}
                  </span>
                </div>
              </div>
            </div>

            <div class="hidden lg:flex flex-col items-end">
              <span class="max-w-[140px] truncate text-sm font-bold text-gray-900">{{ userInfo.name }}</span>
              <span class="max-w-[140px] truncate text-xs text-gray-500">{{ userInfo.email }}</span>
            </div>

            <div class="group relative">
              <button (click)="showUserDropdown = !showUserDropdown"
                class="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-1 sm:p-1.5 transition-all duration-200 hover:border-emerald-200 hover:shadow-sm">
                <div class="relative">
                  <div class="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-white bg-gradient-to-br from-emerald-500 to-teal-500 font-bold text-white shadow-md">
                    {{ getUserInitials() }}
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="text-gray-400 w-3 h-3" [ngClass]="{ 'rotate-180': showUserDropdown }">
                  <path fill="currentColor" d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
                </svg>
              </button>

              <div *ngIf="showUserDropdown" class="absolute right-0 top-full z-50 mt-1.5 w-60 rounded-xl border border-gray-200/50 bg-white/95 py-2 shadow-lg backdrop-blur-xl">
                <div class="border-b border-gray-100 px-4 py-3">
                  <p class="truncate text-sm font-bold text-gray-900">{{ userInfo.name }}</p>
                  <div class="mt-2 flex items-center gap-2">
                    <span [class]="getPlanStatusBadge().color" class="rounded-full px-2 py-1 text-xs font-semibold">
                      {{ getPlanStatusBadge().text }}
                    </span>
                    <span class="text-xs font-medium text-gray-500">{{ getRemainingDaysDisplay() }}</span>
                  </div>
                </div>
                <div class="py-1">
                  <button (click)="forceReload(); showUserDropdown = false" class="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Refresh Data</button>
                  <button (click)="redirectToDashboard(); showUserDropdown = false" class="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Go to Dashboard</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Plan Expired Banner -->
    <div *ngIf="planContext.isPlanExpired && currentStep === 'PLAN_SELECTION'"
      class="relative flex-shrink-0 overflow-hidden border-b border-amber-100/50 bg-gradient-to-r from-amber-50 via-orange-50/50 to-red-50/30 px-4 py-3 sm:py-4">
      <div class="mx-auto flex flex-col items-center justify-between gap-3 lg:flex-row">
        <div class="flex items-center gap-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-5 h-5">
              <path fill="currentColor" d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-bold text-gray-900">Your plan has expired <span class="text-amber-700">{{ planContext.daysSinceExpiry }} days ago</span></h3>
            <p class="text-xs text-gray-600">Upgrade now to restore full access to all HRMS features.</p>
          </div>
        </div>
        <button (click)="triggerExpiredPlanRedirect()" class="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-amber-600 hover:to-orange-600">Upgrade Now →</button>
      </div>
    </div>

    <!-- REDIRECT LOADER OVERLAY -->
    <div *ngIf="isRedirecting" class="fixed inset-0 z-[10000] flex items-center justify-center bg-white/95 backdrop-blur-xl px-4">
      <div class="w-full max-w-2xl text-center">
        <div class="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <div class="absolute inset-0 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin"></div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="relative h-10 w-10" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 class="text-3xl font-bold text-gray-900">Processing Your Payment</h2>
        <p class="mt-2 text-lg text-gray-600">Please wait while we securely connect to Razorpay...</p>
        <div class="mx-auto mt-8 h-2 w-full max-w-md overflow-hidden rounded-full bg-gray-100">
          <div class="h-full rounded-full bg-emerald-500 transition-all duration-500" [style.width.%]="progress"></div>
        </div>
        <div class="mt-10 flex flex-col items-center gap-3">
          <span class="text-sm text-gray-500">Secure payment via</span>
          <span class="text-sm font-bold text-slate-700">Razorpay</span>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-y-auto" [ngClass]="{ 'bg-gray-50': isMinimalLayoutStep() }">
      <div class="mx-auto px-4 py-6">

        <!-- PLAN SELECTION STEP -->
        <div id="plan-selection-area" *ngIf="currentStep === 'PLAN_SELECTION' && !isRedirecting" class="grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          <div class="space-y-6 lg:col-span-8">
            <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 class="text-2xl font-bold text-gray-900">Configure Your Plan</h2>
              <p class="mt-1 text-sm text-gray-500">{{ getPlanStatusMessage() }}</p>

              <div class="mt-8">
                <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">Plan Duration</h3>
                <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button *ngFor="let option of getDurationOptions()" (click)="selectDurationOption(option.months)"
                    [class]="durationInputValue === option.months ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-600'"
                    class="rounded-xl border p-4 text-center transition-all hover:border-emerald-200">
                    <p class="text-lg font-bold">{{ option.label }}</p>
                    <p class="text-xs opacity-70">{{ option.months }} Months</p>
                  </button>
                </div>
              </div>

              <div class="mt-8">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">User Capacity</h3>
                  <div class="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1 border border-gray-200">
                    <span class="text-xl font-bold text-gray-900">{{ targetUsers }}</span>
                    <span class="text-xs text-gray-500">Users</span>
                  </div>
                </div>
                <div class="mt-6 px-2">
                  <input type="range" [min]="getMinUsersForDuration()" max="10000" [value]="targetUsers"
                    (input)="targetUsers = +$any($event.target).value; updateTargetUsers()"
                    [style.background]="getSliderGradient()"
                    class="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 focus:outline-none" />
                  <div class="mt-2 flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    <span>Min: {{ getMinUsersForDuration() }} Users</span>
                    <span>Max: 10,000 Users</span>
                  </div>
                </div>
              </div>
            </section>

            <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-2xl font-bold text-gray-900">Premium Add-ons</h2>
                <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">{{ getSelectedAddonsCount() }} Selected</span>
              </div>
              <div class="divide-y divide-gray-100">
                <div *ngFor="let addon of addOns" class="flex items-center justify-between gap-4 py-4 group">
                  <div class="flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <h4 class="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{{ addon.label }}</h4>
                      <span *ngIf="addon.isInstalled" class="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">Active</span>
                      <span *ngIf="addon.isLocked" class="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600 ring-1 ring-slate-200">Locked</span>
                    </div>
                    <p class="text-sm text-gray-500">{{ addon.description }}</p>
                  </div>
                  <button (click)="toggleAddOn(addon)" [disabled]="addon.isLocked"
                    [title]="addon.isLocked ? 'This add-on is already active and cannot be removed from this purchase.' : (addon.selected ? 'Remove add-on' : 'Add add-on')"
                    [class]="addon.selected ? (addon.isLocked ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 cursor-not-allowed' : 'bg-emerald-500 text-white') : 'bg-gray-100 text-gray-400'"
                    class="h-10 w-10 shrink-0 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-sm disabled:hover:scale-100">
                    <svg *ngIf="!addon.selected" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" /></svg>
                    <svg *ngIf="addon.selected" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                  </button>
                </div>
              </div>
            </section>
          </div>

          <div class="lg:col-span-4">
            <div class="sticky top-24 space-y-6">
              <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl ring-1 ring-emerald-500/10">
                <h3 class="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">Order Summary</h3>
                <div class="mt-4 space-y-4">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Users ({{ targetUsers }})</span>
                    <span class="font-bold text-gray-900">{{ getCurrencySymbol() }}{{ planAmount | number:'1.2-2' }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Duration</span>
                    <span class="font-bold text-gray-900">{{ durationLabel }}</span>
                  </div>
                  <div *ngIf="getSelectedAddonsCount() > 0" class="pt-2 border-t border-dashed border-gray-100">
                    <p class="text-[10px] font-bold text-gray-400 uppercase mb-2">Add-ons</p>
                    <div *ngFor="let addon of addOns">
                      <div *ngIf="addon.selected" class="flex justify-between text-sm mb-1">
                        <span class="text-gray-600 italic text-xs">{{ addon.label }}</span>
                        <span class="font-medium text-gray-800 text-xs">{{ getCurrencySymbol() }}{{ addon.calculatedAmount | number:'1.2-2' }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="pt-4 border-t border-gray-100 space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-500">Subtotal</span>
                      <span class="font-bold text-gray-900">{{ getCurrencySymbol() }}{{ subTotal | number:'1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-500">Tax ({{ isINR ? '18%' : '0%' }})</span>
                      <span class="font-bold text-gray-900">{{ getCurrencySymbol() }}{{ tax | number:'1.2-2' }}</span>
                    </div>
                  </div>
                  <div class="mt-6 rounded-xl bg-emerald-600 p-4 text-white shadow-lg shadow-emerald-200">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium opacity-90">Grand Total</span>
                      <span class="text-2xl font-bold">{{ getCurrencySymbol() }}{{ grandTotal | number:'1.2-2' }}</span>
                    </div>
                  </div>
                </div>
                <button (click)="reviewPay()" [disabled]="grandTotal <= 0 || !legacyBillingConfigured || isSubmitting"
                  class="mt-6 w-full rounded-xl bg-gray-900 py-4 text-lg font-bold text-white transition-all hover:bg-black hover:shadow-xl active:scale-[0.98] disabled:opacity-30">
                  {{ getPlanActionButtonText() }}
                </button>
                <p *ngIf="!legacyBillingConfigured" class="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-800">
                  Payment gateway is not configured on the backend. Please configure Razorpay or the legacy billing gateway before starting a purchase.
                </p>
                <div class="mt-4 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Secure End-to-End Payment
                </div>
              </section>
            </div>
          </div>
        </div>

        <!-- PAYMENT SUCCESS STEP -->
        <div *ngIf="currentStep === 'PAYMENT_SUCCESS'" class="flex min-h-[70vh] flex-col items-center justify-center text-center">
          <div class="relative mb-8">
            <div class="absolute inset-0 animate-ping rounded-full bg-emerald-100 opacity-75"></div>
            <div class="relative h-24 w-24 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
            </div>
          </div>
          <h2 class="text-4xl font-bold text-gray-900">Payment Confirmed!</h2>
          <p class="mt-3 text-lg text-gray-600 max-w-md">Your premium subscription has been successfully activated. Let's get your billing details for the invoice.</p>
          <div class="mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-sm">
            <button (click)="continueToBilling()" class="flex-1 rounded-xl bg-emerald-600 py-4 text-white font-bold shadow-lg hover:bg-emerald-700">Continue to Billing</button>
            <button (click)="downloadReceipt()" class="flex-1 rounded-xl border border-gray-200 bg-white py-4 text-gray-700 font-bold hover:bg-gray-50">Save Receipt</button>
          </div>
        </div>

        <!-- BILLING DETAILS STEP -->
        <div *ngIf="currentStep === 'BILLING_DETAILS'" class="mx-auto max-w-3xl">
          <section class="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 class="text-2xl font-bold text-gray-900">Billing Information</h2>
            <p class="text-sm text-gray-500 mt-1">Please provide accurate details for GST compliant invoice generation.</p>
            
            <form (ngSubmit)="saveAndGenerateInvoice()" class="mt-8 space-y-6">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div class="space-y-2">
                  <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">Company Name</label>
                  <input type="text" [(ngModel)]="billingDetails.companyName" name="companyName" class="w-full rounded-xl border-gray-200 bg-gray-50 p-4 focus:border-emerald-500 focus:ring-0" placeholder="e.g. Acme Corp" required />
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Person</label>
                  <input type="text" [(ngModel)]="billingDetails.contactPerson" name="contactPerson" class="w-full rounded-xl border-gray-200 bg-gray-50 p-4 focus:border-emerald-500 focus:ring-0" placeholder="e.g. John Doe" />
                </div>
              </div>

              <div class="flex items-center gap-3 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <input type="checkbox" [(ngModel)]="billingDetails.hasGst" name="hasGst" id="hasGst" class="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                <label for="hasGst" class="text-sm font-bold text-gray-700 cursor-pointer">Include GST details on invoice</label>
              </div>

              <div *ngIf="billingDetails.hasGst" class="space-y-2">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">GST Number</label>
                <input type="text" [(ngModel)]="billingDetails.gstNumber" name="gstNumber" (blur)="validateGST(billingDetails.gstNumber)" class="w-full rounded-xl border-gray-200 bg-gray-50 p-4 font-mono focus:border-emerald-500 focus:ring-0" placeholder="e.g. 23AAAAA0000A1Z5" />
              </div>

              <div class="space-y-2">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">Billing Address</label>
                <textarea [(ngModel)]="billingDetails.address" name="address" rows="3" class="w-full rounded-xl border-gray-200 bg-gray-50 p-4 focus:border-emerald-500 focus:ring-0" placeholder="Full billing address..."></textarea>
              </div>

              <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div class="space-y-2">
                  <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">City</label>
                  <input type="text" [(ngModel)]="billingDetails.city" name="city" class="w-full rounded-xl border-gray-200 bg-gray-50 p-4 focus:border-emerald-500 focus:ring-0" />
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">State</label>
                  <input type="text" [(ngModel)]="billingDetails.state" name="state" class="w-full rounded-xl border-gray-200 bg-gray-50 p-4 focus:border-emerald-500 focus:ring-0" />
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">ZIP Code</label>
                  <input type="text" [(ngModel)]="billingDetails.zipCode" name="zipCode" class="w-full rounded-xl border-gray-200 bg-gray-50 p-4 focus:border-emerald-500 focus:ring-0" />
                </div>
              </div>

              <button type="submit" [disabled]="isSubmitting" class="w-full rounded-xl bg-gray-900 py-4 text-white font-bold shadow-lg hover:bg-black disabled:opacity-50 transition-all">
                {{ isSubmitting ? 'Generating Invoice...' : 'Finalize & Generate Invoice' }}
              </button>
            </form>
          </section>
        </div>

        <!-- INVOICE VIEW STEP -->
        <div *ngIf="currentStep === 'INVOICE_VIEW'" class="mx-auto max-w-4xl">
          <div class="rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden animate__animated animate__fadeInUp">
            <div class="bg-emerald-600 p-8 text-white flex justify-between items-start">
              <div>
                <h1 class="text-3xl font-bold tracking-tight">Invoice</h1>
                <p class="mt-1 opacity-80 text-sm">Thank you for your business!</p>
              </div>
              <div class="text-right">
                <p class="text-xl font-bold">HRNexus Technology</p>
                <p class="text-xs opacity-80">Premium HRMS Solution</p>
              </div>
            </div>

            <div class="p-8">
              <div class="grid grid-cols-2 gap-12">
                <div class="space-y-4">
                  <div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Billed To</p>
                    <p class="mt-1 text-lg font-bold text-gray-900">{{ billingDetails.companyName }}</p>
                    <p class="text-sm text-gray-500">{{ billingDetails.address }}</p>
                    <p class="text-sm text-gray-500">{{ billingDetails.city }}, {{ billingDetails.state }} - {{ billingDetails.zipCode }}</p>
                    <p *ngIf="billingDetails.hasGst" class="mt-2 text-xs font-bold text-emerald-600">GSTIN: {{ billingDetails.gstNumber }}</p>
                  </div>
                </div>
                <div class="text-right space-y-4">
                  <div class="grid grid-cols-2 gap-x-4 text-sm">
                    <p class="text-gray-400">Invoice #</p><p class="font-bold text-gray-900">{{ invoiceDetails.number }}</p>
                    <p class="text-gray-400">Date</p><p class="font-bold text-gray-900">{{ today | date:'mediumDate' }}</p>
                    <p class="text-gray-400">Status</p><p class="font-extrabold text-emerald-600 uppercase">Paid</p>
                  </div>
                </div>
              </div>

              <div class="mt-12">
                <table class="w-full text-left">
                  <thead class="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th class="pb-4">Description</th>
                      <th class="pb-4 text-center">Qty</th>
                      <th class="pb-4 text-right">Price</th>
                      <th class="pb-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-50">
                    <tr class="text-sm">
                      <td class="py-6">
                        <p class="font-bold text-gray-900">Premium Plan ({{ durationLabel }})</p>
                        <p class="text-xs text-gray-500">Access for {{ targetUsers }} users until {{ planEndDate }}</p>
                      </td>
                      <td class="py-6 text-center text-gray-900 font-medium">1</td>
                      <td class="py-6 text-right text-gray-900">{{ getCurrencySymbol() }}{{ planAmount | number:'1.2-2' }}</td>
                      <td class="py-6 text-right text-gray-900 font-bold">{{ getCurrencySymbol() }}{{ planAmount | number:'1.2-2' }}</td>
                    </tr>
                    <tr *ngFor="let addon of addOns">
                      <td *ngIf="addon.selected" class="py-6">
                        <p class="font-bold text-gray-900">{{ addon.label }} Add-on</p>
                        <p class="text-xs text-gray-500">{{ addon.description }}</p>
                      </td>
                      <td *ngIf="addon.selected" class="py-6 text-center text-gray-900 font-medium">1</td>
                      <td *ngIf="addon.selected" class="py-6 text-right text-gray-900">{{ getCurrencySymbol() }}{{ addon.calculatedAmount | number:'1.2-2' }}</td>
                      <td *ngIf="addon.selected" class="py-6 text-right text-gray-900 font-bold">{{ getCurrencySymbol() }}{{ addon.calculatedAmount | number:'1.2-2' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="mt-8 pt-8 border-t border-gray-100 flex justify-end">
                <div class="w-64 space-y-3">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Subtotal</span>
                    <span class="font-bold text-gray-900">{{ getCurrencySymbol() }}{{ subTotal | number:'1.2-2' }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Tax ({{ isINR ? '18%' : '0%' }})</span>
                    <span class="font-bold text-gray-900">{{ getCurrencySymbol() }}{{ tax | number:'1.2-2' }}</span>
                  </div>
                  <div class="pt-3 border-t border-gray-200 flex justify-between items-center">
                    <span class="text-lg font-bold text-gray-900">Total Paid</span>
                    <span class="text-2xl font-black text-emerald-600">{{ getCurrencySymbol() }}{{ grandTotal | number:'1.2-2' }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="bg-gray-50 p-8 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p class="text-xs text-gray-400 font-medium italic">This is a computer generated invoice and does not require a physical signature.</p>
              <button (click)="redirectToDashboard()" class="rounded-xl bg-gray-900 px-8 py-3 text-white font-bold hover:bg-black shadow-lg">Back to Home</button>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- Footer -->
    <footer class="sticky bottom-0 z-40 border-t border-gray-100 bg-white/80 backdrop-blur-md px-6 py-4">
      <div class="mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">© 2026 HRNexus Technology</p>
        <div class="flex gap-4">
          <a href="#" class="text-[10px] font-bold text-gray-400 hover:text-emerald-600 uppercase tracking-widest transition-colors">Support</a>
          <a href="#" class="text-[10px] font-bold text-gray-400 hover:text-emerald-600 uppercase tracking-widest transition-colors">Privacy</a>
          <a href="#" class="text-[10px] font-bold text-gray-400 hover:text-emerald-600 uppercase tracking-widest transition-colors">Terms</a>
        </div>
      </div>
    </footer>
  </div>
</div>

<!-- Logout Modal -->
<div *ngIf="showLogoutModal" class="fixed inset-0 z-[10001] flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="showLogoutModal = false"></div>
  <div class="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl animate__animated animate__zoomIn">
    <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
    </div>
    <h3 class="text-center text-xl font-bold text-gray-900">Session Expired</h3>
    <p class="mt-2 text-center text-sm text-gray-500">You have been logged out. Please sign in again to continue with your purchase.</p>
    <div class="mt-8 flex flex-col gap-3">
      <button (click)="performLoginRedirect()" class="w-full rounded-xl bg-gray-900 py-3.5 text-white font-bold hover:bg-black">Sign In Again</button>
      <button (click)="showLogoutModal = false" class="w-full rounded-xl py-3.5 text-gray-500 font-bold hover:bg-gray-50 transition-colors">Cancel</button>
    </div>
  </div>
</div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    
    .upgrade-plan-root {
      background:
        radial-gradient(circle at top left, rgba(16, 185, 129, 0.05), transparent 18rem),
        radial-gradient(circle at top right, rgba(14, 165, 233, 0.05), transparent 20rem),
        linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
    }
    
    .backdrop-blur-xl {
      backdrop-filter: blur(24px) saturate(180%);
    }

    input[type='range']::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      background: #ffffff;
      border: 2px solid #10b981;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }
  `]
})
export class BillingComponent implements OnInit, OnDestroy {
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly languageService = inject(LanguageService);

  // States
  isAuthenticating = false;
  isSessionExpired = false;
  isRedirecting = false;
  showUserDropdown = false;
  showLogoutModal = false;
  addOnsExpanded = true;
  isLoadingAddons = false;
  isFinalizingPayment = false;
  isSubmitting = false;
  legacyBillingConfigured = true;
  currentStep: CheckoutStep = 'PLAN_SELECTION';
  progress = 0;
  appName = '';
  private paymentLoaderTimer: ReturnType<typeof setInterval> | null = null;

  // Data
  today = new Date();
  userInfo = { name: '', email: '', contact: '', country: '' };
  planContext = {
    mode: 'Buy' as 'Buy' | 'Upgrade',
    isPlanExpired: false,
    daysSinceExpiry: 0,
    existingUsers: 0,
    isRecentlyExpired: false,
    additionalUsers: 0,
    expiryDate: null as Date | null
  };

  durationInputValue = 12;
  targetUsers = 10;
  planFeatures = [
    'Automated Attendance Tracking',
    'Payroll Management System',
    'Leave & Holiday Management',
    'Employee Self Service Portal',
    'Mobile App with Geo-fencing',
    'Advanced Reports & Analytics'
  ];

  addOns: any[] = [];
  billingDetails = {
    email: '',
    contactPerson: '',
    phone: '',
    companyName: '',
    address: '',
    state: '',
    city: '',
    zipCode: '',
    hasGst: false,
    gstNumber: '',
  };

  invoiceDetails = { number: 'INV-' + Date.now(), date: '' };
  invoiceData: any = null;
  isINR = true;
  preOrderData: any = null;

  // Pricing Computed
  planAmount = 0;
  subTotal = 0;
  tax = 0;
  grandTotal = 0;
  durationLabel = '12 Months';
  planEndDate = '';

  ngOnInit() {
    this.loadInitialData();
    this.route.queryParamMap.subscribe(params => {
      if (params.get('step') === 'success') {
        this.currentStep = 'PAYMENT_SUCCESS';
      }
    });
  }

  ngOnDestroy() {
    this.clearPaymentLoaderTimer();
  }

  private showPaymentLoader(startProgress = 8) {
    this.clearPaymentLoaderTimer();
    this.isRedirecting = true;
    this.progress = Math.max(this.progress || 0, startProgress);

    this.paymentLoaderTimer = setInterval(() => {
      if (this.progress < 45) {
        this.progress += 4;
      } else if (this.progress < 75) {
        this.progress += 2;
      } else if (this.progress < 90) {
        this.progress += 0.75;
      }

      if (this.progress < 90) {
        this.progress = Math.min(90, Math.round(this.progress * 100) / 100);
      }
    }, 350);
  }

  private setPaymentLoaderProgress(value: number) {
    this.progress = Math.max(0, Math.min(100, value));
  }

  private hidePaymentLoader() {
    this.clearPaymentLoaderTimer();
    this.isRedirecting = false;
    this.progress = 0;
  }

  private clearPaymentLoaderTimer() {
    if (this.paymentLoaderTimer) {
      clearInterval(this.paymentLoaderTimer);
      this.paymentLoaderTimer = null;
    }
  }

  private getBrandLogoUrl() {
    return `${window.location.origin}/hrnexus-brand-mark.png`;
  }

  loadInitialData() {
    this.isAuthenticating = true;
    
    // Safety timeout: If data doesn't load within 15 seconds, stop the spinner
    const safetyTimeout = setTimeout(() => {
      if (this.isAuthenticating) {
        this.isAuthenticating = false;
        this.toastService.error('Loading is taking longer than expected. Please refresh.');
      }
    }, 15000);

    forkJoin({
      status: this.subscriptionService.getStatus().pipe(
        take(1),
        catchError(err => {
          console.error('Status fetch failed', err);
          return of(null);
        })
      ),
      context: this.subscriptionService.getLegacyContext().pipe(
        take(1),
        catchError(err => {
          console.error('Context fetch failed', err);
          return of(null);
        })
      )
    }).pipe(
      finalize(() => {
        this.isAuthenticating = false;
        clearTimeout(safetyTimeout);
      })
    ).subscribe({
      next: ({ status, context }) => {
        if (!status) {
          this.isSessionExpired = true;
          return;
        }

        // Populate User Info from Status
        if (status.organization) {
          this.userInfo.name = status.organization.companyName || 'Organization';
          this.planContext.isPlanExpired = status.organization.subscriptionStatus === 'expired';
        }

        // Handle Subscription Dates
        const endDate = status.currentSubscription?.endDate ? new Date(status.currentSubscription.endDate) : null;
        this.planContext.expiryDate = endDate;
        
        if (endDate && !isNaN(endDate.getTime())) {
          const now = new Date();
          const diff = endDate.getTime() - now.getTime();
          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
          if (days < 0) {
            this.planContext.isPlanExpired = true;
            this.planContext.daysSinceExpiry = Math.abs(days);
            this.planContext.isRecentlyExpired = this.planContext.daysSinceExpiry <= 7;
          } else {
            this.planContext.isPlanExpired = false;
            this.planContext.daysSinceExpiry = 0;
          }
        }

        // Handle Context
        if (context) {
          this.legacyBillingConfigured = context.configured !== false;
          this.appName = context.appName || '';
          this.userInfo.email = context.existingPlan?.email || '';
          this.userInfo.contact = context.existingPlan?.phoneNumber || '';
          this.planContext.existingUsers = context.existingPlan?.userlimit || 0;
          this.planContext.mode = context.suggestedAction === 'Upgrade' ? 'Upgrade' : 'Buy';
          this.targetUsers = Math.max(this.targetUsers, context.existingPlan?.userlimit || 10);
          
          this.billingDetails.companyName = context.existingPlan?.orgName || status.organization?.companyName || '';
          this.billingDetails.email = context.existingPlan?.email || '';
          this.billingDetails.phone = context.existingPlan?.phoneNumber || '';
          
          const city = context.existingPlan?.cityName || '';
          const state = context.existingPlan?.stateName || '';
          this.billingDetails.address = city + (state ? ', ' + state : '');
          this.isINR = context.existingPlan?.countryname === 'India';

          this.addOns = this.normalizeAddonCatalog(context.addonCatalog || []);
        }

        this.calculatePricing();
      },
      error: () => {
        this.isSessionExpired = true;
        this.isAuthenticating = false;
      }
    });
  }

  calculatePricing() {
    const basePricePerUserPerMonth = this.isINR ? 50 : 2; 
    const months = this.durationInputValue;
    const userCount = this.targetUsers;
    
    this.planAmount = basePricePerUserPerMonth * userCount * months;
    
    let addonSum = 0;
    this.addOns.forEach(a => {
      if (a.selected) {
        a.calculatedAmount = a.price * userCount * (months / 12);
        addonSum += a.calculatedAmount;
      }
    });

    this.subTotal = this.planAmount + addonSum;
    this.tax = this.isINR ? this.subTotal * 0.18 : 0;
    this.grandTotal = this.subTotal + this.tax;
    this.durationLabel = months + ' Month' + (months > 1 ? 's' : '');
    
    // Calculate Plan End Date
    const start = this.planContext.expiryDate && this.planContext.expiryDate > new Date() 
      ? new Date(this.planContext.expiryDate) 
      : new Date();
    start.setMonth(start.getMonth() + months);
    this.planEndDate = start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private addonStatusEnabled(value: any): boolean {
    const status = String(value ?? '').trim().toLowerCase();
    return status === '1' || status === 'true' || status === 'active' || status === 'enabled';
  }

  private addonKey(value: string): string {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private addonFallbackPrice(name: string): number {
    const key = this.addonKey(name);
    const prices: Record<string, number> = {
      attendance: 400,
      attendancetracking: 400,
      employeetracking: 400,
      payroll: 500,
      payrollmanagement: 500,
      projects: 300,
      projecttaskmanagement: 300,
      expenses: 300,
      expensetracking: 300,
      timesheet: 200,
      timesheets: 200,
      timesheetmanagement: 200,
      announcements: 100,
      visitmanagement: 300,
      visitormanagement: 300,
      trackvisits: 300,
      leaveandtimeoff: 300,
      facerecognition: 1000,
      geofence: 200,
      geofencing: 200,
      shiftplanner: 300,
      manageclients: 300,
    };
    return prices[key] ?? 300;
  }

  private normalizeAddonPrice(price: any, name: string): number {
    const parsed = Number(price);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : this.addonFallbackPrice(name);
  }

  private normalizeAddonCatalog(catalog: Array<{ name: string; price: string; status: string }>) {
    const seen = new Set<string>();
    return catalog
      .filter((addon) => String(addon?.name || '').trim())
      .map((addon) => {
        const label = String(addon.name || '').replace(/\s+/g, ' ').trim();
        const key = label.toLowerCase();
        const isInstalled = this.addonStatusEnabled(addon.status);
        return {
          label,
          description: 'Access premium ' + label + ' features',
          price: this.normalizeAddonPrice(addon.price, label),
          selected: isInstalled,
          isInstalled,
          isLocked: isInstalled,
          isNewlyAdded: false,
          calculatedAmount: 0,
          key,
        };
      })
      .filter((addon) => {
        if (seen.has(addon.key)) return false;
        seen.add(addon.key);
        return true;
      });
  }

  getDurationOptions() {
    return [
      { label: 'Quarterly', months: 3 },
      { label: 'Yearly', months: 12 },
      { label: '2 Years', months: 24 }
    ];
  }

  selectDurationOption(months: number) {
    this.durationInputValue = months;
    this.onDurationChange();
  }

  onDurationChange() {
    if (this.durationInputValue < 1) this.durationInputValue = 1;
    this.calculatePricing();
  }

  getMinDuration() { return 1; }
  getDurationStep() { return 1; }

  updateTargetUsers() {
    this.planContext.additionalUsers = Math.max(0, this.targetUsers - this.planContext.existingUsers);
    this.calculatePricing();
  }

  validateTargetUsers() {
    if (this.targetUsers < this.planContext.existingUsers) {
      this.targetUsers = this.planContext.existingUsers;
    }
    this.updateTargetUsers();
  }

  getMinUsersForDuration() {
    return this.planContext.existingUsers || 10;
  }

  getSliderGradient() {
    const min = this.getMinUsersForDuration();
    const max = 10000;
    const val = this.targetUsers;
    const percentage = ((val - min) / (max - min)) * 100;
    return `linear-gradient(to right, #10b981 0%, #10b981 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`;
  }

  toggleAddOn(addon: any) {
    if (addon.isLocked) {
      this.toastService.info(`${addon.label} is already active and cannot be removed from this purchase.`);
      return;
    }
    addon.selected = !addon.selected;
    addon.isNewlyAdded = addon.selected && !addon.isInstalled;
    this.calculatePricing();
  }

  isMandatoryAddon(addon: any) {
    return false; // Can be linked to specific plan logic
  }

  getSelectedAddonsCount() {
    return this.addOns.filter(a => a.selected).length;
  }

  validateContactInfo() {
    return this.userInfo.name && (this.userInfo.email || this.billingDetails.email);
  }

  getPlanStatusBadgeWithIcon() {
    if (this.planContext.isPlanExpired) {
      return { text: 'EXPIRED', color: 'text-amber-800', bgColor: 'bg-amber-50' };
    }
    return { text: 'ACTIVE', color: 'text-emerald-800', bgColor: 'bg-emerald-50' };
  }

  getPlanStatusBadge() {
    return this.getPlanStatusBadgeWithIcon();
  }

  getRemainingDaysDisplay() {
    if (this.planContext.isPlanExpired) return 'Expired';
    if (!this.planContext.expiryDate) return 'Active';
    const now = new Date();
    const diff = this.planContext.expiryDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days + ' days remaining';
  }

  getFormattedEndDate() {
    return this.planContext.expiryDate 
      ? this.planContext.expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Not available';
  }

  getPlanStatusMessage() {
    if (this.planContext.isPlanExpired) return 'Your workspace is currently inactive. Renew now to restore all HR services.';
    return 'Scale your workspace by adding more users or premium modules.';
  }

  getPlanActionButtonText() {
    if (!this.legacyBillingConfigured) return 'Billing Setup Required';
    return this.planContext.mode === 'Buy' ? 'Purchase Plan' : 'Confirm Upgrade';
  }

  private getApiErrorMessage(error: any, fallback: string) {
    if (error?.status === 0) {
      return 'Backend server is not reachable. Please make sure http://localhost:3333 is running, then retry.';
    }
    const serverMessage = error?.error?.message || error?.error?.error?.message || error?.error?.errors?.[0]?.message;
    return serverMessage || error?.message || fallback;
  }

  getUserInitials() {
    return (this.userInfo.name || 'U').charAt(0).toUpperCase();
  }

  isMinimalLayoutStep() {
    return ['PAYMENT_SUCCESS', 'INVOICE_GENERATED_SUCCESS', 'INVOICE_VIEW'].includes(this.currentStep);
  }

  forceReload() {
    window.location.reload();
  }

  redirectToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  goToBilling() {
    this.currentStep = 'BILLING_DETAILS';
  }

  triggerExpiredPlanRedirect() {
    // Already on billing, but could scroll to selection
    const el = document.getElementById('plan-selection-area');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  reviewPay() {
    if (this.isSubmitting) return;
    if (!this.legacyBillingConfigured) {
      this.toastService.error('Payment gateway is not configured on the backend. Please configure Razorpay or the legacy billing gateway.');
      return;
    }
    this.showPaymentLoader(8);
    
    const payload = {
      nouser: this.targetUsers,
      selectedAddons: this.addOns.filter(a => a.selected).map(a => ({ name: a.label, status: true })),
      paymentMethod: 'razorpay',
      state: this.billingDetails.state || 'Delhi',
      country: this.isINR ? 'India' : 'International',
      name: this.userInfo.name,
      duration: this.durationInputValue,
      durationType: 'Months',
      subtotal: this.subTotal,
      tax: this.tax,
      paymentAmount: this.grandTotal,
      action: this.planContext.mode,
      email: this.billingDetails.email || this.userInfo.email,
      phone: this.billingDetails.phone || this.userInfo.contact
    };

    this.subscriptionService.legacyPurchase(payload).subscribe({
      next: (res) => {
        this.preOrderData = res;
        this.setPaymentLoaderProgress(55);
        setTimeout(() => void this.openRazorpay(res), 250);
      },
      error: (err) => {
        this.hidePaymentLoader();
        this.toastService.error(this.getApiErrorMessage(err, 'Failed to initiate purchase'));
      }
    });
  }

  private loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof Razorpay !== 'undefined') {
        resolve(true);
        return;
      }

      const existingScript = document.getElementById('razorpay-checkout-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true), { once: true });
        existingScript.addEventListener('error', () => resolve(false), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  async openRazorpay(orderData: any) {
    const amount = Number(orderData.amount ?? orderData.paymentAmount ?? 0);
    const key = String(orderData.razorpayKey || orderData.publishableKey || '').trim();
    const orderId = String(orderData.orderId || orderData.Rzr_orderId || '').trim();
    const status = orderData.status === true || orderData.status === 'true' || orderData.status === 1 || orderData.status === '1';

    if (!status || !orderId) {
      this.hidePaymentLoader();
      this.toastService.error(orderData.message || 'Failed to initiate secure payment.');
      return;
    }

    if (!key) {
      this.hidePaymentLoader();
      this.toastService.error('Razorpay key is missing. Please set RAZORPAY_KEY_ID on the backend.');
      return;
    }

    if (!amount || amount <= 0) {
      this.hidePaymentLoader();
      this.toastService.error('Payment amount is invalid. Please refresh and try again.');
      return;
    }

    this.setPaymentLoaderProgress(70);
    const loaded = await this.loadRazorpayScript();
    if (!loaded || typeof Razorpay === 'undefined') {
      this.hidePaymentLoader();
      this.toastService.error('Payment gateway could not be loaded. Please check your connection and try again.');
      return;
    }
    this.setPaymentLoaderProgress(85);

    const options = {
      key,
      amount: amount > 0 && amount < 1000000 ? Math.round(amount * 100) : amount,
      currency: orderData.currency || 'INR',
      name: 'HRNexus Premium',
      description: 'Plan Upgrade/Purchase',
      image: this.getBrandLogoUrl(),
      order_id: orderId,
      handler: (response: any) => {
        this.showPaymentLoader(92);
        this.confirmPayment(response, orderData);
      },
      prefill: {
        name: this.userInfo.name,
        email: this.userInfo.email,
        contact: this.userInfo.contact || this.billingDetails.phone
      },
      theme: { color: '#059669' },
      modal: {
        ondismiss: () => {
          this.hidePaymentLoader();
          this.toastService.warning('Payment cancelled');
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
    setTimeout(() => this.hidePaymentLoader(), 300);
  }

  confirmPayment(response: any, orderData: any) {
    this.showPaymentLoader(92);
    const confirmPayload = {
      paymentRecordId: orderData.paymentRecordId,
      orderId: response.razorpay_order_id,
      paymentStatus: 'success',
      paymentRzrId: response.razorpay_payment_id,
      nouser: this.targetUsers,
      duration: this.durationInputValue,
      durationType: 'Months',
      action: this.planContext.mode
    };

    this.subscriptionService.legacyConfirm(confirmPayload).subscribe({
      next: (res) => {
        this.setPaymentLoaderProgress(100);
        setTimeout(() => {
          this.hidePaymentLoader();
          this.currentStep = 'PAYMENT_SUCCESS';
          this.toastService.success('Payment successful!');
        }, 350);
      },
      error: (err) => {
        this.hidePaymentLoader();
        this.toastService.error('Payment confirmation failed. Please contact support.');
      }
    });
  }

  continueToBilling() {
    this.currentStep = 'BILLING_DETAILS';
  }

  downloadReceipt() {
    // Logic to download receipt/preliminary invoice
    this.toastService.info('Downloading receipt...');
  }

  saveAndGenerateInvoice() {
    if (!this.billingDetails.companyName || !this.billingDetails.email) {
      this.toastService.error('Please fill in required fields');
      return;
    }
    
    this.isSubmitting = true;
    // Simulate API call for invoice generation
    setTimeout(() => {
      this.currentStep = 'INVOICE_VIEW';
      this.isSubmitting = false;
      this.toastService.success('Invoice generated and sent to your email.');
    }, 2000);
  }

  validateGST(gst: string) {
    if (!gst) return;
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gst)) {
      this.toastService.warning('Invalid GST format');
    }
  }

  performLoginRedirect() {
    this.router.navigate(['/auth/login']);
  }

  getCurrencySymbol() {
    return this.isINR ? '₹' : '$';
  }
}
