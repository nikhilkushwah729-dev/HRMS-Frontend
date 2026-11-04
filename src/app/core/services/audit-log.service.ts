import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap, of } from 'rxjs';

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
  IMPORT = 'IMPORT',
  ROLE_CHANGE = 'ROLE_CHANGE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  DOWNLOAD = 'DOWNLOAD',
  VERIFY_OTP = 'VERIFY_OTP',
  OTP_REQUESTED = 'OTP_REQUESTED',
}

export enum AuditModule {
  API = 'api',
  AUTH = 'auth',
  EMPLOYEE = 'EMPLOYEE',
  EMPLOYEES = 'employees',
  LEAVE = 'LEAVE',
  LEAVES = 'leaves',
  ATTENDANCE = 'attendance',
  PAYROLL = 'payroll',
  PROJECTS = 'projects',
  EXPENSES = 'expenses',
  TIMESHEET = 'TIMESHEET',
  TIMESHEETS = 'timesheets',
  USER = 'USER',
  ROLE_PERMISSION = 'ROLE_PERMISSION',
  ORGANIZATION = 'organization',
  SUBSCRIPTION = 'SUBSCRIPTION',
  SETTINGS = 'settings',
  REPORTS = 'REPORTS',
}

export interface AuditLog {
  id: number;
  orgId: number | null;
  userId: number | null;
  employeeId: number | null;
  action: string;
  module: string;
  entityType?: string;
  entityName?: string;
  entityId: string | null;
  description?: string;
  oldValues: any;
  newValues: any;
  ipAddress: string | null;
  userAgent: string | null;
  requestMethod?: string;
  requestUrl?: string;
  status: string;
  isImmutable?: boolean;
  createdAt: string;
  countryCode?: string;
  countryName?: string;
  employee?: { id: number; firstName: string; lastName: string; email: string; role?: { roleName: string } };
}

export interface AuditLogFilter {
  module?: string;
  action?: string;
  employeeId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditStatistics {
  totalActivities: number;
  createActions: number;
  updateActions: number;
  deleteActions: number;
  loginActivities: number;
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
  statistics = signal<AuditStatistics>({
    totalActivities: 0,
    createActions: 0,
    updateActions: 0,
    deleteActions: 0,
    loginActivities: 0,
  });

  private autoRefreshEnabled = signal<boolean>(false);
  private autoRefreshInterval = 30000;
  private autoRefreshTimer: any;

  fetchLogs(module?: string, limit = 50, page = 1, filter?: AuditLogFilter): Observable<any> {
    this.loading.set(true);
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (module) params = params.set('module', module);
    if (filter?.action) params = params.set('action', filter.action);
    if (filter?.status) params = params.set('status', filter.status);
    if (filter?.startDate) params = params.set('startDate', filter.startDate);
    if (filter?.endDate) params = params.set('endDate', filter.endDate);
    if (filter?.search) params = params.set('search', filter.search);
    if (filter?.sortBy) params = params.set('sortBy', filter.sortBy);
    if (filter?.sortOrder) params = params.set('sortOrder', filter.sortOrder);

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      tap({
        next: (res) => {
          const list = res.data || res;
          this.logs.set(Array.isArray(list) ? list : []);
          this.totalItems.set(res.meta?.total || 0);
          this.totalPages.set(res.meta?.lastPage || res.meta?.totalPages || 1);
          this.currentPage.set(page);
          this.loading.set(false);
        },
        error: () => {
          this.logs.set([]);
          this.totalItems.set(0);
          this.totalPages.set(1);
          this.currentPage.set(page);
          this.loading.set(false);
        },
      })
    );
  }

  fetchStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/statistics`).pipe(
      tap({
        next: (res) => {
          if (res?.data) {
            this.statistics.set(res.data);
          }
        },
      })
    );
  }

  fetchLogById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  exportLogs(filter?: AuditLogFilter): Observable<any> {
    let params = new HttpParams();
    if (filter?.module) params = params.set('module', filter.module);
    if (filter?.action) params = params.set('action', filter.action);
    if (filter?.status) params = params.set('status', filter.status);
    if (filter?.startDate) params = params.set('startDate', filter.startDate);
    if (filter?.endDate) params = params.set('endDate', filter.endDate);
    if (filter?.search) params = params.set('search', filter.search);

    return this.http.get<any>(`${this.apiUrl}/export`, { params });
  }

  exportToCSV(): void {
    this.exportLogs().subscribe({
      next: (res) => {
        const csvContent = res.data || res;
        if (!csvContent) return;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      },
      error: () => {
        const logs = this.logs();
        if (!logs.length) return;
        const headers = ['ID', 'Date & Time', 'User', 'Action', 'Module', 'Description', 'Status', 'IP Address'];
        const rows = logs.map((l) => [
          l.id,
          l.createdAt,
          l.employee ? `${l.employee.firstName} ${l.employee.lastName || ''}`.trim() : 'System',
          l.action,
          l.module,
          l.description || '',
          l.status || 'success',
          l.ipAddress || '',
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      },
    });
  }

  logAction(
    _action: AuditAction | string,
    _module: AuditModule | string,
    _options?: {
      entityName?: string;
      entityId?: string;
      oldValues?: any;
      newValues?: any;
    }
  ): Observable<any> {
    // Backward-compatibility stub: Server-side now handles audit logging securely
    return of({ status: 'success' });
  }

  enableAutoRefresh(intervalMs = 30000): void {
    this.disableAutoRefresh();
    this.autoRefreshEnabled.set(true);
    this.autoRefreshInterval = intervalMs;
    this.autoRefreshTimer = setInterval(() => {
      if (this.autoRefreshEnabled()) {
        this.fetchLogs(undefined, 50, this.currentPage()).subscribe();
        this.fetchStatistics().subscribe();
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

  isAutoRefreshEnabled(): boolean {
    return this.autoRefreshEnabled();
  }
}
