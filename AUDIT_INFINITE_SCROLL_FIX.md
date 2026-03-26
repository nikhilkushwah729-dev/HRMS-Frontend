# Audit Logs Infinite Scroll Implementation Guide

## Files to Update

### 1. src/app/core/services/audit-log.service.ts

This file should have these new signals and methods added:

```typescript
// Add these signals (around line 80):
hasMore = signal<boolean>(true);
isLoadingMore = signal<boolean>(false);

// Add loadMore method:
loadMore(): Observable<any> | null {
  if (!this.hasMore() || this.isLoadingMore()) {
    return null;
  }
  
  this.isLoadingMore.set(true);
  const nextPage = this.currentPage() + 1;
  
  return this.fetchLogs(
    this.currentFilter().module,
    this.itemsPerPage(),
    nextPage,
    this.currentFilter()
  ).pipe(
    tap({
      next: (response) => {
        // Append new logs to existing
        const currentLogs = this.logs();
        this.logs.set([...currentLogs, ...response.data]);
        this.currentPage.set(nextPage);
        
        // Check if there are more
        if (response.data.length < this.itemsPerPage() || 
            this.logs().length >= this.totalItems()) {
          this.hasMore.set(false);
        }
        
        this.isLoadingMore.set(false);
      },
      error: () => {
        this.isLoadingMore.set(false);
      }
    })
  );
}

// Add resetAndFetch method:
resetAndFetch(
  module?: string,
  limit: number = 20,
  page: number = 1,
  filter?: AuditLogFilter
): Observable<any> {
  this.hasMore.set(true);
  this.isLoadingMore.set(false);
  return this.fetchLogs(module, limit, page, filter);
}
```

### 2. src/app/features/admin/audit-logs.component.ts

Replace the entire file with:

