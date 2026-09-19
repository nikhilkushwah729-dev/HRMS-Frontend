import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PlatformOrganizationSummary {
  id: number;
  name: string;
  email: string | null;
  status: string;
  subscriptionStatus: string;
  employeeCount: number;
  activeModules: number;
  planName: string;
  createdAt: string | null;
}

export interface PlatformModuleSummary {
  slug: string;
  name: string;
  activeOrganizations: number;
  totalOrganizations: number;
}

export interface PlatformSubscriptionSummary {
  active: number;
  trial: number;
  expired: number;
  revenue: number;
  currency: string;
}

export interface PlatformOverview {
  scope: 'platform' | 'organization';
  totals: {
    organizations: number;
    activeUsers: number;
    modulesEnabled: number;
    subscriptions: number;
  };
  organizations: PlatformOrganizationSummary[];
  modules: PlatformModuleSummary[];
  subscription: PlatformSubscriptionSummary;
}

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/platform`;
  private readonly fallbackOverview: PlatformOverview = {
    scope: 'organization',
    totals: {
      organizations: 1,
      activeUsers: 0,
      modulesEnabled: 0,
      subscriptions: 0,
    },
    organizations: [],
    modules: [],
    subscription: {
      active: 0,
      trial: 0,
      expired: 0,
      revenue: 0,
      currency: 'INR',
    },
  };

  getOverview(): Observable<PlatformOverview> {
    return this.http.get<any>(`${this.apiUrl}/overview`).pipe(
      map((res) => (res?.data ?? res) as PlatformOverview),
      catchError(() => of(this.fallbackOverview)),
    );
  }
}
