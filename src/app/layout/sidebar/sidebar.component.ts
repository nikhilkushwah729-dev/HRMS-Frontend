import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
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

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div
      *ngIf="layoutService.sidebarOpen()"
      (click)="layoutService.toggleSidebar()"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
    ></div>

    <aside
      [class.translate-x-0]="layoutService.sidebarOpen()"
      [class.-translate-x-full]="!layoutService.sidebarOpen()"
      class="app-sidebar-surface fixed lg:static inset-y-0 left-0 w-[88vw] max-w-[280px] sm:w-[80vw] sm:max-w-[300px] h-screen flex flex-col overflow-hidden z-50 transition-transform duration-500 lg:translate-x-0 border-r border-white/[0.03] bg-[#0B1120] shadow-[10px_0_30px_-15px_rgba(0,0,0,0.5)]"
    >
      <!-- Top Product Branding (HRNexus) -->
      <div class="px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6">
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3 group cursor-pointer">
            <div
              class="relative rounded-xl overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-transform duration-500 group-hover:scale-105 border border-white/5"
            >
              <img
                src="/hrnexus-logo.png"
                alt="HRNexus"
                class="h-10 w-auto object-contain"
              />
            </div>
            <div class="flex flex-col">
              <span
                class="text-sm font-black text-white tracking-widest uppercase"
                style="font-family: 'Sora', sans-serif;"
                >HRNexus</span
              >
              <span
                class="text-[8px] font-bold text-indigo-400 uppercase tracking-[0.3em]"
                >Technology</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Client Organization Card -->
      <div class="px-3 sm:px-4 mb-4 sm:mb-6">
        <div
          class="p-5 rounded-xl bg-white/[0.03] border border-white/[0.05] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-md transform transition-all duration-300 hover:bg-white/[0.05] group"
        >
          <div class="flex items-center gap-4">
            <div class="relative">
              <div
                class="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"
              ></div>
              <div
                class="relative w-14 h-14 rounded-lg overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center"
              >
                @if (hasOrgLogo()) {
                  <img
                    [src]="orgLogo()"
                    [alt]="orgName() || 'Organization Logo'"
                    class="w-full h-full object-cover"
                    (error)="onOrgLogoError()"
                  />
                } @else {
                  <span class="text-xl font-black text-emerald-200">{{
                    orgInitial()
                  }}</span>
                }
              </div>
            </div>
            <div class="flex flex-col min-w-0">
              <p
                class="text-[9px] font-extrabold text-emerald-500/80 uppercase tracking-[0.2em] mb-1"
              >
                Active Space
              </p>
              @if (isOrgLoading()) {
                <div
                  class="h-5 bg-white/5 rounded-full animate-pulse w-24"
                ></div>
              } @else {
                <h2
                  class="text-base font-black text-white truncate leading-tight tracking-tight"
                  title="{{ orgName() || 'Enterprise' }}"
                >
                  {{ orgName() || 'Enterprise' }}
                </h2>
              }
            </div>
          </div>

          <div
            class="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-between"
          >
            <div class="min-w-0 flex items-center gap-2">
              <span
                class="w-1.5 h-1.5 rounded-full animate-pulse"
                [ngClass]="subscriptionDotTone()"
              ></span>
              <span
                class="truncate text-[10px] font-bold uppercase tracking-wider"
                [ngClass]="subscriptionLabelTone()"
                >{{ subscriptionBadgeLabel() }}</span
              >
            </div>
            <div class="flex items-center gap-2">
              <span class="rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300 border border-emerald-500/20">
                {{ activeModuleCount() }} active
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-slate-500"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          </div>

          <div class="mt-3 flex items-center justify-between gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
            <div class="min-w-0">
              <p class="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">
                Billing Pulse
              </p>
              <p class="mt-1 truncate text-[11px] font-semibold text-slate-200">
                {{ subscriptionHelperText() }}
              </p>
            </div>
            <a
              routerLink="/billing"
              (click)="closeOnMobile()"
              class="shrink-0 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200 transition hover:bg-cyan-500/20"
            >
              Billing
            </a>
          </div>
        </div>
      </div>


      <nav
        role="navigation"
        aria-label="Main navigation"
        class="flex-1 px-2.5 sm:px-3 py-4 sm:py-5 space-y-3 sm:space-y-4 overflow-y-auto custom-scrollbar scroll-smooth"
      >
        <!-- Main Navigation -->
        <div>
          <button
            type="button"
            class="app-nav-section-trigger group"
            (click)="toggleSection('main')"
            [attr.aria-expanded]="isSectionExpanded('main') | json"
            aria-label="Toggle Self Service section"
          >
            <div class="flex items-center gap-3">
              <span class="app-nav-section-title">{{ mainSectionLabel() }}</span>
              <span
                class="hidden sm:inline-flex px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-[8px] font-black text-indigo-400 border border-indigo-500/20 uppercase tracking-tighter"
                >Portal</span
              >
            </div>
            <div
              class="app-nav-section-chevron transition-transform duration-300 opacity-30 group-hover:opacity-100"
              [class.rotate-180]="isSectionExpanded('main')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </button>
          @if (isSectionExpanded('main')) {
            <div class="app-nav-section-content mt-1.5 space-y-0.5" open>
              @for (link of selfServiceLinks(); track link.route) {
                @if (link.isLocked) {
                  <button
                    type="button"
                    (click)="openLockedModule(link)"
                    class="app-nav-link group justify-between w-full"
                  >
                    <span class="flex items-center gap-3 min-w-0">
                      <div class="app-nav-icon">
                        <span [innerHTML]="resolveIcon(link.icon)"></span>
                      </div>
                      <span class="truncate">{{ link.label }}</span>
                    </span>
                    <span
                      class="shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] border-rose-200 bg-rose-50 text-rose-700"
                    >
                      Locked
                    </span>
                  </button>
                } @else {
                  <a
                    [routerLink]="link.route"
                    routerLinkActive="app-nav-link-active"
                    (click)="closeOnMobile()"
                    class="app-nav-link group justify-between"
                  >
                    <span class="flex items-center gap-3 min-w-0">
                      <div class="app-nav-icon">
                        <span [innerHTML]="resolveIcon(link.icon)"></span>
                      </div>
                      <span class="truncate">{{ link.label }}</span>
                    </span>
                    <span
                      class="shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em]"
                      [ngClass]="isModuleEnabled(link.moduleSlug) ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-slate-500/20 bg-white/5 text-slate-400'"
                    >
                      {{ moduleStateLabel(link.moduleSlug) }}
                    </span>
                  </a>
                }
              }
            </div>
          }
        </div>

        @if (hasPeopleSection()) {
        <!-- People Management -->
        <div>
          <button
            type="button"
            class="app-nav-section-trigger group"
            (click)="toggleSection('employees')"
            [attr.aria-expanded]="isSectionExpanded('employees') | json"
            aria-label="Toggle People section"
          >
            <div class="flex items-center gap-3">
              <span class="app-nav-section-title">{{ peopleSectionLabel() }}</span>
              <span
                class="hidden sm:inline-flex px-1.5 py-0.5 rounded-full bg-sky-500/10 text-[8px] font-black text-sky-300 border border-sky-500/20 uppercase tracking-tighter"
                >Directory</span
              >
            </div>
            <div
              class="app-nav-section-chevron transition-transform duration-300 opacity-30 group-hover:opacity-100"
              [class.rotate-180]="isSectionExpanded('employees')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </button>
          @if (isSectionExpanded('employees')) {
            <div class="app-nav-section-content mt-1.5 space-y-0.5" open>
              @for (link of peopleLinks(); track link.route) {
                @if (link.isLocked) {
                  <button
                    type="button"
                    (click)="openLockedModule(link)"
                    class="app-nav-link group w-full justify-between"
                  >
                    <span class="flex items-center gap-3">
                      <div class="app-nav-icon">
                        <span [innerHTML]="resolveIcon(link.icon)"></span>
                      </div>
                      <span>{{ link.label }}</span>
                    </span>
                    <span class="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-rose-700">
                      Lock
                    </span>
                  </button>
                } @else {
                  <a
                    [routerLink]="link.route"
                    routerLinkActive="app-nav-link-active"
                    (click)="closeOnMobile()"
                    class="app-nav-link group min-w-0"
                  >
                    <div class="app-nav-icon">
                      <span [innerHTML]="resolveIcon(link.icon)"></span>
                    </div>
                    <span class="truncate">{{ link.label }}</span>
                  </a>
                }
              }
            </div>
          }
        </div>
        }

        @if (hasSystemSection()) {
        <!-- System & Config -->
        <div>
          <button
            type="button"
            class="app-nav-section-trigger group"
            (click)="toggleSection('security')"
            [attr.aria-expanded]="isSectionExpanded('security') | json"
            aria-label="Toggle System section"
          >
            <div class="flex items-center gap-3">
              <span class="app-nav-section-title">{{ systemSectionLabel() }}</span>
              <span
                class="hidden sm:inline-flex px-1.5 py-0.5 rounded-full bg-violet-500/10 text-[8px] font-black text-violet-300 border border-violet-500/20 uppercase tracking-tighter"
                >Admin</span
              >
            </div>
            <div
              class="app-nav-section-chevron transition-transform duration-300 opacity-30 group-hover:opacity-100"
              [class.rotate-180]="isSectionExpanded('security')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </button>
          @if (isSectionExpanded('security')) {
            <div class="app-nav-section-content mt-1.5 space-y-0.5" open>
              @for (link of systemLinks(); track link.route) {
                @if (link.isLocked) {
                  <button
                    type="button"
                    (click)="openLockedModule(link)"
                    class="app-nav-link group w-full justify-between"
                  >
                    <span class="flex items-center gap-3">
                      <div class="app-nav-icon">
                        <span [innerHTML]="resolveIcon(link.icon)"></span>
                      </div>
                      <span>{{ link.label }}</span>
                    </span>
                    <span class="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-rose-700">
                      Lock
                    </span>
                  </button>
                } @else {
                  <a
                    [routerLink]="link.route"
                    routerLinkActive="app-nav-link-active"
                    (click)="closeOnMobile()"
                    class="app-nav-link group min-w-0"
                  >
                    <div class="app-nav-icon">
                      <span [innerHTML]="resolveIcon(link.icon)"></span>
                    </div>
                    <span class="truncate">{{ link.label }}</span>
                  </a>
                }
              }
            </div>
          }
        </div>
        }
        <!-- ← closes the System section wrapper <div> -->
      </nav>

      <div class="p-4 md:p-6 border-t border-white/5 opacity-50">
        <p
          class="text-[8px] text-center text-slate-500 uppercase tracking-widest"
        >
          &copy; 2026 HRNexus Technology
        </p>
      </div>
    </aside>
  `,
  styles: [
    `
      .app-sidebar-surface {
        background: linear-gradient(180deg, #0f172a 0%, #0b1120 100%);
        box-shadow: 1px 0 0 0 rgba(255, 255, 255, 0.05);
      }

      .app-nav-link {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 7px 10px;
        border-radius: 8px;
        color: #94a3b8;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        margin-bottom: 2px;
        min-width: 0;
      }

      .app-nav-link {
        position: relative;
        overflow: hidden;
      }

      .app-nav-link::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.1),
          transparent
        );
        transition: left 0.6s;
      }

      .app-nav-link:hover::before {
        left: 100%;
      }

      .app-nav-link:hover {
        background: rgba(255, 255, 255, 0.03);
        color: #f8fafc;
        transform: translateX(1px);
      }

      .app-nav-link-active {
        background: linear-gradient(
          90deg,
          rgba(45, 212, 191, 0.16) 0%,
          rgba(45, 212, 191, 0.02) 100%
        );
        color: #f8fafc !important;
        font-weight: 700;
        box-shadow:
          inset 2px 0 0 #2dd4bf,
          inset 0 1px 0 rgba(255, 255, 255, 0.03);
      }

      .app-nav-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        opacity: 0.7;
        transition: opacity 0.2s ease;
        flex: 0 0 auto;
      }

      .app-nav-link:hover .app-nav-icon,
      .app-nav-link-active .app-nav-icon {
        opacity: 1;
        color: #2dd4bf;
      }

      .app-nav-section-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 6px 10px;
        cursor: pointer;
        border-radius: 6px;
        transition: background 0.2s ease;
      }

      .app-nav-section-trigger {
        overflow: hidden;
      }

      @media (min-width: 640px) {
        .app-nav-link {
          padding: 8px 11px;
        }
      }

      .app-nav-section-trigger:hover {
        background: rgba(255, 255, 255, 0.02);
      }

      .app-nav-section-content {
        overflow: hidden;
        transition:
          max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
          opacity 0.2s ease;
        max-height: 0;
        opacity: 0;
      }

      .app-nav-section-content[open] {
        max-height: 640px;
        opacity: 1;
      }

      .app-nav-section-title {
        font-size: 8px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: #64748b;
      }

      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.02);
        border-radius: 9999px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(71, 85, 105, 0.9);
        border-radius: 9999px;
        border: 1px solid rgba(11, 17, 32, 0.75);
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(100, 116, 139, 1);
      }
    `,
  ],
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
  currentUser = signal<User | null>(null);
  orgName = signal<string>('');
  orgLogo = signal<string>('');
  subscriptionStatus = signal<SubscriptionStatusPayload | null>(null);
  hasOrgLogo = computed(() => Boolean(this.orgLogo().trim()));
  private expandedSections = signal<Record<string, boolean>>({
    main: true,
    employees: false,
    attendance: true,
    payroll: false,
    productivity: false,
    security: false,
  });
  public isUserLoading = signal(true);
  public isOrgLoading = signal(true);
  private store = inject(Store);
  private user$ = this.store.select(selectUser);

  ngOnInit() {
    this.currentUser.set(this.authService.getStoredUser());
    this.permissionService.syncForUser(this.currentUser());
    this.isUserLoading.set(false);

    this.user$.subscribe((user) => {
      if (user) {
        this.currentUser.set(user);
        this.permissionService.syncForUser(user);
      }
    });

    this.orgService.getOrganization().subscribe((org) => {
      this.setOrganizationBranding(org);
      this.isOrgLoading.set(false);
    });
    this.orgService.getAddons().subscribe();
    this.subscriptionService.getStatus().subscribe({
      next: (status) => this.subscriptionStatus.set(status),
      error: () => this.subscriptionStatus.set(null),
    });
  }

  private setOrganizationBranding(org: Organization | null | undefined) {
    const storedUser = this.currentUser() ?? this.authService.getStoredUser();
    const resolvedName = (
      org?.name ||
      storedUser?.organizationName ||
      storedUser?.companyName ||
      this.orgName() ||
      ''
    ).trim();
    const resolvedLogo = (
      org?.logo ||
      storedUser?.organizationLogo ||
      storedUser?.companyLogo ||
      this.orgLogo() ||
      ''
    ).trim();

    this.orgName.set(resolvedName);
    this.orgLogo.set(resolvedLogo);
  }

  toggleSection(section: string) {
    this.expandedSections.update((state) => ({
      ...state,
      [section]: !state[section],
    }));
  }

  isSectionExpanded(section: string): boolean {
    return this.expandedSections()[section] ?? false;
  }

  isModuleActive(slug: string): boolean {
    return this.orgService.activeModules().includes(slug);
  }

  isModuleEnabled(slug?: string): boolean {
    if (!slug) return true;
    return this.orgService.isModuleEnabled(slug);
  }

  moduleStateLabel(slug?: string): string {
    if (!slug) return 'Core';
    return this.isModuleEnabled(slug) ? 'On' : 'Locked';
  }

  activeModuleCount(): number {
    return this.orgService.activeModules().length;
  }

  subscriptionBadgeLabel(): string {
    const status = this.subscriptionStatus();
    if (!status) return 'Subscription';
    if (status.organization.readOnlyMode) return 'Read Only';
    if (status.organization.isTrialActive) {
      const days = Math.max(0, status.trialDaysRemaining ?? 0);
      return `Trial ${days} Day${days === 1 ? '' : 's'}`;
    }
    return status.plan?.name || 'Premium Plan';
  }

  subscriptionHelperText(): string {
    const status = this.subscriptionStatus();
    if (!status) return 'Subscription status will appear here.';
    if (status.organization.readOnlyMode) {
      return 'Upgrade to unlock write access for premium modules.';
    }
    if (status.organization.isTrialActive) {
      const days = Math.max(0, status.trialDaysRemaining ?? 0);
      return `${days} day${days === 1 ? '' : 's'} left before billing action is required.`;
    }
    if (status.plan?.isTrialPlan || status.plan?.name?.toLowerCase().includes('trial')) {
      return 'Currently evaluating the workspace on a free trial plan.';
    }
    return 'Workspace billing is active and premium access is available.';
  }

  subscriptionDotTone(): string {
    const status = this.subscriptionStatus();
    if (status?.organization.readOnlyMode) return 'bg-rose-400';
    if (status?.organization.isTrialActive || status?.plan?.isTrialPlan || status?.plan?.name?.toLowerCase().includes('trial')) return 'bg-amber-400';
    return 'bg-emerald-500';
  }

  subscriptionLabelTone(): string {
    const status = this.subscriptionStatus();
    if (status?.organization.readOnlyMode) return 'text-rose-300';
    if (status?.organization.isTrialActive || status?.plan?.isTrialPlan || status?.plan?.name?.toLowerCase().includes('trial')) return 'text-amber-300';
    return 'text-slate-400';
  }

  canAccess(route: string): boolean {
    const user = this.currentUser() ?? this.authService.getStoredUser();
    return this.permissionService.canAccessRoute(user, route);
  }

  private roleId(): number | undefined {
    const user = this.currentUser() ?? this.authService.getStoredUser();
    return user?.roleId;
  }

  private isEmployeeRole(): boolean {
    return this.roleId() === 5;
  }

  private isManagerRole(): boolean {
    const roleId = this.roleId();
    return roleId === 3 || roleId === 4;
  }

  private isAdminRole(): boolean {
    const roleId = this.roleId();
    return roleId === 1 || roleId === 2;
  }

  hasPeopleSection(): boolean {
    return this.peopleLinks().length > 0;
  }

  hasSystemSection(): boolean {
    return this.systemLinks().length > 0;
  }

  mainSectionLabel(): string {
    return 'Self Service';
  }

  peopleSectionLabel(): string {
    if (this.isAdminRole()) return 'Organization';
    if (this.isManagerRole()) return 'Team';
    return 'People';
  }

  systemSectionLabel(): string {
    return 'Configuration';
  }

  userName(): string {
    const user = this.currentUser() ?? this.authService.getStoredUser();
    if (!user) return 'Workspace User';
    return (
      `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
      user.email ||
      'Workspace User'
    );
  }

  userRole(): string {
    const roleId = (this.currentUser() ?? this.authService.getStoredUser())
      ?.roleId;
    switch (roleId) {
      case 1:
        return 'Super Admin';
      case 2:
        return 'Admin';
      case 3:
        return 'HR Manager';
      case 4:
        return 'Manager';
      case 5:
        return 'Employee';
      default:
        return 'Employee';
    }
  }

  userInitials(): string {
    const user = this.currentUser() ?? this.authService.getStoredUser();
    const first = user?.firstName?.charAt(0) || '';
    const last = user?.lastName?.charAt(0) || '';
    return (first + last || user?.email?.charAt(0) || 'U').toUpperCase();
  }

  orgInitial(): string {
    const source = this.orgName().trim();
    return (source.charAt(0) || 'E').toUpperCase();
  }

  onOrgLogoError() {
    this.orgLogo.set('');
    const storedUser = this.currentUser() ?? this.authService.getStoredUser();
    if (!this.orgName().trim()) {
      this.orgName.set(
        (
          storedUser?.organizationName ||
          storedUser?.companyName ||
          'Enterprise'
        ).trim(),
      );
    }
  }

  closeOnMobile() {
    if (window.innerWidth < 1024) {
      this.layoutService.closeSidebar();
    }
  }

  resolveIcon(icon?: string): SafeHtml {
    const icons: Record<string, string> = {
      dashboard:
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>',
      profile:
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></svg>',
      attendance:
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>',
      leave:
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>',
      payroll:
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 9h10" /><path d="M7 13h6" /></svg>',
      timesheets:
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>',
      expenses:
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 3h10l4 4v14H3V3z" /><path d="M7 8h10" /><path d="M7 12h10" /></svg>',
      projects:
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M3 11h18" /></svg>',
      reports:
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 3v18h18" /><path d="M7 14l3-3 3 2 5-6" /></svg>',
      employees:
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>',
      invitations:
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></svg>',
      visitors:
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16h16V8l-6-6z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></svg>',
      'team-attendance':
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6" /><path d="M23 11h-6" /></svg>',
      regularization:
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></svg>',
      documents:
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6" /><path d="M9 17h6" /></svg>',
      roles:
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 12a4 4 0 1 0-4-4" /><path d="M12 12a4 4 0 1 1 4-4" /><path d="M6 22v-2a6 6 0 0 1 12 0v2" /></svg>',
      announcements:
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>',
      settings:
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>',
      addons:
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>',
      audit:
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" /></svg>',
    };

    return this.sanitizer.bypassSecurityTrustHtml(
      icons[icon || ''] ?? icons['dashboard'],
    );
  }

  openLockedModule(link: WorkspaceModuleView): void {
    this.closeOnMobile();
    this.toastService.info(link.lockReason ?? `${link.label} is locked for this organization.`);
    this.router.navigateByUrl('/billing');
  }

  selfServiceLinks(): WorkspaceModuleView[] {
    return this.workspaceCatalog.getSectionViews(
      this.currentUser() ?? this.authService.getStoredUser(),
      'self-service',
      { includeLocked: true },
    );
  }

  peopleLinks(): WorkspaceModuleView[] {
    return this.workspaceCatalog.getSectionViews(
      this.currentUser() ?? this.authService.getStoredUser(),
      'people',
      { includeLocked: true },
    );
  }

  systemLinks(): WorkspaceModuleView[] {
    return this.workspaceCatalog.getSectionViews(
      this.currentUser() ?? this.authService.getStoredUser(),
      'system',
      { includeLocked: true },
    );
  }
}
