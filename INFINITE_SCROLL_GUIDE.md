# Infinite Scroll Implementation Guide for Audit Logs

## Overview
This guide provides the code changes needed to implement YouTube-style infinite scrolling for the Audit Logs page.

---

## File 1: src/app/core/services/audit-log.service.ts

Replace the entire file with this updated version that supports infinite scrolling:

```typescript
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap, map, BehaviorSubject, interval, Subscription } from 'rxjs';

// ============================================
// ENUMS
// ============================================

export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    LOGIN_FAILED = 'LOGIN_FAILED',
    PASSWORD_CHANGE = 'PASSWORD_CHANGE',
    PASSWORD_RESET = 'PASSWORD_RESET',
    EMAIL_VERIFY = 'EMAIL_VERIFY',
    APPROVE = 'APPROVE',
    REJECT = 'REJECT',
    EXPORT = 'EXPORT',
    IMPORT = 'IMPORT',
    VIEW = 'VIEW',
    DOWNLOAD = 'DOWNLOAD',
    ARCHIVE = 'ARCHIVE',
    RESTORE = 'RESTORE',
    LOCK = 'LOCK',
    UNLOCK = 'UNLOCK',
    FORGOT_PASSWORD = 'FORGOT_PASSWORD',
    VERIFY_OTP = 'VERIFY_OTP',
    OTP_REQUESTED = 'OTP_REQUESTED',
    REGISTER = 'REGISTER',
    SOCIAL_LOGIN = 'SOCIAL_LOGIN'
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
    SETTINGS = 'settings',
    REPORTS = 'reports',
    DASHBOARD = 'dashboard',
    AUDIT_LOGS = 'audit_logs',
    ANNOUNCEMENTS = 'announcements',
    NOTIFICATIONS = 'notifications'
}

// ============================================
// INTERFACES
// ============================================

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
    employee?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
}

export interface AuditLogCreatePayload {
    action: AuditAction | string;
    module: AuditModule | string;
    entityName?: string;
    entityId?: string;
    oldValues?: any;
    newValues?: any;
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

export interface PaginatedAuditLogs {
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface AuditLogStats {
    totalLogs: number;
    todayLogs: number;
    byAction: { [key: string]: number };
    byModule: { [key: string]: number };
}

// ============================================
// SERVICE
// ============================================

@Injectable({
    providedIn: 'root'
})
export class AuditLogService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/audit-logs`;

    // Signals for state management
    logs = signal<AuditLog[]>([]);
    loading = signal<boolean>(false);
    stats = signal<AuditLogStats | null>(null);
    
    // Pagination state
    currentPage = signal<number>(1);
    totalItems = signal<number>(0);
    itemsPerPage = signal<number>(20);
    totalPages = signal<number>(0);

    // Infinite scroll state
    hasMore = signal<boolean>(true);
    isLoadingMore = signal<boolean>(false);

    // Filter state
    currentFilter = signal<AuditLogFilter>({});

    // Auto-refresh
    private autoRefreshSubscription: Subscription | null = null;
    private autoRefreshEnabled = signal<boolean>(false);
    private autoRefreshInterval = signal<number>(30000);

    // For real-time updates
    private logsSubject = new BehaviorSubject<AuditLog[]>([]);
    logs$ = this.logsSubject.asObservable();

    // ============================================
    // FETCH LOGS (with pagination and filters)
    // ============================================

    fetchLogs(
        module?: string, 
        limit: number = 20, 
        page: number = 1,
        filter?: AuditLogFilter,
        append: boolean = false
    ): Observable<{ status: string; data: AuditLog[]; total?: number; totalPages?: number }> {
        this.loading.set(true);
        
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (module) {
            params = params.set('module', module);
        }

        if (filter) {
            if (filter.action) params = params.set('action', filter.action);
            if (filter.employeeId) params = params.set('employeeId', filter.employeeId.toString());
            if (filter.entityName) params = params.set('entityName', filter.entityName);
            if (filter.entityId) params = params.set('entityId', filter.entityId);
            if (filter.startDate) params = params.set('startDate', filter.startDate);
            if (filter.endDate) params = params.set('endDate', filter.endDate);
            if (filter.search) params = params.set('search', filter.search);
        }

        return this.http.get<{ status: string; data: AuditLog[]; total?: number; totalPages?: number }>(
            this.apiUrl, 
            { params }
        ).pipe(
            tap({
                next: (response) => {
                    if (append) {
                        const currentLogs = this.logs();
                        this.logs.set([...currentLogs, ...response.data]);
                    } else {
                        this.logs.set(response.data);
                    }
                    
                    this.currentPage.set(page);
                    this.itemsPerPage.set(limit);
                    
                    if (response.total !== undefined) {
                        this.totalItems.set(response.total);
                        const calculatedTotalPages = response.totalPages || Math.ceil(response.total / limit);
                        this.totalPages.set(calculatedTotalPages);
                        this.hasMore.set(page < calculatedTotalPages);
                    }
                    
                    this.logsSubject.next(response.data);
                    this.loading.set(false);
                },
                error: () => this.loading.set(false)
            })
        );
    }

    // ============================================
    // LOAD MORE (for infinite scroll)
    // ============================================

    loadMore(): Observable<{ status: string; data: AuditLog[]; total?: number; totalPages?: number }> | null {
        if (this.isLoadingMore() || !this.hasMore()) {
            return null;
        }

        this.isLoadingMore.set(true);
        const nextPage = this.currentPage() + 1;

        return this.fetchLogs(
            this.currentFilter().module,
            this.itemsPerPage(),
            nextPage,
            this.currentFilter(),
            true
        ).pipe(
            tap({
                next: () => {
                    this.isLoadingMore.set(false);
                },
                error: () => {
                    this.isLoadingMore.set(false);
                }
            })
        );
    }

    // ============================================
    // RESET FOR NEW SEARCH (for filters)
    // ============================================

    resetAndFetch(
        module?: string, 
        limit: number = 20, 
        page: number = 1,
        filter?: AuditLogFilter
    ): Observable<{ status: string; data: AuditLog[]; total?: number; totalPages?: number }> {
        this.currentPage.set(1);
        this.hasMore.set(true);
        return this.fetchLogs(module, limit, page, filter, false);
    }

    // ============================================
    // CREATE LOG ENTRY
    // ============================================

    createLog(payload: AuditLogCreatePayload): Observable<{ status: string; data: AuditLog }> {
        return this.http.post<{ status: string; data: AuditLog }>(this.apiUrl, payload);
    }

    logAction(
        action: AuditAction | string,
        module: AuditModule | string,
        options?: {
            entityName?: string;
            entityId?: string;
            oldValues?: any;
            newValues?: any;
        }
    ): Observable<{ status: string; data: AuditLog }> {
        const payload: AuditLogCreatePayload = {
            action,
            module,
            entityName: options?.entityName,
            entityId: options?.entityId,
            oldValues: options?.oldValues,
            newValues: options?.newValues
        };
        return this.createLog(payload);
    }

    // ============================================
    // SEARCH LOGS
    // ============================================

    searchLogs(filter: AuditLogFilter): Observable<{ status: string; data: AuditLog[]; total?: number }> {
        this.loading.set(true);
        this.currentFilter.set(filter);

        let params = new HttpParams()
            .set('page', '1')
            .set('limit', '20');

        if (filter.module) params = params.set('module', filter.module);
        if (filter.action) params = params.set('action', filter.action);
        if (filter.employeeId) params = params.set('employeeId', filter.employeeId.toString());
        if (filter.entityName) params = params.set('entityName', filter.entityName);
        if (filter.entityId) params = params.set('entityId', filter.entityId);
        if (filter.startDate) params = params.set('startDate', filter.startDate);
        if (filter.endDate) params = params.set('endDate', filter.endDate);
        if (filter.search) params = params.set('search', filter.search);

        return this.http.get<{ status: string; data: AuditLog[]; total?: number }>(
            `${this.apiUrl}/search`, 
            { params }
        ).pipe(
            tap({
                next: (response) => {
                    this.logs.set(response.data);
                    this.currentPage.set(1);
                    this.totalItems.set(response.total || 0);
                    this.hasMore.set(false);
                    this.loading.set(false);
                },
                error: () => this.loading.set(false)
            })
        );
    }

    // ============================================
    // GET LOGS BY DATE RANGE
    // ============================================

    getLogsByDateRange(
        startDate: string,
        endDate: string,
        module?: string,
        limit: number = 20
    ): Observable<{ status: string; data: AuditLog[] }> {
        this.loading.set(true);

        let params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate)
            .set('limit', limit.toString());

        if (module) {
            params = params.set('module', module);
        }

        return this.http.get<{ status: string; data: AuditLog[] }>(
            `${this.apiUrl}/date-range`,
            { params }
        ).pipe(
            tap({
                next: (response) => {
                    this.logs.set(response.data);
                    this.loading.set(false);
                },
                error: () => this.loading.set(false)
            })
        );
    }

    // ============================================
    // GET STATISTICS
    // ============================================

    getStats(): Observable<{ status: string; data: AuditLogStats }> {
        return this.http.get<{ status: string; data: AuditLogStats }>(`${this.apiUrl}/stats`).pipe(
            tap({
                next: (response) => this.stats.set(response.data),
                error: () => {}
            })
        );
    }

    // ============================================
    // EXPORT TO CSV
    // ============================================

    exportToCSV(logs: AuditLog[] = this.logs()): void {
        if (logs.length === 0) {
            console.warn('No logs to export');
            return;
        }

        const headers = [
            'ID',
            'Timestamp',
            'Actor',
            'Email',
            'Action',
            'Module',
            'Entity Name',
            'Entity ID',
            'IP Address',
            'User Agent'
        ];

        const rows = logs.map(log => [
            log.id,
            log.createdAt,
            log.employee ? `${log.employee.firstName} ${log.employee.lastName}` : 'System',
            log.employee?.email || '',
            log.action,
            log.module,
            log.entityName || '',
            log.entityId || '',
            log.ipAddress || '',
            log.userAgent || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // ============================================
    // PAGINATION METHODS
    // ============================================

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages()) {
            this.fetchLogs(
                this.currentFilter().module,
                this.itemsPerPage(),
                page,
                this.currentFilter()
            ).subscribe();
        }
    }

    nextPage(): void {
        if (this.currentPage() < this.totalPages()) {
            this.goToPage(this.currentPage() + 1);
        }
    }

    previousPage(): void {
        if (this.currentPage() > 1) {
            this.goToPage(this.currentPage() - 1);
        }
    }

    // ============================================
    // AUTO-REFRESH FUNCTIONALITY
    // ============================================

    enableAutoRefresh(intervalMs: number = 30000): void {
        this.disableAutoRefresh();
        
        this.autoRefreshEnabled.set(true);
        this.autoRefreshInterval.set(intervalMs);

        this.autoRefreshSubscription = interval(intervalMs).pipe(
            tap(() => {
                if (this.autoRefreshEnabled()) {
                    this.fetchLogs(
                        this.currentFilter().module,
                        this.itemsPerPage(),
                        1,
                        this.currentFilter()
                    ).subscribe();
                }
            })
        ).subscribe();
    }

    disableAutoRefresh(): void {
        if (this.autoRefreshSubscription) {
            this.autoRefreshSubscription.unsubscribe();
            this.autoRefreshSubscription = null;
        }
        this.autoRefreshEnabled.set(false);
    }

    toggleAutoRefresh(intervalMs?: number): void {
        if (this.autoRefreshEnabled()) {
            this.disableAutoRefresh();
        } else {
            this.enableAutoRefresh(intervalMs || this.autoRefreshInterval());
        }
    }

    isAutoRefreshEnabled(): boolean {
        return this.autoRefreshEnabled();
    }

    // ============================================
    // GET LOG BY ID
    // ============================================

    getLogById(id: number): Observable<{ status: string; data: AuditLog }> {
        return this.http.get<{ status: string; data: AuditLog }>(`${this.apiUrl}/${id}`);
    }

    // ============================================
    // DELETE LOG (Admin only)
    // ============================================

    deleteLog(id: number): Observable<{ status: string }> {
        return this.http.delete<{ status: string }>(`${this.apiUrl}/${id}`);
    }

    deleteLogs(ids: number[]): Observable<{ status: string; deleted: number }> {
        return this.http.post<{ status: string; deleted: number }>(`${this.apiUrl}/bulk-delete`, { ids });
    }
}

