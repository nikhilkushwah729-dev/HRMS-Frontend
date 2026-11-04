import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AuditLogService,
  AuditLogFilter,
  AuditLog,
} from '../../core/services/audit-log.service';
import {
  UiSelectAdvancedComponent,
  SelectOption,
} from '../../core/components/ui/ui-select-advanced.component';

interface QuickDateFilter {
  label: string;
  value: string;
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, UiSelectAdvancedComponent],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.css',
})
export class AuditLogsComponent implements OnInit, OnDestroy {
  private auditLogService = inject(AuditLogService);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  logs = this.auditLogService.logs;
  loading = this.auditLogService.loading;
  totalItems = this.auditLogService.totalItems;
  totalPages = this.auditLogService.totalPages;
  currentPage = this.auditLogService.currentPage;
  statistics = this.auditLogService.statistics;

  expandedLogId = signal<number | null>(null);
  autoRefreshEnabled = signal<boolean>(false);
  filterDrawerOpen = signal<boolean>(true);

  // Modal states
  showDetailsModal = signal<boolean>(false);
  selectedLog = signal<AuditLog | null>(null);

  // Quick date filters
  quickDateFilters: QuickDateFilter[] = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 days', value: 'last7days' },
    { label: 'Last 30 days', value: 'last30days' },
  ];
  selectedQuickDate = '';

  // Search with debounce
  private searchDebounceTimer: any;

  // Filter states
  searchQuery = '';
  selectedModule = '';
  selectedAction = '';
  selectedStatus = '';
  startDate = '';
  endDate = '';
  itemsPerPage = 50;

  moduleOptions: SelectOption[] = [
    { label: 'All Modules', value: '' },
    { label: 'Employee Management', value: 'EMPLOYEE' },
    { label: 'Attendance Management', value: 'ATTENDANCE' },
    { label: 'Leave Management', value: 'LEAVE' },
    { label: 'Payroll Management', value: 'PAYROLL' },
    { label: 'Timesheet Management', value: 'TIMESHEET' },
    { label: 'User Management', value: 'USER' },
    { label: 'Role & Permission', value: 'ROLE_PERMISSION' },
    { label: 'Organization Settings', value: 'ORGANIZATION' },
    { label: 'Subscription & Add-ons', value: 'SUBSCRIPTION' },
    { label: 'Reports & Exports', value: 'REPORTS' },
    { label: 'Authentication & Security', value: 'AUTH' },
  ];

  actionOptions: SelectOption[] = [
    { label: 'All Actions', value: '' },
    { label: 'CREATE', value: 'CREATE' },
    { label: 'UPDATE', value: 'UPDATE' },
    { label: 'DELETE', value: 'DELETE' },
    { label: 'LOGIN', value: 'LOGIN' },
    { label: 'LOGOUT', value: 'LOGOUT' },
    { label: 'APPROVE', value: 'APPROVE' },
    { label: 'REJECT', value: 'REJECT' },
    { label: 'EXPORT', value: 'EXPORT' },
    { label: 'IMPORT', value: 'IMPORT' },
    { label: 'ROLE_CHANGE', value: 'ROLE_CHANGE' },
    { label: 'PERMISSION_CHANGE', value: 'PERMISSION_CHANGE' },
    { label: 'STATUS_CHANGE', value: 'STATUS_CHANGE' },
  ];

  statusOptions: SelectOption[] = [
    { label: 'All Statuses', value: '' },
    { label: 'Success', value: 'success' },
    { label: 'Failure', value: 'failure' },
  ];

  itemsPerPageOptions: SelectOption[] = [
    { label: '10', value: 10 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
  ];

  ngOnInit() {
    this.refresh();
  }

  ngOnDestroy() {
    this.auditLogService.disableAutoRefresh();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.searchInput?.nativeElement.focus();
    }
    if (event.key === 'Escape' && this.showDetailsModal()) {
      this.closeDetailsModal();
    }
  }

  refresh() {
    this.expandedLogId.set(null);
    this.auditLogService
      .fetchLogs(
        this.selectedModule || undefined,
        this.itemsPerPage,
        1,
        this.getCurrentFilter()
      )
      .subscribe();
    this.auditLogService.fetchStatistics().subscribe();
  }

  getCurrentFilter(): AuditLogFilter {
    return {
      search: this.searchQuery ? this.searchQuery.trim() : undefined,
      module: this.selectedModule || undefined,
      action: this.selectedAction || undefined,
      status: this.selectedStatus || undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
    };
  }

  applyFilters() {
    this.selectedQuickDate = '';
    this.auditLogService
      .fetchLogs(
        this.selectedModule || undefined,
        this.itemsPerPage,
        1,
        this.getCurrentFilter()
      )
      .subscribe();
    this.auditLogService.fetchStatistics().subscribe();
  }

  applyQuickDate(value: string) {
    this.selectedQuickDate = value;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7 = new Date(today);
    last7.setDate(last7.getDate() - 7);
    const last30 = new Date(today);
    last30.setDate(last30.getDate() - 30);

    switch (value) {
      case 'today':
        this.startDate = this.formatDate(today);
        this.endDate = this.formatDate(today);
        break;
      case 'yesterday':
        this.startDate = this.formatDate(yesterday);
        this.endDate = this.formatDate(yesterday);
        break;
      case 'last7days':
        this.startDate = this.formatDate(last7);
        this.endDate = this.formatDate(today);
        break;
      case 'last30days':
        this.startDate = this.formatDate(last30);
        this.endDate = this.formatDate(today);
        break;
    }
    this.applyFilters();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.searchQuery = value;
      this.applyFilters();
    }, 400);
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchQuery ||
      this.selectedModule ||
      this.selectedAction ||
      this.selectedStatus ||
      this.startDate ||
      this.endDate ||
      this.selectedQuickDate
    );
  }

  clearModuleFilter() {
    this.selectedModule = '';
    this.applyFilters();
  }

  clearActionFilter() {
    this.selectedAction = '';
    this.applyFilters();
  }

  clearStatusFilter() {
    this.selectedStatus = '';
    this.applyFilters();
  }

  clearDateFilter() {
    this.startDate = '';
    this.endDate = '';
    this.selectedQuickDate = '';
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
    this.selectedStatus = '';
    this.startDate = '';
    this.endDate = '';
    this.selectedQuickDate = '';
    this.refresh();
  }

  onItemsPerPageChange() {
    this.applyFilters();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.auditLogService
        .fetchLogs(
          this.selectedModule || undefined,
          this.itemsPerPage,
          page,
          this.getCurrentFilter()
        )
        .subscribe();
    }
  }

  previousPage() {
    if (this.currentPage() > 1) this.goToPage(this.currentPage() - 1);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) this.goToPage(this.currentPage() + 1);
  }

  toggleAutoRefresh() {
    this.auditLogService.toggleAutoRefresh();
    this.autoRefreshEnabled.set(this.auditLogService.isAutoRefreshEnabled());
  }

  toggleFilterDrawer() {
    this.filterDrawerOpen.set(!this.filterDrawerOpen());
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.searchQuery) count++;
    if (this.selectedModule) count++;
    if (this.selectedAction) count++;
    if (this.selectedStatus) count++;
    if (this.startDate) count++;
    if (this.endDate) count++;
    if (this.selectedQuickDate) count++;
    return count;
  }

  exportCSV() {
    this.auditLogService.exportToCSV();
  }

  toggleDetails(id: number) {
    this.expandedLogId.set(this.expandedLogId() === id ? null : id);
  }

  openDetailsModal(event: Event, log: AuditLog) {
    event.stopPropagation();
    this.selectedLog.set(log);
    this.showDetailsModal.set(true);
  }

  closeDetailsModal() {
    this.showDetailsModal.set(false);
    this.selectedLog.set(null);
  }

  parseJsonSafe(val: any): any {
    if (!val) return null;
    if (typeof val === 'object') return val;
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }

  getDiffKeys(oldVal: any, newVal: any): string[] {
    const o = this.parseJsonSafe(oldVal) || {};
    const n = this.parseJsonSafe(newVal) || {};
    const keys = new Set([...Object.keys(o), ...Object.keys(n)]);
    return Array.from(keys);
  }

  isFieldChanged(key: string, oldVal: any, newVal: any): boolean {
    const o = this.parseJsonSafe(oldVal) || {};
    const n = this.parseJsonSafe(newVal) || {};
    return JSON.stringify(o[key]) !== JSON.stringify(n[key]);
  }

  formatFieldValue(val: any): string {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }

  getVisiblePages(): (number | string)[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, '...', total);
      } else if (current >= total - 2) {
        pages.push(1, '...', total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, '...', current - 1, current, current + 1, '...', total);
      }
    }

    return pages;
  }

  formatModule(module: string): string {
    const names: Record<string, string> = {
      employee: 'Employee Management',
      employees: 'Employee Management',
      attendance: 'Attendance',
      leave: 'Leave Management',
      leaves: 'Leave Management',
      payroll: 'Payroll',
      timesheet: 'Timesheet',
      timesheets: 'Timesheet',
      user: 'User Management',
      role_permission: 'Roles & Permissions',
      organization: 'Organization Settings',
      subscription: 'Subscription & Add-ons',
      reports: 'Reports & Exports',
      auth: 'Authentication & Security',
    };
    return names[module?.toLowerCase()] || module || '';
  }

  getActionClasses(action: string): string {
    const a = action?.toUpperCase();
    if (a === 'CREATE' || a === 'APPROVE')
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (a === 'UPDATE' || a === 'STATUS_CHANGE')
      return 'bg-blue-50 text-blue-700 border-blue-200';
    if (a === 'DELETE' || a === 'REJECT')
      return 'bg-rose-50 text-rose-700 border-rose-200';
    if (a === 'LOGIN' || a === 'LOGOUT')
      return 'bg-purple-50 text-purple-700 border-purple-200';
    if (a === 'ROLE_CHANGE' || a === 'PERMISSION_CHANGE')
      return 'bg-amber-50 text-amber-700 border-amber-200';
    if (a === 'EXPORT' || a === 'IMPORT')
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  }

  getActionIcon(action: string): string {
    const a = action?.toUpperCase();
    if (a === 'CREATE') return '➕';
    if (a === 'UPDATE') return '✏️';
    if (a === 'DELETE') return '🗑️';
    if (a === 'LOGIN') return '🔓';
    if (a === 'LOGOUT') return '🔒';
    if (a === 'APPROVE') return '✅';
    if (a === 'REJECT') return '❌';
    if (a === 'EXPORT') return '📤';
    if (a === 'IMPORT') return '📥';
    if (a === 'ROLE_CHANGE') return '👥';
    if (a === 'PERMISSION_CHANGE') return '🛡️';
    if (a === 'STATUS_CHANGE') return '🔄';
    return '📝';
  }
}
