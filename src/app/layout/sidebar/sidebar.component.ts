import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, inject, OnInit, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectUser } from '../../core/state/auth/auth.selectors';
import { LayoutService } from '../../core/services/layout.service';
import {
  Organization,
  OrganizationService,
} from '../../core/services/organization.service';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';
import {
  SubscriptionService,
  SubscriptionStatusPayload,
} from '../../core/services/subscription.service';
import { User } from '../../core/models/auth.model';
import { WorkspaceCatalogService } from '../../core/access/workspace-catalog.service';
import { WorkspaceModuleView } from '../../core/access/access.models';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Mobile Backdrop -->
    <div
      *ngIf="layoutService.sidebarOpen()"
      (click)="layoutService.closeSidebar()"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 lg:hidden transition-all duration-500"
    ></div>

    <aside
      [ngClass]="desktopSidebarWidthClass()"
      [class.translate-x-0]="layoutService.sidebarOpen()"
      [class.-translate-x-full]="!layoutService.sidebarOpen()"
      class="app-sidebar-surface fixed lg:static inset-y-0 left-0 w-[85vw] max-w-[276px] h-screen flex flex-col overflow-hidden z-50 transition-all duration-500 lg:translate-x-0 bg-white border-r border-slate-200/80 shadow-xl shadow-slate-200/40"
    >
      <!-- Branding & Close (Mobile) -->
      <div class="relative border-b border-slate-100 px-4 pt-4 pb-3">
        <div class="flex items-center justify-between">
          <div class="flex min-w-0 items-center gap-3 group cursor-pointer" routerLink="/dashboard">
            <div class="flex shrink-0 overflow-hidden items-center justify-center transition-transform duration-500 group-hover:scale-[1.02]">
               <img [src]="showExpandedSidebar() ? '/hrnexus-logo.png' : '/hrnexus-brand-mark.png'" alt="HRNexus" [class]="showExpandedSidebar() ? 'h-12 w-auto max-w-[200px] object-contain' : 'h-11 w-11 rounded-md bg-slate-950 p-1 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-100 object-contain'" />
            </div>
          </div>

          <button
            (click)="layoutService.closeSidebar()"
            class="flex lg:hidden h-10 w-10 items-center justify-center rounded-md bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      <!-- User Profile Card -->
      @if (showExpandedSidebar()) {
        <div class="px-4 pt-3 pb-3">
          <div class="group relative overflow-hidden rounded-md border border-slate-200 bg-slate-50/80 px-3.5 py-3 transition-all hover:border-emerald-100 hover:bg-white">
            <div class="relative z-10 flex items-center gap-3.5">
              <div class="relative">
                <div class="h-11 w-11 overflow-hidden rounded-full border-2 border-white bg-white shadow-sm transition-transform duration-500 group-hover:scale-105">
                  @if (orgLogo()) {
                    <img [src]="orgLogo()" [alt]="orgName()" class="h-full w-full object-contain p-1">
                  } @else if (currentUser()?.avatar) {
                    <img [src]="currentUser()?.avatar" class="h-full w-full object-cover">
                  } @else {
                    <div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-500 text-base font-black text-white">
                      {{ userInitials() }}
                    </div>
                  }
                </div>
                <div class="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-sm"></div>
              </div>
              <div class="flex min-w-0 flex-col">
                <h3 class="truncate text-sm font-black text-slate-900 tracking-tight">{{ userName() }}</h3>
                <p class="truncate text-[10px] font-bold text-slate-500 uppercase tracking-[0.16em] opacity-70">{{ userRole() }}</p>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Nav Sections -->
      <nav
        role="navigation"
        class="flex-1 overflow-y-auto custom-scrollbar pb-8"
      >
        @if (showExpandedSidebar()) {
          <div class="space-y-5 px-4 pt-3">
          <!-- Self Service -->
          @if (shouldShowSection('main')) {
            <div class="space-y-2">
              <button type="button" (click)="toggleSection('main')" class="flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left transition" [ngClass]="isSectionExpanded('main') ? 'border-emerald-100 bg-emerald-50/70 text-emerald-900' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'">
                <div class="flex min-w-0 items-center gap-3">
                  <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{{ mainSectionLabel() }}</span>
                  <div class="h-px w-10 bg-slate-100"></div>
                </div>
                <svg class="h-4 w-4 text-slate-400 transition-transform" [class.rotate-180]="isSectionExpanded('main')" [class.text-emerald-600]="isSectionExpanded('main')" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              @if (isSectionExpanded('main')) {
              <div class="ml-4 space-y-1 border-l border-dashed border-slate-200 pl-3">
                @for (link of selfServiceLinks(); track link.id + link.route) {
                  <ng-container *ngTemplateOutlet="navItem; context: { $implicit: link }"></ng-container>
                }
              </div>
              }
            </div>
          }

          <!-- People -->
          @if (shouldShowSection('employees')) {
            <div class="space-y-2">
              <button type="button" (click)="toggleSection('employees')" class="flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left transition" [ngClass]="isSectionExpanded('employees') ? 'border-emerald-100 bg-emerald-50/70 text-emerald-900' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'">
                <div class="flex min-w-0 items-center gap-3">
                  <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{{ peopleSectionLabel() }}</span>
                  <div class="h-px w-10 bg-slate-100"></div>
                </div>
                <svg class="h-4 w-4 text-slate-400 transition-transform" [class.rotate-180]="isSectionExpanded('employees')" [class.text-emerald-600]="isSectionExpanded('employees')" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              @if (isSectionExpanded('employees')) {
              <div class="ml-4 space-y-1 border-l border-dashed border-slate-200 pl-3">
                @for (link of peopleLinks(); track link.id + link.route) {
                  <ng-container *ngTemplateOutlet="navItem; context: { $implicit: link }"></ng-container>
                }
              </div>
              }
            </div>
          }

          <!-- Attendance -->
          @if (shouldShowSection('attendance')) {
            <div class="space-y-2">
              <button type="button" (click)="toggleSection('attendance')" class="flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left transition" [ngClass]="isSectionExpanded('attendance') ? 'border-emerald-100 bg-emerald-50/70 text-emerald-900' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'">
                <div class="flex min-w-0 items-center gap-3">
                  <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{{ attendanceSectionLabel() }}</span>
                  <div class="h-px w-10 bg-slate-100"></div>
                </div>
                <svg class="h-4 w-4 text-slate-400 transition-transform" [class.rotate-180]="isSectionExpanded('attendance')" [class.text-emerald-600]="isSectionExpanded('attendance')" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              @if (isSectionExpanded('attendance')) {
              <div class="ml-4 space-y-1 border-l border-dashed border-slate-200 pl-3">
                @for (link of attendanceLinks(); track link.id + link.route) {
                  <ng-container *ngTemplateOutlet="navItem; context: { $implicit: link }"></ng-container>
                }
              </div>
              }
            </div>
          }

          <!-- Leave -->
          @if (shouldShowSection('leave')) {
            <div class="space-y-2">
              <button type="button" (click)="toggleSection('leave')" class="flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left transition" [ngClass]="isSectionExpanded('leave') ? 'border-emerald-100 bg-emerald-50/70 text-emerald-900' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'">
                <div class="flex min-w-0 items-center gap-3">
                  <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{{ leaveSectionLabel() }}</span>
                  <div class="h-px w-10 bg-slate-100"></div>
                </div>
                <svg class="h-4 w-4 text-slate-400 transition-transform" [class.rotate-180]="isSectionExpanded('leave')" [class.text-emerald-600]="isSectionExpanded('leave')" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              @if (isSectionExpanded('leave')) {
              <div class="ml-4 space-y-1 border-l border-dashed border-slate-200 pl-3">
                @for (link of leaveLinks(); track link.id + link.route) {
                  <ng-container *ngTemplateOutlet="navItem; context: { $implicit: link }"></ng-container>
                }
              </div>
              }
            </div>
          }

          <!-- Payroll -->
          @if (shouldShowSection('payroll')) {
            <div class="space-y-2">
              <button type="button" (click)="toggleSection('payroll')" class="flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left transition" [ngClass]="isSectionExpanded('payroll') ? 'border-emerald-100 bg-emerald-50/70 text-emerald-900' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'">
                <div class="flex min-w-0 items-center gap-3">
                  <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{{ payrollSectionLabel() }}</span>
                  <div class="h-px w-10 bg-slate-100"></div>
                </div>
                <svg class="h-4 w-4 text-slate-400 transition-transform" [class.rotate-180]="isSectionExpanded('payroll')" [class.text-emerald-600]="isSectionExpanded('payroll')" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              @if (isSectionExpanded('payroll')) {
              <div class="ml-4 space-y-1 border-l border-dashed border-slate-200 pl-3">
                @for (link of payrollLinks(); track link.id + link.route) {
                  <ng-container *ngTemplateOutlet="navItem; context: { $implicit: link }"></ng-container>
                }
              </div>
              }
            </div>
          }

          <!-- System -->
          @if (shouldShowSection('security')) {
            <div class="space-y-2">
              <button type="button" (click)="toggleSection('security')" class="flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left transition" [ngClass]="isSectionExpanded('security') ? 'border-emerald-100 bg-emerald-50/70 text-emerald-900' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'">
                <div class="flex min-w-0 items-center gap-3">
                  <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{{ systemSectionLabel() }}</span>
                  <div class="h-px w-10 bg-slate-100"></div>
                </div>
                <svg class="h-4 w-4 text-slate-400 transition-transform" [class.rotate-180]="isSectionExpanded('security')" [class.text-emerald-600]="isSectionExpanded('security')" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              @if (isSectionExpanded('security')) {
              <div class="ml-4 space-y-1 border-l border-dashed border-slate-200 pl-3">
                @for (link of systemLinks(); track link.id + link.route) {
                  <ng-container *ngTemplateOutlet="navItem; context: { $implicit: link }"></ng-container>
                }
              </div>
              }
            </div>
          }
          </div>
        } @else {
          <!-- Compact Mode -->
          <div class="flex flex-col items-center gap-3 px-3 pt-5">
            @for (link of compactNavLinks(); track link.id + link.route) {
              @if (link.isLocked) {
                <button
                  type="button"
                  (click)="openLockedModule(link)"
                  class="flex h-12 w-12 items-center justify-center rounded-md bg-slate-50 text-slate-400 transition hover:bg-slate-100"
                  [attr.title]="link.label + ' (Locked)'"
                >
                  <span [innerHTML]="resolveIcon(link.icon)"></span>
                </button>
              } @else {
                <a
                  [routerLink]="routePath(link.route)"
                  [queryParams]="routeQueryParams(link.route)"
                  class="flex h-12 w-12 items-center justify-center rounded-md transition-all duration-300"
                  [class.bg-emerald-600]="isRouteActive(link.route)"
                  [class.text-white]="isRouteActive(link.route)"
                  [class.shadow-lg]="isRouteActive(link.route)"
                  [class.shadow-emerald-200]="isRouteActive(link.route)"
                  [class.bg-slate-50]="!isRouteActive(link.route)"
                  [class.text-slate-400]="!isRouteActive(link.route)"
                  [class.hover:bg-slate-100]="!isRouteActive(link.route)"
                  [attr.title]="link.label"
                  (click)="closeOnMobile()"
                >
                  <span [innerHTML]="resolveIcon(link.icon)"></span>
                </a>
              }
            }
          </div>
        }
      </nav>

      <!-- Sidebar Footer -->
      <div class="border-t border-slate-100 px-4 py-4">
        @if (showExpandedSidebar()) {
          <div class="flex flex-col gap-3">
             <!-- Collapse Toggle -->
             <button
              (click)="layoutService.cycleDesktopSidebar()"
              class="group flex items-center justify-center gap-3 w-full h-11 rounded-md bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.18em] shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 hover:scale-[1.01] active:scale-[0.98]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="transition-transform group-hover:-translate-x-1"><path d="m15 18-6-6 6-6"/></svg>
              <span>Minimize Menu</span>
            </button>
          </div>
        } @else {
          <button
            (click)="layoutService.cycleDesktopSidebar()"
            class="flex h-12 w-12 items-center justify-center rounded-md bg-slate-900 text-white shadow-xl shadow-slate-200 transition-transform hover:scale-110 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        }
      </div>
    </aside>

    <!-- Nav Item Template -->
    <ng-template #navItem let-link>
      @if (link.isLocked) {
        <button
          (click)="openLockedModule(link)"
          class="flex w-full items-center justify-between gap-3 px-4 py-3.5 rounded-md bg-transparent text-slate-400 grayscale opacity-60 cursor-not-allowed"
        >
          <div class="flex items-center gap-3 min-w-0">
            <span [innerHTML]="resolveIcon(link.icon)"></span>
            <span class="truncate text-sm font-bold tracking-tight">{{ link.label }}</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </button>
      } @else {
        <a
          [routerLink]="routePath(link.route)"
          [queryParams]="routeQueryParams(link.route)"
          (click)="onNavLinkClick(activeSectionKey())"
          class="group relative flex items-center gap-2.5 rounded-md border px-3 py-2.5 transition-all duration-300"
          [class.border-emerald-200]="isRouteActive(link.route)"
          [class.bg-emerald-50]="isRouteActive(link.route)"
          [class.text-white]="isRouteActive(link.route)"
          [class.shadow-sm]="isRouteActive(link.route)"
          [class.text-slate-600]="!isRouteActive(link.route)"
          [class.font-bold]="!isRouteActive(link.route)"
          [class.border-transparent]="!isRouteActive(link.route)"
          [class.hover:border-slate-200]="!isRouteActive(link.route)"
          [class.hover:bg-slate-50]="!isRouteActive(link.route)"
          [class.hover:text-slate-900]="!isRouteActive(link.route)"
        >
          <span class="absolute left-[-0.85rem] top-1/2 hidden h-px w-3 -translate-y-1/2 bg-slate-200 lg:block"></span>
          <span class="relative z-10 flex h-8 w-8 items-center justify-center rounded-md transition-transform duration-300 group-hover:scale-105" [class.bg-emerald-600]="isRouteActive(link.route)" [class.text-white]="isRouteActive(link.route)" [class.bg-slate-100]="!isRouteActive(link.route)" [class.text-slate-500]="!isRouteActive(link.route)" [innerHTML]="resolveIcon(link.icon)"></span>
          <span class="relative z-10 truncate text-[13px] font-bold tracking-tight" [class.text-slate-900]="!isRouteActive(link.route)" [class.text-emerald-900]="isRouteActive(link.route)">{{ link.label }}</span>
          
          @if (isRouteActive(link.route)) {
            <div class="absolute inset-y-2 left-0 w-1 rounded-r-md bg-emerald-500"></div>
            <div class="absolute right-3 h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm"></div>
          }
        </a>
      }
    </ng-template>
  `,
  styles: [`
    :host { display: block; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e2e8f0; }
  `]
})
export class SidebarComponent implements OnInit {
  private readonly sanitizer = inject(DomSanitizer);
  layoutService = inject(LayoutService);
  private orgService = inject(OrganizationService);
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);
  private workspaceCatalog = inject(WorkspaceCatalogService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private subscriptionService = inject(SubscriptionService);
  private languageService = inject(LanguageService);
  private destroyRef = inject(DestroyRef);
  currentUser = signal<User | null>(null);
  orgName = signal<string>('');
  orgLogo = signal<string>('');
  subscriptionStatus = signal<SubscriptionStatusPayload | null>(null);
  hasOrgLogo = computed(() => Boolean(this.orgLogo().trim()));
  private expandedSection = signal<string>('main');
  private isDesktopViewport = signal(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  public isUserLoading = signal(true);
  public isOrgLoading = signal(true);
  private store = inject(Store);
  private user$ = this.store.select(selectUser);
  readonly selfServiceLinks = computed(() =>
    ['dashboard', 'self-service'].flatMap((id) =>
      this.workspaceCatalog.getSectionViews(this.currentUser(), id, { includeLocked: true }),
    ),
  );
  readonly peopleLinks = computed(() =>
    this.workspaceCatalog.getSectionViews(this.currentUser(), 'employees', { includeLocked: true }),
  );
  readonly attendanceLinks = computed(() =>
    this.workspaceCatalog.getSectionViews(this.currentUser(), 'attendance', { includeLocked: true }),
  );
  readonly leaveLinks = computed(() =>
    this.workspaceCatalog.getSectionViews(this.currentUser(), 'leave', { includeLocked: true }),
  );
  readonly payrollLinks = computed(() =>
    this.workspaceCatalog.getSectionViews(this.currentUser(), 'payroll', { includeLocked: true }),
  );
  readonly systemLinks = computed(() =>
    ['settings', 'addons', 'visitormanagement', 'organization', 'kiosk-management', 'roles-permissions'].flatMap((id) =>
      this.workspaceCatalog.getSectionViews(this.currentUser(), id, { includeLocked: true }),
    ),
  );
  readonly compactNavLinks = computed(() =>
    this.mergeUniqueLinks(
      this.selfServiceLinks(),
      this.peopleLinks(),
      this.attendanceLinks(),
      this.leaveLinks(),
      this.payrollLinks(),
      this.systemLinks(),
    ),
  );

  ngOnInit() {
    this.currentUser.set(this.authService.getStoredUser());
    this.permissionService.syncForUser(this.currentUser());
    this.isUserLoading.set(false);

    this.user$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      if (user) {
        this.currentUser.set(user);
        this.permissionService.syncForUser(user);
      }
    });

    this.orgService.getOrganization().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((org) => {
      this.setOrganizationBranding(org);
      this.isOrgLoading.set(false);
    });
    this.subscriptionService.getStatus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (status) => this.subscriptionStatus.set(status),
      error: () => this.subscriptionStatus.set(null),
    });

    this.syncExpandedSectionWithRoute();
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.syncExpandedSectionWithRoute();
      }
    });
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.isDesktopViewport.set(window.innerWidth >= 1024);
  }

  desktopSidebarWidthClass(): string {
    if (!this.isDesktopViewport()) return '';
    if (this.layoutService.showSideBar()) return 'lg:w-64 xl:w-[280px]';
    return this.layoutService.showSidebarMenu() ? 'lg:w-[90px]' : 'lg:w-[40px]';
  }

  showExpandedSidebar(): boolean {
    return !this.isDesktopViewport() || this.layoutService.showSideBar();
  }

  showCompactSidebar(): boolean {
    return this.isDesktopViewport() && !this.layoutService.showSideBar() && this.layoutService.showSidebarMenu();
  }

  sectionTabs(): Array<{ key: string; label: string }> {
    return [
      { key: 'main', label: 'Portal' },
      { key: 'employees', label: 'People' },
      { key: 'attendance', label: 'Attendance' },
      { key: 'leave', label: 'Leave' },
      { key: 'security', label: 'System' },
    ];
  }

  activeSectionKey(): string {
    return this.sectionForCurrentRoute();
  }

  shouldShowSection(section: string): boolean {
    return this.showExpandedSidebar() || this.activeSectionKey() === section;
  }

  private mergeUniqueLinks(...groups: WorkspaceModuleView[][]): WorkspaceModuleView[] {
    const seen = new Set<string>();
    return groups.flat().filter((link) => {
      const key = `${link.id}:${link.route}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private setOrganizationBranding(org: Organization | null | undefined) {
    const storedUser = this.currentUser() ?? this.authService.getStoredUser();
    this.orgName.set((org?.name || storedUser?.organizationName || storedUser?.companyName || '').trim());
    this.orgLogo.set((org?.logo || storedUser?.organizationLogo || storedUser?.companyLogo || '').trim());
  }

  private expandOnly(section: string) {
    this.expandedSection.set(section);
  }

  private syncExpandedSectionWithRoute() {
    this.expandOnly(this.sectionForCurrentRoute());
  }

  private sectionForCurrentRoute(): string {
    const path = this.routePath(this.router.url || '/dashboard');
    if (path.startsWith('/self-service/requests') || path.startsWith('/admin/approvals')) return 'main';
    if (path.startsWith('/self-service/leave') || path.startsWith('/leave') || path.startsWith('/leaves')) return 'leave';
    if (path.startsWith('/self-service/payroll') || path.startsWith('/self-service/payslip') || path.startsWith('/payroll')) return 'payroll';
    if (path.startsWith('/employees')) return 'employees';
    if (path.startsWith('/attendance') || path.startsWith('/face-registration') || path.startsWith('/admin/attendance') || path.startsWith('/hr/attendance')) return 'attendance';
    if (path.startsWith('/settings') || path.startsWith('/admin') || path.startsWith('/add-ons') || path.startsWith('/visit-management') || path.startsWith('/reports')) return 'security';
    return 'main';
  }

  toggleSection(section: string) {
    this.expandOnly(section);
  }

  isSectionExpanded(section: string): boolean {
    return this.expandedSection() === section;
  }

  moduleStateLabel(slug?: string): string {
    if (!slug) return this.t('common.core');
    return this.orgService.isModuleEnabled(slug) ? this.t('common.on') : this.t('common.locked');
  }

  userName(): string {
    const user = this.currentUser() ?? this.authService.getStoredUser();
    if (!user) return 'Workspace User';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User';
  }

  userRole(): string {
    const user = this.currentUser() ?? this.authService.getStoredUser();
    return this.permissionService.getRoleDisplayName(user) || 'Employee';
  }

  userInitials(): string {
    const user = this.currentUser() ?? this.authService.getStoredUser();
    const first = user?.firstName?.charAt(0) || '';
    const last = user?.lastName?.charAt(0) || '';
    return (first + last || user?.email?.charAt(0) || 'U').toUpperCase();
  }

  orgInitial(): string {
    return (this.orgName().charAt(0) || 'E').toUpperCase();
  }

  onOrgLogoError() {
    this.orgLogo.set('');
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    return this.languageService.t(key, params);
  }

  closeOnMobile() {
    if (window.innerWidth < 1024) this.layoutService.closeSidebar();
  }

  onNavLinkClick(section: string) {
    this.expandOnly(section);
    this.closeOnMobile();
  }

  routePath(route: string): string {
    return route.split('?')[0] || route;
  }

  routeQueryParams(route: string): Record<string, string> | null {
    const query = route.split('?')[1];
    if (!query) return null;
    const params: Record<string, string> = {};
    new URLSearchParams(query).forEach((value, key) => params[key] = value);
    return params;
  }

  isRouteActive(route: string): boolean {
    return this.activeRouteSignature() === this.routeSignature(route);
  }

  private activeRouteSignature(): string {
    const links = this.mergeUniqueLinks(
      this.selfServiceLinks(),
      this.peopleLinks(),
      this.attendanceLinks(),
      this.leaveLinks(),
      this.payrollLinks(),
      this.systemLinks(),
    );

    const ranked = links
      .map((link) => ({ route: link.route, score: this.routeMatchScore(link.route) }))
      .filter((item) => item.score >= 0)
      .sort((a, b) => b.score - a.score);

    return ranked[0]?.route ? this.routeSignature(ranked[0].route) : '';
  }

  private routeSignature(route: string): string {
    const path = this.normalizeRoutePath(this.routePath(route));
    const query = this.routeQueryParams(route) ?? {};
    const sortedQuery = Object.keys(query)
      .sort((left, right) => left.localeCompare(right))
      .map((key) => `${key}=${query[key] ?? ''}`)
      .join('&');
    return sortedQuery ? `${path}?${sortedQuery}` : path;
  }

  private routeMatchScore(route: string): number {
    const currentPath = this.normalizeRoutePath(this.routePath(this.router.url || '/'));
    const currentQuery = this.routeQueryParams(this.router.url || '/') ?? {};
    const targetPath = this.normalizeRoutePath(this.routePath(route));
    const targetQuery = this.routeQueryParams(route) ?? {};

    let pathMatched = false;

    if (targetPath === '/dashboard' || targetPath === '/self-service' || targetPath === '') {
      pathMatched =
        currentPath === '' ||
        currentPath === '/' ||
        currentPath === '/dashboard' ||
        currentPath === '/self-service';
    } else if (targetPath === '/settings' || targetPath === '/admin') {
      pathMatched =
        currentPath === targetPath ||
        currentPath.startsWith(`${targetPath}/`);
    } else {
      pathMatched =
        currentPath === targetPath ||
        currentPath.startsWith(`${targetPath}/`);
    }

    if (!pathMatched) {
      return -1;
    }

    const targetQueryKeys = Object.keys(targetQuery);
    const queryMatched = targetQueryKeys.every(
      (key) => currentQuery[key] === targetQuery[key],
    );

    if (!queryMatched) {
      return -1;
    }

    return targetPath.length * 10 + targetQueryKeys.length;
  }

  private normalizeRoutePath(path: string): string {
    if (!path) return '';
    const normalized = path.replace(/\/+$/, '');
    return normalized || '/';
  }

  resolveIcon(icon?: string): SafeHtml {
    const icons: Record<string, string> = {
      dashboard: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="7" height="9" x="3" y="3" rx="2"/><rect width="7" height="5" x="14" y="3" rx="2"/><rect width="7" height="9" x="14" y="12" rx="2"/><rect width="7" height="5" x="3" y="16" rx="2"/></svg>',
      profile: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      attendance: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>',
      leave: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      payroll: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" x2="12" y1="1" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      timesheets: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      expenses: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      projects: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>',
      reports: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>',
      employees: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      invitations: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>',
      visitors: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>',
      'team-attendance': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>',
      regularization: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>',
      geofence: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11z"/><circle cx="12" cy="10" r="3"/></svg>',
      'shift-planner': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>',
      documents: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>',
      roles: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      announcements: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>',
      settings: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
      addons: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
      audit: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    };
    return this.sanitizer.bypassSecurityTrustHtml(icons[icon || ''] ?? icons['dashboard']);
  }

  openLockedModule(link: WorkspaceModuleView): void {
    this.closeOnMobile();
    this.toastService.info(link.lockReason ?? `${link.label} is locked.`);
    this.router.navigateByUrl('/billing');
  }

  mainSectionLabel(): string { return 'Portal'; }
  peopleSectionLabel(): string { return 'Workforce'; }
  attendanceSectionLabel(): string { return 'Time & Presence'; }
  leaveSectionLabel(): string { return 'Absence'; }
  payrollSectionLabel(): string { return 'Compensation'; }
  systemSectionLabel(): string { return 'Operations'; }
}