```typescript
import { Component, OnInit, OnDestroy, inject, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService, AuditLogFilter } from '../../core/services/audit-log.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="flex flex-col gap-6">
  <header class="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">System Audit Logs</h1>
      <p class="text-slate-500 text-sm mt-1">Track system activity.</p>
    </div>
    <div class="flex flex-wrap gap-3">
      <button (click)="toggleAutoRefresh()" class="px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2" [ngClass]="autoRefreshEnabled() ? 'bg-green-100 text-green-700' : 'bg-slate-50 text-slate-600'">
        {{ autoRefreshEnabled() ? 'Auto On' : 'Auto Off' }}
      </button>
      <button (click)="exportCSV()" [disabled]="logs().length === 0" class="bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50">Export</button>
      <button (click)="refresh()" [disabled]="loading()" class="bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold disabled:opacity-50">Refresh</button>
    </div>
  </header>

  <div class="bg-white p-5 rounded-3xl border border-slate-100">
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <input type="text" [(ngModel)]="searchQuery" (keyup.enter)="applyFilters()" placeholder="Search..." class="px-4 py-2.5 bg-slate-50 border rounded-xl text-sm">
      <select [(ngModel)]="selectedModule" (change)="applyFilters()" class="px-4 py-2.5 bg-slate-50 border rounded-xl text-sm">
        <option value="">All Modules</option>
        <option value="auth">Auth</option>
        <option value="employees">Employees</option>
      </select>
      <select [(ngModel)]="selectedAction" (change)="applyFilters()" class="px-4 py-2.5 bg-slate-50 border rounded-xl text-sm">
        <option value="">All Actions</option>
        <option value="CREATE">CREATE</option>
        <option value="UPDATE">UPDATE</option>
        <option value="DELETE">DELETE</option>
      </select>
      <input type="date" [(ngModel)]="startDate" (change)="applyFilters()" class="px-4 py-2.5 bg-slate-50 border rounded-xl text-sm">
      <input type="date" [(ngModel)]="endDate" (change)="applyFilters()" class="px-4 py-2.5 bg-slate-50 border rounded-xl text-sm">
    </div>

  <div class="flex justify-between items-center">
    <p class="text-sm text-slate-500">Showing {{ logs().length }} of {{ totalItems() }}</p>
    <span *ngIf="hasMore()" class="text-xs text-slate-400">Scroll for more</span>
  </div>
  
  <div class="card overflow-hidden rounded-3xl border border-slate-200 bg-white">
    <table class="w-full text-left min-w-[800px]">
      <thead class="bg-slate-50 border-b sticky top-0">
        <tr>
          <th class="px-5 py-4 text-xs font-bold text-slate-400">Timestamp</th>
          <th class="px-5 py-4 text-xs font-bold text-slate-400">Actor</th>
          <th class="px-5 py-4 text-xs font-bold text-slate-400">Action</th>
          <th class="px-5 py-4 text-xs font-bold text-slate-400">Module</th>
          <th class="px-5 py-4 text-xs font-bold text-slate-400">Target</th>
          <th class="px-5 py-4 text-xs font-bold text-slate-400 text-right">Details</th>
        </tr>
      </thead>
      <tbody class="divide-y">
        <tr *ngIf="loading() && logs().length === 0">
          <td colspan="6" class="px-6 py-16 text-center text-slate-400">Loading...</td>
        </tr>
        <tr *ngIf="!loading() && logs().length === 0">
          <td colspan="6" class="px-6 py-16 text-center text-slate-500">No logs found.</td>
        </tr>
        <tr *ngFor="let log of logs()" class="hover:bg-slate-50">
          <td class="px-5 py-4">
            <span class="font-bold text-sm">{{ log.createdAt | date:'MMM dd, yyyy' }}</span>
            <span class="text-xs text-slate-400 block">{{ log.createdAt | date:'HH:mm' }}</span>
          </td>
          <td class="px-5 py-4">{{ log.employee?.firstName || 'System' }}</td>
          <td class="px-5 py-4"><span class="px-2 py-1 rounded text-xs font-bold" [ngClass]="getActionClasses(log.action)">{{ log.action }}</span></td>
          <td class="px-5 py-4 capitalize">{{ log.module }}</td>
          <td class="px-5 py-4">{{ log.entityName || '-' }}</td>
          <td class="px-5 py-4 text-right">
            <button (click)="toggleDetails(log.id)" class="text-slate-400 hover:text-primary-600">+</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div *ngIf="expandedLogId()" class="bg-slate-50 p-6 rounded-3xl">
    <div *ngFor="let log of logs()">
      <div *ngIf="expandedLogId() === log.id" class="grid grid-cols-2 gap-6">
        <div class="bg-white p-4 rounded-xl">
          <h4 class="font-bold text-xs text-rose-600 mb-2">Previous</h4>
          <pre class="text-xs bg-slate-900 text-rose-300 p-3 rounded overflow-auto max-h-40">{{ log.oldValues | json }}</pre>
        </div>
        <div class="bg-white p-4 rounded-xl">
          <h4 class="font-bold text-xs text-emerald-600 mb-2">New</h4>
          <pre class="text-xs bg-slate-900 text-emerald-300 p-3 rounded overflow-auto max-h-40">{{ log.newValues | json }}</pre>
        </div>
    </div>

  <div #scrollSentinel class="flex justify-center py-8">
    <div *ngIf="isLoadingMore()" class="text-slate-500">Loading more...</div>
    <div *ngIf="!hasMore() && logs().length > 0" class="text-slate-400">End of results</div>
</div>
  `,
  styles: [`.whitespace-pre { white-space: pre-wrap; }`]
})
export class AuditLogsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('scrollSentinel') scrollSentinel!: ElementRef;
  private auditLogService = inject(AuditLogService);
  private observer: IntersectionObserver | null = null;

  logs = this.auditLogService.logs;
  loading = this.auditLogService.loading;
  totalItems = this.auditLogService.totalItems;
  hasMore = this.auditLogService.hasMore;
  isLoadingMore = this.auditLogService.isLoadingMore;
  
  expandedLogId = signal<number | null>(null);
  autoRefreshEnabled = signal<boolean>(false);
  
  searchQuery = '';
  selectedModule = '';
  selectedAction = '';
  startDate = '';
  endDate = '';
  itemsPerPage = 20;

  ngOnInit() { this.refresh(); }

  ngAfterViewInit() { this.setupIntersectionObserver(); }

  ngOnDestroy() {
    this.auditLogService.disableAutoRefresh();
    if (this.observer) { this.observer.disconnect(); }
  }

  private setupIntersectionObserver() {
    const options = { root: null, rootMargin: '100px', threshold: 0.1 };
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && this.hasMore() && !this.isLoadingMore() && !this.loading()) {
          this.loadMore();
        }
      });
    }, options);
    if (this.scrollSentinel?.nativeElement) { this.observer.observe(this.scrollSentinel.nativeElement); }
  }

  loadMore() { this.auditLogService.loadMore()?.subscribe(); }

  refresh() {
    this.expandedLogId.set(null);
    this.auditLogService.resetAndFetch(this.selectedModule || undefined, this.itemsPerPage, 1, this.getCurrentFilter()).subscribe();
  }

  getCurrentFilter(): AuditLogFilter {
    return { search: this.searchQuery || undefined, module: this.selectedModule || undefined, action: this.selectedAction || undefined, startDate: this.startDate || undefined, endDate: this.endDate || undefined };
  }

  applyFilters() { this.auditLogService.resetAndFetch(this.selectedModule || undefined, this.itemsPerPage, 1, this.getCurrentFilter()).subscribe(); }
  hasActiveFilters(): boolean { return !!(this.searchQuery || this.selectedModule || this.selectedAction || this.startDate || this.endDate); }
  clearModuleFilter() { this.selectedModule = ''; this.applyFilters(); }
  clearActionFilter() { this.selectedAction = ''; this.applyFilters(); }
  clearDateFilter() { this.startDate = ''; this.endDate = ''; this.applyFilters(); }
  clearSearchFilter() { this.searchQuery = ''; this.applyFilters(); }
  clearAllFilters() { this.searchQuery = ''; this.selectedModule = ''; this.selectedAction = ''; this.startDate = ''; this.endDate = ''; this.refresh(); }
  toggleAutoRefresh() { this.auditLogService.toggleAutoRefresh(); this.autoRefreshEnabled.set(this.auditLogService.isAutoRefreshEnabled()); }
  exportCSV() { this.auditLogService.exportToCSV(); }
  toggleDetails(id: number) { this.expandedLogId.set(this.expandedLogId() === id ? null : id); }

  formatModule(module: string): string { return module || ''; }

  getActionClasses(action: string): string {
    const a = action?.toUpperCase();
    if (a === 'CREATE' || a === 'LOGIN' || a === 'APPROVE') return 'bg-green-50 text-emerald-600';
    if (a === 'UPDATE' || a === 'PASSWORD_CHANGE') return 'bg-blue-50 text-blue-600';
    if (a === 'DELETE' || a === 'LOGIN_FAILED' || a === 'REJECT') return 'bg-red-50 text-rose-600';
    if (a === 'LOGOUT') return 'bg-amber-50 text-amber-600';
    return 'bg-slate-50 text-slate-600';
  }
}
```

## Key Changes

1. **Infinite Scroll**: Uses IntersectionObserver to detect when user scrolls near bottom
2. **20 items per load**: Changed from 50 to 20
3. **Append mode**: Service appends new data instead of replacing
4. **hasMore signal**: Tracks if more data is available
5. **isLoadingMore signal**: Prevents duplicate requests
6. **Sentinel element**: #scrollSentinel at bottom triggers loadMore()

## Backend
No changes needed - already supports pagination.
