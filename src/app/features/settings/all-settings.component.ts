import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PermissionService } from '../../core/services/permission.service';
import { AuthService } from '../../core/services/auth.service';
import { getSettingMenu, SettingCategory, SettingRoute } from './setting-menu';
import { OrganizationService } from '../../core/services/organization.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { EmployeeService } from '../../core/services/employee.service';
import { LeaveService } from '../../core/services/leave.service';

@Component({
  selector: 'app-all-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="mx-auto flex h-full max-w-7xl flex-col gap-4 sm:gap-5 lg:gap-6">
      <section class="grid gap-4 sm:gap-5 lg:grid-cols-[1fr_360px] lg:gap-6 xl:grid-cols-[1fr_400px]">
  
        <!-- Main Control Center Area -->
        <div class="min-w-0 flex flex-col gap-5 sm:gap-6">
          <!-- Hero Header -->
          <div class="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <!-- Decor -->
            <div class="absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/3 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-100/60 via-slate-50/20 to-transparent blur-3xl"></div>
            
            <div class="relative">
              <div class="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700 shadow-sm">
                <span class="relative flex h-2 w-2">
                  <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                Control Center
              </div>
              <h1 class="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">System Settings</h1>
              <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base sm:leading-7">
                Manage configurations, organizations, policies, and system-wide behavior from one polished admin surface designed for faster day-to-day operations.
              </p>
            </div>

            <div class="relative mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2">
              <div class="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 shadow-sm transition hover:border-slate-200 hover:bg-white hover:shadow">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm" [ngClass]="controlCenterTone()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <div>
                  <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Workspace Pulse</p>
                  <p class="mt-1 text-sm font-bold text-slate-900">{{ settingsReadiness() }}</p>
                  <p class="mt-1 text-xs leading-5 text-slate-500">{{ controlCenterMessage() }}</p>
                </div>
              </div>

              <div class="flex items-start gap-4 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white shadow-md transition hover:border-slate-700 hover:shadow-lg">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <div>
                  <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Overall Coverage</p>
                  <p class="mt-1 text-2xl font-black tracking-tight text-white">{{ summaryScore() }}%</p>
                  <p class="mt-1 text-[11px] leading-5 text-white/50">Based on core module configurations.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Metrics -->
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div class="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow">
              <p class="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">Employees</p>
              <p class="mt-1 text-2xl font-black text-slate-900">{{ employeeCount() }}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow">
              <p class="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">Locations</p>
              <p class="mt-1 text-2xl font-black text-slate-900">{{ locationCount() }}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow">
              <p class="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">Departments</p>
              <p class="mt-1 text-2xl font-black text-slate-900">{{ departmentCount() }}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow">
              <p class="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">Shifts</p>
              <p class="mt-1 text-2xl font-black text-slate-900">{{ shiftCount() }}</p>
            </div>
          </div>
        </div>

        <!-- Search & Pinned Section -->
        <div class="flex h-full min-w-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 p-4 sm:p-5 lg:p-6">
            <div class="flex justify-between items-start gap-3">
              <div>
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500">Navigator</p>
                <p class="mt-1 text-sm font-semibold text-slate-900">Quick jump to any configuration module.</p>
              </div>
              <button type="button" (click)="closeSettings()" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div class="relative mt-5" data-settings-search>
              <input
                type="text"
                placeholder="Search modules..."
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearchChange($event)"
                class="w-full rounded-lg border-2 border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
              />
              <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>

              @if (isSearchOpen() && searchResults().length > 0) {
                <div class="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                  @for (result of searchResults(); track result.route) {
                    <a [routerLink]="result.route" class="group flex items-center justify-between gap-3 rounded-md px-3 py-2.5 transition hover:bg-indigo-50">
                      <div class="flex items-center gap-3">
                        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 transition group-hover:bg-indigo-100 group-hover:text-indigo-600">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </div>
                        <div>
                          <p class="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-700">{{ result.label }}</p>
                          <p class="text-[11px] font-medium tracking-[0.05em] text-slate-500">{{ result.category }}</p>
                        </div>
                      </div>
                    </a>
                  }
                </div>
              }
              @if (isSearchOpen() && searchResults().length === 0) {
                <div class="absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-sm font-medium text-slate-500 shadow-xl">
                  No matches found. Try another term.
                </div>
              }
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              @for (term of quickSearchTerms(); track term) {
                <button type="button" (click)="applyQuickSearch(term)" class="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.05em] text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">
                  {{ term }}
                </button>
              }
            </div>
          </div>

          <div class="flex-1 rounded-b-xl bg-slate-50/50 p-4 sm:p-5 lg:p-6">
            <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Pinned Modules</p>
            <div class="mt-4 grid gap-2">
              @for (route of featuredSettings(); track route.route) {
                <a [routerLink]="route.route" class="group flex items-center justify-between rounded-lg border border-transparent bg-white px-4 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">{{ formatLabel(route.label) }}</p>
                    <p class="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{{ route.category }}</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500"><path d="m9 18 6-6-6-6"/></svg>
                </a>
              }
            </div>
          </div>
        </div>
      </section>

      <div class="mt-2 flex-1">
        <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Module Library</p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">Settings categories</h2>
          </div>
          <p class="max-w-xl text-sm font-medium leading-6 text-slate-500">Every visible card below is access-aware and routes only to modules available for your specific permission level.</p>
        </div>
        
        <div class="grid gap-4 sm:gap-5 md:grid-cols-2 2xl:grid-cols-3 lg:gap-6">
          @for (category of objectKeys(structuredSettings()); track category) {
            @if (structuredSettings()[category].per && structuredSettings()[category].routes.length > 0) {
              <section class="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <div class="p-6">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex items-start gap-4">
                      <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl font-black uppercase tracking-wider shadow-sm transition-transform group-hover:scale-105" [ngClass]="[structuredSettings()[category].bgClass, structuredSettings()[category].colorClass]">
                        {{ categoryBadge(structuredSettings()[category].label) }}
                      </div>
                      <div class="min-w-0 pt-1">
                        <h2 class="break-words text-lg font-black text-slate-900">{{ structuredSettings()[category].label }}</h2>
                        <p class="mt-1 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">{{ visibleRouteCount(structuredSettings()[category]) }} modules</p>
                      </div>
                    </div>
                  </div>
                  <p class="mt-5 text-sm font-medium leading-6 text-slate-600">
                    {{ categoryDescription(category) }}
                  </p>
                </div>

                <div class="flex-1 bg-slate-50 p-4 mt-auto border-t border-slate-100">
                  <div class="grid gap-2 xl:grid-cols-2">
                    @for (route of structuredSettings()[category].routes; track route.route) {
                      @if (route.per) {
                        <a [routerLink]="route.route" class="group/item flex flex-col justify-center rounded-xl border border-transparent bg-slate-100/50 px-4 py-4 transition hover:border-slate-200 hover:bg-white hover:shadow-sm">
                          <div class="flex items-start gap-3">
                            <div class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-300 transition group-hover/item:scale-125 group-hover/item:bg-indigo-500"></div>
                            <div class="min-w-0">
                              <p class="truncate text-sm font-bold text-slate-900 transition group-hover/item:text-indigo-600">{{ formatLabel(route.label) }}</p>
                              <p class="mt-1 truncate text-[11px] font-medium tracking-wide text-slate-500">{{ route.path }}</p>
                            </div>
                          </div>
                        </a>
                      }
                    }
                  </div>
                </div>
              </section>
            }
          }
        </div>
      </div>

      @if (adminShortcuts().length > 0) {
        <section class="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500">Quick Actions</p>
              <h2 class="mt-2 text-2xl font-black text-slate-900">Shortcuts for admin work</h2>
            </div>
            <p class="text-sm font-medium text-slate-500">Fast access for day-to-day configuration tasks.</p>
          </div>
          
          <div class="grid gap-4 md:grid-cols-2 lg:gap-5">
            @for (shortcut of adminShortcuts(); track shortcut.route) {
              <a [routerLink]="shortcut.route" class="group flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:-translate-y-1 hover:shadow-md sm:p-5"
                 [ngClass]="shortcut.route === '/settings/approval-flow' ? 'hover:border-emerald-200 hover:bg-emerald-50' : 'hover:border-indigo-200 hover:bg-indigo-50'">
                <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm transition"
                     [ngClass]="shortcut.route === '/settings/approval-flow' ? 'text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white' : 'text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white'">
                  <svg *ngIf="shortcut.route === '/settings/approval-flow'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                  <svg *ngIf="shortcut.route !== '/settings/approval-flow'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                </div>
                <div class="min-w-0 pt-1">
                  <p class="text-lg font-black text-slate-900">{{ shortcut.label }}</p>
                  <p class="mt-2 text-sm font-medium leading-relaxed text-slate-500">{{ shortcut.category }}</p>
                </div>
              </a>
            }
          </div>
        </section>
      }
    </div>
  `
})
export class AllSettingsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private organizationService = inject(OrganizationService);
  private attendanceService = inject(AttendanceService);
  private employeeService = inject(EmployeeService);
  private leaveService = inject(LeaveService);

  structuredSettings = signal<Record<string, SettingCategory>>({});
  departmentCount = signal(0);
  shiftCount = signal(0);
  activeAddonCount = signal(0);
  employeeCount = signal(0);
  holidayCount = signal(0);
  locationCount = signal(0);
  leaveTypeCount = signal(0);
  quickTerms = ['shift', 'holiday', 'leave', 'department', 'approval'];
  
  searchQuery = signal('');
  isSearchOpen = signal(false);
  searchResults = signal<SettingRoute[]>([]);
  allFlatRoutes: SettingRoute[] = [];
  private handleDocumentClick = (e: Event) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-settings-search]')) {
      this.isSearchOpen.set(false);
    }
  };
  
  private permissionService = inject(PermissionService);
  private authService = inject(AuthService);

  ngOnInit() {
    this.structuredSettings.set(getSettingMenu(this.permissionService, this.authService));
    
    // Flatten routes for search
    const settings = this.structuredSettings();
    const flat: SettingRoute[] = [];
    Object.keys(settings).forEach(key => {
      flat.push(...settings[key].routes.filter(r => r.per));
    });
    this.allFlatRoutes = flat;
    this.loadSummary();

    document.addEventListener('click', this.handleDocumentClick);
  }

  private loadSummary() {
    this.organizationService.getDepartments().subscribe({
      next: (departments) => this.departmentCount.set(departments.length),
      error: () => this.departmentCount.set(0),
    });

    this.attendanceService.getShifts().subscribe({
      next: (shifts) => this.shiftCount.set(shifts.length),
      error: () => this.shiftCount.set(0),
    });

    this.organizationService.getAddons().subscribe({
      next: (addons) =>
        this.activeAddonCount.set(addons.filter((addon) => addon?.isActive).length),
      error: () => this.activeAddonCount.set(0),
    });

    this.employeeService.getEmployees().subscribe({
      next: (employees) => this.employeeCount.set(employees.length),
      error: () => this.employeeCount.set(0),
    });

    this.organizationService.getHolidays().subscribe({
      next: (holidays) => this.holidayCount.set(holidays.length),
      error: () => this.holidayCount.set(0),
    });

    this.organizationService.getLocations().subscribe({
      next: (locations) => this.locationCount.set(locations.length),
      error: () => this.locationCount.set(0),
    });

    this.leaveService.getLeaveTypes().subscribe({
      next: (response) => this.leaveTypeCount.set(response.data.length),
      error: () => this.leaveTypeCount.set(0),
    });
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.handleDocumentClick);
  }

  objectKeys(obj: any) {
    return Object.keys(obj);
  }

  formatLabel(label: string): string {
    return label.replace(/-/g, ' ');
  }

  categoryBadge(label: string): string {
    const parts = label.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'S';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }

  visibleRouteCount(category: SettingCategory): number {
    return category.routes.filter((route) => route.per).length;
  }

  totalVisibleSettings(): number {
    return this.allFlatRoutes.length;
  }

  totalCategories(): number {
    return Object.keys(this.structuredSettings()).filter((key) => {
      const category = this.structuredSettings()[key];
      return category.per && category.routes.some((route) => route.per);
    }).length;
  }

  featuredSettings(): SettingRoute[] {
    const preferredRoutes = [
      '/settings/organisation/organisation-profile',
      '/settings/attendance/shift',
      '/settings/leave/leave-types',
      '/settings/approval-flow',
      '/settings/import-wizard',
    ];

    const ordered = preferredRoutes
      .map((route) => this.allFlatRoutes.find((item) => item.route === route))
      .filter((item): item is SettingRoute => Boolean(item));

    return ordered.slice(0, 5);
  }

  quickSearchTerms(): string[] {
    return this.quickTerms;
  }

  adminShortcuts(): Array<{ route: string; label: string; category: string }> {
    const shortcuts = [
      {
        route: '/settings/approval-flow',
        label: 'Approval Flow Center',
        category: 'Review rules and setup nested approval chains across your entire organization.',
      },
      {
        route: '/settings/import-wizard',
        label: 'Import Master Wizard',
        category: 'Bring external policy references and core framework data directly into the system.',
      },
    ];

    return shortcuts.filter((shortcut) =>
      this.allFlatRoutes.some((route) => route.route === shortcut.route),
    );
  }

  applyQuickSearch(term: string): void {
    this.searchQuery.set(term);
    this.onSearchChange(term);
  }

  summaryScore(): number {
    const checkpoints = [
      this.departmentCount() > 0,
      this.shiftCount() > 0,
      this.employeeCount() > 0,
      this.holidayCount() > 0,
      this.locationCount() > 0,
      this.leaveTypeCount() > 0,
    ];
    const completed = checkpoints.filter(Boolean).length;
    return Math.round((completed / checkpoints.length) * 100);
  }

  settingsReadiness(): string {
    const score = this.summaryScore();
    if (score >= 100) return 'Ready';
    if (score >= 60) return 'In Progress';
    return 'Needs Setup';
  }

  controlCenterTone(): string {
    const score = this.summaryScore();
    if (score >= 100) return 'bg-emerald-100 text-emerald-700';
    if (score >= 60) return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
  }

  controlCenterMessage(): string {
    const score = this.summaryScore();
    if (score >= 100) {
      return 'Core settings coverage looks healthy.';
    }
    if (score >= 60) {
      return 'Most key masters are in place, a few areas still need attention.';
    }
    return 'Important setup blocks are still missing for a smooth production rollout.';
  }

  categoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      attendance: 'Control shift rules, device logic, geo validation, and attendance-specific policy masters.',
      organisation: 'Maintain company structure, master data, locations, holidays, and organization-wide defaults.',
      leave: 'Configure leave programs, time-off logic, and absence policy building blocks.',
      employee: 'Prepare onboarding and employee-related setup experiences for smoother HR operations.',
      visitManagement: 'Manage advanced configuration surfaces used for broader operational setup.',
      system: 'Handle approval logic, import flows, and global admin utilities.',
    };

    return descriptions[category] || 'Manage settings for this module group.';
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    const q = query.trim().toLowerCase();
    
    if (!q) {
      this.isSearchOpen.set(false);
      this.searchResults.set([]);
      return;
    }

    this.isSearchOpen.set(true);
    const results = this.allFlatRoutes.filter(route => 
      route.label.toLowerCase().includes(q) || 
      route.category.toLowerCase().includes(q)
    );
    this.searchResults.set(results);
  }

  closeSettings() {
    this.router.navigate(['/dashboard']);
  }
}

