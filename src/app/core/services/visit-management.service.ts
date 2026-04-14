import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export type VisitStatus =
  | 'pending_approval'
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'rejected';

export interface VisitClient {
  id: number;
  name: string;
  industry?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
}

export interface VisitVisitor {
  id: number;
  clientId?: number | null;
  clientName?: string | null;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  designation?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
}

export interface VisitEmployeeReference {
  id: number;
  fullName: string;
  email?: string | null;
  roleId?: number | null;
  managerId?: number | null;
}

export interface VisitNote {
  id: number;
  noteType: string;
  content: string;
  attachmentUrls: string[];
  photoProofUrl?: string | null;
  createdAt: string;
  employee?: { id: number; name: string } | null;
}

export interface VisitFollowUp {
  id: number;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  dueAt?: string | null;
  completedAt?: string | null;
  assignedTo?: { id: number; name: string } | null;
}

export interface VisitRecord {
  id: number;
  title: string;
  purpose: string;
  visitType: string;
  priority: string;
  status: VisitStatus;
  locationName?: string | null;
  requiresApproval: boolean;
  scheduledStart: string;
  scheduledEnd?: string | null;
  reminderAt?: string | null;
  approvedAt?: string | null;
  approvalNotes?: string | null;
  completionNotes?: string | null;
  actualCheckInAt?: string | null;
  actualCheckOutAt?: string | null;
  photoProofUrl?: string | null;
  attachmentUrls: string[];
  client?: VisitClient | null;
  visitor?: VisitVisitor | null;
  host?: { id: number; name: string; email?: string | null } | null;
  approver?: { id: number; name: string } | null;
  createdBy?: { id: number; name: string } | null;
  gps?: {
    checkIn?: { latitude: number; longitude: number; address?: string } | null;
    checkOut?: { latitude: number; longitude: number; address?: string } | null;
  };
  notes: VisitNote[];
  followUps: VisitFollowUp[];
}

export interface VisitDashboardSummary {
  total: number;
  planned: number;
  inProgress: number;
  completed: number;
  pendingApproval: number;
  todaysVisits: number;
  overdueFollowUps: number;
  upcomingReminders: number;
}

export interface VisitDashboardResponse {
  summary: VisitDashboardSummary;
  statusBreakdown: Array<{ status: string; count: number }>;
  hostBreakdown: Array<{ hostName: string; count: number }>;
  upcomingVisits: VisitRecord[];
  dueFollowUps: Array<VisitFollowUp & { visitId: number; visitTitle: string }>;
  recentActivity: Array<{
    visitId: number;
    visitTitle: string;
    noteType: string;
    content: string;
    createdAt: string;
    employee?: { id: number; name: string } | null;
  }>;
}

export interface VisitReferencesResponse {
  role: { id?: number | null; name: string };
  clients: VisitClient[];
  visitors: VisitVisitor[];
  employees: VisitEmployeeReference[];
}

@Injectable({ providedIn: 'root' })
export class VisitManagementService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/visits`;

  private unwrap<T>(response: any): T {
    return (response?.data ?? response) as T;
  }

  getDashboard(): Observable<VisitDashboardResponse> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`).pipe(map((res) => this.unwrap<VisitDashboardResponse>(res)));
  }

  getReferences(): Observable<VisitReferencesResponse> {
    return this.http.get<any>(`${this.apiUrl}/references`).pipe(map((res) => this.unwrap<VisitReferencesResponse>(res)));
  }

  getReports(filters?: { status?: string; search?: string; dateFrom?: string; dateTo?: string }): Observable<any> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params = params.set('dateTo', filters.dateTo);
    return this.http.get<any>(`${this.apiUrl}/reports`, { params }).pipe(map((res) => this.unwrap<any>(res)));
  }

  exportReports(format: 'csv' | 'json' = 'csv', filters?: { status?: string; search?: string; dateFrom?: string; dateTo?: string }): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params = params.set('dateTo', filters.dateTo);
    return this.http.get(`${this.apiUrl}/reports/export`, { params, responseType: 'blob' });
  }

  getVisits(filters?: { status?: string; search?: string; dateFrom?: string; dateTo?: string }): Observable<VisitRecord[]> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params = params.set('dateTo', filters.dateTo);
    return this.http.get<any>(this.apiUrl, { params }).pipe(map((res) => this.unwrap<VisitRecord[]>(res)));
  }

  getVisit(id: number): Observable<VisitRecord> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map((res) => this.unwrap<VisitRecord>(res)));
  }

  createVisit(payload: any): Observable<VisitRecord> {
    return this.http.post<any>(this.apiUrl, payload).pipe(map((res) => this.unwrap<VisitRecord>(res)));
  }

  updateVisit(id: number, payload: any): Observable<VisitRecord> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload).pipe(map((res) => this.unwrap<VisitRecord>(res)));
  }

  reviewVisit(id: number, action: 'approve' | 'reject', notes?: string): Observable<VisitRecord> {
    return this.http.post<any>(`${this.apiUrl}/${id}/review`, { action, notes }).pipe(map((res) => this.unwrap<VisitRecord>(res)));
  }

  checkIn(id: number, payload: any): Observable<VisitRecord> {
    return this.http.post<any>(`${this.apiUrl}/${id}/check-in`, payload).pipe(map((res) => this.unwrap<VisitRecord>(res)));
  }

  checkOut(id: number, payload: any): Observable<VisitRecord> {
    return this.http.post<any>(`${this.apiUrl}/${id}/check-out`, payload).pipe(map((res) => this.unwrap<VisitRecord>(res)));
  }

  addNote(id: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/notes`, payload).pipe(map((res) => this.unwrap<any>(res)));
  }

  addFollowUp(id: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/follow-ups`, payload).pipe(map((res) => this.unwrap<any>(res)));
  }

  updateFollowUp(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/follow-ups/${id}`, payload).pipe(map((res) => this.unwrap<any>(res)));
  }

  getClients(): Observable<VisitClient[]> {
    return this.http.get<any>(`${this.apiUrl}/clients`).pipe(map((res) => this.unwrap<VisitClient[]>(res)));
  }

  createClient(payload: any): Observable<VisitClient> {
    return this.http.post<any>(`${this.apiUrl}/clients`, payload).pipe(map((res) => this.unwrap<VisitClient>(res)));
  }

  updateClient(id: number, payload: any): Observable<VisitClient> {
    return this.http.put<any>(`${this.apiUrl}/clients/${id}`, payload).pipe(map((res) => this.unwrap<VisitClient>(res)));
  }

  getVisitors(): Observable<VisitVisitor[]> {
    return this.http.get<any>(`${this.apiUrl}/visitors`).pipe(map((res) => this.unwrap<VisitVisitor[]>(res)));
  }

  createVisitor(payload: any): Observable<VisitVisitor> {
    return this.http.post<any>(`${this.apiUrl}/visitors`, payload).pipe(map((res) => this.unwrap<VisitVisitor>(res)));
  }

  updateVisitor(id: number, payload: any): Observable<VisitVisitor> {
    return this.http.put<any>(`${this.apiUrl}/visitors/${id}`, payload).pipe(map((res) => this.unwrap<VisitVisitor>(res)));
  }
}
