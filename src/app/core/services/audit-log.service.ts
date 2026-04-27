import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  REGISTER = 'REGISTER',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  VIEW = 'VIEW',
  EXPORT = 'EXPORT',
  DOWNLOAD = 'DOWNLOAD',
  VERIFY_OTP = 'VERIFY_OTP',
  OTP_REQUESTED = 'OTP_REQUESTED'
}

export enum AuditModule {
  API = 'api',
  AUTH = 'auth',
  EMPLOYEES = 'employees',
  LEAVES = 'leaves',
  ATTENDANCE = 'attendance',
  PAYROLL = 'payroll',
  PROJECTS = 'projects',
  TIMESHEETS = 'timesheets',
  EXPENSES = 'expenses',
  ORGANIZATION = 'organization',
  SETTINGS = 'settings'
}

export interface AuditLog {
  id: number;
  orgId: number;
  employeeId: number;
  action: string;
  module: string;
  entityName: string;
  entityId: string;
  oldValues: any;
  newValues: any;
  ipAddress: string;
  userAgent: string;
  isImmutable: boolean;
  createdAt: string;
  countryCode?: string;
  countryName?: string;
  employee?: { id: number; firstName: string; lastName: string; email: string };
}

export interface AuditLogFilter {
  module?: string;
  action?: string;
  employeeId?: number;
  entityName?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/audit-logs`;

  logs = signal<AuditLog[]>([]);
  loading = signal<boolean>(false);
  totalItems = signal<number>(0);
  totalPages = signal<number>(0);
  currentPage = signal<number>(1);

  private autoRefreshEnabled = signal<boolean>(false);
  private autoRefreshInterval = 30000;
  private autoRefreshTimer: any;

  fetchLogs(module?: string, limit = 50, page = 1, filter?: AuditLogFilter): Observable<any> {
    this.loading.set(true);
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (module) params = params.set('module', module);
    if (filter?.action) params = params.set('action', filter.action);
    if (filter?.startDate) params = params.set('startDate', filter.startDate);
    if (filter?.endDate) params = params.set('endDate', filter.endDate);
    if (filter?.search) params = params.set('search', filter.search);

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      tap({
        next: (res) => {
          this.logs.set(res.data || res);
          this.totalItems.set(res.meta?.total || res.total || 0);
          this.totalPages.set(res.meta?.totalPages || res.totalPages || 1);
          this.currentPage.set(page);
          this.loading.set(false);
        },
        error: () => {
          this.logs.set([]);
          this.totalItems.set(0);
          this.totalPages.set(1);
          this.currentPage.set(page);
          this.loading.set(false);
        }
      })
    );
  }

  createLog(payload: any): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  logAction(action: AuditAction | string, module: AuditModule | string, options?: {
    entityName?: string;
    entityId?: string;
    oldValues?: any;
    newValues?: any;
  }): Observable<any> {
    const payload = {
      action,
      module,
      entityName: options?.entityName,
      entityId: options?.entityId,
      oldValues: options?.oldValues,
      newValues: options?.newValues
    };
    return this.createLog(payload);
  }

  exportToCSV(): void {
    const logs = this.logs();
    if (!logs.length) return;
    const headers = ['ID', 'Timestamp', 'Actor', 'Action', 'Module', 'Entity', 'IP'];
    const rows = logs.map(l => [l.id, l.createdAt, l.employee?.firstName || 'System', l.action, l.module, l.entityName || '', l.ipAddress || '']);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  enableAutoRefresh(intervalMs = 30000): void {
    this.disableAutoRefresh();
    this.autoRefreshEnabled.set(true);
    this.autoRefreshInterval = intervalMs;
    this.autoRefreshTimer = setInterval(() => {
      if (this.autoRefreshEnabled()) {
        this.fetchLogs(undefined, 50, this.currentPage()).subscribe();
      }
    }, intervalMs);
  }

  disableAutoRefresh(): void {
    if (this.autoRefreshTimer) clearInterval(this.autoRefreshTimer);
    this.autoRefreshEnabled.set(false);
  }

  toggleAutoRefresh(intervalMs?: number): void {
    if (this.autoRefreshEnabled()) this.disableAutoRefresh();
    else this.enableAutoRefresh(intervalMs || this.autoRefreshInterval);
  }

  isAutoRefreshEnabled(): boolean { return this.autoRefreshEnabled(); }
}
