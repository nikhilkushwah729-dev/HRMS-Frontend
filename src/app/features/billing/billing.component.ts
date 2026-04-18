import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  SubscriptionService,
  BillingPlan,
  SubscriptionStatusPayload,
  LegacyBillingContext,
} from '../../core/services/subscription.service';
import { ToastService } from '../../core/services/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';

type BillingCycle = 'monthly' | 'yearly';
type BillingGateway = 'razorpay' | 'stripe';
type CheckoutStage = 'select' | 'review' | 'pay';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <div class="mx-auto max-w-[1600px] space-y-6 p-2">
      <section class="overflow-hidden rounded-md border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_30%),linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#ecfeff_100%)] shadow-sm">
        <div class="grid gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-8">
          <div class="space-y-5">
            <div class="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              <span class="h-2 w-2 rounded-full bg-cyan-500"></span>
              {{ t('billing.saasBilling') }}
            </div>
            <div>
              <h1 class="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{{ t('billing.title') }}</h1>
              <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{{ t('billing.subtitle') }}</p>
            </div>
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div class="rounded-md border border-white/80 bg-white/90 px-4 py-4 shadow-sm" *ngFor="let card of stats()">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ card.label }}</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ card.value }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ card.help }}</p>
              </div>
            </div>
          </div>
          <div class="space-y-4 rounded-md border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ t('billing.currentWorkspace') }}</p>
              <h2 class="mt-2 text-xl font-black text-slate-900">{{ currentWorkspacePlanName() }}</h2>
              <p class="mt-2 text-sm text-slate-500">{{ status()?.organization?.companyName || legacyContext()?.existingPlan?.orgName || t('billing.organization') }}</p>
            </div>
            <div class="rounded-md border px-4 py-4" [ngClass]="bannerTone()">
              <p class="text-xs font-semibold uppercase tracking-[0.18em]">{{ t('billing.subscriptionState') }}</p>
              <p class="mt-2 text-lg font-black">{{ humanStatus() }}</p>
              <p class="mt-2 text-sm">{{ statusNote() }}</p>
            </div>
            <div class="flex flex-wrap gap-3">
              <button type="button" (click)="selectedGateway.set('razorpay')" class="rounded-md border px-4 py-2 text-sm font-semibold transition" [ngClass]="selectedGateway() === 'razorpay' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'">Razorpay</button>
              <button type="button" (click)="selectedGateway.set('stripe')" class="rounded-md border px-4 py-2 text-sm font-semibold transition" [ngClass]="selectedGateway() === 'stripe' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'">Stripe</button>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ t('billing.upgradeJourney') }}</p>
            <h2 class="mt-1 text-lg font-black text-slate-900">{{ t('billing.upgradeJourneySubtitle') }}</h2>
          </div>
          <div class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-md border px-4 py-3" [ngClass]="checkoutStage() === 'select' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-600'">
              <p class="text-[10px] font-black uppercase tracking-[0.18em]">Step 1</p>
              <p class="mt-1 text-sm font-semibold">{{ t('billing.selectPlan') }}</p>
            </div>
            <div class="rounded-md border px-4 py-3" [ngClass]="checkoutStage() === 'review' ? 'border-cyan-600 bg-cyan-50 text-cyan-700' : 'border-slate-200 bg-slate-50 text-slate-600'">
              <p class="text-[10px] font-black uppercase tracking-[0.18em]">Step 2</p>
              <p class="mt-1 text-sm font-semibold">{{ t('billing.reviewCheckout') }}</p>
            </div>
            <div class="rounded-md border px-4 py-3" [ngClass]="checkoutStage() === 'pay' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'">
              <p class="text-[10px] font-black uppercase tracking-[0.18em]">Step 3</p>
              <p class="mt-1 text-sm font-semibold">{{ t('billing.payActivate') }}</p>
            </div>
          </div>
        </div>
      </section>

      <section *ngIf="focusedAddonLabel()" class="rounded-md border border-amber-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_55%,#fef3c7_100%)] px-5 py-5 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="max-w-3xl">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Add-on Upgrade Flow</p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">{{ focusedAddonLabel() }} is ready for activation</h2>
            <p class="mt-3 text-sm leading-6 text-slate-600">
              You opened billing from the self-service add-on card. We have already highlighted this module in the checkout journey so you can continue without searching again.
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <button type="button" (click)="checkoutStage.set('review')" class="rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Review {{ focusedAddonLabel() }}
            </button>
            <button type="button" (click)="clearAddonFocus()" class="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Clear Focus
            </button>
          </div>
        </div>
      </section>

      <section *ngIf="legacyContext()" class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article class="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Real API Scenario</p>
              <h2 class="mt-2 text-2xl font-black text-slate-900">{{ legacyContext()!.suggestedAction }} payment workflow</h2>
            </div>
            <span class="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]" [ngClass]="legacyContext()!.suggestedAction === 'Buy' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'">
              {{ legacyContext()!.suggestedAction }}
            </span>
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Plan window</p>
              <p class="mt-2 text-sm font-bold text-slate-900">{{ legacyContext()!.existingPlan.startDate || 'N/A' }} to {{ legacyContext()!.existingPlan.endDate || 'N/A' }}</p>
            </div>
            <div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">User limit</p>
              <p class="mt-2 text-sm font-bold text-slate-900">{{ legacyContext()!.existingPlan.userlimit || 0 }}</p>
            </div>
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <label class="space-y-2 text-sm font-semibold text-slate-700">
              <span>Billing Contact Name</span>
              <input [value]="contactName()" (input)="contactName.set(($any($event.target)).value)" class="w-full rounded-md border border-slate-200 px-3 py-2.5 outline-none transition focus:border-cyan-300" placeholder="hari singh delhi">
            </label>
            <label class="space-y-2 text-sm font-semibold text-slate-700">
              <span>State</span>
              <select [value]="stateCode()" (change)="stateCode.set(($any($event.target)).value)" class="w-full rounded-md border border-slate-200 px-3 py-2.5 outline-none transition focus:border-cyan-300">
                <option value="">Select state</option>
                <option *ngFor="let state of legacyContext()!.states" [value]="state.code">{{ state.name }}</option>
              </select>
            </label>
            <label class="space-y-2 text-sm font-semibold text-slate-700">
              <span>No. of Users</span>
              <input type="number" [value]="nouser()" (input)="updateNouser(($any($event.target)).value)" class="w-full rounded-md border border-slate-200 px-3 py-2.5 outline-none transition focus:border-cyan-300" placeholder="0">
            </label>
            <label class="space-y-2 text-sm font-semibold text-slate-700">
              <span>GSTIN</span>
              <input [value]="gstin()" (input)="gstin.set(($any($event.target)).value)" class="w-full rounded-md border border-slate-200 px-3 py-2.5 outline-none transition focus:border-cyan-300" placeholder="Optional">
            </label>
            <label class="space-y-2 text-sm font-semibold text-slate-700">
              <span>Duration</span>
              <input type="number" min="1" [value]="duration()" (input)="updateDuration(($any($event.target)).value)" class="w-full rounded-md border border-slate-200 px-3 py-2.5 outline-none transition focus:border-cyan-300" placeholder="1">
            </label>
            <label class="space-y-2 text-sm font-semibold text-slate-700">
              <span>Duration Type</span>
              <select [value]="durationType()" (change)="durationType.set(($any($event.target)).value)" class="w-full rounded-md border border-slate-200 px-3 py-2.5 outline-none transition focus:border-cyan-300">
                <option value="Years">Years</option>
                <option value="Months">Months</option>
              </select>
            </label>
          </div>

          <div class="mt-4 rounded-md border border-cyan-100 bg-cyan-50 px-4 py-4 text-sm text-cyan-800">
            {{ pricingEstimateNote() }}
          </div>

          <div class="mt-6">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Add-ons</p>
                <h3 class="mt-1 text-lg font-black text-slate-900">Select modules for {{ legacyContext()!.suggestedAction.toLowerCase() }}</h3>
              </div>
              <span class="text-sm font-bold text-slate-900">Base {{ legacyContext()!.basePlanAmount | currency:'INR':'symbol':'1.0-0' }}</span>
            </div>
            <div class="mt-4 grid gap-3 md:grid-cols-2">
              <label *ngFor="let addon of legacyContext()!.addonCatalog" class="flex items-start gap-3 rounded-md border border-slate-200 px-4 py-4 transition hover:border-cyan-200 hover:bg-cyan-50/40">
                <input type="checkbox" [checked]="addonSelected(addon.name)" (change)="toggleAddon(addon.name, ($any($event.target)).checked)" class="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600">
                <span class="min-w-0 flex-1">
                  <span class="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">
                    <span>{{ addon.name }}</span>
                    <span *ngIf="normalizeAddonKey(addon.name) === normalizeAddonKey(focusedAddonLabel())" class="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                      Focused
                    </span>
                  </span>
                  <span class="mt-1 block text-xs text-slate-500">{{ effectiveAddonPrice(addon) | currency:'INR':'symbol':'1.0-0' }} estimated amount</span>
                  <span class="mt-1 block text-[11px] text-slate-400">Legacy source price: {{ addon.price | currency:'INR':'symbol':'1.0-0' }}</span>
                </span>
              </label>
            </div>
          </div>

          <div class="mt-6 flex flex-wrap gap-3">
            <button type="button" (click)="startLegacyPurchase()" [disabled]="processing()" class="rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
              {{ processing() ? 'Processing...' : legacyContext()!.suggestedAction + ' with ' + (selectedGateway() === 'razorpay' ? 'Razorpay' : 'Stripe') }}
            </button>
            <button type="button" *ngIf="pendingLegacyOrderId()" (click)="confirmLegacyPayment()" [disabled]="processing()" class="rounded-md border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50">
              Mark Payment Success
            </button>
          </div>
        </article>

        <article class="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Scenario Summary</p>
          <h2 class="mt-2 text-2xl font-black text-slate-900">API-aligned totals</h2>
          <div class="mt-6 space-y-3">
            <div class="grid gap-3 sm:grid-cols-3">
              <div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Users</p>
                <p class="mt-2 text-lg font-black text-slate-900">{{ billableUsers() }}</p>
              </div>
              <div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Duration</p>
                <p class="mt-2 text-lg font-black text-slate-900">{{ duration() }} {{ durationType() }}</p>
              </div>
              <div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mode</p>
                <p class="mt-2 text-lg font-black text-slate-900">{{ legacyContext()!.suggestedAction }}</p>
              </div>
            </div>
            <div class="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
              <span class="text-sm text-slate-600">Base plan amount</span>
              <span class="text-sm font-black text-slate-900">{{ legacyContext()!.basePlanAmount | currency:'INR':'symbol':'1.0-0' }}</span>
            </div>
            <div class="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
              <span class="text-sm text-slate-600">Selected add-ons</span>
              <span class="text-sm font-black text-slate-900">{{ selectedAddonAmount() | currency:'INR':'symbol':'1.0-0' }}</span>
            </div>
            <div class="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
              <span class="text-sm text-slate-600">Tax (18%)</span>
              <span class="text-sm font-black text-slate-900">{{ legacyTax() | currency:'INR':'symbol':'1.0-0' }}</span>
            </div>
            <div class="flex items-center justify-between gap-3 rounded-md border border-slate-900 bg-slate-900 px-4 py-4">
              <span class="text-sm font-semibold text-slate-200">Invoice total</span>
              <span class="text-lg font-black text-white">{{ legacyTotalWithTax() | currency:'INR':'symbol':'1.0-0' }}</span>
            </div>
            <div class="rounded-md border border-cyan-100 bg-cyan-50 px-4 py-4 text-sm text-cyan-800" *ngIf="legacyContext()!.pricingMatrix">
              User pricing tiers loaded for upgrade scenario and available for extension.
            </div>
            <div class="rounded-md border border-slate-200 px-4 py-4" *ngIf="pendingLegacyOrderId()">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pending order</p>
              <p class="mt-2 break-all text-sm font-bold text-slate-900">{{ pendingLegacyOrderId() }}</p>
              <p class="mt-1 text-xs text-slate-500">If checkout completes outside the popup, you can still confirm the payment from this screen.</p>
            </div>
            <div class="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-800" *ngIf="generatedInvoice()">
              Invoice generated successfully: {{ generatedInvoice()?.invoicedata?.invoice || 'available' }}
            </div>
          </div>
        </article>
      </section>

      <section *ngIf="generatedInvoice()?.invoicedata" class="billing-print-shell rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Invoice Preview</p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">{{ generatedInvoice()!.invoicedata.invoice }}</h2>
            <p class="mt-2 text-sm text-slate-500">{{ generatedInvoice()!.invoicedata.text_head }}</p>
          </div>
          <div class="flex flex-wrap gap-3">
            <button type="button" (click)="downloadInvoiceJson()" class="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Download JSON
            </button>
            <button type="button" (click)="printInvoice()" class="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Print Invoice
            </button>
          </div>
        </div>

        <div class="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div class="space-y-4">
            <div class="rounded-md border border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_55%,#ecfeff_100%)] px-4 py-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Billed To</p>
              <p class="mt-2 text-sm font-bold text-slate-900">{{ generatedInvoice()!.invoicedata.org_name }}</p>
              <p class="mt-1 text-sm text-slate-600">{{ generatedInvoice()!.invoicedata.cname }}</p>
              <p class="mt-1 text-sm text-slate-600">{{ generatedInvoice()!.invoicedata.email }}</p>
              <div class="mt-4 grid gap-3 sm:grid-cols-2">
                <div class="rounded-md border border-slate-200 bg-white px-3 py-3">
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Invoice ID</p>
                  <p class="mt-1 text-sm font-bold text-slate-900">{{ generatedInvoice()!.invoicedata.invoice }}</p>
                </div>
                <div class="rounded-md border border-slate-200 bg-white px-3 py-3">
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">State Code</p>
                  <p class="mt-1 text-sm font-bold text-slate-900">{{ generatedInvoice()!.invoicedata.state_code || 'N/A' }}</p>
                </div>
              </div>
            </div>
            <div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Narration</p>
              <pre class="mt-3 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-700">{{ generatedInvoice()!.invoicedata.narration }}</pre>
            </div>
          </div>

          <div class="space-y-4">
            <div class="rounded-md border border-slate-200 px-4 py-4">
              <div class="flex items-center justify-between gap-3 py-2">
                <span class="text-sm text-slate-600">Base amount</span>
                <span class="text-sm font-bold text-slate-900">{{ generatedInvoice()!.invoicedata.total_baseamt | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
              <div class="flex items-center justify-between gap-3 py-2">
                <span class="text-sm text-slate-600">Add-ons</span>
                <span class="text-sm font-bold text-slate-900">{{ invoiceAddonTotal() | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
              <div class="flex items-center justify-between gap-3 py-2">
                <span class="text-sm text-slate-600">IGST</span>
                <span class="text-sm font-bold text-slate-900">{{ generatedInvoice()!.invoicedata.IGST | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
              <div class="mt-3 flex items-center justify-between gap-3 rounded-md bg-slate-900 px-4 py-4">
                <span class="text-sm font-semibold text-slate-200">Invoice total</span>
                <span class="text-lg font-black text-white">{{ generatedInvoice()!.invoicedata.total | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
            </div>

            <div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Included add-ons</p>
              <pre class="mt-3 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-700">{{ generatedInvoice()!.invoicedata.addonshtml }}</pre>
            </div>
          </div>
        </div>
      </section>

      <section class="flex flex-wrap items-center justify-between gap-4 rounded-md border border-slate-200 bg-white px-4 py-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Billing cycle</p>
          <h2 class="mt-1 text-lg font-black text-slate-900">Compare internal SaaS plans</h2>
        </div>
        <div class="flex gap-3">
          <button type="button" (click)="billingCycle.set('monthly')" class="rounded-md border px-4 py-2 text-sm font-semibold transition" [ngClass]="billingCycle() === 'monthly' ? 'border-cyan-200 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'">Monthly</button>
          <button type="button" (click)="billingCycle.set('yearly')" class="rounded-md border px-4 py-2 text-sm font-semibold transition" [ngClass]="billingCycle() === 'yearly' ? 'border-cyan-200 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'">Yearly</button>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <article class="rounded-md border bg-white p-6 shadow-sm transition" *ngFor="let plan of plans()" [ngClass]="selectedPlanId() === plan.id ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-200 hover:border-slate-300'" (click)="selectPlan(plan)">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ plan.slug }}</p>
              <h2 class="mt-2 text-2xl font-black text-slate-900">{{ plan.name }}</h2>
            </div>
            <div class="flex flex-col items-end gap-2">
              <span class="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]" [ngClass]="status()?.plan?.id === plan.id ? 'bg-emerald-100 text-emerald-700' : selectedPlanId() === plan.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'">
                {{ status()?.plan?.id === plan.id ? 'Current' : selectedPlanId() === plan.id ? 'Selected' : 'Available' }}
              </span>
              <span *ngIf="plan.slug === recommendedPlanSlug()" class="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                Recommended
              </span>
            </div>
          </div>
          <p class="mt-4 text-4xl font-black tracking-tight text-slate-900">{{ planPrice(plan) | currency:plan.currency:'symbol':'1.0-0' }}</p>
          <p class="mt-1 text-sm text-slate-500">per {{ billingCycle() === 'yearly' ? 'year' : 'month' }}</p>
          <p class="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
            {{ plan.slug === 'trial' ? 'Trial-only reference plan for onboarding.' : planPitch(plan) }}
          </p>
          <div class="mt-5 space-y-3 text-sm text-slate-600">
            <div class="flex items-center justify-between gap-3">
              <span>User limit</span>
              <span class="font-bold text-slate-900">{{ plan.userLimit }}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span>Storage</span>
              <span class="font-bold text-slate-900">{{ plan.storageLimitMb }} MB</span>
            </div>
            <div class="pt-2">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Modules</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700" *ngFor="let module of plan.modules">{{ module }}</span>
              </div>
            </div>
          </div>
          <div class="mt-6 space-y-2">
            <div class="flex items-center justify-between gap-3 text-xs text-slate-500" *ngFor="let limit of plan.limits">
              <span>{{ limit.label }}</span>
              <span class="font-bold text-slate-700">{{ limit.enabled ? (limit.value || 'Enabled') : 'Not included' }}</span>
            </div>
          </div>
          <button type="button" (click)="openCheckoutModal(plan); $event.stopPropagation()" [disabled]="!canStartPlanAction(plan)" class="mt-6 w-full rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
            {{ planActionLabel(plan) }}
          </button>
        </article>
        </div>

        <aside class="rounded-md border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-4 xl:h-fit">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Plan Checkout</p>
          <h2 class="mt-2 text-2xl font-black text-slate-900">{{ selectedPlan()?.name || 'Select a plan' }}</h2>
          <p class="mt-2 text-sm leading-6 text-slate-500">{{ selectedPlan() ? planPitch(selectedPlan()!) : 'Choose a plan card to see billing summary and checkout guidance.' }}</p>

          <div class="mt-6 space-y-3" *ngIf="selectedPlan() as plan">
            <div class="rounded-md border border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_55%,#ecfeff_100%)] px-4 py-4">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-semibold text-slate-600">Checkout stage</span>
                <span class="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]" [ngClass]="checkoutStage() === 'select' ? 'bg-slate-900 text-white' : checkoutStage() === 'review' ? 'bg-cyan-100 text-cyan-700' : 'bg-emerald-100 text-emerald-700'">
                  {{ checkoutStage() }}
                </span>
              </div>
              <p class="mt-2 text-xs text-slate-500">{{ checkoutStageMessage() }}</p>
            </div>
            <div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm text-slate-600">Plan price</span>
                <span class="text-lg font-black text-slate-900">{{ planPrice(plan) | currency:plan.currency:'symbol':'1.0-0' }}</span>
              </div>
              <p class="mt-2 text-xs text-slate-500">Billed {{ billingCycle() === 'yearly' ? 'annually' : 'monthly' }} via {{ selectedGateway() | titlecase }}</p>
            </div>
            <div class="rounded-md border border-slate-200 px-4 py-4">
              <div class="flex items-center justify-between gap-3 py-2">
                <span class="text-sm text-slate-600">Included users</span>
                <span class="text-sm font-bold text-slate-900">{{ plan.userLimit }}</span>
              </div>
              <div class="flex items-center justify-between gap-3 py-2">
                <span class="text-sm text-slate-600">Storage</span>
                <span class="text-sm font-bold text-slate-900">{{ plan.storageLimitMb }} MB</span>
              </div>
              <div class="flex items-center justify-between gap-3 py-2">
                <span class="text-sm text-slate-600">Modules</span>
                <span class="text-sm font-bold text-slate-900">{{ plan.modules.length }}</span>
              </div>
            </div>
            <div class="rounded-md border border-slate-200 px-4 py-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">What happens next</p>
              <div class="mt-3 space-y-2 text-sm text-slate-600">
                <div class="flex items-start gap-2">
                  <span class="mt-1 h-2 w-2 rounded-full bg-slate-300"></span>
                  <span>Plan intent is created for {{ plan.name }}.</span>
                </div>
                <div class="flex items-start gap-2">
                  <span class="mt-1 h-2 w-2 rounded-full bg-cyan-400"></span>
                  <span>{{ selectedGateway() === 'razorpay' ? 'Razorpay checkout opens when keys are configured.' : 'Stripe-ready flow can continue from the generated payment intent.' }}</span>
                </div>
                <div class="flex items-start gap-2">
                  <span class="mt-1 h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span>Successful payment updates subscription, access, and billing history.</span>
                </div>
              </div>
            </div>
            <div class="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
              Secure checkout starts after clicking the CTA below. Simulation mode auto-verifies when live gateway secrets are not configured.
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <button type="button" (click)="checkoutStage.set('review')" [disabled]="processing()" class="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
                Review Details
              </button>
              <button type="button" (click)="openCheckoutModal(plan)" [disabled]="!canStartPlanAction(plan)" class="rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                Continue to Checkout
              </button>
            </div>
            <button type="button" *ngIf="pendingLegacyOrderId()" (click)="checkoutStage.set('pay')" class="w-full rounded-md border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
              Continue Payment Review
            </button>
            <button type="button" *ngIf="selectedGateway() === 'stripe' && !processing() && !plan.isTrialPlan && status()?.plan?.id !== plan.id" (click)="upgrade(plan)" class="w-full rounded-md border border-cyan-200 px-4 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50">
              Generate Stripe Payment Intent
            </button>
            <p class="text-xs text-slate-500">{{ status()?.plan?.id === plan.id ? 'This plan is already active for the workspace.' : 'You can change billing cycle before confirming the upgrade.' }}</p>
          </div>
        </aside>
      </section>

      <section class="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <article class="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Trial & access</p>
          <h2 class="mt-2 text-2xl font-black text-slate-900">Countdown and policy</h2>
          <div class="mt-6 space-y-3">
            <div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Trial end date</p>
              <p class="mt-2 text-lg font-black text-slate-900">{{ status()?.organization?.trialEndDate ? (status()!.organization.trialEndDate | date:'dd MMM yyyy') : 'N/A' }}</p>
            </div>
            <div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Read only mode</p>
              <p class="mt-2 text-lg font-black text-slate-900">{{ status()?.organization?.readOnlyMode ? 'Enabled' : 'Disabled' }}</p>
            </div>
            <div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Grace period</p>
              <p class="mt-2 text-lg font-black text-slate-900">{{ status()?.organization?.gracePeriodEndDate ? (status()!.organization.gracePeriodEndDate | date:'dd MMM yyyy') : 'No grace window' }}</p>
            </div>
          </div>
        </article>

        <article class="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Billing history</p>
          <h2 class="mt-2 text-2xl font-black text-slate-900">Transactions</h2>
          <div class="mt-6 space-y-3" *ngIf="status()?.billingHistory?.length; else noHistory">
            <div class="rounded-md border border-slate-200 px-4 py-4" *ngFor="let item of status()?.billingHistory">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-bold text-slate-900">{{ item.amount | currency:item.currency:'symbol':'1.0-0' }}</p>
                  <p class="mt-1 text-xs text-slate-500">{{ item.gateway || 'Gateway' }} | {{ item.billingCycle || 'cycle' }}</p>
                </div>
                <span class="rounded-full px-3 py-1 text-xs font-semibold" [ngClass]="paymentTone(item.status)">{{ item.status }}</span>
              </div>
              <p class="mt-2 text-xs text-slate-500">{{ item.createdAt | date:'dd MMM yyyy, hh:mm a' }}</p>
            </div>
          </div>
          <ng-template #noHistory>
            <div class="mt-6 rounded-md border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">No billing history yet. Your first successful upgrade will appear here.</div>
          </ng-template>
        </article>
      </section>

      <div *ngIf="checkoutModalOpen()" class="fixed inset-0 z-[80] bg-slate-950/45 backdrop-blur-sm" (click)="closeCheckoutModal()"></div>
      <section *ngIf="checkoutModalOpen() && selectedPlan() as plan" class="fixed inset-x-3 top-4 z-[81] mx-auto max-w-4xl overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl">
        <div class="grid max-h-[88vh] gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div class="overflow-y-auto bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 sm:p-6">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Upgrade Checkout</p>
                <h2 class="mt-2 text-2xl font-black text-slate-900">{{ plan.name }}</h2>
                <p class="mt-2 text-sm leading-6 text-slate-500">{{ checkoutStageMessage() }}</p>
              </div>
              <button type="button" (click)="closeCheckoutModal()" class="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                Close
              </button>
            </div>

            <div class="mt-6 grid gap-3 sm:grid-cols-3">
              <div class="rounded-2xl border px-4 py-4" [ngClass]="checkoutStage() === 'select' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'">
                <div class="flex items-center gap-3">
                  <span class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black" [ngClass]="checkoutStage() === 'select' ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700'">1</span>
                  <div>
                    <p class="text-[10px] font-black uppercase tracking-[0.18em]">Step 1</p>
                    <p class="mt-1 text-sm font-semibold">Select</p>
                  </div>
                </div>
              </div>
              <div class="rounded-2xl border px-4 py-4" [ngClass]="checkoutStage() === 'review' ? 'border-cyan-600 bg-cyan-50 text-cyan-700' : 'border-slate-200 bg-white text-slate-600'">
                <div class="flex items-center gap-3">
                  <span class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black" [ngClass]="checkoutStage() === 'review' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-700'">2</span>
                  <div>
                    <p class="text-[10px] font-black uppercase tracking-[0.18em]">Step 2</p>
                    <p class="mt-1 text-sm font-semibold">Review</p>
                  </div>
                </div>
              </div>
              <div class="rounded-2xl border px-4 py-4" [ngClass]="checkoutStage() === 'pay' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'">
                <div class="flex items-center gap-3">
                  <span class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black" [ngClass]="checkoutStage() === 'pay' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'">3</span>
                  <div>
                    <p class="text-[10px] font-black uppercase tracking-[0.18em]">Step 3</p>
                    <p class="mt-1 text-sm font-semibold">Pay</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 space-y-4">
              <div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace Plan</p>
                <div class="mt-3 flex items-center justify-between gap-3">
                  <span class="text-sm text-slate-600">Selected plan</span>
                  <span class="text-sm font-black text-slate-900">{{ plan.name }}</span>
                </div>
                <div class="mt-2 flex items-center justify-between gap-3">
                  <span class="text-sm text-slate-600">Billing cycle</span>
                  <span class="text-sm font-black text-slate-900">{{ billingCycle() | titlecase }}</span>
                </div>
                <div class="mt-2 flex items-center justify-between gap-3">
                  <span class="text-sm text-slate-600">Gateway</span>
                  <span class="text-sm font-black text-slate-900">{{ selectedGateway() | titlecase }}</span>
                </div>
              </div>

              <div class="rounded-md border border-slate-200 px-4 py-4">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Included Modules</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700" *ngFor="let module of plan.modules">{{ module }}</span>
                </div>
              </div>

              <div class="rounded-md border border-cyan-100 bg-cyan-50 px-4 py-4 text-sm text-cyan-800" *ngIf="checkoutStage() !== 'pay'">
                Review this plan, then continue to payment. If live keys are not configured, simulation mode will still activate the plan safely for testing.
              </div>

              <div class="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-800" *ngIf="checkoutStage() === 'pay'">
                Payment flow is ready. For Razorpay, checkout opens automatically when publishable keys are available.
              </div>
            </div>
          </div>

          <aside class="border-t border-slate-200 bg-slate-50 p-5 sm:p-6 lg:border-l lg:border-t-0">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Order Summary</p>
            <h3 class="mt-2 text-xl font-black text-slate-900">{{ plan.name }}</h3>

            <div class="mt-5 space-y-3">
              <div class="rounded-md border border-slate-200 bg-white px-4 py-4">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm text-slate-600">Plan price</span>
                  <span class="text-lg font-black text-slate-900">{{ planPrice(plan) | currency:plan.currency:'symbol':'1.0-0' }}</span>
                </div>
                <div class="mt-2 flex items-center justify-between gap-3">
                  <span class="text-sm text-slate-600">User limit</span>
                  <span class="text-sm font-bold text-slate-900">{{ plan.userLimit }}</span>
                </div>
                <div class="mt-2 flex items-center justify-between gap-3">
                  <span class="text-sm text-slate-600">Storage</span>
                  <span class="text-sm font-bold text-slate-900">{{ plan.storageLimitMb }} MB</span>
                </div>
              </div>

              <div class="rounded-md border border-slate-200 bg-white px-4 py-4">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Checkout actions</p>
                <div class="mt-4 grid gap-3">
                  <button type="button" (click)="checkoutStage.set('review')" [disabled]="processing()" class="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
                    Review Details
                  </button>
                  <button type="button" (click)="upgrade(plan)" [disabled]="!canStartPlanAction(plan)" class="rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                    {{ checkoutStage() === 'pay' ? 'Pay & Activate' : 'Start Secure Payment' }}
                  </button>
                </div>
              </div>

              <p class="text-xs leading-5 text-slate-500">
                Payment success updates subscription, feature access, and billing history automatically.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section *ngIf="paymentSuccessOpen()" class="fixed inset-0 z-[82] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
        <div class="w-full max-w-md rounded-[24px] border border-emerald-100 bg-white p-6 text-center shadow-2xl">
          <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
              <span class="text-2xl font-black">✓</span>
            </div>
          </div>
          <h2 class="mt-5 text-2xl font-black text-slate-900">Payment Successful</h2>
          <p class="mt-2 text-sm leading-6 text-slate-500">Your workspace subscription has been updated and the selected plan is now active.</p>
          <div class="mt-6 grid gap-3 sm:grid-cols-2">
            <div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-4 text-left">
              <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Activated Plan</p>
              <p class="mt-1 text-sm font-bold text-slate-900">{{ status()?.plan?.name || selectedPlan()?.name || 'Updated Plan' }}</p>
            </div>
            <div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-4 text-left">
              <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Billing Gateway</p>
              <p class="mt-1 text-sm font-bold text-slate-900">{{ selectedGateway() | titlecase }}</p>
            </div>
          </div>
          <div class="mt-6 grid gap-3">
            <button type="button" (click)="closePaymentSuccess()" class="rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
              Continue
            </button>
            <button type="button" *ngIf="generatedInvoice()?.invoicedata" (click)="printInvoice()" class="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Print Invoice
            </button>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    @media print {
      body {
        background: white !important;
      }

      button,
      .fixed,
      .shadow-sm,
      .shadow-2xl {
        box-shadow: none !important;
      }

      section:not(.billing-print-shell),
      .fixed,
      .rounded-md button {
        display: none !important;
      }

      app-root > *:not(.billing-print-shell) {
        display: none !important;
      }

      .billing-print-shell {
        display: block !important;
        border: 0 !important;
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
        background: white !important;
      }

      .billing-print-shell * {
        color: #0f172a !important;
      }

      .billing-print-shell pre {
        white-space: pre-wrap !important;
      }
    }
  `],
})
export class BillingComponent implements OnInit {
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly languageService = inject(LanguageService);

  plans = signal<BillingPlan[]>([]);
  status = signal<SubscriptionStatusPayload | null>(null);
  legacyContext = signal<LegacyBillingContext | null>(null);
  generatedInvoice = signal<any | null>(null);
  processing = signal(false);
  activePlanActionId = signal<number | null>(null);
  selectedPlanId = signal<number | null>(null);
  checkoutStage = signal<CheckoutStage>('select');
  checkoutModalOpen = signal(false);
  paymentSuccessOpen = signal(false);
  billingCycle = signal<BillingCycle>('monthly');
  selectedGateway = signal<BillingGateway>('razorpay');
  nouser = signal(0);
  duration = signal(1);
  durationType = signal<'Months' | 'Years'>('Years');
  contactName = signal('');
  stateCode = signal('');
  gstin = signal('');
  selectedAddons = signal<Record<string, boolean>>({});
  pendingLegacyPaymentRecordId = signal<number | null>(null);
  pendingLegacyOrderId = signal<string>('');
  focusedAddon = signal<string>('');
  billingSource = signal<string>('');
  requestedMode = signal<string>('');

  stats = computed(() => {
    const status = this.status();
    return [
      { label: 'Plan', value: status?.plan?.name || (this.legacyContext()?.suggestedAction === 'Buy' ? 'Trial' : 'Active'), help: 'Current assigned subscription' },
      { label: 'Trial Days', value: status?.trialDaysRemaining ?? 0, help: 'Remaining before expiry' },
      { label: 'Read Only', value: status?.organization?.readOnlyMode ? 'Yes' : 'No', help: 'Workspace restriction state' },
      { label: 'Invoices', value: status?.billingHistory?.length ?? 0, help: 'Recorded payment attempts' },
    ];
  });

  selectedPlan = computed(() => {
    const planId = this.selectedPlanId();
    return this.plans().find((plan) => plan.id === planId) ?? null;
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.focusedAddon.set(params.get('addon') || '');
      this.billingSource.set(params.get('source') || '');
      this.requestedMode.set(params.get('mode') || '');
    });
    this.loadAll();
  }

  loadAll(): void {
    this.subscriptionService.getPlans().subscribe({
      next: (plans) => {
        const normalizedPlans = plans || [];
        this.plans.set(normalizedPlans);
        if (!this.selectedPlanId()) {
          const preferredPlan = normalizedPlans.find((plan) => !plan.isTrialPlan && plan.slug === 'pro')
            || normalizedPlans.find((plan) => !plan.isTrialPlan)
            || normalizedPlans[0]
            || null;
          this.selectedPlanId.set(preferredPlan?.id ?? null);
        }

        const selectedPlan = normalizedPlans.find((plan) => plan.id === this.selectedPlanId()) ?? null;
        if (this.requestedMode() === 'upgrade' && selectedPlan && !selectedPlan.isTrialPlan) {
          this.checkoutStage.set('review');
          this.checkoutModalOpen.set(true);
        }
      }
    });
    this.subscriptionService.getStatus().subscribe({ next: (status) => this.status.set(status) });
    this.subscriptionService.getLegacyContext().subscribe({
      next: (context) => {
        this.legacyContext.set(context);
        this.contactName.set(context.existingPlan.orgName || this.status()?.organization?.companyName || '');
        this.gstin.set(context.existingPlan.gstin || '');
        this.nouser.set(Math.max(0, Number(context.existingPlan.userlimit || 0)));
        const preselected: Record<string, boolean> = {};
        (context.addonCatalog || []).forEach((addon) => {
          preselected[addon.name] = addon.status === '1';
        });
        const matchedAddon = this.findAddonName(context, this.focusedAddon());
        if (matchedAddon) {
          preselected[matchedAddon] = true;
          this.checkoutStage.set('review');
        }
        this.selectedAddons.set(preselected);
      },
      error: () => this.legacyContext.set(null),
    });
  }

  planPrice(plan: BillingPlan): number {
    return this.billingCycle() === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  }

  selectPlan(plan: BillingPlan): void {
    this.selectedPlanId.set(plan.id);
    this.checkoutStage.set('select');
    this.checkoutModalOpen.set(false);
  }

  recommendedPlanSlug(): string {
    return 'pro';
  }

  planPitch(plan: BillingPlan): string {
    if (plan.slug === 'basic') return 'For growing teams that need attendance and core ESS workflows.';
    if (plan.slug === 'pro') return 'Best fit for HR teams that need payroll, visit management, and full operations coverage.';
    if (plan.slug === 'enterprise') return 'For scaled organizations that need higher capacity and enterprise controls.';
    return 'Flexible access for onboarding and workspace evaluation.';
  }

  planActionLabel(plan: BillingPlan): string {
    if (this.status()?.plan?.id === plan.id) return 'Current plan';
    if (this.activePlanActionId() === plan.id && this.processing()) return 'Processing...';
    if (plan.isTrialPlan) return 'Trial reference';
    return this.status()?.organization?.isTrialActive ? `Upgrade to ${plan.name}` : `Choose ${plan.name}`;
  }

  canStartPlanAction(plan: BillingPlan): boolean {
    return !this.processing() && !plan.isTrialPlan && this.status()?.plan?.id !== plan.id;
  }

  checkoutStageMessage(): string {
    if (this.checkoutStage() === 'select') {
      return 'Pick the right subscription plan and billing cycle for your workspace.';
    }
    if (this.checkoutStage() === 'review') {
      return 'Review plan pricing, limits, and checkout details before continuing to payment.';
    }
    return 'Complete payment and activate the selected plan for the organization.';
  }

  openCheckoutModal(plan?: BillingPlan): void {
    if (plan && !this.canStartPlanAction(plan)) {
      if (plan.isTrialPlan) {
        this.toastService.info('Free trial is only a reference plan. Please choose Basic, Pro, or Enterprise.');
        return;
      }
      if (this.status()?.plan?.id === plan.id) {
        this.toastService.info(`${plan.name} is already active for this workspace.`);
        return;
      }
      if (this.processing()) {
        return;
      }
    }

    if (plan) {
      this.selectedPlanId.set(plan.id);
    }
    if (this.checkoutStage() === 'select') {
      this.checkoutStage.set('review');
    }
    this.checkoutModalOpen.set(true);
  }

  closeCheckoutModal(): void {
    if (this.processing()) return;
    this.checkoutModalOpen.set(false);
  }

  closePaymentSuccess(): void {
    this.paymentSuccessOpen.set(false);
    this.checkoutModalOpen.set(false);
    this.checkoutStage.set('select');
  }

  humanStatus(): string {
    const status = this.status()?.organization?.subscriptionStatus;
    if (status) {
      return status.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
    }
    const legacyStatus = this.legacyContext()?.existingPlan?.planStatus;
    return legacyStatus === 0 ? 'Trialing' : legacyStatus === 1 ? 'Active' : 'Inactive';
  }

  statusNote(): string {
    const status = this.status();
    if (status) {
      if (status.organization.isTrialActive) return `${status.trialDaysRemaining ?? 0} day(s) remaining in your free trial.`;
      if (status.organization.readOnlyMode) return 'Your workspace is currently read-only until an upgrade is completed.';
      return 'Your subscription is active and premium modules are available as per plan.';
    }
    if (this.legacyContext()) {
      return this.legacyContext()!.suggestedAction === 'Buy'
        ? 'Legacy API indicates the organization is still in trial and should use the Buy workflow.'
        : 'Legacy API indicates the organization already has an active plan and should use the Upgrade workflow.';
    }
    return 'Subscription status is loading.';
  }

  bannerTone(): string {
    const status = this.status()?.organization;
    if (status?.readOnlyMode || status?.subscriptionStatus === 'expired') return 'border-rose-200 bg-rose-50 text-rose-700';
    if (status?.isTrialActive || this.legacyContext()?.suggestedAction === 'Buy') return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  paymentTone(status: string): string {
    const map: Record<string, string> = {
      success: 'bg-emerald-50 text-emerald-700',
      pending: 'bg-amber-50 text-amber-700',
      failed: 'bg-rose-50 text-rose-700',
      refunded: 'bg-slate-100 text-slate-700',
      disputed: 'bg-violet-50 text-violet-700',
    };
    return map[status] || 'bg-slate-100 text-slate-700';
  }

  addonSelected(name: string): boolean {
    return Boolean(this.selectedAddons()[name]);
  }

  focusedAddonLabel(): string {
    const matchedAddon = this.findAddonName(this.legacyContext(), this.focusedAddon());
    return matchedAddon || this.prettyLabel(this.focusedAddon());
  }

  clearAddonFocus(): void {
    this.focusedAddon.set('');
    this.billingSource.set('');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { addon: null, source: null, mode: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private findAddonName(context: LegacyBillingContext | null, raw: string): string {
    if (!context || !raw) return '';
    const target = this.normalizeAddonKey(raw);
    const match = context.addonCatalog.find((addon) => this.normalizeAddonKey(addon.name) === target);
    return match?.name || '';
  }

  normalizeAddonKey(value: string): string {
    return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  private prettyLabel(value: string): string {
    return value
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim();
  }

  toggleAddon(name: string, checked: boolean): void {
    this.selectedAddons.update((state) => ({ ...state, [name]: checked }));
  }

  updateNouser(raw: string): void {
    const parsed = Number(raw);
    this.nouser.set(Number.isFinite(parsed) ? Math.max(0, parsed) : 0);
  }

  updateDuration(raw: string): void {
    const parsed = Number(raw);
    this.duration.set(Number.isFinite(parsed) ? Math.max(1, parsed) : 1);
  }

  billableUsers(): number {
    const configuredUsers = Number(this.legacyContext()?.existingPlan?.userlimit || 0);
    return Math.max(1, this.nouser() || configuredUsers || 1);
  }

  durationMonths(): number {
    return this.durationType() === 'Years' ? this.duration() * 12 : this.duration();
  }

  effectiveAddonPrice(addon: { name: string; price: string; status: string }): number {
    const rawPrice = Number(addon.price || 0);
    if (this.legacyContext()?.suggestedAction === 'Buy') {
      return Number((rawPrice * this.billableUsers() * this.durationMonths()).toFixed(2));
    }
    return Number(rawPrice.toFixed(2));
  }

  selectedAddonAmount(): number {
    const context = this.legacyContext();
    if (!context) return 0;
    return context.addonCatalog.reduce((sum, addon) => sum + (this.addonSelected(addon.name) ? this.effectiveAddonPrice(addon) : 0), 0);
  }

  legacySubtotal(): number {
    const context = this.legacyContext();
    return (context?.basePlanAmount || 0) + this.selectedAddonAmount();
  }

  legacyTax(): number {
    return Number((this.legacySubtotal() * 0.18).toFixed(2));
  }

  legacyTotalWithTax(): number {
    return Number((this.legacySubtotal() + this.legacyTax()).toFixed(2));
  }

  pricingEstimateNote(): string {
    if (this.legacyContext()?.suggestedAction === 'Buy') {
      return `Buy flow estimate is based on ${this.billableUsers()} user(s) x ${this.durationMonths()} month(s), which matches the sample legacy annual pricing pattern you shared.`;
    }
    if (this.legacyContext()?.pricingMatrix) {
      return 'Upgrade flow is using the paid addon catalog from the legacy API. User pricing tiers are loaded and can influence the final gateway-side total.';
    }
    return 'Totals are based on the current legacy addon catalog and will be finalized by the payment API response.';
  }

  invoiceAddonTotal(): number {
    const invoice = this.generatedInvoice()?.invoicedata;
    if (!invoice?.addonprice) return this.selectedAddonAmount();
    return String(invoice.addonprice)
      .split(/\r?\n/)
      .map((line) => Number((line || '').trim()))
      .filter((value) => Number.isFinite(value) && value > 0)
      .reduce((sum, value) => sum + value, 0);
  }

  startLegacyPurchase(): void {
    const context = this.legacyContext();
    if (!context) {
      this.toastService.error(this.t('billing.legacyContextMissing'));
      return;
    }
    if (!this.contactName().trim()) {
      this.toastService.warning('Billing contact name is required.');
      return;
    }
    if (!this.stateCode().trim()) {
      this.toastService.warning('Please select a state.');
      return;
    }

    this.processing.set(true);
    this.subscriptionService.legacyPurchase({
      nouser: this.nouser(),
      selectedAddons: Object.entries(this.selectedAddons()).map(([name, status]) => ({ name, status })),
      paymentMethod: this.selectedGateway() === 'razorpay' ? 'Razorpay' : 'Stripe',
      state: this.stateCode(),
      country: context.existingPlan.countryname || 'India',
      zip: context.existingPlan.zip || '',
      city: context.existingPlan.cityName || '',
      name: this.contactName(),
      duration: this.duration(),
      durationType: this.durationType(),
      gstin: this.gstin(),
      remark: 'Auto Mode',
      action: context.suggestedAction,
    }).subscribe({
      next: (result) => {
        this.pendingLegacyPaymentRecordId.set(result.paymentRecordId);
        this.pendingLegacyOrderId.set(result.orderId || '');
        if (this.selectedGateway() === 'razorpay' && result.orderId && result.publishableKey) {
          this.launchLegacyRazorpay(result);
          return;
        }
        this.toastService.success(result.message || this.t('billing.legacyPaymentStarted'));
        this.processing.set(false);
      },
      error: (error) => {
        this.toastService.error(error?.error?.message || this.t('billing.legacyPaymentStartFailed'));
        this.processing.set(false);
      },
    });
  }

  confirmLegacyPayment(): void {
    const context = this.legacyContext();
    const paymentRecordId = this.pendingLegacyPaymentRecordId();
    const orderId = this.pendingLegacyOrderId();
    if (!context || !paymentRecordId || !orderId) {
      this.toastService.warning('No pending legacy payment is available to confirm.');
      return;
    }

    this.processing.set(true);
    this.subscriptionService.legacyConfirm({
      paymentRecordId,
      orderId,
      paymentStatus: 'Success',
      paymentRzrId: `pay_${Date.now()}`,
      nouser: this.nouser(),
      duration: this.duration(),
      durationType: this.durationType(),
      action: context.suggestedAction,
    }).subscribe({
      next: (result) => {
        this.generatedInvoice.set(result.invoice);
        this.toastService.success(this.t('billing.legacyConfirmed'));
        this.pendingLegacyPaymentRecordId.set(null);
        this.pendingLegacyOrderId.set('');
        this.processing.set(false);
        this.loadAll();
      },
      error: (error) => {
        this.toastService.error(error?.error?.message || this.t('billing.legacyConfirmFailed'));
        this.processing.set(false);
      },
    });
  }

  upgrade(plan: BillingPlan): void {
    this.activePlanActionId.set(plan.id);
    this.checkoutStage.set('pay');
    this.checkoutModalOpen.set(true);
    this.processing.set(true);
    this.subscriptionService.createUpgradeIntent({
      planId: plan.id,
      billingCycle: this.billingCycle(),
      gateway: this.selectedGateway(),
    }).subscribe({
      next: (intent) => {
        if (intent?.simulation) {
          this.subscriptionService.verifyPayment({
            paymentId: intent.paymentId,
            gateway: this.selectedGateway(),
            providerPaymentId: `sim_${Date.now()}`,
            signature: 'simulation',
            status: 'success',
          }).subscribe({
            next: () => {
              this.toastService.success(`${plan.name} activated successfully in simulation mode.`);
              this.processing.set(false);
              this.activePlanActionId.set(null);
              this.checkoutStage.set('select');
              this.paymentSuccessOpen.set(true);
              this.loadAll();
            },
            error: () => {
              this.toastService.error(this.t('billing.paymentVerificationFailed'));
              this.processing.set(false);
              this.activePlanActionId.set(null);
              this.checkoutStage.set('review');
            },
          });
          return;
        }

        if (this.selectedGateway() === 'razorpay' && intent?.orderId && intent?.publishableKey) {
          this.launchInternalRazorpay(plan, intent);
          return;
        }

        this.toastService.info(`Payment intent created for ${plan.name}. Complete ${this.selectedGateway()} checkout using your configured gateway keys.`);
        this.processing.set(false);
        this.activePlanActionId.set(null);
        this.checkoutStage.set('review');
      },
      error: (error) => {
        this.toastService.error(error?.error?.message || this.t('billing.upgradeStartFailed'));
        this.processing.set(false);
        this.activePlanActionId.set(null);
        this.checkoutStage.set('review');
      },
    });
  }

  currentWorkspacePlanName(): string {
    if (this.status()?.plan?.name) return this.status()!.plan!.name;
    if (this.legacyContext()?.existingPlan?.planStatus === 0) return this.t('billing.trialPlan');
    if (this.legacyContext()?.existingPlan?.planStatus === 1) return this.t('billing.activePlan');
    return 'No active plan';
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    this.languageService.currentLanguage();
    return this.languageService.t(key, params);
  }

  printInvoice(): void {
    window.print();
  }

  downloadInvoiceJson(): void {
    const invoice = this.generatedInvoice();
    if (!invoice) {
      this.toastService.warning('No invoice is available to download.');
      return;
    }

    const blob = new Blob([JSON.stringify(invoice, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${invoice?.invoicedata?.invoice || 'invoice'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private launchLegacyRazorpay(result: any): void {
    const context = this.legacyContext();
    const RazorpayCtor = (window as any).Razorpay;
    if (!RazorpayCtor) {
      this.toastService.warning('Razorpay checkout SDK is not available. You can still confirm payment manually.');
      this.processing.set(false);
      return;
    }

    const instance = new RazorpayCtor({
      key: result.publishableKey,
      amount: Math.round(Number(result.paymentAmount || 0) * 100),
      currency: 'INR',
      name: context?.existingPlan?.orgName || 'HRNexus',
      description: `${context?.suggestedAction || 'Buy'} subscription`,
      order_id: result.orderId,
      handler: (response: any) => {
        this.subscriptionService.legacyConfirm({
          paymentRecordId: result.paymentRecordId,
          orderId: response.razorpay_order_id || result.orderId,
          paymentStatus: 'Success',
          paymentRzrId: response.razorpay_payment_id,
          nouser: this.nouser(),
          duration: this.duration(),
          durationType: this.durationType(),
          action: context?.suggestedAction || 'Buy',
        }).subscribe({
          next: (confirmResult) => {
            this.generatedInvoice.set(confirmResult.invoice);
            this.toastService.success('Razorpay payment captured and synced successfully.');
            this.pendingLegacyPaymentRecordId.set(null);
            this.pendingLegacyOrderId.set('');
            this.processing.set(false);
            this.loadAll();
          },
          error: (error) => {
            this.toastService.error(error?.error?.message || 'Payment was captured but sync failed.');
            this.processing.set(false);
          },
        });
      },
      modal: {
        ondismiss: () => {
          this.toastService.info('Razorpay checkout was closed before completion.');
          this.processing.set(false);
        },
      },
      prefill: {
        name: this.contactName(),
        email: this.status()?.organization?.companyName ? undefined : undefined,
        contact: context?.existingPlan?.phoneNumber || '',
      },
      notes: {
        orgId: String(context?.existingPlan?.orgid || ''),
        action: context?.suggestedAction || 'Buy',
      },
      theme: { color: '#0f172a' },
    });

    instance.open();
  }

  private launchInternalRazorpay(plan: BillingPlan, intent: any): void {
    const RazorpayCtor = (window as any).Razorpay;
    if (!RazorpayCtor) {
      this.toastService.warning('Razorpay checkout SDK is not available for internal plan upgrade.');
      this.processing.set(false);
      this.activePlanActionId.set(null);
      this.checkoutStage.set('review');
      return;
    }

    const instance = new RazorpayCtor({
      key: intent.publishableKey,
      amount: Math.round(Number(intent.amount || 0) * 100),
      currency: intent.currency || 'INR',
      name: intent.organizationName || this.status()?.organization?.companyName || 'HRNexus',
      description: `${plan.name} plan upgrade`,
      order_id: intent.orderId,
      handler: (response: any) => {
        this.subscriptionService.verifyPayment({
          paymentId: intent.paymentId,
          gateway: 'razorpay',
          providerPaymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          status: 'success',
        }).subscribe({
          next: () => {
            this.toastService.success(`${plan.name} activated successfully.`);
            this.processing.set(false);
            this.activePlanActionId.set(null);
            this.checkoutStage.set('select');
            this.paymentSuccessOpen.set(true);
            this.loadAll();
          },
          error: (error) => {
            this.toastService.error(error?.error?.message || 'Payment succeeded but verification failed.');
            this.processing.set(false);
            this.activePlanActionId.set(null);
            this.checkoutStage.set('review');
          },
        });
      },
      modal: {
        ondismiss: () => {
          this.toastService.info('Razorpay checkout was closed before completion.');
          this.processing.set(false);
          this.activePlanActionId.set(null);
          this.checkoutStage.set('review');
        },
      },
      prefill: {
        name: intent.organizationName || this.status()?.organization?.companyName || '',
      },
      notes: {
        plan: plan.slug,
        billingCycle: this.billingCycle(),
      },
      theme: { color: '#0f172a' },
    });

    instance.open();
  }
}