export function createAuditLogHelper(service: AuditLogService) {
    return (
        action: AuditAction | string,
        module: AuditModule | string,
        options?: {
            entityName?: string;
            entityId?: string;
            oldValues?: any;
            newValues?: any;
        }
    ) => {
        service.logAction(action, module, options).subscribe({
            next: () => {},
            error: (err) => console.error('Failed to create audit log:', err)
        });
    };
}
```

---

## File 2: src/app/features/admin/audit-logs.component.ts

Replace the component with this infinite scroll version:

```typescript
import { Component, OnInit, OnDestroy, inject, signal, computed, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { 
    AuditLogService, 
    AuditLog, 
    AuditAction, 
    AuditModule,
    AuditLogFilter 
} from '../../core/services/audit-log.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: \`
    <div class="flex flex-col gap-6">
      <!-- Header Section -->
      <header class="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">System Audit Logs</h1>
          <p class="text-slate-500 text-sm mt-1">Track system activity, data changes, and security events.</p>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-3">
          <button 
            (click)="toggleAutoRefresh()" 
            class="px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
            [ngClass]="autoRefreshEnabled() ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                [ngClass]="{'animate-spin': autoRefreshEnabled()}"
            ><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
            {{ autoRefreshEnabled() ? 'Auto-Refresh On' : 'Auto-Refresh Off' }}
          </button>
          
          <button 
            (click)="exportCSV()" 
            [disabled]="logs().length === 0"
            class="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Export CSV
          </button>
          
          <button 
            (click)="refresh()" 
            [disabled]="loading()"
            class="bg-primary-600 text-white hover:bg-primary-700 px-5 py-2.5 rounded-xl font-bold shadow-md shadow-primary-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
             <svg [class.animate-spin]="loading()" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
             Refresh
          </button>
        </div>
      </header>

      <!-- Filters Section -->
      <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          
          <!-- Search -->
          <div class="relative">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Search</label>
            <div class="relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input 
                type="text" 
                [(ngModel)]="searchQuery"
                (keyup.enter)="applyFilters()"
                placeholder="Search by actor, entity..." 
                class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              >
            </div>

          <!-- Module Filter -->
          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Module</label>
            <select 
              [(ngModel)]="selectedModule" 
              (change)="applyFilters()"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
            >
              <option value="">All Modules</option>
              <option value="auth">Authentication</option>
              <option value="employees">Employees</option>
              <option value="leaves">Leaves</option>
              <option value="attendance">Attendance</option>
              <option value="payroll">Payroll</option>
              <option value="projects">Projects</option>
              <option value="timesheets">Timesheets</option>
              <option value="expenses">Expenses</option>
              <option value="organization">Organization</option>
              <option value="settings">Settings</option>
            </select>
          </div>

          <!-- Action Filter -->
          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Action</label>
            <select 
              [(ngModel)]="selectedAction" 
              (change)="applyFilters()"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="LOGIN_FAILED">LOGIN FAILED</option>
              <option value="PASSWORD_CHANGE">PASSWORD CHANGE</option>
              <option value="APPROVE">APPROVE</option>
              <option value="REJECT">REJECT</option>
              <option value="VIEW">VIEW</option>
              <option value="EXPORT">EXPORT</option>
            </select>
          </div>

          <!-- Start Date -->
          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">From Date</label>
            <input 
              type="date" 
              [(ngModel)]="startDate"
              (change)="applyFilters()"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
          </div>

          <!-- End Date -->
          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">To Date</label>
            <input 
              type="date" 
              [(ngModel)]="endDate"
              (change)="applyFilters()"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
          </div>

        <!-- Active Filters Display -->
        <div *ngIf="hasActiveFilters()" class="mt-4 flex items-center gap-2 flex-wrap">
          <span class="text-xs text-slate-400 font-medium">Active filters:</span>
          <span *ngIf="selectedModule" class="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-600 text-xs font-bold rounded-lg">
            Module: {{ selectedModule }}
            <button (click)="clearModuleFilter()" class="hover:text-primary-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </span>
          <span *ngIf="selectedAction" class="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg">
            Action: {{ selectedAction }}
            <button (click)="clearActionFilter()" class="hover:text-blue-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </span>
          <span *ngIf="startDate || endDate" class="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-lg">
            Date: {{ startDate || 'Start' }} to {{ endDate || 'End' }}
            <button (click)="clearDateFilter()" class="hover:text-amber-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </span>
          <span *ngIf="searchQuery" class="inline-flex items-center gap-1 px-2 py-1 bg-violet-50 text-violet-600 text-xs font-bold rounded-lg">
            Search: "{{ searchQuery }}"
            <button (click)="clearSearchFilter()" class="hover:text-violet-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </span>
          <button (click)="clearAllFilters()" class="text-xs text-slate-400 hover:text-slate-600 font-medium underline">Clear all</button>
        </div>

      <!-- Results Info -->
      <div class="flex justify-between items-center px-1">
        <p class="text-sm text-slate-500 font-medium">
          Showing <span class="text-slate-800 font-bold">{{ logs().length }}</span> of 
          <span class="text-slate-800 font-bold">{{ totalItems() }}</span> log entries
        </p>
        <span class="text-xs text-slate-400 font-medium" *ngIf="hasMore()">Scroll for more...</span>
        <span class="text-xs text-slate-400 font-medium" *ngIf="!hasMore() && logs().length > 0">All entries loaded</span>
      </div>
      
      <!-- Main Table -->
      <div class="card overflow-hidden rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/50 bg-white">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[1100px]">
            <thead class="bg-slate-50/80 border-b border-slate-100 sticky top-0 z-10">
              <tr>
                <th class="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th class="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actor</th>
                <th class="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                <th class="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Module</th>
                <th class="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target</th>
                <th class="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              
              <!-- Loading State -->
              <tr *ngIf="loading() && logs().length === 0">
                 <td colspan="6" class="px-6 py-16 text-center">
                     <svg class="animate-spin h-8 w-8 text-primary-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     <span class="text-slate-400 font-medium text-sm">Fetching immutable logs...</span>
                 </td>
              </tr>
              
              <!-- Empty State -->
              <tr *ngIf="!loading() && logs().length === 0">
                 <td colspan="6" class="px-6 py-16 text-center">
                     <div class="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-slate-400"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                     </div>
                     <span class="text-slate-500 font-medium text-sm">No audit logs match your criteria.</span>
                     <button *ngIf="hasActiveFilters()" (click)="clearAllFilters()" class="block mx-auto mt-2 text-primary-500 text-sm font-bold hover:underline">Clear filters</button>
                 </td>
              </tr>
              
              <!-- Log Rows -->
              <ng-container *ngIf="!loading() || logs().length > 0">
                <ng-container *ngFor="let log of logs()">
                  <tr class="hover:bg-slate-50/50 transition-colors group cursor-pointer" (click)="toggleDetails(log.id)">
                    <td class="px-5 py-4 whitespace-nowrap">
                      <span class="font-bold text-slate-800 text-sm block">{{ log.createdAt | date:'MMM dd, yyyy' }}</span>
                      <span class="text-[11px] text-slate-400 font-bold tracking-wider">{{ log.createdAt | date:'HH:mm:ss a' }}</span>
                    </td>
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 flex-shrink-0 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center text-primary-600 font-black text-xs shadow-inner">
                          {{ log.employee ? (log.employee.firstName[0] + (log.employee.lastName ? log.employee.lastName[0] : '')) : 'S' }}
                        </div>
                        <div>
                          <span class="font-bold text-slate-800 text-sm block">{{ log.employee ? (log.employee.firstName + ' ' + (log.employee.lastName || '')) : 'System / Auto' }}</span>
                          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest block max-w-[150px] truncate" [title]="log.userAgent">{{ log.ipAddress || 'Internal Routine' }}</span>
                        </div>
                    </td>
                    <td class="px-5 py-4 whitespace-nowrap">
                       <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border"
                            [ngClass]="getActionClasses(log.action)">
                          {{ log.action }}
                       </span>
                    </td>
                    <td class="px-5 py-4 whitespace-nowrap">
                      <span class="font-bold text-slate-700 text-sm capitalize">{{ formatModule(log.module) }}</span>
                    </td>
                    <td class="px-5 py-4">
                      <span *ngIf="log.entityName" class="font-bold text-slate-700 text-sm block">{{ log.entityName }}</span>
                      <span *ngIf="log.entityId" class="text-[11px] text-slate-400 font-medium block">
                         #{{ log.entityId }}
                      </span>
                      <span *ngIf="!log.entityName && !log.entityId" class="text-slate-400 text-xs italic">No target</span>
                    </td>
                    <td class="px-5 py-4 text-right">
                       <button class="text-slate-400 group-hover:text-primary-600 group-hover:bg-primary-50 p-2 rounded-lg transition-colors focus:outline-none">
                           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                                [ngClass]="{'rotate-180 text-primary-600': expandedLogId() === log.id}" 
                                class="transition-transform duration-300"
                           >
                             <path d="m6 9 6 6 6-6"/>
                           </svg>
                       </button>
                    </td>
                  </tr>
                  
                  <!-- Expanded Details Row -->
                  <tr *ngIf="expandedLogId() === log.id" class="bg-slate-50/50">
                      <td colspan="6" class="p-0">
                          <div class="px-6 py-8 border-y border-slate-100 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                             
                             <!-- Previous State -->
                             <div class="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group/card">
                               <div class="absolute top-0 left-0 w-1 h-full bg-rose-400"></div>
                               <h4 class="font-black text-rose-600 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                                 Previous State
                               </h4>
                               <div class="bg-slate-900 rounded-xl p-4 text-rose-300 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed shadow-inner max-h-[300px] custom-scrollbar">
                                  {{ log.oldValues ? (log.oldValues | json) : 'No previous data (Creation or Action-only event)' }}
                               </div>

                             <!-- New State -->
                             <div class="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group/card">
                               <div class="absolute top-0 left-0 w-1 h-full bg-emerald-400"></div>
                               <h4 class="font-black text-emerald-600 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                                 New State
                               </h4>
                               <div class="bg-slate-900 rounded-xl p-4 text-emerald-300 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed shadow-inner max-h-[300px] custom-scrollbar">
                                  {{ log.newValues ? (log.newValues | json) : 'No new data provided' }}
                               </div>

                             <!-- Additional Metadata -->
                             <div class="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                               <h4 class="font-black text-slate-600 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                 Technical Details
                               </h4>
                               <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                 <div>
                                   <span class="text-slate-400 font-bold uppercase tracking-wider block mb-1">Log ID</span>
                                   <span class="text-slate-700 font-mono">{{ log.id }}</span>
                                 </div>
                                 <div>
                                   <span class="text-slate-400 font-bold uppercase tracking-wider block mb-1">IP Address</span>
                                   <span class="text-slate-700 font-mono">{{ log.ipAddress || 'N/A' }}</span>
                                 </div>
                                 <div>
                                   <span class="text-slate-400 font-bold uppercase tracking-wider block mb-1">Immutable</span>
                                   <span class="text-slate-700 font-mono">{{ log.isImmutable ? 'Yes' : 'No' }}</span>
                                 </div>
                                 <div>
                                   <span class="text-slate-400 font-bold uppercase tracking-wider block mb-1">User Agent</span>
                                   <span class="text-slate-700 font-mono text-[10px] block max-w-[200px] truncate" [title]="log.userAgent">{{ log.userAgent || 'N/A' }}</span>
                                 </div>
                             </div>
                      </td>
                  </tr>
                </ng-container>
              </ng-container>
              
            </tbody>
          </table>
        </div>

      <!-- Infinite Scroll Sentinel & Loading Indicator -->
      <div #scrollSentinel class="flex flex-col items-center justify-center py-8">
        <!-- Loading more indicator -->
        <div *ngIf="isLoadingMore()" class="flex items-center gap-3">
          <svg class="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-sm text-slate-500 font-medium">Loading more logs...</span>
        </div>
        
        <!-- End of results -->
        <div *ngIf="!hasMore() && logs().length > 0" class="text-center">
          <span class="text-sm text-slate-400 font-medium">You've reached the end</span>
          <span class="text-xs text-slate-300 block mt-1">{{ totalItems() }} total entries</span>
        </div>
        
        <!-- No more to load (initial load complete but no data) -->
        <div *ngIf="!hasMore() && logs().length === 0 && !loading()" class="text-center">
          <span class="text-sm text-slate-400 font-medium">No logs to display</span>
        </div>
    </div>
  \`,
  styles: [\`
     .whitespace-pre { 
        white-space: pre-wrap; 
        word-wrap: break-word; 
     }
     .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
     }
     .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(15, 23, 42, 0.5);
        border-radius: 4px;
     }
     .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
     }
     .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
     }
  \`]
})
export class AuditLogsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('scrollSentinel') scrollSentinel!: ElementRef;
  
  private auditLogService = inject(AuditLogService);
  private observer: IntersectionObserver | null = null;

  // Signals from service
  logs = this.auditLogService.logs;
  loading = this.auditLogService.loading;
  totalItems = this.auditLogService.totalItems;
  totalPages = this.auditLogService.totalPages;
  currentPage = this.auditLogService.currentPage;
  hasMore = this.auditLogService.hasMore;
  isLoadingMore = this.auditLogService.isLoadingMore;
  
  // Local signals
  expandedLogId = signal<number | null>(null);
  autoRefreshEnabled = signal<boolean>(false);
  
  // Filter values
  searchQuery = '';
  selectedModule = '';
  selectedAction = '';
  startDate = '';
  endDate = '';
  itemsPerPage = 20;

  ngOnInit() {
    this.refresh();
  }

  ngAfterViewInit() {
    this.setupIntersectionObserver();
  }

  ngOnDestroy() {
    this.auditLogService.disableAutoRefresh();
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  // ============================================
  // INTERSECTION OBSERVER (Infinite Scroll)
  // ============================================

  private setupIntersectionObserver() {
    const options = {
      root: null, // viewport
      rootMargin: '100px', // load before user reaches bottom
      threshold: 0.1
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && this.hasMore() && !this.isLoadingMore() && !this.loading()) {
          this.loadMore();
        }
      });
    }, options);

    if (this.scrollSentinel?.nativeElement) {
      this.observer.observe(this.scrollSentinel.nativeElement);
    }
  }

  loadMore() {
    this.auditLogService.loadMore()?.subscribe();
  }

  // ============================================
  // REFRESH
  // ============================================

  refresh() {
    this.expandedLogId.set(null);
    this.auditLogService.resetAndFetch(
      this.selectedModule || undefined,
      this.itemsPerPage,
      1,
      this.getCurrentFilter()
    ).subscribe();
  }

  // ============================================
  // FILTERS
  // ============================================

  getCurrentFilter(): AuditLogFilter {
    return {
      search: this.searchQuery || undefined,
      module: this.selectedModule || undefined,
      action: this.selectedAction || undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined
    };
  }

  applyFilters() {
    this.auditLogService.resetAndFetch(
      this.selectedModule || undefined,
      this.itemsPerPage,
      1,
      this.getCurrentFilter()
    ).subscribe();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.selectedModule || this.selectedAction || this.startDate || this.endDate);
  }

  clearModuleFilter() {
    this.selectedModule = '';
    this.applyFilters();
  }

  clearActionFilter() {
    this.selectedAction = '';
    this.applyFilters();
  }

  clearDateFilter() {
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  clearSearchFilter() {
    this.searchQuery = '';
    this.applyFilters();
  }

  clearAllFilters() {
    this.searchQuery = '';
    this.selectedModule = '';
    this.selectedAction = '';
    this.startDate = '';
    this.endDate = '';
    this.refresh();
  }

  onItemsPerPageChange() {
    this.applyFilters();
  }

  // ============================================
  // AUTO-REFRESH
  // ============================================

  toggleAutoRefresh() {
    this.auditLogService.toggleAutoRefresh();
    this.autoRefreshEnabled.set(this.auditLogService.isAutoRefreshEnabled());
  }

  // ============================================
  // EXPORT
  // ============================================

  exportCSV() {
    this.auditLogService.exportToCSV();
  }

  // ============================================
  // UI HELPERS
  // ============================================

  toggleDetails(id: number) {
    if (this.expandedLogId() === id) {
      this.expandedLogId.set(null);
    } else {
      this.expandedLogId.set(id);
    }
  }

  formatModule(module: string): string {
    if (!module) return '';
    const moduleNames: { [key: string]: string } = {
      'auth': 'Authentication',
      'employees': 'Employees',
      'leaves': 'Leaves',
      'attendance': 'Attendance',
      'payroll': 'Payroll',
      'projects': 'Projects',
      'timesheets': 'Timesheets',
      'expenses': 'Expenses',
      'organization': 'Organization',
      'settings': 'Settings',
      'reports': 'Reports',
      'dashboard': 'Dashboard',
      'audit_logs': 'Audit Logs'
    };
    return moduleNames[module.toLowerCase()] || module;
  }

  getActionClasses(action: string): string {
    const actionLower = action?.toUpperCase();
    
    if (actionLower === 'CREATE' || actionLower === 'LOGIN' || actionLower === 'APPROVE' || actionLower === 'REGISTER') {
      return 'bg-green-50 text-emerald-600 border-emerald-600/20';
    }
    if (actionLower === 'UPDATE' || actionLower === 'PASSWORD_CHANGE' || actionLower === 'RESTORE') {
      return 'bg-blue-50 text-blue-600 border-blue-600/20';
    }
    if (actionLower === 'DELETE' || actionLower === 'LOGIN_FAILED' || actionLower === 'REJECT' || actionLower === 'LOCK') {
      return 'bg-red-50 text-rose-600 border-rose-600/20';
    }
    if (actionLower === 'LOGOUT' || actionLower === 'FORGOT_PASSWORD' || actionLower === 'PASSWORD_RESET') {
      return 'bg-amber-50 text-amber-600 border-amber-600/20';
    }
    if (actionLower === 'VIEW' || actionLower === 'EXPORT' || actionLower === 'DOWNLOAD') {
      return 'bg-violet-50 text-violet-600 border-violet-600/20';
    }
    
    return 'bg-slate-50 text-slate-600 border-slate-600/20';
  }
}
```

---

## Key Changes Summary:

### Service Changes (audit-log.service.ts):
1. Changed default `itemsPerPage` from 50 to 20
2. Added `hasMore` signal to track if more data exists
3. Added `isLoadingMore` signal to track loading state
4. Modified `fetchLogs()` to support `append` parameter
5. Added `loadMore()` method for fetching next page
6. Added `resetAndFetch()` method for fresh loads with filters

### Component Changes (audit-logs.component.ts):
1. Added `@ViewChild('scrollSentinel')` for scroll detection
2. Added `IntersectionObserver` for infinite scroll trigger
3. Added `loadMore()` method that calls service's loadMore
4. Replaced pagination UI with infinite scroll sentinel
5. Added loading indicator at bottom ("Loading more logs...")
6. Added "You've reached the end" message when no more data
7. Modified `refresh()` to use `resetAndFetch()` instead of `fetchLogs()`

---

## How It Works:

1. **Initial Load**: Loads first 20 logs
2. **Scroll Detection**: When user scrolls near bottom (100px before), triggers `loadMore()`
3. **Append Mode**: Service appends new data to existing logs instead of replacing
4. **Filter Application**: Clears existing logs and loads from page 1
5. **End Detection**: Shows "You've reached the end" when all data is loaded
