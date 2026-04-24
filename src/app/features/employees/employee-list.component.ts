import {
  Component,
  OnInit,
  signal,
  inject,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../core/services/employee.service';
import { User } from '../../core/models/auth.model';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';
import { LiveRefreshService } from '../../core/services/live-refresh.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { UiSelectAdvancedComponent } from '../../core/components/ui';
import { SelectOption } from '../../core/components/ui/ui-select-advanced.component';
import { LanguageService } from '../../core/services/language.service';
import { PermissionService } from '../../core/services/permission.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, UiSelectAdvancedComponent],
  template: `
    <div class="flex flex-col gap-4 sm:gap-5 lg:gap-6">
      <!-- Header Section -->
      <section
        class="sticky top-3 z-20 overflow-hidden rounded-lg border border-slate-100 bg-white/95 shadow-lg shadow-slate-200/60 backdrop-blur"
      >
        <div
          class="grid gap-5 px-4 py-5 sm:px-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8 lg:py-8"
        >
          <div class="min-w-0 space-y-5">
            <div
              class="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
            >
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              {{ t('employee.workspace') }}
            </div>
            <div>
              <h1
                class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl xl:text-4xl"
              >
                {{ t('employee.directoryTitle') }}
              </h1>
              <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                {{ t('employee.directorySubtitle') }}
              </p>
            </div>

            <!-- Stats Grid -->
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div class="rounded-md border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {{ t('common.totalEmployees') }}
                </p>
                <div class="mt-2 flex items-baseline gap-1">
                  <p class="text-2xl font-black text-slate-900">{{ employeeStats().total }}</p>
                </div>
              </div>
              <div class="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-4 shadow-sm">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">
                  {{ t('common.active') }}
                </p>
                <div class="mt-2 flex items-baseline gap-1">
                  <p class="text-2xl font-black text-emerald-600">{{ employeeStats().active }}</p>
                </div>
              </div>
              <div class="rounded-md border border-amber-100 bg-amber-50 px-4 py-4 shadow-sm">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-amber-500">
                  {{ t('common.onLeave') }}
                </p>
                <div class="mt-2 flex items-baseline gap-1">
                  <p class="text-2xl font-black text-amber-600">{{ employeeStats().onLeave }}</p>
                </div>
              </div>
              <div class="rounded-md border border-rose-100 bg-rose-50 px-4 py-4 shadow-sm">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-rose-500">
                  {{ t('common.terminated') }}
                </p>
                <div class="mt-2 flex items-baseline gap-1">
                  <p class="text-2xl font-black text-rose-600">{{ employeeStats().terminated }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions Panel -->
          <div
            class="flex min-w-0 flex-col gap-4 rounded-md border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5"
          >
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {{ t('common.quickActions') }}
              </p>
              <h2 class="mt-1 text-lg font-black text-slate-900">
                Directory Controls
              </h2>
            </div>

            <div class="rounded-md border border-slate-100 bg-slate-50/50 px-4 py-4">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div>
                  <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Health Status</p>
                  <p class="text-sm font-bold text-slate-900">Directory Optimized</p>
                </div>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <button
                class="inline-flex items-center justify-center gap-2 rounded-md border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                (click)="exportEmployees()"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </button>
              <button
                class="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95 hover:shadow-lg"
                (click)="addEmployee()"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
                Add New
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Tabs Navigation -->
      <div class="flex overflow-x-auto no-scrollbar rounded-md border border-slate-200 bg-white p-1 shadow-sm">
        @for (tab of tabs; track tab.id) {
          @let tId = tab.id;
          <button
            (click)="setTab(tId)"
            [class]="
              'px-6 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all relative rounded-md ' +
              (currentTab() === tId
                ? 'text-primary-600 bg-primary-50/50'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/80')
            "
          >
            <div class="flex items-center gap-2.5">
              {{ tabLabel(tab.id) }}
              <span
                [class]="
                  'px-2 py-0.5 rounded-full text-[9px] font-black ' +
                  (currentTab() === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-400')
                "
              >
                {{ tab.count }}
              </span>
            </div>
          </button>
        }
      </div>

      <!-- Main Directory Card -->
      <div class="card overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <!-- Search and Filters -->
        <div class="flex flex-col items-start justify-between gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center bg-slate-50/30">
          <div class="relative w-full lg:max-w-[400px]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              (input)="onFilterChange()"
              [placeholder]="t('common.searchByNameEmailOrCode')"
              class="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-md text-sm font-semibold outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/5 transition-all bg-white"
            />
          </div>
          
          <div class="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:items-center">
            <div class="w-full sm:w-[220px]">
              <app-ui-select-advanced
                [ngModel]="statusFilter()"
                (ngModelChange)="statusFilter.set($event); onFilterChange()"
                [options]="statusFilterOptions"
                [placeholder]="statusPlaceholder()"
                [searchable]="false"
              ></app-ui-select-advanced>
            </div>
            <button
              class="inline-flex h-[42px] items-center justify-center px-4 border border-slate-200 rounded-md text-xs font-black uppercase tracking-widest bg-white text-slate-500 hover:bg-slate-50 active:bg-slate-100 transition-all"
              (click)="clearFilters()"
            >
              {{ t('common.reset') }}
            </button>
          </div>
        </div>

        <!-- Table State handling -->
        @if (isTableLoading()) {
          <div class="px-5 py-32 text-center">
            <div class="flex flex-col items-center gap-5">
              <div class="relative">
                 <div class="h-16 w-16 animate-spin rounded-full border-4 border-slate-100 border-t-primary-600"></div>
                 <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-lg animate-pulse">⚡</span>
                 </div>
              </div>
              <div class="space-y-1">
                <p class="text-lg font-black text-slate-900 uppercase tracking-tight">{{ t('common.loadingData') }}</p>
                <p class="text-sm font-medium text-slate-400">{{ t('common.fetchingEmployeeRecords') }}</p>
              </div>
            </div>
          </div>
        } @else if (tableEmployees().length === 0) {
          <div class="px-5 py-32 text-center">
            <div class="flex flex-col items-center gap-6">
              <div class="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-50 text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <div class="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-8 ring-slate-50">
                  <span class="text-xl">🤷‍♂️</span>
                </div>
              </div>
              <div class="max-w-sm space-y-2">
                <p class="text-xl font-black text-slate-900 tracking-tight">{{ t('common.noMembersFound') }}</p>
                <p class="text-sm font-medium text-slate-400 leading-relaxed">{{ t('common.noMembersFoundDescription') }}</p>
              </div>
              <button
                class="inline-flex items-center gap-2.5 px-6 py-3 rounded-md border border-slate-200 bg-white text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all hover:shadow-lg active:scale-95"
                (click)="clearFilters()"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Clear Filters
              </button>
            </div>
          </div>
        } @else {
          <!-- Roster Table -->
          <div class="overflow-x-auto no-scrollbar">
            <div class="min-w-[1200px]">
              <!-- Table Header -->
              <div class="grid grid-cols-[minmax(340px,1.8fr)_150px_180px_160px_180px_200px] bg-slate-50/50 border-b border-slate-100">
                <div class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{{ t('sidebar.employee') }}</div>
                <div class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-center">ID</div>
                <div class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{{ t('common.role') }}</div>
                <div class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{{ t('common.status') }}</div>
                <div class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{{ t('common.tenure') }}</div>
                <div class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-right">{{ t('common.actions') }}</div>
              </div>

              <!-- Table Body -->
              <div class="divide-y divide-slate-100">
                @for (emp of tableEmployees(); track trackEmployee(rowIndex, emp); let rowIndex = $index) {
                  <div class="grid grid-cols-[minmax(340px,1.8fr)_150px_180px_160px_180px_200px] items-center bg-white transition-all hover:bg-slate-50/80 group">
                    <!-- User Info Column -->
                    <div class="min-w-0 px-8 py-4">
                      <div class="flex items-center gap-4">
                        <div class="relative">
                          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 text-sm font-black text-white shadow-sm ring-4 ring-white transition-transform group-hover:scale-110 group-hover:rotate-3">
                            {{ employeeInitials(emp) }}
                          </div>
                          @if (normalizeStatus(emp.status) === 'active') {
                            <span class="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow-sm animate-pulse"></span>
                          }
                        </div>
                        <div class="min-w-0 flex flex-col gap-0.5">
                          <span class="truncate font-black text-slate-900 tracking-tight group-hover:text-primary-600 transition-colors">{{ employeeName(emp) }}</span>
                          <span class="truncate text-[11px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors">{{ employeeEmail(emp) }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- ID Column -->
                    <div class="px-6 py-4 flex justify-center">
                      <span class="inline-flex rounded-md border border-slate-100 bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-500 tracking-widest transition-all group-hover:bg-white group-hover:border-slate-300">
                        {{ employeeCode(emp) }}
                      </span>
                    </div>

                    <!-- Role Column -->
                    <div class="px-6 py-4">
                      <span class="text-sm font-bold text-slate-700 tracking-tight group-hover:text-slate-900 transition-colors">{{ employeeRoleLabel(emp) }}</span>
                    </div>

                    <!-- Status Column -->
                    <div class="px-6 py-4">
                      <span class="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-sm ring-1 ring-inset transition-all" [ngClass]="statusBadgeClass(employeeStatus(emp))">
                        <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                        {{ employeeStatusLabel(employeeStatus(emp)) }}
                      </span>
                    </div>

                    <!-- Date Column -->
                    <div class="px-6 py-4 text-xs font-bold italic text-slate-400 group-hover:text-slate-600 transition-colors">{{ employeeJoinedDate(emp) }}</div>

                    <!-- Actions Column -->
                    <div class="px-8 py-4">
                      <div class="flex justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <button type="button" (click)="viewEmployee(emp)" class="inline-flex h-9 min-w-[76px] items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-black uppercase tracking-widest text-slate-700 shadow-sm transition-all hover:bg-slate-900 hover:text-white hover:border-slate-900">
                          View
                        </button>
                        @if (canManageEmployees()) {
                          <button type="button" (click)="editEmployee(emp)" class="inline-flex h-9 min-w-[76px] items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-black uppercase tracking-widest text-slate-700 shadow-sm transition-all hover:bg-primary-600 hover:text-white hover:border-primary-600">
                            Edit
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Footer Pagination Info -->
        <div class="flex flex-col gap-4 border-t border-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between bg-slate-50/20">
          <div class="flex flex-col gap-1">
            <span class="text-sm font-black text-slate-900 tracking-tight uppercase">
              {{ t('common.showingOfEntries', { shown: tableEmployees().length, total: rawEmployees().length }) }}
            </span>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ tabLabel(currentTab()) }} View Active</p>
          </div>
          
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center rounded-md bg-white p-1 ring-1 ring-slate-200 shadow-sm">
              <div class="flex items-center px-4 py-1.5 gap-2">
                 <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                 <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {{ employeeStats().active }} Active
                 </span>
              </div>
              <div class="h-4 w-px bg-slate-100"></div>
              <div class="flex items-center px-4 py-1.5 gap-2">
                 <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">
                   Total {{ employeeStats().total }}
                 </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class EmployeeListComponent implements OnInit {
  private readonly permissionService = inject(PermissionService);
  private readonly authService = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private modalService = inject(ModalService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private liveRefreshService = inject(LiveRefreshService);
  private destroyRef = inject(DestroyRef);
  private languageService = inject(LanguageService);

  rawEmployees = signal<any[]>([]);
  loading = signal<boolean>(true);
  searchQuery = signal<string>('');
  statusFilter = signal<any>('');
  currentTab = signal<'all' | 'active' | 'inactive' | 'on_leave' | 'terminated'>('all');
  private routeView = signal<'dashboard' | 'on-job' | 'lifecycle'>('dashboard');

  normalizeStatus(value: any): 'active' | 'inactive' | 'on_leave' | 'terminated' {
    const normalized = String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');

    if (!normalized) return 'active';
    if (['active', 'accepted', 'approved', 'enabled', 'working', 'on_job', 'onboarded'].includes(normalized)) return 'active';
    if (['inactive', 'disabled', 'paused', 'pending', 'invited', 'expired'].includes(normalized)) return 'inactive';
    if (['on_leave', 'leave', 'onleave', 'leave_pending'].includes(normalized)) return 'on_leave';
    if (['terminated', 'offboarded', 'resigned', 'ex_employee', 'exit'].includes(normalized)) return 'terminated';
    return 'active';
  }

  private normalizeStatusFilter(value: any): '' | 'active' | 'inactive' | 'on_leave' | 'terminated' {
    const rawValue = typeof value === 'object' && value !== null ? value.value : value;
    const normalized = String(rawValue ?? '').trim();
    if (!normalized) return '';
    return this.normalizeStatus(normalized);
  }

  private syncCurrentTab(employees: any[]) {
    const counts = {
      active: employees.filter((e) => this.normalizeStatus(e.status) === 'active').length,
      inactive: employees.filter((e) => this.normalizeStatus(e.status) === 'inactive').length,
      on_leave: employees.filter((e) => this.normalizeStatus(e.status) === 'on_leave').length,
      terminated: employees.filter((e) => this.normalizeStatus(e.status) === 'terminated').length,
    };

    this.tabs[0].count = employees.length;
    this.tabs[1].count = counts.active;
    this.tabs[2].count = counts.inactive;
    this.tabs[3].count = counts.on_leave;
    this.tabs[4].count = counts.terminated;

    const activeTab = this.currentTab();
    if (this.routeView() !== 'dashboard') {
      return;
    }

    if (activeTab === 'all' || counts[activeTab] > 0 || employees.length === 0) {
      return;
    }

    const fallbackTab = (['active', 'inactive', 'on_leave', 'terminated'] as const).find(
      (tab) => counts[tab] > 0,
    );

    if (fallbackTab) {
      this.currentTab.set(fallbackTab);
    }
  }

  filteredEmployees = computed(() => {
    const all = this.rawEmployees();
    const tab = this.currentTab();
    const q = this.searchQuery().trim().toLowerCase();
    const sf = this.normalizeStatusFilter(this.statusFilter());

    let results = [...all];

    // Tab Filter
    if (tab !== 'all') {
      results = results.filter(e => this.normalizeStatus(e.status) === tab);
    }

    // Status Dropdown Filter
    if (sf) {
      results = results.filter(e => this.normalizeStatus(e.status) === sf);
    }

    // Search Query Filter
    if (q) {
      results = results.filter(e => 
        this.employeeName(e).toLowerCase().includes(q) ||
        this.employeeEmail(e).toLowerCase().includes(q) ||
        this.employeeCode(e).toLowerCase().includes(q)
      );
    }

    return results;
  });

  tableEmployees = computed(() => {
    return this.filteredEmployees();
  });

  isTableLoading(): boolean {
    return this.loading() && this.rawEmployees().length === 0;
  }

  employeeStats = computed(() => {
    const employees = this.rawEmployees();
    return {
      total: employees.length,
      active: employees.filter((e) => this.normalizeStatus(e.status) === 'active').length,
      onLeave: employees.filter((e) => this.normalizeStatus(e.status) === 'on_leave').length,
      terminated: employees.filter((e) => this.normalizeStatus(e.status) === 'terminated').length,
    };
  });

  tabs: {
    id: 'all' | 'active' | 'inactive' | 'on_leave' | 'terminated';
    count: number;
  }[] = [
    { id: 'all', count: 0 },
    { id: 'active', count: 0 },
    { id: 'inactive', count: 0 },
    { id: 'on_leave', count: 0 },
    { id: 'terminated', count: 0 },
  ];

  get statusFilterOptions(): SelectOption[] {
    return [
      { label: `Filter: All Status`, value: '' },
      { label: this.t('common.active'), value: 'active' },
      { label: this.t('common.inactive'), value: 'inactive' },
      { label: this.t('common.onLeave'), value: 'on_leave' },
      { label: this.t('common.terminated'), value: 'terminated' },
    ];
  }

  ngOnInit() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.applyRouteView(params.get('view'));
      });

    this.loadEmployees();
    this.liveRefreshService
      .createStream(30000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadEmployees(false));
  }

  loadEmployees(showLoader = true) {
    if (showLoader) this.loading.set(true);

    this.employeeService.getEmployees().pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (employees) => {
        const list = employees || [];
        this.rawEmployees.set(list);
        this.syncCurrentTab(list);
      },
      error: (err) => {
        console.error('Failed to load employees', err);
        this.rawEmployees.set([]);
        this.syncCurrentTab([]);
        this.toastService.error(this.t('error.failedToLoadEmployees'));
      },
    });
  }

  setTab(tabId: 'all' | 'active' | 'inactive' | 'on_leave' | 'terminated') {
    this.currentTab.set(tabId);
  }

  onFilterChange() {
    // Computeds update automatically via signals
  }

  clearFilters() {
    this.searchQuery.set('');
    this.statusFilter.set('');
  }

  private applyRouteView(view: string | null) {
    switch ((view || '').trim().toLowerCase()) {
      case 'on-job':
        this.routeView.set('on-job');
        this.currentTab.set('active');
        break;
      case 'lifecycle':
        this.routeView.set('lifecycle');
        this.currentTab.set('terminated');
        break;
      case 'dashboard':
      default:
        this.routeView.set('dashboard');
        this.currentTab.set('all');
        break;
    }
  }

  exportEmployees() {
    const rows = this.tableEmployees();
    if (!rows.length) {
      this.toastService.error(this.t('common.noEmployeesToExport'));
      return;
    }

    const csvHeaders = ['First Name', 'Last Name', 'Email', 'Code', 'Status', 'Joined Date'].join(',');
    const csvRows = rows.map(e => [
      e.firstName ?? '',
      e.lastName ?? '',
      e.email ?? '',
      this.employeeCode(e),
      this.employeeStatusLabel(e.status),
      this.employeeJoinedDate(e)
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const blob = new Blob([[csvHeaders, ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employee_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    this.toastService.success(this.t('common.exportSuccess'));
  }

  addEmployee() {
    this.router.navigate(['/employees/add']);
  }

  private resolveEmployeeId(value: unknown): number | null {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  getRoleLabel(roleId?: number | null): string {
    const label = this.permissionService.getRoleDisplayName({
      email: '',
      firstName: '',
      lastName: '',
      roleId: Number(roleId ?? 0) || undefined,
    });
    return label || this.t('sidebar.employee');
  }

  tabLabel(tabId: string): string {
    switch (tabId) {
      case 'all': return 'All Directory';
      case 'active': return this.t('common.active');
      case 'inactive': return this.t('common.inactive');
      case 'on_leave': return this.t('common.onLeave');
      case 'terminated': return this.t('common.terminated');
      default: return tabId;
    }
  }

  statusPlaceholder(): string {
    return `Filter: All Status`;
  }

  private fieldValue(emp: any, keys: string[]): string {
    for (const key of keys) {
      const value = key.split('.').reduce((current, piece) => current?.[piece], emp);
      const text = String(value ?? '').trim();
      if (text && text !== 'undefined' && text !== 'null') return text;
    }
    return '';
  }

  employeeNumericId(emp: any): number {
    return Number(this.fieldValue(emp, ['id', 'employeeId', 'employee_id', 'userId', 'user_id', 'orgId'])) || 0;
  }

  trackEmployee(index: number, emp: any): string | number {
    return this.employeeNumericId(emp) || `idx-${index}`;
  }

  employeeName(emp: any): string {
    const fn = this.fieldValue(emp, ['firstName', 'first_name']);
    const ln = this.fieldValue(emp, ['lastName', 'last_name']);
    const name = this.fieldValue(emp, ['name', 'fullName', 'full_name']);
    if (fn || ln) return `${fn} ${ln}`.trim();
    return name || 'Unknown Employee';
  }

  employeeInitials(emp: any): string {
    const name = this.employeeName(emp);
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }

  employeeEmail(emp: any): string {
    return this.fieldValue(emp, ['email', 'workEmail']) || 'No email provided';
  }

  employeeCode(emp: any): string {
    return this.fieldValue(emp, ['employeeCode', 'employee_code', 'code']) || 'EMP-000';
  }

  employeeStatus(emp: any): string {
    return this.fieldValue(emp, ['status']) || 'active';
  }

  employeeJoinedDate(emp: any): string {
    const val = this.fieldValue(emp, ['joinDate', 'join_date', 'createdAt', 'created_at']);
    if (!val) return 'Date Not Set';
    try {
       return new Date(val).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
       return val;
    }
  }

  employeeRoleLabel(emp: any): string {
    const role = this.fieldValue(emp, ['role.name', 'roleName', 'role_name']);
    return role || this.getRoleLabel(emp.roleId);
  }

  statusBadgeClass(status: any): Record<string, boolean> {
    const norm = this.normalizeStatus(status);
    return {
      'bg-emerald-50 text-emerald-700 ring-emerald-600/20': norm === 'active',
      'bg-amber-50 text-amber-700 ring-amber-600/20': norm === 'on_leave',
      'bg-rose-50 text-rose-700 ring-rose-600/20': norm === 'terminated',
      'bg-slate-50 text-slate-600 ring-slate-500/20': norm === 'inactive',
    };
  }

  employeeStatusLabel(status: any): string {
    const norm = this.normalizeStatus(status);
    return norm.charAt(0).toUpperCase() + norm.slice(1).replace('_', ' ');
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    this.languageService.currentLanguage();
    return this.languageService.t(key, params);
  }

  canManageEmployees(): boolean {
    return this.permissionService.canManageEmployees(this.authService.getStoredUser());
  }

  editEmployee(emp: any) {
    const id = this.resolveEmployeeId(this.employeeNumericId(emp));
    if (!id) {
       this.toastService.error(this.t('error.invalidEmployeeId'));
       return;
    }
    this.router.navigate(['/employees/edit', id]);
  }

  viewEmployee(emp: any) {
    const id = this.resolveEmployeeId(this.employeeNumericId(emp));
    if (!id) {
       this.toastService.error(this.t('error.invalidEmployeeId'));
       return;
    }
    this.router.navigate(['/employees/view', id]);
  }

  async deleteEmployee(id: number) {
    const employeeId = this.resolveEmployeeId(id);
    if (!employeeId) return;

    const confirmed = await this.modalService.confirm({
      title: 'Delete Employee Record',
      message: 'Are you sure you want to remove this employee from the directory? This action cannot be undone.',
      confirmText: 'Delete Forever',
      cancelText: 'Keep Record',
      type: 'danger',
    });

    if (confirmed) {
      this.employeeService.deleteEmployee(employeeId).subscribe({
        next: () => {
          this.toastService.success('Employee record successfully purged.');
          this.loadEmployees();
        },
        error: () => this.toastService.error('Failed to eliminate employee record.')
      });
    }
  }
}
