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

export interface PlatformAddon {
  id: number;
  name: string;
  slug: string;
  price: number;
  enabled: boolean;
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

export interface PlatformUser {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  employeeCode: string;
  roleName: string;
  status: string;
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

  createOrganization(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/organizations`, payload).pipe(
      map(res => res?.data ?? res)
    );
  }

  updateOrganization(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/organizations/${id}`, payload).pipe(
      map(res => res?.data ?? res)
    );
  }

  deleteOrganization(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/organizations/${id}`);
  }

  getOrganizationAddons(id: number): Observable<PlatformAddon[]> {
    return this.http.get<any>(`${this.apiUrl}/organizations/${id}/addons`).pipe(
      map(res => (res?.data ?? res) as PlatformAddon[]),
      catchError(() => of([]))
    );
  }

  updateOrganizationAddons(id: number, addons: Array<{ id: number; enabled: boolean }>): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/organizations/${id}/addons`, { addons });
  }

  getOrganizationUsers(id: number): Observable<PlatformUser[]> {
    return this.http.get<any>(`${this.apiUrl}/organizations/${id}/users`).pipe(
      map(res => (res?.data ?? res) as PlatformUser[]),
      catchError(() => of([]))
    );
  }

  resetUserPassword(userId: number, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/${userId}/reset-password`, { password });
  }
}
