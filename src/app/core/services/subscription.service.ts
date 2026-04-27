import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BillingPlan {
  id: number;
  name: string;
  slug: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  userLimit: number;
  storageLimitMb: number;
  durationDays: number;
  isTrialPlan: boolean;
  modules: string[];
  features: Record<string, any>;
  limits: Array<{ key: string; label: string; type: string; enabled: boolean; value?: string | null }>;
}

export interface SubscriptionStatusPayload {
  organization: {
    id: number;
    companyName: string;
    subscriptionStatus: string;
    readOnlyMode: boolean;
    isTrialActive: boolean;
    trialStartDate: string | null;
    trialEndDate: string | null;
    gracePeriodEndDate: string | null;
  };
  currentSubscription: {
    id: number;
    status: string;
    billingCycle: string;
    startDate: string | null;
    endDate: string | null;
    trialStartDate: string | null;
    trialEndDate: string | null;
    graceEndDate: string | null;
    autoRenew: boolean;
    paymentGateway: string | null;
  } | null;
  plan: BillingPlan | null;
  billingHistory: Array<{
    id: number;
    amount: number;
    currency: string;
    status: string;
    gateway: string;
    billingCycle: string | null;
    createdAt: string | null;
    invoiceUrl: string | null;
  }>;
  trialDaysRemaining: number | null;
}

export interface LegacyBillingContext {
  configured: boolean;
  appName: string;
  currentOrgSts: string;
  existingPlan: {
    orgid: number;
    orgName: string;
    email: string;
    phoneNumber: string;
    countryname: string;
    startDate: string | null;
    endDate: string | null;
    noemp: number;
    userlimit: number;
    planStatus: number;
    trialItemCount: number;
    turnOffMyPlan: boolean;
    stateName: string;
    cityName: string;
    gstin: string;
    zip: string;
  };
  states: Array<{ code: number; name: string }>;
  addonCatalog: Array<{ name: string; price: string; status: string }>;
  pricingMatrix: Record<string, string> | null;
  basePlanAmount: number;
  suggestedAction: 'Buy' | 'Upgrade';
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/billing`;
  private readonly statusCacheTtlMs = 5 * 60 * 1000;

  private statusSignal = signal<SubscriptionStatusPayload | null>(null);
  private statusCache$?: Observable<SubscriptionStatusPayload>;
  private statusCacheAt = 0;
  readonly status = this.statusSignal.asReadonly();
  readonly bannerVisible = computed(() => {
    const status = this.statusSignal();
    if (!status) return false;
    return Boolean(
      status.organization.isTrialActive ||
      ['grace', 'expired'].includes(status.organization.subscriptionStatus)
    );
  });

  private unwrap<T>(res: any): T {
    return (res?.data ?? res) as T;
  }

  getPlans(): Observable<BillingPlan[]> {
    return this.http.get<any>(`${this.apiUrl}/plans`).pipe(map((res) => this.unwrap<BillingPlan[]>(res)));
  }

  getStatus(): Observable<SubscriptionStatusPayload> {
    if (this.statusCache$ && Date.now() - this.statusCacheAt < this.statusCacheTtlMs) {
      return this.statusCache$;
    }

    this.statusCacheAt = Date.now();
    this.statusCache$ = this.http.get<any>(`${this.apiUrl}/status`).pipe(
      map((res) => this.unwrap<SubscriptionStatusPayload>(res)),
      tap((status) => this.statusSignal.set(status)),
      shareReplay(1)
    );

    return this.statusCache$;
  }

  createUpgradeIntent(payload: { planId: number; billingCycle: 'monthly' | 'yearly'; gateway: 'razorpay' | 'stripe' }) {
    return this.http.post<any>(`${this.apiUrl}/upgrade-intent`, payload).pipe(map((res) => this.unwrap<any>(res)));
  }

  verifyPayment(payload: { paymentId: number; gateway: 'razorpay' | 'stripe'; providerPaymentId?: string; signature?: string; status: 'success' | 'failed' }) {
    return this.http.post<any>(`${this.apiUrl}/verify-payment`, payload).pipe(map((res) => this.unwrap<any>(res)));
  }

  getLegacyContext(): Observable<LegacyBillingContext> {
    return this.http.get<any>(`${this.apiUrl}/legacy/context`).pipe(map((res) => this.unwrap<LegacyBillingContext>(res)));
  }

  legacyPurchase(payload: {
    nouser: number;
    selectedAddons: Array<{ name: string; status: boolean }>;
    paymentMethod: string;
    state: string;
    country: string;
    zip?: string;
    city?: string;
    name: string;
    duration: number;
    durationType: string;
    subtotal?: number;
    tax?: number;
    paymentAmount?: number;
    gstin?: string;
    remark?: string;
    action: 'Buy' | 'Upgrade';
  }) {
    return this.http.post<any>(`${this.apiUrl}/legacy/purchase`, payload).pipe(map((res) => this.unwrap<any>(res)));
  }

  legacyConfirm(payload: {
    paymentRecordId: number;
    orderId: string;
    paymentStatus: string;
    paymentRzrId: string;
    nouser: number;
    duration: number;
    durationType: string;
    action: 'Buy' | 'Upgrade';
  }) {
    return this.http.post<any>(`${this.apiUrl}/legacy/confirm`, payload).pipe(map((res) => this.unwrap<any>(res)));
  }
}
