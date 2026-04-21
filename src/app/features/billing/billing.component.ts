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
    <div class="billing-shell">

      <!-- ─── ANIMATED BACKGROUND ─── -->
      <div class="billing-bg" aria-hidden="true">
        <div class="bg-orb bg-orb-1"></div>
        <div class="bg-orb bg-orb-2"></div>
        <div class="bg-orb bg-orb-3"></div>
        <div class="bg-grid"></div>
      </div>

      <div class="billing-content">
        <!-- ─── BACK NAVIGATION ─── -->
        <nav class="billing-nav">
          <div class="nav-left" (click)="goDashboard()" id="nav-brand">
            <div class="nav-logo">HN</div>
            <div class="nav-sep"></div>
            <span class="nav-text">Billing & Subscriptions</span>
          </div>
          <button class="nav-exit" (click)="goDashboard()" id="btn-back-dashboard">
            <span>Dashboard</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </nav>

        <!-- ─── TOP HERO SECTION ─── -->
        <section class="hero-section">
          <div class="hero-left">
            <div class="hero-badge">
              <span class="badge-dot"></span>
              Subscription Management
            </div>
            <h1 class="hero-title">
              Power up your<br>
              <span class="hero-gradient-text">HR Workspace</span>
            </h1>
            <p class="hero-sub">
              Unlock premium modules, scale your team, and manage the entire billing lifecycle in one place.
            </p>

            <!-- Stats row -->
            <div class="hero-stats">
              <div class="stat-chip" *ngFor="let card of stats()">
                <span class="stat-label">{{ card.label }}</span>
                <span class="stat-value">{{ card.value }}</span>
                <span class="stat-help">{{ card.help }}</span>
              </div>
            </div>
          </div>

          <!-- Active plan card -->
          <div class="plan-status-card">
            <div class="psc-header">
              <div>
                <p class="psc-eyebrow">Active License</p>
                <h2 class="psc-plan-name">{{ currentWorkspacePlanName() }}</h2>
              </div>
              <span class="psc-status-badge" [ngClass]="statusBadgeClass()">{{ humanStatus() }}</span>
            </div>

            <div class="psc-divider"></div>

            <div class="psc-meta">
              <div class="psc-meta-row" *ngIf="status()?.organization?.isTrialActive">
                <span class="psc-meta-icon">⏳</span>
                <span>{{ status()?.trialDaysRemaining }} days left in trial</span>
              </div>
              <div class="psc-meta-row">
                <span class="psc-meta-icon">🏢</span>
                <span>{{ status()?.organization?.companyName || 'Your Workspace' }}</span>
              </div>
              <div class="psc-meta-row">
                <span class="psc-meta-icon">📅</span>
                <span>{{ statusNote() }}</span>
              </div>
            </div>

            <div class="psc-gateway">
              <p class="psc-gateway-label">Payment Gateway</p>
              <div class="gateway-toggle">
                <button (click)="selectedGateway.set('razorpay')"
                        [class.gw-active]="selectedGateway() === 'razorpay'"
                        class="gw-btn" id="gateway-razorpay">
                  <span class="gw-icon">⚡</span> Razorpay
                </button>
                <button (click)="selectedGateway.set('stripe')"
                        [class.gw-active]="selectedGateway() === 'stripe'"
                        class="gw-btn" id="gateway-stripe">
                  <span class="gw-icon">💳</span> Stripe
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- ─── STEPPER ─── -->
        <nav class="stepper-nav">
          <div class="stepper-track">
            <button class="step-item" [class.step-active]="checkoutStage() === 'select'"
                    [class.step-done]="checkoutStage() === 'review' || checkoutStage() === 'pay'"
                    (click)="checkoutStage.set('select')" id="step-select">
              <span class="step-circle">
                <span *ngIf="checkoutStage() === 'select'">1</span>
                <svg *ngIf="checkoutStage() !== 'select'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <span class="step-label">Pick Plan</span>
            </button>

            <div class="step-connector" [class.connector-done]="checkoutStage() === 'review' || checkoutStage() === 'pay'"></div>

            <button class="step-item" [class.step-active]="checkoutStage() === 'review'"
                    [class.step-done]="checkoutStage() === 'pay'"
                    [disabled]="!selectedPlanId()"
                    (click)="selectedPlanId() && checkoutStage.set('review')" id="step-review">
              <span class="step-circle">
                <span *ngIf="checkoutStage() !== 'pay'">2</span>
                <svg *ngIf="checkoutStage() === 'pay'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <span class="step-label">Configure</span>
            </button>

            <div class="step-connector" [class.connector-done]="checkoutStage() === 'pay'"></div>

            <button class="step-item" [class.step-active]="checkoutStage() === 'pay'" id="step-checkout">
              <span class="step-circle">3</span>
              <span class="step-label">Checkout</span>
            </button>
          </div>
        </nav>

        <!-- ─── STEP CONTENT ─── -->
        <main [ngSwitch]="checkoutStage()" class="step-content">

          <!-- STEP 1 – Plan Selection -->
          <div *ngSwitchCase="'select'" class="fade-in">
            <!-- Billing cycle toggle -->
            <div class="cycle-toggle-wrap">
              <div class="cycle-toggle">
                <button (click)="billingCycle.set('monthly')"
                        [class.cycle-active]="billingCycle() === 'monthly'"
                        class="cycle-btn" id="cycle-monthly">Monthly</button>
                <button (click)="billingCycle.set('yearly')"
                        [class.cycle-active]="billingCycle() === 'yearly'"
                        class="cycle-btn" id="cycle-yearly">
                  Yearly
                  <span class="cycle-badge">Save 20%</span>
                </button>
              </div>
            </div>

            <!-- Plan cards grid -->
            <div class="plans-grid">
              <div *ngFor="let plan of upgradablePlans(); let i = index"
                   (click)="selectPlan(plan)"
                   [class.plan-selected]="selectedPlanId() === plan.id"
                   [class.plan-popular]="plan.slug === recommendedPlanSlug()"
                   class="plan-card"
                   [attr.id]="'plan-' + plan.slug">

                <div class="plan-card-glow" *ngIf="plan.slug === recommendedPlanSlug()"></div>

                <div class="plan-card-inner">
                  <div class="plan-card-top">
                    <div class="plan-header">
                      <div>
                        <span class="plan-slug">{{ plan.slug }}</span>
                        <h3 class="plan-name">{{ plan.name }}</h3>
                      </div>
                      <span *ngIf="plan.slug === recommendedPlanSlug()" class="popular-badge">
                        ⭐ Popular
                      </span>
                    </div>

                    <div class="plan-price">
                      <span class="price-currency">₹</span>
                      <span class="price-amount">{{ planPrice(plan) | number:'1.0-0' }}</span>
                      <span class="price-period">/{{ billingCycle() === 'yearly' ? 'yr' : 'mo' }}</span>
                    </div>

                    <p class="plan-pitch">{{ planPitch(plan) }}</p>

                    <div class="plan-modules">
                      <span class="modules-label">Modules included</span>
                      <ul class="modules-list">
                        <li *ngFor="let module of plan.modules.slice(0, 6)" class="module-item">
                          <span class="module-check">✓</span>
                          {{ module }}
                        </li>
                        <li *ngIf="plan.modules.length > 6" class="module-more">
                          +{{ plan.modules.length - 6 }} more
                        </li>
                      </ul>
                    </div>
                  </div>

                  <button type="button"
                          (click)="$event.stopPropagation(); selectPlan(plan); checkoutStage.set('review')"
                          [disabled]="status()?.plan?.id === plan.id"
                          class="plan-cta"
                          [attr.id]="'select-plan-' + plan.slug">
                    <span *ngIf="status()?.plan?.id === plan.id">✓ Current Plan</span>
                    <span *ngIf="status()?.plan?.id !== plan.id">Select {{ plan.name }} →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 2 – Configure & Review -->
          <div *ngSwitchCase="'review'" class="fade-in review-layout">
            <div class="review-main">

              <!-- Configure section -->
              <section class="review-card">
                <div class="review-card-header">
                  <div>
                    <h3 class="review-card-title">Customise Your Plan</h3>
                    <p class="review-card-sub">Configure seats and billing details</p>
                  </div>
                  <button (click)="checkoutStage.set('select')" class="change-plan-btn" id="btn-change-plan">
                    ← Change Plan
                  </button>
                </div>

                <div class="config-grid">
                  <div class="config-field">
                    <label class="field-label">Seat Count</label>
                    <div class="seat-input-wrap">
                      <button (click)="updateNouser(String(Math.max(1, nouser() - 1)))" class="seat-adj" id="btn-seats-minus">−</button>
                      <input type="number"
                             [value]="nouser() || selectedPlan()?.userLimit"
                             (input)="updateNouser(($any($event.target)).value)"
                             class="seat-input" id="input-seats" min="1">
                      <button (click)="updateNouser(String(nouser() + 1))" class="seat-adj" id="btn-seats-plus">+</button>
                    </div>
                    <p class="field-hint">Plan minimum: {{ selectedPlan()?.userLimit }} seats</p>
                  </div>

                  <div class="config-field">
                    <label class="field-label">Duration</label>
                    <div class="duration-tabs">
                      <button (click)="duration.set(1)" [class.dur-active]="duration() === 1" class="dur-btn" id="btn-dur-1">1 Year</button>
                      <button (click)="duration.set(2)" [class.dur-active]="duration() === 2" class="dur-btn" id="btn-dur-2">2 Years</button>
                      <button (click)="duration.set(3)" [class.dur-active]="duration() === 3" class="dur-btn" id="btn-dur-3">3 Years</button>
                    </div>
                  </div>

                  <div class="config-field">
                    <label class="field-label">Billing Name</label>
                    <input [value]="contactName()"
                           (input)="contactName.set(($any($event.target)).value)"
                           class="text-field" placeholder="Full billing name" id="input-billing-name">
                  </div>

                  <div class="config-field">
                    <label class="field-label">GSTIN <span class="optional">(optional)</span></label>
                    <input [value]="gstin()"
                           (input)="gstin.set(($any($event.target)).value)"
                           class="text-field" placeholder="22AAAAA0000A1Z5" id="input-gstin">
                  </div>

                  <div class="config-field">
                    <label class="field-label">State</label>
                    <select [value]="stateCode()"
                            (change)="stateCode.set(($any($event.target)).value)"
                            class="text-field" id="select-state">
                      <option value="">Select state</option>
                      <option *ngFor="let state of legacyContext()?.states" [value]="state.code">{{ state.name }}</option>
                    </select>
                  </div>

                  <div class="config-field">
                    <label class="field-label">Currency</label>
                    <div class="currency-display">{{ selectedPlan()?.currency || 'INR' }} — Indian Rupee</div>
                  </div>
                </div>

                <!-- Modules included -->
                <div class="modules-section">
                  <p class="field-label mb-sm">Modules Included in {{ selectedPlan()?.name }}</p>
                  <div class="modules-chips">
                    <span *ngFor="let mod of selectedPlan()?.modules" class="module-chip">{{ mod }}</span>
                  </div>
                </div>
              </section>
            </div>

            <!-- Sticky summary -->
            <aside class="checkout-summary">
              <div class="summary-card">
                <div class="summary-header">
                  <div class="summary-plan-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  </div>
                  <div>
                    <p class="summary-eyebrow">Order Summary</p>
                    <h3 class="summary-plan-name">{{ selectedPlan()?.name }} Plan</h3>
                  </div>
                </div>

                <div class="summary-lines">
                  <div class="summary-line">
                    <span>{{ checkoutUnitLabel() }}</span>
                    <span>{{ checkoutUnitAmount() | currency:selectedPlan()?.currency:'symbol':'1.0-0' }}</span>
                  </div>
                  <div class="summary-line">
                    <span>{{ checkoutBaseLabel() }}</span>
                    <span>{{ checkoutBaseAmount() | currency:selectedPlan()?.currency:'symbol':'1.0-0' }}</span>
                  </div>
                  <div class="summary-line" *ngIf="selectedAddonAmount() > 0">
                    <span>Add-ons</span>
                    <span>{{ selectedAddonAmount() | currency:selectedPlan()?.currency:'symbol':'1.0-0' }}</span>
                  </div>
                  <div class="summary-line">
                    <span>GST (18%)</span>
                    <span>{{ checkoutTax() | currency:selectedPlan()?.currency:'symbol':'1.0-0' }}</span>
                  </div>
                </div>

                <div class="summary-total">
                  <span>Total Payable</span>
                  <span class="total-amount">{{ checkoutTotalWithTax() | currency:selectedPlan()?.currency:'symbol':'1.0-0' }}</span>
                </div>

                <button (click)="payNow()"
                        [disabled]="processing()"
                        class="pay-btn" id="btn-pay-now">
                  <span *ngIf="!processing()">
                    <span class="pay-lock">🔒</span> Pay Securely Now
                  </span>
                  <span *ngIf="processing()" class="pay-loading">
                    <span class="spinner-sm"></span> Processing…
                  </span>
                </button>

                <p class="summary-secure">256-bit SSL · Secured via {{ selectedGateway() | titlecase }}</p>

                <div class="summary-note">
                  <span class="note-icon">⚠️</span>
                  <p>Final amount is confirmed by the payment gateway. All prices include active seat configuration.</p>
                </div>
              </div>
            </aside>
          </div>

          <!-- STEP 3 – Processing -->
          <div *ngSwitchCase="'pay'" class="fade-in pay-state">
            <div class="pay-spinner-wrap">
              <div class="pay-ring pay-ring-1"></div>
              <div class="pay-ring pay-ring-2"></div>
              <div class="pay-ring pay-ring-3"></div>
              <div class="pay-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
            </div>
            <h3 class="pay-title">Syncing with {{ selectedGateway() | titlecase }}</h3>
            <p class="pay-sub">Initializing secure payment session. Please do not close this window.</p>
            <button (click)="checkoutStage.set('review')" class="pay-cancel-btn" id="btn-cancel-payment">
              Cancel Transaction
            </button>
          </div>

        </main>

        <!-- ─── BILLING HISTORY ─── -->
        <section class="history-section" *ngIf="status()?.billingHistory?.length">
          <div class="history-header">
            <div>
              <span class="history-eyebrow">Payment Records</span>
              <h3 class="history-title">Transaction History</h3>
            </div>
            <span class="history-updated">Last updated: {{ status()?.billingHistory?.[0]?.createdAt | date:'dd MMM yyyy' }}</span>
          </div>

          <div class="history-table-wrap">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Reference ID</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Cycle</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th class="th-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of status()?.billingHistory; let i = index"
                    class="history-row"
                    [attr.id]="'payment-row-' + item.id">
                  <td class="td-ref">
                    <span class="ref-badge">#{{ item.id }}</span>
                  </td>
                  <td class="td-gateway">
                    <span class="gateway-tag">{{ item.gateway || '—' }}</span>
                  </td>
                  <td class="td-amount">
                    {{ item.amount | currency:item.currency:'symbol':'1.0-0' }}
                  </td>
                  <td class="td-cycle">
                    <span class="cycle-tag" *ngIf="item.billingCycle">{{ item.billingCycle }}</span>
                    <span *ngIf="!item.billingCycle">—</span>
                  </td>
                  <td class="td-status">
                    <span class="status-pill" [ngClass]="paymentTone(item.status)">
                      <span class="status-dot"></span>
                      {{ item.status }}
                    </span>
                  </td>
                  <td class="td-date">{{ item.createdAt | date:'dd MMM yyyy, hh:mm a' }}</td>
                  <td class="td-actions">
                    <button *ngIf="item.invoiceUrl"
                            class="action-btn" title="View Invoice"
                            [attr.id]="'view-invoice-' + item.id">
                      📄 Receipt
                    </button>
                    <span *ngIf="!item.invoiceUrl" class="no-invoice">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Empty state if no history -->
        <div class="empty-history" *ngIf="!status()?.billingHistory?.length && status()">
          <div class="empty-icon">🧾</div>
          <h4>No transactions yet</h4>
          <p>Your payment history will appear here after your first upgrade.</p>
        </div>

      </div><!-- /billing-content -->

      <!-- ─── PAYMENT SUCCESS MODAL ─── -->
      <div *ngIf="paymentSuccessOpen()" class="modal-overlay" id="payment-success-modal">
        <div class="success-modal">
          <div class="success-confetti" aria-hidden="true">
            <span *ngFor="let i of [1,2,3,4,5,6,7,8,9,10,11,12]" class="confetti-piece"></span>
          </div>

          <div class="success-icon-wrap">
            <div class="success-icon-ring"></div>
            <div class="success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>

          <h2 class="success-title">Plan Activated! 🎉</h2>
          <p class="success-sub">
            Your workspace has been upgraded to
            <strong>{{ status()?.plan?.name || selectedPlan()?.name }}</strong>.
            All premium modules are now unlocked and ready to use.
          </p>

          <div class="success-plan-chip">
            <span>✓</span>
            <span>{{ status()?.plan?.name || selectedPlan()?.name }} · Active</span>
          </div>

          <div class="success-actions">
            <button (click)="closePaymentSuccess()" class="success-primary-btn" id="btn-go-dashboard">
              Go to Dashboard
            </button>
            <button (click)="printInvoice()" class="success-secondary-btn" id="btn-print-invoice">
              🖨️ Print Invoice
            </button>
          </div>

          <button (click)="closePaymentSuccess()" class="modal-close" id="btn-close-success" aria-label="Close">×</button>
        </div>
      </div>

    </div><!-- /billing-shell -->
  `,
  styles: [`
    /* ─── CORE SHELL ─── */
    .billing-shell {
      min-height: 100vh;
      position: relative;
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      background: #060b14;
      color: #e2e8f0;
      overflow-x: hidden;
    }

    /* ─── ANIMATED BACKGROUND ─── */
    .billing-bg {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }
    .bg-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.18;
      animation: orb-drift 16s ease-in-out infinite alternate;
    }
    .bg-orb-1 {
      width: 700px; height: 700px;
      background: radial-gradient(circle, #10b981, #064e3b);
      top: -200px; left: -200px;
      animation-delay: 0s;
    }
    .bg-orb-2 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, #6366f1, #1e1b4b);
      bottom: -100px; right: -100px;
      animation-delay: -6s;
    }
    .bg-orb-3 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, #0ea5e9, #0c4a6e);
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      animation-delay: -11s;
    }
    .bg-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
      background-size: 48px 48px;
    }
    @keyframes orb-drift {
      from { transform: translateY(0px) scale(1); }
      to   { transform: translateY(40px) scale(1.08); }
    }

    /* ─── CONTENT WRAPPER (MAIN PANEL) ─── */
    .billing-content {
      position: relative;
      z-index: 1;
      max-width: 1400px;
      margin: 24px auto 80px;
      padding: 48px;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
    }

    /* ─── NAVIGATION (FULL-SCREEN MODE) ─── */
    .billing-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .nav-left {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    .nav-left:hover { opacity: 1; }
    .nav-logo {
      width: 32px; height: 32px;
      background: linear-gradient(135deg, #10b981, #6366f1);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 900; color: white;
    }
    .nav-sep { width: 1px; height: 16px; background: rgba(255,255,255,0.1); }
    .nav-text { font-size: 14px; font-weight: 700; color: #f1f5f9; }

    .nav-exit {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      color: #64748b;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .nav-exit:hover { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.2); color: #f87171; }

    /* ─── FADE IN ANIMATION ─── */
    .fade-in {
      animation: fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes fade-up {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ─── HERO SECTION ─── */
    .hero-section {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 40px;
      align-items: start;
      margin-bottom: 48px;
    }
    @media (max-width: 1024px) {
      .hero-section { grid-template-columns: 1fr; }
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      background: rgba(16,185,129,0.12);
      border: 1px solid rgba(16,185,129,0.25);
      border-radius: 100px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #34d399;
      margin-bottom: 20px;
    }
    .badge-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #10b981;
      animation: pulse-dot 2s ease-in-out infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .hero-title {
      font-size: clamp(2.5rem, 5vw, 4.5rem);
      font-weight: 900;
      line-height: 1.05;
      letter-spacing: -0.03em;
      color: #f8fafc;
      margin: 0 0 16px;
    }
    .hero-gradient-text {
      background: linear-gradient(135deg, #10b981 0%, #6366f1 50%, #0ea5e9 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-sub {
      font-size: 17px;
      color: #94a3b8;
      line-height: 1.7;
      max-width: 560px;
      margin: 0 0 32px;
    }

    /* Stats row */
    .hero-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    @media (max-width: 600px) { .hero-stats { grid-template-columns: repeat(2, 1fr); } }
    .stat-chip {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 16px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      backdrop-filter: blur(10px);
      transition: all 0.2s;
    }
    .stat-chip:hover {
      background: rgba(255,255,255,0.07);
      border-color: rgba(16,185,129,0.2);
      transform: translateY(-2px);
    }
    .stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; }
    .stat-value { font-size: 24px; font-weight: 900; color: #f1f5f9; }
    .stat-help  { font-size: 10px; color: #475569; }

    /* ─── PLAN STATUS CARD ─── */
    .plan-status-card {
      background: rgba(15,23,42,0.7);
      backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 28px;
      box-shadow: 0 0 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .psc-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
    .psc-eyebrow { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #475569; margin-bottom: 6px; }
    .psc-plan-name { font-size: 26px; font-weight: 900; color: #f8fafc; }
    .psc-status-badge {
      padding: 5px 14px;
      border-radius: 100px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      white-space: nowrap;
    }
    .badge-active   { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.25); }
    .badge-trial    { background: rgba(251,191,36,0.12); color: #fbbf24; border: 1px solid rgba(251,191,36,0.2); }
    .badge-expired  { background: rgba(239,68,68,0.12);  color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
    .badge-default  { background: rgba(148,163,184,0.1); color: #94a3b8; border: 1px solid rgba(148,163,184,0.15); }
    .psc-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 0 0 20px; }
    .psc-meta { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .psc-meta-row { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: #94a3b8; line-height: 1.5; }
    .psc-meta-icon { font-size: 15px; flex-shrink: 0; }
    .psc-gateway-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #475569; margin-bottom: 10px; }
    .gateway-toggle { display: flex; gap: 8px; }
    .gw-btn {
      flex: 1;
      padding: 10px 12px;
      border-radius: 8px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      color: #64748b;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      display: flex; align-items: center; justify-content: center; gap: 6px;
    }
    .gw-btn:hover { background: rgba(255,255,255,0.07); color: #94a3b8; }
    .gw-active {
      background: rgba(16,185,129,0.12) !important;
      border-color: rgba(16,185,129,0.35) !important;
      color: #34d399 !important;
      box-shadow: 0 0 20px rgba(16,185,129,0.1);
    }
    .gw-icon { font-size: 14px; }

    /* ─── STEPPER ─── */
    .stepper-nav { margin-bottom: 40px; }
    .stepper-track {
      display: flex;
      align-items: center;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px;
      padding: 8px 16px;
      backdrop-filter: blur(12px);
    }
    .step-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 16px;
      border-radius: 100px;
      cursor: pointer;
      background: transparent;
      border: none;
      color: #475569;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.3s;
    }
    .step-item:disabled { opacity: 0.4; cursor: not-allowed; }
    .step-circle {
      width: 30px; height: 30px;
      border-radius: 50%;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 800;
      transition: all 0.3s;
      flex-shrink: 0;
    }
    .step-active .step-circle {
      background: #10b981;
      border-color: #10b981;
      color: white;
      box-shadow: 0 0 20px rgba(16,185,129,0.4);
    }
    .step-active { color: #f1f5f9; }
    .step-done .step-circle {
      background: rgba(16,185,129,0.15);
      border-color: rgba(16,185,129,0.4);
      color: #34d399;
    }
    .step-done { color: #64748b; }
    .step-connector {
      flex: 1;
      height: 1px;
      background: rgba(255,255,255,0.06);
      margin: 0 4px;
      transition: background 0.4s;
    }
    .connector-done { background: rgba(16,185,129,0.3); }
    .step-label { font-size: 12px; font-weight: 700; }

    /* ─── BILLING CYCLE TOGGLE ─── */
    .cycle-toggle-wrap { display: flex; justify-content: center; margin-bottom: 36px; }
    .cycle-toggle {
      display: flex;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 100px;
      padding: 4px;
      gap: 4px;
    }
    .cycle-btn {
      padding: 10px 24px;
      border-radius: 100px;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex; align-items: center; gap: 8px;
      transition: all 0.25s;
    }
    .cycle-active {
      background: #10b981;
      color: white;
      box-shadow: 0 4px 20px rgba(16,185,129,0.35);
    }
    .cycle-badge {
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      background: rgba(255,255,255,0.2);
      padding: 2px 8px;
      border-radius: 100px;
    }

    /* ─── PLAN CARDS GRID ─── */
    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }
    .plan-card {
      position: relative;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
      outline: 2px solid transparent;
      outline-offset: 4px;
    }
    .plan-card:hover { transform: translateY(-6px); }
    .plan-selected {
      outline-color: #10b981;
      box-shadow: 0 0 0 1px rgba(16,185,129,0.3), 0 20px 60px rgba(16,185,129,0.15);
    }
    .plan-popular .plan-card-inner {
      border-color: rgba(99,102,241,0.3) !important;
    }
    .plan-card-glow {
      position: absolute;
      inset: -2px;
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(16,185,129,0.2));
      z-index: 0;
      animation: glow-pulse 3s ease-in-out infinite alternate;
    }
    @keyframes glow-pulse {
      from { opacity: 0.5; }
      to   { opacity: 1; }
    }
    .plan-card-inner {
      position: relative;
      z-index: 1;
      background: rgba(15,23,42,0.75);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 0;
      min-height: 480px;
    }
    .plan-card-top { flex: 1; }
    .plan-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .plan-slug { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #475569; display: block; margin-bottom: 4px; }
    .plan-name { font-size: 28px; font-weight: 900; color: #f8fafc; }
    .popular-badge {
      font-size: 10px; font-weight: 800;
      background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(16,185,129,0.15));
      border: 1px solid rgba(99,102,241,0.3);
      color: #a5b4fc;
      padding: 4px 12px;
      border-radius: 100px;
      white-space: nowrap;
    }
    .plan-price {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin-bottom: 16px;
    }
    .price-currency { font-size: 22px; font-weight: 900; color: #94a3b8; }
    .price-amount { font-size: 52px; font-weight: 900; color: #f8fafc; line-height: 1; }
    .price-period { font-size: 14px; font-weight: 600; color: #475569; }
    .plan-pitch { font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }

    .modules-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #475569; margin-bottom: 10px; display: block; }
    .modules-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
    .module-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #94a3b8; }
    .module-check { color: #10b981; font-weight: 800; width: 16px; flex-shrink: 0; }
    .module-more { font-size: 12px; color: #475569; font-style: italic; padding-left: 26px; }

    .plan-cta {
      width: 100%;
      margin-top: 24px;
      padding: 14px;
      border-radius: 8px;
      border: none;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.25s;
      box-shadow: 0 4px 20px rgba(16,185,129,0.3);
    }
    .plan-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(16,185,129,0.4); }
    .plan-cta:disabled {
      background: rgba(255,255,255,0.06);
      color: #475569;
      cursor: default;
      box-shadow: none;
      transform: none;
    }

    /* ─── REVIEW LAYOUT ─── */
    .review-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 28px;
      align-items: start;
    }
    @media (max-width: 1024px) { .review-layout { grid-template-columns: 1fr; } }

    .review-card {
      background: rgba(15,23,42,0.7);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
      padding: 32px;
    }
    .review-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 28px;
    }
    .review-card-title { font-size: 22px; font-weight: 900; color: #f8fafc; margin-bottom: 4px; }
    .review-card-sub { font-size: 13px; color: #64748b; }
    .change-plan-btn {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.1);
      color: #64748b;
      font-size: 12px;
      font-weight: 700;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .change-plan-btn:hover { border-color: #10b981; color: #34d399; }

    .config-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }
    @media (max-width: 640px) { .config-grid { grid-template-columns: 1fr; } }

    .config-field { display: flex; flex-direction: column; gap: 8px; }
    .field-label {
      font-size: 10px; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.12em;
      color: #64748b;
    }
    .optional { font-weight: 400; text-transform: none; letter-spacing: 0; color: #475569; }
    .field-hint { font-size: 10px; color: #475569; font-style: italic; }
    .mb-sm { margin-bottom: 12px; }

    .seat-input-wrap {
      display: flex; align-items: center;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 8px;
      overflow: hidden;
    }
    .seat-adj {
      width: 44px; height: 52px;
      background: transparent;
      border: none;
      color: #64748b; font-size: 20px; font-weight: 700;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.15s;
    }
    .seat-adj:hover { background: rgba(255,255,255,0.06); color: #10b981; }
    .seat-input {
      flex: 1; min-width: 0;
      background: transparent; border: none;
      text-align: center;
      font-size: 20px; font-weight: 900; color: #f1f5f9;
      padding: 0 4px; height: 52px;
      outline: none;
    }
    .seat-input::-webkit-outer-spin-button,
    .seat-input::-webkit-inner-spin-button { -webkit-appearance: none; }

    .text-field {
      width: 100%;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 8px;
      padding: 14px 18px;
      color: #f1f5f9;
      font-size: 14px; font-weight: 500;
      outline: none; transition: all 0.2s;
    }
    .text-field:focus {
      border-color: rgba(16,185,129,0.4);
      background: rgba(16,185,129,0.04);
      box-shadow: 0 0 0 3px rgba(16,185,129,0.08);
    }
    .text-field option { background: #0f172a; }

    .duration-tabs {
      display: flex; gap: 8px;
    }
    .dur-btn {
      flex: 1; padding: 12px 6px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 8px;
      color: #64748b; font-size: 13px; font-weight: 700;
      cursor: pointer; transition: all 0.2s;
    }
    .dur-active {
      background: rgba(16,185,129,0.12) !important;
      border-color: rgba(16,185,129,0.3) !important;
      color: #34d399 !important;
    }

    .currency-display {
      padding: 14px 18px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 8px;
      font-size: 13px; color: #475569; font-weight: 500;
    }

    .modules-section { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px; }
    .modules-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .module-chip {
      padding: 6px 14px;
      background: rgba(16,185,129,0.08);
      border: 1px solid rgba(16,185,129,0.2);
      border-radius: 100px;
      font-size: 12px; font-weight: 600; color: #34d399;
    }

    /* ─── CHECKOUT SUMMARY ─── */
    .checkout-summary { position: sticky; top: 24px; }
    .summary-card {
      background: rgba(15,23,42,0.85);
      backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 28px;
      box-shadow: 0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
    }
    .summary-header {
      display: flex; align-items: center; gap: 14px;
      margin-bottom: 24px;
    }
    .summary-plan-icon {
      width: 48px; height: 48px;
      background: rgba(16,185,129,0.1);
      border: 1px solid rgba(16,185,129,0.2);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      color: #10b981; flex-shrink: 0;
    }
    .summary-eyebrow { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #475569; margin-bottom: 4px; }
    .summary-plan-name { font-size: 18px; font-weight: 900; color: #f8fafc; }

    .summary-lines { display: flex; flex-direction: column; gap: 0; }
    .summary-line {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      font-size: 13px; color: #64748b;
    }
    .summary-line:last-child { border-bottom: none; }
    .summary-line span:last-child { font-weight: 700; color: #94a3b8; }
    .summary-included { color: #34d399 !important; font-weight: 700 !important; }

    .summary-total {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 0 24px;
      border-top: 1px solid rgba(255,255,255,0.08);
      font-size: 13px; font-weight: 700; color: #94a3b8;
    }
    .total-amount { font-size: 32px; font-weight: 900; color: #f8fafc; }

    .pay-btn {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #10b981 0%, #059669 50%, #0d9488 100%);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 15px; font-weight: 900;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 8px 32px rgba(16,185,129,0.35);
      position: relative;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .pay-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, transparent, rgba(255,255,255,0.08));
      opacity: 0;
      transition: opacity 0.3s;
    }
    .pay-btn:hover::before { opacity: 1; }
    .pay-btn:hover { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(16,185,129,0.4); }
    .pay-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .pay-lock { font-size: 14px; }
    .pay-loading { display: flex; align-items: center; justify-content: center; gap: 10px; }
    .spinner-sm {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .summary-secure { text-align: center; font-size: 11px; color: #475569; font-weight: 600; margin-bottom: 16px; }
    .summary-note {
      display: flex; gap: 10px; align-items: flex-start;
      background: rgba(251,191,36,0.06);
      border: 1px solid rgba(251,191,36,0.12);
      border-radius: 8px;
      padding: 14px;
    }
    .note-icon { font-size: 16px; flex-shrink: 0; }
    .summary-note p { font-size: 11px; color: #92400e; line-height: 1.5; color: #ca8a04; }

    /* ─── PAY STATE ─── */
    .pay-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 80px 20px; text-align: center; gap: 20px;
    }
    .pay-spinner-wrap {
      position: relative;
      width: 100px; height: 100px;
      margin-bottom: 20px;
    }
    .pay-ring {
      position: absolute;
      border-radius: 50%;
      border: 2px solid transparent;
      animation: spin 2s linear infinite;
    }
    .pay-ring-1 { inset: 0; border-top-color: #10b981; animation-duration: 1.5s; }
    .pay-ring-2 { inset: 12px; border-top-color: #6366f1; animation-duration: 2s; animation-direction: reverse; }
    .pay-ring-3 { inset: 22px; border-top-color: #0ea5e9; animation-duration: 2.5s; }
    .pay-icon {
      position: absolute;
      inset: 0;
      display: flex; align-items: center; justify-content: center;
      color: #10b981;
    }
    .pay-title { font-size: 26px; font-weight: 900; color: #f8fafc; }
    .pay-sub { font-size: 14px; color: #64748b; max-width: 440px; line-height: 1.6; }
    .pay-cancel-btn {
      margin-top: 8px;
      padding: 12px 24px;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      color: #64748b; font-size: 13px; font-weight: 700;
      cursor: pointer; transition: all 0.2s;
    }
    .pay-cancel-btn:hover { border-color: rgba(239,68,68,0.3); color: #f87171; }

    /* ─── BILLING HISTORY ─── */
    .history-section {
      margin-top: 60px;
    }
    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 24px;
    }
    .history-eyebrow { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #475569; display: block; margin-bottom: 6px; }
    .history-title { font-size: 26px; font-weight: 900; color: #f8fafc; }
    .history-updated { font-size: 12px; color: #475569; }

    .history-table-wrap {
      background: rgba(15,23,42,0.6);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
      overflow: hidden;
    }
    .history-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .history-table thead tr {
      background: rgba(255,255,255,0.03);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .history-table th {
      padding: 16px 20px;
      font-size: 10px; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.12em;
      color: #475569; text-align: left;
    }
    .th-right { text-align: right; }
    .history-row { border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s; }
    .history-row:last-child { border-bottom: none; }
    .history-row:hover { background: rgba(255,255,255,0.02); }
    .history-table td { padding: 16px 20px; vertical-align: middle; }

    .td-ref {}
    .ref-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      font-size: 12px; font-weight: 700; color: #94a3b8;
      font-family: 'Courier New', monospace;
    }
    .td-amount { font-weight: 900; font-size: 15px; color: #f1f5f9; }
    .td-date { color: #475569; font-size: 12px; }
    .td-actions { text-align: right; }
    .gateway-tag {
      padding: 4px 10px;
      background: rgba(99,102,241,0.08);
      border: 1px solid rgba(99,102,241,0.15);
      border-radius: 8px;
      font-size: 11px; font-weight: 700; color: #a5b4fc;
      text-transform: capitalize;
    }
    .cycle-tag {
      padding: 4px 10px;
      background: rgba(14,165,233,0.08);
      border: 1px solid rgba(14,165,233,0.15);
      border-radius: 8px;
      font-size: 11px; font-weight: 700; color: #38bdf8;
      text-transform: capitalize;
    }

    .status-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 12px;
      border-radius: 100px;
      font-size: 11px; font-weight: 800;
      text-transform: capitalize;
    }
    .status-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: currentColor;
    }
    .bg-emerald-50 { background: rgba(16,185,129,0.1) !important; color: #34d399 !important; border: 1px solid rgba(16,185,129,0.2); }
    .bg-amber-50   { background: rgba(251,191,36,0.08) !important; color: #fbbf24 !important; border: 1px solid rgba(251,191,36,0.18); }
    .bg-rose-50    { background: rgba(239,68,68,0.1) !important;  color: #f87171 !important; border: 1px solid rgba(239,68,68,0.2); }
    .bg-slate-100  { background: rgba(148,163,184,0.08) !important; color: #94a3b8 !important; border: 1px solid rgba(148,163,184,0.15); }
    .bg-violet-50  { background: rgba(139,92,246,0.08) !important; color: #a78bfa !important; border: 1px solid rgba(139,92,246,0.2); }

    .action-btn {
      padding: 8px 16px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 6px;
      color: #64748b; font-size: 11px; font-weight: 700;
      cursor: pointer; transition: all 0.2s;
    }
    .action-btn:hover { background: rgba(16,185,129,0.08); border-color: rgba(16,185,129,0.2); color: #34d399; }
    .no-invoice { color: #334155; }

    /* ─── EMPTY STATE ─── */
    .empty-history {
      margin-top: 60px;
      text-align: center;
      padding: 60px 20px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 12px;
    }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
    .empty-history h4 { font-size: 18px; font-weight: 800; color: #f1f5f9; margin-bottom: 8px; }
    .empty-history p { font-size: 14px; color: #64748b; }

    /* ─── SUCCESS MODAL ─── */
    .modal-overlay {
      position: fixed; inset: 0; z-index: 200;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(16px);
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      animation: fade-up 0.25s ease both;
    }
    .success-modal {
      position: relative;
      background: rgba(15,23,42,0.95);
      backdrop-filter: blur(32px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 52px 48px;
      max-width: 520px; width: 100%;
      text-align: center;
      box-shadow: 0 80px 160px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06);
      animation: modal-pop 0.4s cubic-bezier(0.16,1,0.3,1) both;
    }
    @keyframes modal-pop {
      from { opacity: 0; transform: scale(0.9) translateY(20px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* Confetti */
    .success-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; border-radius: 16px; }
    .confetti-piece {
      position: absolute;
      width: 8px; height: 8px;
      border-radius: 2px;
      animation: confetti-fall 3s ease-in-out infinite;
    }
    .confetti-piece:nth-child(1)  { background: #10b981; left: 10%;  animation-delay: 0.0s; }
    .confetti-piece:nth-child(2)  { background: #6366f1; left: 20%;  animation-delay: 0.2s; }
    .confetti-piece:nth-child(3)  { background: #f59e0b; left: 30%;  animation-delay: 0.4s; }
    .confetti-piece:nth-child(4)  { background: #0ea5e9; left: 40%;  animation-delay: 0.1s; }
    .confetti-piece:nth-child(5)  { background: #ec4899; left: 50%;  animation-delay: 0.3s; }
    .confetti-piece:nth-child(6)  { background: #10b981; left: 60%;  animation-delay: 0.5s; }
    .confetti-piece:nth-child(7)  { background: #f59e0b; left: 70%;  animation-delay: 0.15s; }
    .confetti-piece:nth-child(8)  { background: #6366f1; left: 80%;  animation-delay: 0.35s; }
    .confetti-piece:nth-child(9)  { background: #0ea5e9; left: 90%;  animation-delay: 0.25s; }
    .confetti-piece:nth-child(10) { background: #ec4899; left: 15%;  animation-delay: 0.45s; }
    .confetti-piece:nth-child(11) { background: #10b981; left: 45%;  animation-delay: 0.55s; }
    .confetti-piece:nth-child(12) { background: #f59e0b; left: 75%;  animation-delay: 0.05s; }
    @keyframes confetti-fall {
      0%   { transform: translateY(-20px) rotate(0deg); opacity: 0; }
      20%  { opacity: 1; }
      80%  { opacity: 1; }
      100% { transform: translateY(600px) rotate(720deg); opacity: 0; }
    }

    .success-icon-wrap {
      position: relative;
      width: 96px; height: 96px;
      margin: 0 auto 28px;
    }
    .success-icon-ring {
      position: absolute; inset: -8px;
      border-radius: 50%;
      border: 2px solid rgba(16,185,129,0.3);
      animation: ring-spin 4s linear infinite;
    }
    @keyframes ring-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    .success-icon {
      width: 96px; height: 96px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1));
      border: 1px solid rgba(16,185,129,0.3);
      display: flex; align-items: center; justify-content: center;
      color: #10b981;
      box-shadow: 0 0 60px rgba(16,185,129,0.25);
    }

    .success-title { font-size: 36px; font-weight: 900; color: #f8fafc; margin-bottom: 16px; }
    .success-sub { font-size: 15px; color: #64748b; line-height: 1.7; margin-bottom: 24px; }
    .success-sub strong { color: #34d399; }
    .success-plan-chip {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 20px;
      background: rgba(16,185,129,0.1);
      border: 1px solid rgba(16,185,129,0.25);
      border-radius: 100px;
      font-size: 13px; font-weight: 700; color: #34d399;
      margin-bottom: 32px;
    }
    .success-actions { display: flex; flex-direction: column; gap: 12px; }
    .success-primary-btn {
      width: 100%;
      padding: 18px;
      background: linear-gradient(135deg, #10b981, #059669);
      border: none; border-radius: 18px;
      color: white; font-size: 15px; font-weight: 900;
      cursor: pointer;
      box-shadow: 0 8px 32px rgba(16,185,129,0.35);
      transition: all 0.25s;
    }
    .success-primary-btn:hover { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(16,185,129,0.4); }
    .success-secondary-btn {
      width: 100%;
      padding: 14px;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      color: #64748b; font-size: 13px; font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .success-secondary-btn:hover { border-color: rgba(255,255,255,0.2); color: #94a3b8; }

    .modal-close {
      position: absolute; top: 20px; right: 24px;
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      color: #64748b; font-size: 20px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .modal-close:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.2); color: #f87171; }

    /* ─── SCROLLBAR ─── */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }
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

  readonly Math = Math;
  readonly String = String;

  stats = computed(() => {
    const status = this.status();
    return [
      { label: 'Plan', value: status?.plan?.name || 'Loading…', help: 'Current subscription' },
      { label: 'Trial Days', value: status?.trialDaysRemaining ?? 0, help: 'Days remaining' },
      { label: 'Read Only', value: status?.organization?.readOnlyMode ? 'Yes' : 'No', help: 'Workspace mode' },
      { label: 'Invoices', value: status?.billingHistory?.length ?? 0, help: 'Total payments' },
    ];
  });

  selectedPlan = computed(() => {
    const planId = this.selectedPlanId();
    return this.plans().find((plan) => plan.id === planId) ?? null;
  });

  /** Only non-trial plans are shown in the upgrade grid */
  upgradablePlans = computed(() => this.plans().filter((plan) => !plan.isTrialPlan));

  goDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

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
    if (plan.slug === 'pro') return 'Best fit for HR teams that need payroll, visit management, and full operations.';
    if (plan.slug === 'enterprise') return 'For scaled organizations that need higher capacity and enterprise controls.';
    return 'Flexible access for onboarding and workspace evaluation.';
  }

  statusBadgeClass(): string {
    const status = this.status()?.organization?.subscriptionStatus;
    if (status === 'active') return 'psc-status-badge badge-active';
    if (status === 'trialing') return 'psc-status-badge badge-trial';
    if (status === 'expired' || status === 'cancelled') return 'psc-status-badge badge-expired';
    return 'psc-status-badge badge-default';
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
      if (status.organization.readOnlyMode) return 'Workspace is read-only until an upgrade is completed.';
      return 'Subscription is active — premium modules are available.';
    }
    if (this.legacyContext()) {
      return this.legacyContext()!.suggestedAction === 'Buy'
        ? 'Organization is in trial — use Buy workflow.'
        : 'Organization has an active plan — use Upgrade workflow.';
    }
    return 'Loading subscription status…';
  }

  paymentTone(status: string): string {
    const map: Record<string, string> = {
      success: 'bg-emerald-50',
      pending: 'bg-amber-50',
      failed: 'bg-rose-50',
      refunded: 'bg-slate-100',
      disputed: 'bg-violet-50',
    };
    return map[status] || 'bg-slate-100';
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
    const rawPrice = this.toAmount(addon.price);
    if (this.legacyContext()?.suggestedAction === 'Buy') {
      return Number((rawPrice * this.billableUsers() * this.durationMonths()).toFixed(2));
    }
    return Number(rawPrice.toFixed(2));
  }

  selectedAddonAmount(): number {
    const context = this.legacyContext();
    if (!context) return 0;
    return context.addonCatalog.reduce((sum, addon) => {
      if (!this.addonSelected(addon.name)) return sum;
      if (context.suggestedAction === 'Upgrade' && addon.status === '1') return sum;
      return sum + this.effectiveAddonPrice(addon);
    }, 0);
  }

  legacySubtotal(): number {
    return this.checkoutBaseAmount() + this.selectedAddonAmount();
  }

  legacyTax(): number {
    return Number((this.legacySubtotal() * 0.18).toFixed(2));
  }

  legacyTotalWithTax(): number {
    return Number((this.legacySubtotal() + this.legacyTax()).toFixed(2));
  }

  checkoutSubtotal(): number {
    return this.checkoutBaseAmount() + this.selectedAddonAmount();
  }

  checkoutUnitLabel(): string {
    return this.legacyContext()?.suggestedAction === 'Buy'
      ? 'Price per seat / month'
      : `Price per seat (${this.billingCycle()})`;
  }

  checkoutUnitAmount(): number {
    const plan = this.selectedPlan();
    if (plan) return this.legacyContext()?.suggestedAction === 'Buy' ? plan.monthlyPrice : this.planPrice(plan);
    return this.toAmount(this.legacyContext()?.basePlanAmount);
  }

  checkoutBaseLabel(): string {
    const action = this.legacyContext()?.suggestedAction;
    if (action === 'Buy') return `Base plan (${this.billableUsers()} seats x ${this.durationMonths()} months)`;
    if (action === 'Upgrade') return `Base plan (${this.billableUsers()} seats)`;
    return `Seats (${this.billableUsers()})`;
  }

  checkoutBaseAmount(): number {
    const context = this.legacyContext();
    const legacyBaseAmount = this.toAmount(context?.basePlanAmount);
    if (legacyBaseAmount > 0) return legacyBaseAmount;

    const plan = this.selectedPlan();
    if (!plan) return 0;

    if (context?.suggestedAction === 'Buy') {
      const seatAmount = plan.monthlyPrice * this.billableUsers();
      return Number((seatAmount * this.durationMonths()).toFixed(2));
    }

    const seatAmount = this.planPrice(plan) * this.billableUsers();
    return Number(seatAmount.toFixed(2));
  }

  checkoutTax(): number {
    return Number((this.checkoutSubtotal() * 0.18).toFixed(2));
  }

  checkoutTotalWithTax(): number {
    return Number((this.checkoutSubtotal() + this.checkoutTax()).toFixed(2));
  }

  pricingEstimateNote(): string {
    if (this.legacyContext()?.suggestedAction === 'Buy') {
      return `Buy flow estimate is based on ${this.billableUsers()} user(s) x ${this.durationMonths()} month(s).`;
    }
    return 'Totals are based on the legacy addon catalog and finalized by the payment API.';
  }

  payNow(): void {
    if (this.legacyContext()?.configured) {
      this.startLegacyPurchase();
      return;
    }
    this.upgrade(this.selectedPlan()!);
  }

  private toAmount(value: unknown): number {
    const normalized = typeof value === 'string' ? value.replace(/[^0-9.-]+/g, '') : value;
    const parsed = Number(normalized || 0);
    return Number.isFinite(parsed) ? parsed : 0;
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

  openCheckoutModal(plan?: BillingPlan): void {
    if (plan && plan.isTrialPlan) {
      this.toastService.info('Free trial is only a reference plan. Please choose Basic, Pro, or Enterprise.');
      return;
    }
    if (plan && this.status()?.plan?.id === plan.id) {
      this.toastService.info(`${plan.name} is already active for this workspace.`);
      return;
    }
    if (plan) this.selectedPlanId.set(plan.id);
    if (this.checkoutStage() === 'select') this.checkoutStage.set('review');
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

  currentWorkspacePlanName(): string {
    if (this.status()?.plan?.name) return this.status()!.plan!.name;
    if (this.legacyContext()?.existingPlan?.planStatus === 0) return this.t('billing.trialPlan');
    if (this.legacyContext()?.existingPlan?.planStatus === 1) return this.t('billing.activePlan');
    return 'No Active Plan';
  }

  upgrade(plan: BillingPlan): void {
    if (!plan || plan.isTrialPlan) {
      this.toastService.info('Please select a paid plan (Basic, Pro, or Enterprise) to upgrade.');
      return;
    }
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

  startLegacyPurchase(): void {
    const context = this.legacyContext();
    if (!context) { this.toastService.error(this.t('billing.legacyContextMissing')); return; }
    if (!this.contactName().trim()) { this.toastService.warning('Billing contact name is required.'); return; }
    if (!this.stateCode().trim()) { this.toastService.warning('Please select a state.'); return; }

    this.processing.set(true);
    this.subscriptionService.legacyPurchase({
      nouser: this.billableUsers(),
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
      nouser: this.billableUsers(),
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

  private launchLegacyRazorpay(result: any): void {
    const context = this.legacyContext();
    const RazorpayCtor = (window as any).Razorpay;
    if (!RazorpayCtor) {
      this.toastService.warning('Razorpay checkout SDK is not available.');
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
          nouser: this.billableUsers(),
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
        contact: context?.existingPlan?.phoneNumber || '',
      },
      notes: {
        orgId: String(context?.existingPlan?.orgid || ''),
        action: context?.suggestedAction || 'Buy',
      },
      theme: { color: '#10b981' },
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
      theme: { color: '#10b981' },
    });

    instance.open();
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    this.languageService.currentLanguage();
    return this.languageService.t(key, params);
  }
}
