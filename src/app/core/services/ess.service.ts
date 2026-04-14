import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EssRequest {
  id: number;
  requestType: string;
  title: string;
  description?: string | null;
  requestDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  amount?: number | null;
  status: string;
  attachmentUrl?: string | null;
  resolutionNote?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface EssDashboardPayload {
  summary: {
    presentDays: number;
    lateDays: number;
    leaveCount: number;
    pendingRequests: number;
    latestNetSalary: number;
    unreadNotifications: number;
    documents: number;
  };
  upcomingHolidays: Array<{ id: number; name: string; date: string; isOptional: boolean }>;
  recentNotifications: Array<{ id: number; title: string; message: string; type: string; isRead: boolean; createdAt: string }>;
  requestBreakdown: Array<{ type: string; count: number }>;
}

@Injectable({ providedIn: 'root' })
export class EssService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/ess`;

  private unwrap<T>(res: any): T {
    return (res?.data ?? res) as T;
  }

  getDashboard(): Observable<EssDashboardPayload> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`).pipe(map((res) => this.unwrap<EssDashboardPayload>(res)));
  }

  getRequests(filters?: { type?: string; status?: string }): Observable<EssRequest[]> {
    let params = new HttpParams();
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.status) params = params.set('status', filters.status);
    return this.http.get<any>(`${this.apiUrl}/requests`, { params }).pipe(map((res) => this.unwrap<EssRequest[]>(res)));
  }

  createRequest(payload: any): Observable<EssRequest> {
    return this.http.post<any>(`${this.apiUrl}/requests`, payload).pipe(map((res) => this.unwrap<EssRequest>(res)));
  }

  cancelRequest(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/requests/${id}/cancel`, {});
  }

  getProfileAudit(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/profile-audit`).pipe(map((res) => this.unwrap<any[]>(res)));
  }

  getLoginActivity(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/login-activity`).pipe(map((res) => this.unwrap<any[]>(res)));
  }

  changePassword(payload: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/change-password`, payload);
  }
}
