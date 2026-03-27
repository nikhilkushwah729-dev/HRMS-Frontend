import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { NavigationEnd, Router } from '@angular/router';
import { selectUser } from '../../core/state/auth/auth.selectors';
import { LayoutService } from '../../core/services/layout.service';
import * as AuthActions from '../../core/state/auth/auth.actions';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { Project, ProjectService } from '../../core/services/project.service';
import { OrganizationService, Designation } from '../../core/services/organization.service';
import { User } from '../../core/models/auth.model';
import { catchError, forkJoin, of } from 'rxjs';
import { PermissionService } from '../../core/services/permission.service';
import { filter } from 'rxjs/operators';

type SearchCategory = 'Quick Link' | 'Employee' | 'Project';
type SearchResult = {
  title: string;
  subtitle: string;
  route: string;
  category: SearchCategory;
  tone: string;
};

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="app-topbar-surface min-h-16 md:min-h-[82px] w-full px-3 sm:px-4 lg:px-8 flex items-center justify-between sticky top-0 z-50">
      <div class="flex min-w-0 items-center gap-3 sm:gap-4 lg:gap-5">
        <button (click)="layoutService.toggleSidebar()" class="lg:hidden p-2.5 text-slate-600 hover:bg-white/80 rounded-md transition-colors border border-stone-200/70 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>

        <div class="hidden md:flex min-w-0 flex-col">
          <span class="app-page-kicker">{{ headerKicker() }}</span>
          <h1 class="app-page-title truncate">{{ headerTitle() }}</h1>
          <p class="app-page-subtitle truncate">{{ headerSubtitle() }}</p>
        </div>

        @if (canUseSearch()) {
        <div class="relative w-full max-w-[220px] md:max-w-[430px] hidden sm:block">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            type="text"
            [value]="searchQuery()"
            (focus)="openSearch()"
            (input)="onSearchInput(($any($event.target).value || '').toString())"
            placeholder="Search anything..."
            class="w-full pl-11 pr-16 py-2.5 rounded-full border border-slate-200/60 bg-slate-50/50 hover:bg-white text-sm shadow-sm focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-700 placeholder:text-slate-400 font-medium"
          >
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-white border border-slate-200/70 rounded-full px-2 py-0.5 shadow-sm">Ctrl K</span>

          @if (showSearchPanel()) {
            <div class="absolute left-0 right-0 mt-3 bg-white rounded-md shadow-2xl border border-stone-100 overflow-hidden z-[70]">
              <div class="px-4 py-3 border-b border-stone-100 bg-gradient-to-r from-amber-50/80 via-white to-teal-50/70">
                <p class="text-[11px] font-black uppercase tracking-widest text-stone-500">Global Search</p>
              </div>
              <div class="max-h-[min(65vh,26rem)] overflow-y-auto">
                @if (searchResults().length === 0) {
                  <div class="px-4 py-8 text-center">
                    <p class="text-sm font-semibold text-slate-400">No matching results</p>
                    <p class="text-xs text-slate-400 mt-1">Try employee name, project, or module name</p>
                  </div>
                } @else {
                  @for (result of searchResults(); track result.route + result.title) {
                    <button
                      (click)="goToSearchResult(result.route)"
                      class="w-full text-left px-4 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="text-sm font-bold text-slate-900 truncate">{{ result.title }}</p>
                          <p class="text-xs text-slate-500 truncate">{{ result.subtitle }}</p>
                        </div>
                        <span class="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md"
                              [ngClass]="result.tone">
                          {{ result.category }}
                        </span>
                      </div>
                    </button>
                  }
                }
              </div>
            </div>
          }
        </div>
        }
      </div>

      <div class="flex items-center gap-1.5 sm:gap-3 md:gap-4">
        <div class="hidden xl:flex items-center">
          <span class="app-page-header-chip">{{ currentDateLabel() }}</span>
        </div>

        <!-- Notification Bell -->
        @if (canViewNotifications()) {
        <div class="relative">
          <button (click)="toggleNotifications()" class="relative text-slate-500 p-2 rounded-full hover:bg-slate-100/80 hover:text-indigo-600 transition-colors border border-transparent hover:border-slate-200/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            @if (notifService.unreadCount() > 0) {
              <span class="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm">
                {{ notifService.unreadCount() > 9 ? '9+' : notifService.unreadCount() }}
              </span>
            }
          </button>

          <!-- Notification Panel -->
          @if (showNotifications()) {
            <div class="fixed left-2 right-2 top-[4.5rem] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 w-auto sm:w-80 sm:max-w-80 bg-white rounded-md shadow-2xl border border-stone-100 overflow-hidden z-[60]">
              <div class="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                <h4 class="font-bold text-slate-900 text-sm">Notifications</h4>
                @if (notifService.unreadCount() > 0) {
                  <button (click)="markAllRead()" class="text-[11px] font-bold text-primary-600 hover:underline">Mark all read</button>
                }
              </div>
              <div class="max-h-[min(70vh,26rem)] overflow-y-auto">
                @if (notifService.notifications().length === 0) {
                  <div class="flex flex-col items-center justify-center py-10 text-center px-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-slate-300 mb-2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                    <p class="text-sm text-slate-400 font-medium">No notifications</p>
                  </div>
                }
                @for (notif of notifService.notifications(); track notif.id) {
                  <div class="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0"
                       [ngClass]="{ 'bg-primary-50/30': !notif.isRead }"
                       (click)="markRead(notif.id)">
                    <div class="w-2 h-2 rounded-full mt-2 shrink-0 transition-colors"
                         [ngClass]="!notif.isRead ? 'bg-primary-500' : 'bg-transparent'"></div>
                    <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span class="text-sm font-bold text-slate-800 leading-tight">{{ notif.title }}</span>
                      <span class="text-xs text-slate-500 line-clamp-2">{{ notif.message }}</span>
                      <span class="text-[10px] text-slate-400 font-medium mt-1">{{ notif.createdAt | date:'short' }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
        }

        <!-- User Profile Dropdown -->
        <div class="relative">
          @if (currentUser(); as user) {
            <div (click)="showDropdown = !showDropdown; showNotifications.set(false)" class="flex items-center gap-2.5 p-1 md:pr-4 rounded-full cursor-pointer bg-slate-50/50 hover:bg-white border border-slate-200/60 hover:border-slate-300/80 hover:shadow-sm transition-all group">
              <div class="w-8 h-8 md:w-9 md:h-9 overflow-hidden bg-gradient-to-br from-indigo-500 to-teal-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] group-hover:scale-105 transition-transform ring-2 ring-white">
                @if (user.avatar) {
                  <img [src]="user.avatar" class="h-full w-full object-cover" alt="Profile photo">
                } @else {
                  <span>{{ userInitial() }}</span>
                }
              </div>
              <div class="hidden md:flex flex-col items-start justify-center leading-none">
                <span class="text-[13px] font-bold text-slate-800">{{ user.firstName }} {{ user.lastName }}</span>
                @if (userDesignation()) {
                  <span class="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">{{ userDesignation() }}</span>
                } @else {
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{{ userRoleLabel() }}</span>
                }
              </div>
            </div>
          }

          <!-- Profile Dropdown -->
          @if (showDropdown && currentUser(); as user) {
            <div class="fixed left-2 right-2 top-[4.5rem] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 w-auto sm:w-64 sm:max-w-64 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 z-[60] ring-1 ring-slate-900/5">
              <div class="px-3 py-3 border-b border-slate-100/80 mb-1 flex items-center gap-3 bg-slate-50/50 rounded-lg">
                <div class="w-10 h-10 overflow-hidden bg-gradient-to-br from-indigo-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner ring-2 ring-white">
                  @if (user.avatar) {
                    <img [src]="user.avatar" class="h-full w-full object-cover">
                  } @else {
                    <span>{{ userInitial() }}</span>
                  }
                </div>
                <div class="min-w-0">
                  <p class="text-[13px] font-bold text-slate-900 truncate">{{ user.firstName }} {{ user.lastName }}</p>
                  <p class="text-[11px] font-medium text-slate-500 truncate mt-0.5">{{ user.email }}</p>
                </div>
              </div>
              <button (click)="goToSearchResult('/profile')" class="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-all group">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-slate-400 group-hover:text-indigo-500 transition-colors"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>My Profile</span>
              </button>
              @if (canAccess('/settings')) {
                <button (click)="goToSearchResult('/settings')" class="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-all group mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-slate-400 group-hover:text-indigo-500 transition-colors"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                  <span>Profile Settings</span>
                </button>
              }
              @if (canAccess('/admin/settings')) {
                <div class="my-1.5 border-t border-slate-100"></div>
                <button (click)="goToSearchResult('/admin/settings')" class="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-all group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-slate-400 group-hover:text-indigo-500 transition-colors"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                  <span>Admin Settings</span>
                </button>
              }
              <div class="my-1.5 border-t border-slate-100"></div>
              <button (click)="logout()" class="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-all group">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="group-hover:translate-x-0.5 transition-transform"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                <span>Sign Out</span>
              </button>
            </div>
          }
        </div>
      </div>
    </header>

    <!-- Click outside overlay to close dropdowns -->
    @if (showDropdown || showNotifications() || showSearchPanel()) {
      <div (click)="closeAll()" class="fixed inset-0 z-30"></div>
    }
  `,
  styles: []
})
export class TopbarComponent implements OnInit {
  private store = inject(Store);
  private router = inject(Router);
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private projectService = inject(ProjectService);
  private permissionService = inject(PermissionService);
  private organizationService = inject(OrganizationService);
  layoutService = inject(LayoutService);
  notifService = inject(NotificationService);

  user$ = this.store.select(selectUser);
  showDropdown = false;
  showNotifications = signal(false);
  showSearchPanel = signal(false);
  searchQuery = signal('');
  searchResults = signal<SearchResult[]>([]);
  loggingOut = signal(false);
  currentUser = signal<User | null>(null);
  private currentPath = signal('/');
  private employeeCache = signal<User[]>([]);
  private projectCache = signal<Project[]>([]);
  private designations = signal<Designation[]>([]);
  userDesignation = signal<string>('');
  userRoleLabel = signal<string>('Employee');
  private readonly quickLinks: SearchResult[] = [
    { title: 'Dashboard', subtitle: 'Overview and metrics', route: '/self-service', category: 'Quick Link', tone: 'bg-indigo-50 text-indigo-600' },
    { title: 'Employees', subtitle: 'Employee records', route: '/employees', category: 'Quick Link', tone: 'bg-sky-50 text-sky-600' },
    { title: 'Attendance', subtitle: 'Daily attendance tracking', route: '/attendance', category: 'Quick Link', tone: 'bg-cyan-50 text-cyan-600' },
    { title: 'Leaves', subtitle: 'Leave request and approval', route: '/leaves', category: 'Quick Link', tone: 'bg-emerald-50 text-emerald-600' },
    { title: 'Reports', subtitle: 'Attendance reports and analytics', route: '/reports', category: 'Quick Link', tone: 'bg-orange-50 text-orange-600' },
    { title: 'Projects', subtitle: 'Project management board', route: '/projects', category: 'Quick Link', tone: 'bg-violet-50 text-violet-600' },
    { title: 'Expenses', subtitle: 'Claims and reimbursements', route: '/expenses', category: 'Quick Link', tone: 'bg-amber-50 text-amber-700' },
    { title: 'Timesheets', subtitle: 'Work hour logs', route: '/timesheets', category: 'Quick Link', tone: 'bg-rose-50 text-rose-600' },
    { title: 'Payroll', subtitle: 'Salary and payslips', route: '/payroll', category: 'Quick Link', tone: 'bg-fuchsia-50 text-fuchsia-600' },
    { title: 'Audit Logs', subtitle: 'System audit trail', route: '/admin/audit', category: 'Quick Link', tone: 'bg-slate-100 text-slate-600' },
    { title: 'Settings', subtitle: 'System configuration', route: '/admin/settings', category: 'Quick Link', tone: 'bg-teal-50 text-teal-700' }
  ];

  ngOnInit() {
    this.currentPath.set(this.router.url || '/');
    this.currentUser.set(this.authService.getStoredUser());
    this.updateRoleLabel(this.currentUser()?.roleId);
    
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this.currentPath.set(event.urlAfterRedirects || event.url || '/');
      this.closeAll();
    });

    // Subscribe to user$ observable to get the latest user data reactively from the store
    this.user$.subscribe(user => {
      if (user) {
        this.currentUser.set(user);
        this.updateRoleLabel(user.roleId);
      }
    });

    this.notifService.getNotifications().subscribe();
    this.loadSearchData();
    this.searchResults.set(this.getVisibleQuickLinks().slice(0, 6));
    this.loadUserDesignation();
  }

  private updateRoleLabel(roleId?: number) {
    switch (roleId) {
      case 1: 
        this.userRoleLabel.set('Admin');
        break;
      case 2: 
        this.userRoleLabel.set('HR');
        break;
      case 3: 
        this.userRoleLabel.set('Manager');
        break;
      case 4: 
        this.userRoleLabel.set('Employee');
        break;
      default: 
        this.userRoleLabel.set('Employee');
    }
  }

  private loadUserDesignation() {
    const user = this.currentUser() ?? this.authService.getStoredUser();
    if (user?.designationId) {
      this.organizationService.getDesignations().subscribe({
        next: (designations) => {
          const designation = designations.find(d => d.id === user.designationId);
          if (designation) {
            this.userDesignation.set(designation.name);
          }
        },
        error: () => {
          // Silently handle error
        }
      });
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === 'k') {
      event.preventDefault();
      this.openSearch();
      return;
    }
    if (key === 'escape') {
      this.closeAll();
    }
  }

  private loadSearchData() {
    const canSearchEmployees = this.permissionService.hasPermission(this.currentUser(), 'search.employees');
    const canSearchProjects = this.permissionService.hasPermission(this.currentUser(), 'search.projects');

    forkJoin({
      employees: canSearchEmployees
        ? this.employeeService.getEmployees().pipe(catchError(() => of([] as User[])))
        : of([] as User[]),
      projects: canSearchProjects
        ? this.projectService.getProjects().pipe(catchError(() => of([] as Project[])))
        : of([] as Project[])
    }).subscribe(({ employees, projects }) => {
      this.employeeCache.set(employees);
      this.projectCache.set(projects);
    });
  }

  openSearch() {
    if (!this.canUseSearch()) return;
    this.showDropdown = false;
    this.showNotifications.set(false);
    this.showSearchPanel.set(true);
    if (!this.searchQuery().trim()) {
      this.searchResults.set(this.getVisibleQuickLinks().slice(0, 8));
    }
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);
    this.showSearchPanel.set(true);
    const query = value.trim().toLowerCase();
    const visibleQuickLinks = this.getVisibleQuickLinks();
    if (!query) {
      this.searchResults.set(visibleQuickLinks.slice(0, 8));
      return;
    }

    const links = visibleQuickLinks
      .filter((item) => (item.title + ' ' + item.subtitle).toLowerCase().includes(query))
      .slice(0, 6);

    const employees = this.employeeCache()
      .filter((emp) =>
        `${emp.firstName || ''} ${emp.lastName || ''} ${emp.email || ''}`.toLowerCase().includes(query)
      )
      .slice(0, 6)
      .map((emp) => ({
        title: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email,
        subtitle: emp.email,
        route: '/employees',
        category: 'Employee' as const,
        tone: 'bg-blue-50 text-blue-700'
      }));

    const projects = this.projectCache()
      .filter((project) =>
        `${project.name || ''} ${project.description || ''}`.toLowerCase().includes(query)
      )
      .slice(0, 6)
      .map((project) => ({
        title: project.name,
        subtitle: project.description || 'Project',
        route: '/projects',
        category: 'Project' as const,
        tone: 'bg-purple-50 text-purple-700'
      }));

    this.searchResults.set([...links, ...employees, ...projects].slice(0, 12));
  }

  goToSearchResult(route: string) {
    this.closeAll();
    this.router.navigateByUrl(route);
  }

  toggleNotifications() {
    if (!this.canViewNotifications()) return;
    this.showSearchPanel.set(false);
    this.showDropdown = false;
    this.showNotifications.update(v => !v);
  }

  markRead(id: number) {
    this.notifService.markAsRead(id).subscribe();
  }

  markAllRead() {
    this.notifService.markAllAsRead().subscribe();
  }

  closeAll() {
    this.showDropdown = false;
    this.showNotifications.set(false);
    this.showSearchPanel.set(false);
  }

  canAccess(route: string): boolean {
    const user = this.currentUser() ?? this.authService.getStoredUser();
    return this.permissionService.canAccessRoute(user, route);
  }

  canViewNotifications(): boolean {
    const user = this.currentUser() ?? this.authService.getStoredUser();
    return this.permissionService.hasPermission(user, 'notifications.view');
  }

  canUseSearch(): boolean {
    return this.getVisibleQuickLinks().length > 0;
  }

  currentDateLabel(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  userInitial(): string {
    const user = this.currentUser() ?? this.authService.getStoredUser();
    return (user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase();
  }

  headerKicker(): string {
    return this.currentPath() === '/' || this.currentPath() === '/dashboard' ? 'Today at a Glance' : 'HR Workspace';
  }

  headerTitle(): string {
    const path = this.currentPath();
    if (path === '/' || path === '/dashboard' || path === '/self-service') return 'Operations Dashboard';
    if (path.startsWith('/employees')) return 'Employee Management';
    if (path.startsWith('/attendance')) return 'Attendance Hub';
    if (path.startsWith('/leaves')) return 'Leave Workspace';
    if (path.startsWith('/reports')) return 'Reports and Insights';
    if (path.startsWith('/projects')) return 'Projects';
    if (path.startsWith('/payroll')) return 'Payroll Center';
    if (path.startsWith('/expenses')) return 'Expense Claims';
    if (path.startsWith('/timesheets')) return 'Timesheets';
    if (path.startsWith('/settings') || path.startsWith('/admin')) return 'Administration';
    return 'HRMS Workspace';
  }

  headerSubtitle(): string {
    const path = this.currentPath();
    if (path === '/' || path === '/dashboard' || path === '/self-service') {
      return 'Monitor attendance, approvals, and people updates from one premium workspace.';
    }
    if (path.startsWith('/employees')) return 'Maintain employee records, invitations, and profile updates.';
    if (path.startsWith('/attendance')) return 'Track clock-ins, review regularization, and monitor live status.';
    if (path.startsWith('/leaves')) return 'Manage balances, requests, approvals, and holiday planning.';
    if (path.startsWith('/reports')) return 'Review trends, exports, and operational insights.';
    if (path.startsWith('/settings') || path.startsWith('/admin')) return 'Control permissions, policies, documents, and system settings.';
    return 'Everything important stays organized, fast, and easier to operate.';
  }

  roleLabel(): string {
    // First try to get from observable, then fallback to stored user
    let roleId: number | undefined;
    
    // Subscribe synchronously to get current value
    this.user$.subscribe(user => {
      if (user) {
        roleId = user.roleId;
      }
    }).unsubscribe();
    
    // Fallback to stored user if not found in store
    if (!roleId) {
      const storedUser = this.authService.getStoredUser();
      roleId = storedUser?.roleId;
    }
    
    switch (roleId) {
      case 1: return 'Admin';
      case 2: return 'HR';
      case 3: return 'Manager';
      case 4: return 'Employee';
      default: return 'Employee';
    }
  }

  private getVisibleQuickLinks(): SearchResult[] {
    const user = this.currentUser() ?? this.authService.getStoredUser();
    return this.quickLinks.filter((item) => this.permissionService.canAccessRoute(user, item.route));
  }

  logout() {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    this.showDropdown = false;
    const token = this.authService.getStoredToken();
    this.authService.clearAuthStorage();
    this.store.dispatch(AuthActions.logout());
    this.router.navigateByUrl('/auth/login', { replaceUrl: true });
    this.authService.logout(token).subscribe({
      next: () => this.loggingOut.set(false),
      error: () => this.loggingOut.set(false)
    });
  }
}
