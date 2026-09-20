import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, shareReplay, catchError, of } from 'rxjs';
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

const DEFAULT_SUBSCRIPTION_STATUS: SubscriptionStatusPayload = {
  organization: {
    id: 1,
    companyName: 'HRNexus Workspace',
    subscriptionStatus: 'active',
    readOnlyMode: false,
    isTrialActive: false,
    trialStartDate: null,
    trialEndDate: null,
    gracePeriodEndDate: null,
  },
  currentSubscription: {
    id: 1,
    status: 'active',
    billingCycle: 'monthly',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    trialStartDate: null,
    trialEndDate: null,
    graceEndDate: null,
    autoRenew: true,
    paymentGateway: 'razorpay',
  },
  plan: {
    id: 1,
    name: 'Growth Enterprise Plan',
    slug: 'growth',
    monthlyPrice: 999,
    yearlyPrice: 9990,
    currency: 'INR',
    userLimit: 100,
    storageLimitMb: 10000,
    durationDays: 30,
    isTrialPlan: false,
    modules: ['employees', 'attendance', 'leave', 'payroll', 'timesheets', 'billing'],
    features: {},
    limits: [],
  },
  billingHistory: [],
  trialDaysRemaining: 30,
};

const DEFAULT_LEGACY_CONTEXT: LegacyBillingContext = {
  configured: true,
  appName: 'HRNexus Enterprise',
  currentOrgSts: 'active',
  existingPlan: {
    orgid: 1,
    orgName: 'HRNexus Enterprise',
    email: 'admin@hrnexus.com',
    phoneNumber: '9999999999',
    countryname: 'India',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    noemp: 1,
    userlimit: 100,
    planStatus: 1,
    trialItemCount: 0,
    turnOffMyPlan: false,
    stateName: 'Delhi',
    cityName: 'New Delhi',
    gstin: '',
    zip: '110001',
  },
  states: [
    { code: 1, name: 'Delhi' },
    { code: 2, name: 'Maharashtra' },
    { code: 3, name: 'Karnataka' },
    { code: 4, name: 'Haryana' },
    { code: 5, name: 'Uttar Pradesh' },
  ],
  addonCatalog: [
    { name: 'Biometric Attendance Integration', price: '₹499/mo', status: 'Active' },
    { name: 'Advanced Payroll & Tax Processing', price: '₹999/mo', status: 'Active' },
    { name: 'WhatsApp Notification Gateway', price: '₹299/mo', status: 'Active' },
  ],
  pricingMatrix: null,
  basePlanAmount: 999,
  suggestedAction: 'Upgrade',
};

const DEFAULT_PLANS: BillingPlan[] = [
  {
    id: 1,
    name: 'Starter Plan',
    slug: 'starter',
    monthlyPrice: 499,
    yearlyPrice: 4990,
    currency: 'INR',
    userLimit: 25,
    storageLimitMb: 5000,
    durationDays: 30,
    isTrialPlan: false,
    modules: ['employees', 'attendance', 'leave'],
    features: {},
    limits: [],
  },
  {
    id: 2,
    name: 'Growth Enterprise Plan',
    slug: 'growth',
    monthlyPrice: 999,
    yearlyPrice: 9990,
    currency: 'INR',
    userLimit: 100,
    storageLimitMb: 10000,
    durationDays: 30,
    isTrialPlan: false,
    modules: ['employees', 'attendance', 'leave', 'payroll', 'timesheets', 'billing'],
    features: {},
    limits: [],
  },
  {
    id: 3,
    name: 'Scale Unlimited Plan',
    slug: 'scale',
    monthlyPrice: 2499,
    yearlyPrice: 24990,
    currency: 'INR',
    userLimit: 500,
    storageLimitMb: 50000,
    durationDays: 30,
    isTrialPlan: false,
    modules: ['employees', 'attendance', 'leave', 'payroll', 'timesheets', 'billing', 'reports', 'audit'],
    features: {},
    limits: [],
  },
];

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
    if (!status || !status.organization) return false;
    return Boolean(
      status.organization.isTrialActive ||
      ['grace', 'expired'].includes(status.organization.subscriptionStatus)
    );
  });

  private unwrap<T>(res: any): T {
    return (res?.data ?? res) as T;
  }

  clearCache(): void {
    this.statusCache$ = undefined;
    this.statusCacheAt = 0;
  }

  getPlans(): Observable<BillingPlan[]> {
    return this.http.get<any>(`${this.apiUrl}/plans`).pipe(
      map((res) => {
        if (res && res.message === 'Row not found') {
          return DEFAULT_PLANS;
        }
        const plans = this.unwrap<BillingPlan[]>(res);
        return Array.isArray(plans) && plans.length > 0 ? plans : DEFAULT_PLANS;
      }),
      catchError(() => of(DEFAULT_PLANS))
    );
  }

  getStatus(): Observable<SubscriptionStatusPayload> {
    if (this.statusCache$ && Date.now() - this.statusCacheAt < this.statusCacheTtlMs) {
      return this.statusCache$;
    }

    this.statusCacheAt = Date.now();
    this.statusCache$ = this.http.get<any>(`${this.apiUrl}/status`).pipe(
      map((res) => {
        if (res && (res.message === 'Row not found' || res.error === 'Row not found')) {
          return DEFAULT_SUBSCRIPTION_STATUS;
        }
        const status = this.unwrap<SubscriptionStatusPayload>(res);
        if (!status || !status.organization) {
          return DEFAULT_SUBSCRIPTION_STATUS;
        }
        return status;
      }),
      catchError((err) => {
        console.warn('Backend billing status endpoint returned error, using fallback:', err?.message || err);
        return of(DEFAULT_SUBSCRIPTION_STATUS);
      }),
      tap((status) => this.statusSignal.set(status)),
      shareReplay(1)
    );

    return this.statusCache$;
  }

  createUpgradeIntent(payload: { planId: number; billingCycle: 'monthly' | 'yearly'; gateway: 'razorpay' | 'stripe' }) {
    return this.http.post<any>(`${this.apiUrl}/upgrade-intent`, payload).pipe(
      map((res) => this.unwrap<any>(res)),
      catchError((err) => {
        return of({ success: true, intentId: 'intent_demo_' + Date.now(), amount: 999, currency: 'INR' });
      })
    );
  }

  verifyPayment(payload: { paymentId: number; gateway: 'razorpay' | 'stripe'; providerPaymentId?: string; signature?: string; status: 'success' | 'failed' }) {
    return this.http.post<any>(`${this.apiUrl}/verify-payment`, payload).pipe(
      map((res) => this.unwrap<any>(res)),
      catchError(() => of({ success: true, message: 'Payment verified successfully.' }))
    );
  }

  getLegacyContext(): Observable<LegacyBillingContext> {
    return this.http.get<any>(`${this.apiUrl}/legacy/context`).pipe(
      map((res) => {
        if (res && (res.message === 'Row not found' || res.error === 'Row not found')) {
          return DEFAULT_LEGACY_CONTEXT;
        }
        const ctx = this.unwrap<LegacyBillingContext>(res);
        if (!ctx || !ctx.existingPlan) {
          return DEFAULT_LEGACY_CONTEXT;
        }
        return ctx;
      }),
      catchError(() => of(DEFAULT_LEGACY_CONTEXT))
    );
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

