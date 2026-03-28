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

  expandedLogId = signal<number | null>(null);
  autoRefreshEnabled = signal<boolean>(false);
  filterDrawerOpen = signal<boolean>(true);

  // Modal states
  showDetailsModal = signal<boolean>(false);
  selectedLog = signal<AuditLog | null>(null);

  // Stats
  todayCount = 0;
  weekCount = 0;
  uniqueUsers = 0;

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
  startDate = '';
  endDate = '';
  itemsPerPage = 50;

  moduleOptions: SelectOption[] = [
    { label: 'All Modules', value: '' },
    { label: 'Authentication', value: 'auth' },
    { label: 'Employees', value: 'employees' },
    { label: 'Leaves', value: 'leaves' },
    { label: 'Attendance', value: 'attendance' },
    { label: 'Payroll', value: 'payroll' },
    { label: 'Projects', value: 'projects' },
    { label: 'Timesheets', value: 'timesheets' },
    { label: 'Expenses', value: 'expenses' },
    { label: 'Organization', value: 'organization' },
    { label: 'Settings', value: 'settings' },
  ];

  actionOptions: SelectOption[] = [
    { label: 'All Actions', value: '' },
    { label: 'Create', value: 'CREATE' },
    { label: 'Update', value: 'UPDATE' },
    { label: 'Delete', value: 'DELETE' },
    { label: 'Login', value: 'LOGIN' },
    { label: 'Logout', value: 'LOGOUT' },
    { label: 'Approve', value: 'APPROVE' },
    { label: 'Reject', value: 'REJECT' },
    { label: 'View', value: 'VIEW' },
    { label: 'Export', value: 'EXPORT' },
  ];

  itemsPerPageOptions: SelectOption[] = [
    { label: '10', value: 10 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
  ];

  // GeoJSON for Map
  countriesGeoJson: any = null;

  ngOnInit() {
    this.refresh();
    this.calculateStats();
    this.loadGeoJson();
  }

  loadGeoJson() {
    fetch('/geo_countries.json')
      .then((res) => res.json())
      .then((data) => (this.countriesGeoJson = data))
      .catch((err) => console.error('Failed to load GeoJSON', err));
  }

  getSvgPath(feature: any): string {
    if (!feature || !feature.geometry) return '';
    const { type, coordinates } = feature.geometry;

    if (type === 'Polygon') {
      return this.ringToPath(coordinates[0]);
    } else if (type === 'MultiPolygon') {
      return coordinates.map((poly: any) => this.ringToPath(poly[0])).join(' ');
    }
    return '';
  }

  private ringToPath(ring: number[][]): string {
    return (
      ring
        .map((point, i) => `${i === 0 ? 'M' : 'L'}${point[0]} ${-point[1]}`)
        .join(' ') + 'Z'
    );
  }

  ngOnDestroy() {
    this.auditLogService.disableAutoRefresh();
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Ctrl+R to refresh
    if (event.ctrlKey && event.key === 'r') {
      event.preventDefault();
      this.refresh();
    }
    // Ctrl+F to focus search
    if (event.ctrlKey && event.key === 'f') {
      event.preventDefault();
      this.searchInput?.nativeElement?.focus();
    }
    // Escape to close modal
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
        this.getCurrentFilter(),
      )
      .subscribe(() => {
        this.calculateStats();
      });
  }

  getCurrentFilter(): AuditLogFilter {
    return {
      search: this.searchQuery || undefined,
      module: this.selectedModule || undefined,
      action: this.selectedAction || undefined,
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
        this.getCurrentFilter(),
      )
      .subscribe(() => {
        this.calculateStats();
      });
  }

  // Quick date filter methods
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

  // Debounced search
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
          this.getCurrentFilter(),
        )
        .subscribe();
    }
  }

  previousPage() {
    if (this.currentPage() > 1) this.goToPage(this.currentPage() - 1);
  }
  nextPage() {
    if (this.currentPage() < this.totalPages())
      this.goToPage(this.currentPage() + 1);
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

  // Modal methods
  openDetailsModal(event: Event, log: AuditLog) {
    event.stopPropagation();
    this.selectedLog.set(log);
    this.showDetailsModal.set(true);
  }

  closeDetailsModal() {
    this.showDetailsModal.set(false);
    this.selectedLog.set(null);
  }

  exportSingleLog() {
    const log = this.selectedLog();
    if (!log) return;

    const headers = ['Field', 'Value'];
    const rows = [
      ['ID', log.id.toString()],
      ['Timestamp', log.createdAt],
      ['Actor', log.employee?.firstName || 'System'],
      ['Email', log.employee?.email || 'N/A'],
      ['Action', log.action],
      ['Module', log.module],
      ['Entity Name', log.entityName || 'N/A'],
      ['Entity ID', log.entityId || 'N/A'],
      ['IP Address', log.ipAddress || 'N/A'],
      ['User Agent', log.userAgent || 'N/A'],
    ];

    if (log.oldValues) {
      rows.push(['Old Values', JSON.stringify(log.oldValues, null, 2)]);
    }
    if (log.newValues) {
      rows.push(['New Values', JSON.stringify(log.newValues, null, 2)]);
    }

    const csv = [
      headers.join(','),
      ...rows.map((r) => `"${r[0]}","${r[1].replace(/"/g, '""')}"`),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit-log-${log.id}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  // Get visible page numbers for pagination
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
    const names: { [key: string]: string } = {
      auth: 'Authentication',
      employees: 'Employees',
      leaves: 'Leaves',
      attendance: 'Attendance',
      payroll: 'Payroll',
      projects: 'Projects',
      timesheets: 'Timesheets',
      expenses: 'Expenses',
      organization: 'Organization',
      settings: 'Settings',
    };
    return names[module?.toLowerCase()] || module || '';
  }

  getActionClasses(action: string): string {
    const a = action?.toUpperCase();
    if (a === 'CREATE' || a === 'LOGIN' || a === 'APPROVE' || a === 'REGISTER')
      return 'bg-green-50 text-emerald-600 border-emerald-600/20';
    if (a === 'UPDATE' || a === 'PASSWORD_CHANGE' || a === 'PASSWORD_RESET')
      return 'bg-blue-50 text-blue-600 border-blue-600/20';
    if (a === 'DELETE' || a === 'LOGIN_FAILED' || a === 'REJECT')
      return 'bg-red-50 text-rose-600 border-rose-600/20';
    if (a === 'LOGOUT' || a === 'FORGOT_PASSWORD')
      return 'bg-amber-50 text-amber-600 border-amber-600/20';
    return 'bg-slate-50 text-slate-600 border-slate-600/20';
  }

  getActionIcon(action: string): string {
    const a = action?.toUpperCase();
    if (a === 'CREATE' || a === 'REGISTER') return '➕';
    if (a === 'UPDATE' || a === 'PASSWORD_CHANGE' || a === 'PASSWORD_RESET')
      return '✏️';
    if (a === 'DELETE') return '🗑️';
    if (a === 'LOGIN') return '🔓';
    if (a === 'LOGOUT' || a === 'LOGIN_FAILED') return '🔒';
    if (a === 'APPROVE') return '✅';
    if (a === 'REJECT') return '❌';
    if (a === 'VIEW') return '👁️';
    if (a === 'EXPORT' || a === 'DOWNLOAD') return '📤';
    return '📝';
  }

  getBrowserInfo(userAgent: string): string {
    if (!userAgent) return 'Unknown';

    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('MSIE') || userAgent.includes('Trident'))
      return 'Internet Explorer';

    return 'Other';
  }

  private calculateStats() {
    const logs = this.logs();
    if (!logs.length) {
      this.todayCount = 0;
      this.weekCount = 0;
      this.uniqueUsers = 0;
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const uniqueUserIds = new Set<number>();

    logs.forEach((log) => {
      const logDate = new Date(log.createdAt);
      logDate.setHours(0, 0, 0, 0);

      if (logDate.getTime() === today.getTime()) {
        this.todayCount++;
      }

      if (logDate >= weekAgo) {
        this.weekCount++;
      }

      if (log.employeeId) {
        uniqueUserIds.add(log.employeeId);
      }
    });

    this.uniqueUsers = uniqueUserIds.size;
  }
}
