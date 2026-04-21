import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OrganizationService } from '../../core/services/organization.service';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';
import { CustomButtonComponent } from '../../core/components/ui/button/custom-button.component';
import { LanguageService } from '../../core/services/language.service';

type AddonTab = 'active' | 'locked';
type AddonCategory = 'all' | 'ess' | 'ops' | 'premium';

interface AddonViewModel {
  id: number;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  route: string | null;
  accent: string;
  iconBg: string;
  iconColor: string;
  category: AddonCategory;
  helper: string;
  spotlight: string;
  guideLabel: string;
}

@Component({
  selector: 'app-add-ons',
  standalone: true,
  imports: [CommonModule, RouterModule, CustomButtonComponent],
  template: `
    <div class="app-page">
      <div class="app-page-inner">
        <div class="mx-auto max-w-[1500px] space-y-6">
          <section class="overflow-hidden rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_28%),linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#ecfeff_100%)] p-6 shadow-sm sm:p-8">
            <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div class="max-w-4xl">
                <p class="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Add-ons Workspace</p>
                <h1 class="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Open modules, learn the workflow, then enable what your team needs</h1>
                <p class="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                  This hub is now designed like a product launcher instead of a plain settings list. Teams can open live modules, study module guides, and move into billing without bouncing between many screens.
                </p>

                <div class="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    (click)="activeTab.set('active')"
                    class="rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition"
                    [ngClass]="activeTab() === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
                  >
                    {{ t('common.active') }} {{ activeCount() }}
                  </button>
                  <button
                    type="button"
                    (click)="activeTab.set('locked')"
                    class="rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition"
                    [ngClass]="activeTab() === 'locked' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
                  >
                    Learn & Buy {{ lockedCount() }}
                  </button>

                  <div class="h-6 w-px bg-slate-200"></div>

                  @for (category of categories; track category.id) {
                    <button
                      type="button"
                      (click)="activeCategory.set(category.id)"
                      class="rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition"
                      [ngClass]="activeCategory() === category.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
                    >
                      {{ category.label }}
                    </button>
                  }
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div class="rounded-[26px] border border-white/80 bg-white/90 p-5 shadow-sm sm:col-span-2">
                  <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Featured Focus</p>
                  <h2 class="mt-2 text-2xl font-black tracking-tight text-slate-900">{{ featuredAddon().name || 'No module selected yet' }}</h2>
                  <p class="mt-3 text-sm leading-6 text-slate-600">
                    {{ featuredAddon().spotlight || 'Choose a module to see the recommended next move for your users.' }}
                  </p>
                  <div class="mt-5 flex flex-wrap gap-3">
                    <app-custom-button
                      [type]="'active-solid'"
                      (btnClick)="openPrimaryFeature()"
                      addClass="w-full sm:w-auto"
                    >
                      {{ featuredAddon().isActive ? 'Open Featured Module' : 'Open Buy Flow' }}
                    </app-custom-button>
                    <app-custom-button
                      [type]="'secondary-solid'"
                      (btnClick)="openGuide(featuredAddon())"
                      addClass="w-full sm:w-auto"
                    >
                      View Guide
                    </app-custom-button>
                  </div>
                </div>

                <div class="rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-5">
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Live Modules</p>
                  <p class="mt-2 text-3xl font-black tracking-tight text-emerald-900">{{ activeCount() }}</p>
                  <p class="mt-2 text-sm leading-6 text-emerald-800/80">Modules already running and ready to open from the workspace.</p>
                </div>

                <div class="rounded-[24px] border border-amber-100 bg-amber-50/80 p-5">
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Expansion Ready</p>
                  <p class="mt-2 text-3xl font-black tracking-tight text-amber-900">{{ lockedCount() }}</p>
                  <p class="mt-2 text-sm leading-6 text-amber-800/80">Modules users can learn first and then activate through the billing flow.</p>
                </div>
              </div>
            </div>
          </section>

          <section class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <article class="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Launcher Guidance</p>
                  <h2 class="mt-2 text-2xl font-black tracking-tight text-slate-900">The add-ons button now works like a real module hub</h2>
                </div>
                <span class="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">Page Based</span>
              </div>

              <div class="mt-6 space-y-4">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Step 1</p>
                  <p class="mt-2 text-base font-black text-slate-900">User clicks Add-ons from the navbar and lands here directly.</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Step 2</p>
                  <p class="mt-2 text-base font-black text-slate-900">User opens a guide page to understand how the module works.</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Step 3</p>
                  <p class="mt-2 text-base font-black text-slate-900">Active modules open instantly. Locked modules move into billing with context.</p>
                </div>
              </div>
            </article>

            <article class="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#0f172a_0%,#111827_55%,#1e293b_100%)] p-6 text-white shadow-sm">
              <p class="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/80">Current View</p>
              <h2 class="mt-2 text-2xl font-black tracking-tight">
                {{ activeTab() === 'active' ? 'Operational modules for your team' : 'Suggested upgrades your team can explore' }}
              </h2>
              <p class="mt-3 text-sm leading-7 text-slate-300">
                {{ activeTab() === 'active'
                  ? 'This view focuses on modules already enabled in the organization so teams can move straight into work.'
                  : 'This view focuses on modules that are not active yet, with cleaner guide-first and buy-first actions.' }}
              </p>

              <div class="mt-6 grid gap-4 sm:grid-cols-2">
                <div class="rounded-[22px] border border-white/10 bg-white/5 p-4">
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Category Filter</p>
                  <p class="mt-2 text-lg font-black text-white">{{ activeCategoryLabel() }}</p>
                  <p class="mt-2 text-xs leading-5 text-slate-300">Use this to narrow the launcher into ESS, operational, or premium-ready modules.</p>
                </div>
                <div class="rounded-[22px] border border-white/10 bg-white/5 p-4">
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Best Next Action</p>
                  <p class="mt-2 text-lg font-black text-white">{{ activeTab() === 'active' ? 'Open and use' : 'Learn and upgrade' }}</p>
                  <p class="mt-2 text-xs leading-5 text-slate-300">The CTA set changes automatically so users do not get confused.</p>
                </div>
              </div>
            </article>
          </section>

          <section class="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
            @for (addon of visibleAddons(); track addon.id) {
              <article class="overflow-hidden rounded-[28px] border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" [ngClass]="addon.accent">
                <div class="border-b border-black/5 p-6">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex min-w-0 items-center gap-4">
                      <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" [ngClass]="addon.iconBg">
                        <svg class="h-7 w-7" [ngClass]="addon.iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <ng-container [ngSwitch]="addon.slug">
                            <path *ngSwitchCase="'analytics'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3v18h18M8 16V9M12 16V6M16 16v-4" />
                            <path *ngSwitchCase="'payroll'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 10v-1m9-4a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path *ngSwitchCase="'geofence'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21s6-5.5 6-11a6 6 0 0 0-12 0c0 5.5 6 11 6 11z" />
                            <circle *ngSwitchCase="'geofence'" cx="12" cy="10" r="2" stroke-width="2" />
                            <path *ngSwitchCase="'face-recognition'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M21 15v4a2 2 0 0 1-2 2h-4M9 21H5a2 2 0 0 1-2-2v-4M9 10h.01M15 10h.01M9.5 15a4 4 0 0 0 5 0" />
                            <path *ngSwitchCase="'face_recognition'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M21 15v4a2 2 0 0 1-2 2h-4M9 21H5a2 2 0 0 1-2-2v-4M9 10h.01M15 10h.01M9.5 15a4 4 0 0 0 5 0" />
                            <path *ngSwitchCase="'visitor-management'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 3h10l4 4v14H3V3h4zM7 8h10M7 12h10M7 16h6" />
                            <path *ngSwitchCase="'visitor_management'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 3h10l4 4v14H3V3h4zM7 8h10M7 12h10M7 16h6" />
                            <path *ngSwitchCase="'visitormanagement'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 3h10l4 4v14H3V3h4zM7 8h10M7 12h10M7 16h6" />
                            <path *ngSwitchDefault stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          </ng-container>
                        </svg>
                      </div>

                      <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                          <h2 class="truncate text-xl font-black tracking-tight text-slate-900">{{ addon.name }}</h2>
                          <span class="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]" [ngClass]="addon.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
                            {{ addon.isActive ? t('common.active') : t('common.locked') }}
                          </span>
                        </div>
                        <p class="mt-1 text-xs font-black uppercase tracking-[0.18em]" [ngClass]="addon.isActive ? 'text-emerald-600' : 'text-slate-400'">
                          {{ addon.helper }}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      (click)="setFeature(addon)"
                      class="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      Spotlight
                    </button>
                  </div>

                  <p class="mt-5 min-h-[72px] text-sm leading-6 text-slate-600">{{ addon.description }}</p>
                </div>

                <div class="space-y-4 p-6">
                  <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Recommended flow</p>
                    <p class="mt-2 text-sm font-black text-slate-900">{{ addon.spotlight }}</p>
                  </div>

                  <div class="grid gap-3 sm:grid-cols-2">
                    <app-custom-button
                      [type]="'secondary-solid'"
                      (btnClick)="openGuide(addon)"
                      addClass="w-full"
                    >
                      {{ addon.guideLabel }}
                    </app-custom-button>

                    <app-custom-button
                      [type]="'active-solid'"
                      (btnClick)="addon.isActive ? openAddon(addon) : openBilling(addon)"
                      addClass="w-full"
                    >
                      {{ addon.isActive ? t('common.openModule') : t('common.upgradePlan') }}
                    </app-custom-button>
                  </div>
                </div>
              </article>
            }
          </section>

          @if (visibleAddons().length === 0) {
            <section class="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h2 class="text-lg font-black text-slate-900">{{ t('common.noResults') }}</h2>
              <p class="mt-2 text-sm text-slate-500">Try another category or switch between active and learn-and-buy modes.</p>
            </section>
          }
        </div>
      </div>
    </div>
  `,
})
export class AddOnsComponent implements OnInit {
  private readonly organizationService = inject(OrganizationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly permissionService = inject(PermissionService);
  private readonly toastService = inject(ToastService);
  private readonly languageService = inject(LanguageService);

  readonly categories = [
    { id: 'all' as AddonCategory, label: 'All' },
    { id: 'ess' as AddonCategory, label: 'ESS' },
    { id: 'ops' as AddonCategory, label: 'HR Ops' },
    { id: 'premium' as AddonCategory, label: 'Premium' },
  ];

  readonly addons = signal<AddonViewModel[]>([]);
  readonly loading = signal(false);
  readonly activeTab = signal<AddonTab>('active');
  readonly activeCategory = signal<AddonCategory>('all');
  readonly featuredSlug = signal<string | null>(null);

  readonly activeCount = computed(() => this.addons().filter((addon) => addon.isActive).length);
  readonly lockedCount = computed(() => this.addons().filter((addon) => !addon.isActive).length);
  readonly filteredByTab = computed(() =>
    this.addons().filter((addon) => this.activeTab() === 'active' ? addon.isActive : !addon.isActive)
  );
  readonly visibleAddons = computed(() => {
    const category = this.activeCategory();
    return this.filteredByTab().filter((addon) => category === 'all' ? true : addon.category === category);
  });
  readonly featuredAddon = computed(() => {
    const currentSlug = this.featuredSlug();
    const visible = this.visibleAddons();
    if (currentSlug) {
      const match = visible.find((addon) => addon.slug === currentSlug);
      if (match) {
        return match;
      }
    }
    return visible[0] ?? this.filteredByTab()[0] ?? this.addons()[0] ?? null;
  });

  private readonly defaultAddonCatalog = [
    {
      id: 507,
      name: 'Face Recognition',
      slug: 'face-recognition',
      description: 'Employee authentication with face recognition for attendance and identity verification.',
      route: '/face-registration',
      permission: 'module507_view',
      userPermission: 'module507_UserView',
    },
    {
      id: 518,
      name: 'Employee Tracking',
      slug: 'employee-tracking',
      description: 'Track employee location from phone or desktop and monitor live field attendance.',
      route: '/attendance?view=tracking',
      permission: 'module518_view',
      userPermission: 'module518_UserView',
    },
    {
      id: 516,
      name: 'Manage Clients',
      slug: 'manage-clients',
      description: 'Manage client masters and visit-related client data from inside the attendance workflow.',
      route: '/visit-management',
      permission: 'module516_view',
      userPermission: 'module516_UserView',
    },
    {
      id: 517,
      name: 'Track Visit',
      slug: 'track-visit',
      description: 'Track visit schedules, distance, and client visit activity for field employees.',
      route: '/visit-management',
      permission: 'module517_view',
      userPermission: 'module517_UserView',
    },
    {
      id: 5,
      name: 'Payroll',
      slug: 'payroll',
      description: 'Enable payroll, salary, payslip, reimbursement, and finance workflows.',
      route: '/payroll',
    },
    {
      id: 6,
      name: 'Leave',
      slug: 'leave',
      description: 'Enable leave applications, balances, short day leave, time off, and approvals.',
      route: '/leaves',
    },
    {
      id: 443,
      name: 'Shift Planner',
      slug: 'shift-planner',
      description: 'Plan shifts, rosters, and employee scheduling from the attendance module.',
      route: '/attendance?view=shift-planner',
      permission: 'module443_view',
      userPermission: 'module443_UserView',
    },
    {
      id: 318,
      name: 'Geo-Fence',
      slug: 'geofence',
      description: 'Configure geo-fence boundaries and location-based attendance compliance.',
      route: '/attendance?view=geofence',
      permission: 'module318_view',
      userPermission: 'module318_UserView',
    },
  ];

  ngOnInit(): void {
    const category = this.route.snapshot.queryParamMap.get('category') as AddonCategory | null;
    if (category && this.categories.some((item) => item.id === category)) {
      this.activeCategory.set(category);
    }
    this.loadAddons();
  }

  activeCategoryLabel(): string {
    return this.categories.find((item) => item.id === this.activeCategory())?.label ?? 'All';
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    this.languageService.currentLanguage();
    return this.languageService.t(key, params);
  }

  loadAddons(): void {
    this.loading.set(true);
    this.organizationService.getAddons().subscribe({
      next: (addons: any[]) => {
        const mapped = this.mergeAddonCatalog(addons || []).map((addon) => this.toViewModel(addon));
        this.addons.set(mapped);
        this.applyQueryFocus(mapped);
        this.loading.set(false);
      },
      error: () => {
        const mapped = this.mergeAddonCatalog([]).map((addon) => this.toViewModel(addon));
        this.addons.set(mapped);
        this.applyQueryFocus(mapped);
        this.loading.set(false);
      },
    });
  }

  private applyQueryFocus(addons: AddonViewModel[]): void {
    const focus = this.normalizeSlug(
      this.route.snapshot.queryParamMap.get('addon') ||
      this.route.snapshot.queryParamMap.get('focus') ||
      '',
    );
    const attendanceFocus = focus === 'attendance';
    const matchedAddon = addons.find((addon) =>
      attendanceFocus
        ? ['attendance', 'employee-tracking', 'geofence', 'shift-planner', 'face-recognition'].includes(addon.slug)
        : addon.slug === focus,
    );

    if (matchedAddon) {
      this.activeTab.set(matchedAddon.isActive ? 'active' : 'locked');
      this.featuredSlug.set(matchedAddon.slug);
      return;
    }

    this.featuredSlug.set(addons[0]?.slug ?? null);
  }

  private mergeAddonCatalog(apiAddons: any[]): any[] {
    const normalizedApi = apiAddons.map((addon) => ({
      ...addon,
      slug: this.normalizeSlug(addon?.slug ?? addon?.name),
    }));
    const bySlug = new Map<string, any>();

    this.defaultAddonCatalog.forEach((addon) => {
      bySlug.set(this.normalizeSlug(addon.slug), {
        ...addon,
        isActive: this.isDefaultAddonActive(addon),
      });
    });

    normalizedApi.forEach((addon) => {
      const slug = this.normalizeSlug(addon.slug ?? addon.name);
      const fallback = bySlug.get(slug);
      bySlug.set(slug, {
        ...fallback,
        ...addon,
        id: Number(addon?.id ?? fallback?.id ?? 0),
        name: addon?.name ?? fallback?.name ?? 'Add-on',
        slug,
        description: addon?.description ?? fallback?.description,
        route: addon?.route ?? fallback?.route,
        isActive: Boolean(addon?.isActive ?? fallback?.isActive),
      });
    });

    return Array.from(bySlug.values());
  }

  private isDefaultAddonActive(addon: { slug: string; route?: string; permission?: string; userPermission?: string }): boolean {
    const user = this.authService.getStoredUser();
    if (addon.permission && addon.userPermission) {
      return this.hasRawPermission(user, addon.permission) && this.hasRawPermission(user, addon.userPermission);
    }
    if (addon.route) {
      return this.permissionService.canAccessRoute(user, addon.route);
    }
    return this.organizationService.isModuleEnabled(addon.slug);
  }

  private hasRawPermission(user: any, key: string): boolean {
    if (this.permissionService.isSuperAdminUser(user)) return true;

    const sources = [
      user?.permissions,
      user?.permission,
      user?.allUserPermissions?.permission,
      user?.rawPermissions,
      user?.userPermissions,
    ];

    return sources.some((source) => {
      if (!source) return false;
      if (Array.isArray(source)) {
        return source.some((item) => {
          if (typeof item === 'string') return item === key;
          if (item?.key === key) return this.toBoolean(item?.allowed ?? item?.value ?? true);
          if (item?.name === key) return this.toBoolean(item?.allowed ?? item?.value ?? true);
          return false;
        });
      }
      if (typeof source === 'object') {
        return this.toBoolean(source[key]);
      }
      return false;
    });
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === '1' || normalized === 'true' || normalized === 'yes';
    }
    return Boolean(value);
  }

  setFeature(addon: AddonViewModel): void {
    this.featuredSlug.set(addon.slug);
  }

  openPrimaryFeature(): void {
    const addon = this.featuredAddon();
    if (!addon) {
      return;
    }
    addon.isActive ? this.openAddon(addon) : this.openBilling(addon);
  }

  openAddon(addon: AddonViewModel): void {
    if (!addon.isActive) {
      this.openBilling(addon);
      return;
    }

    const route = addon.route || '/add-ons';
    const user = this.authService.getStoredUser();

    if (!this.permissionService.canAccessRoute(user, route)) {
      this.toastService.info(`${addon.name} is available, but your current access opens the guided page first.`);
      this.openGuide(addon);
      return;
    }

    this.router.navigateByUrl(route);
  }

  openBilling(addon: AddonViewModel | null): void {
    if (!addon) {
      this.router.navigateByUrl('/billing');
      return;
    }

    this.router.navigate(['/billing'], {
      queryParams: {
        source: 'addons',
        addon: addon.slug,
        mode: addon.isActive ? 'manage' : 'upgrade',
      },
    });
  }

  openGuide(addon: AddonViewModel | null): void {
    if (!addon) {
      return;
    }
    this.router.navigateByUrl(`/add-ons/guide/${addon.slug}`);
  }

  private toViewModel(raw: any): AddonViewModel {
    const slug = this.normalizeSlug(raw?.slug ?? raw?.name);
    const palettes: Record<string, Pick<AddonViewModel, 'accent' | 'iconBg' | 'iconColor' | 'category' | 'helper' | 'spotlight' | 'guideLabel'>> = {
      attendance: {
        accent: 'border-cyan-200 bg-cyan-50/60',
        iconBg: 'bg-cyan-100',
        iconColor: 'text-cyan-600',
        category: 'ess',
        helper: 'Daily employee workflow',
        spotlight: 'Open attendance directly for check-in, status, and history in one workspace.',
        guideLabel: 'See Attendance Guide',
      },
      leave: {
        accent: 'border-emerald-200 bg-emerald-50/60',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        category: 'ess',
        helper: 'ESS request workflow',
        spotlight: 'Ideal when employees need a guide-first flow for balances, requests, and approvals.',
        guideLabel: 'See Leave Guide',
      },
      leaves: {
        accent: 'border-emerald-200 bg-emerald-50/60',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        category: 'ess',
        helper: 'ESS request workflow',
        spotlight: 'Ideal when employees need a guide-first flow for balances, requests, and approvals.',
        guideLabel: 'See Leave Guide',
      },
      analytics: {
        accent: 'border-violet-200 bg-violet-50/60',
        iconBg: 'bg-violet-100',
        iconColor: 'text-violet-600',
        category: 'ops',
        helper: 'Insights and reporting',
        spotlight: 'Use this when teams need cross-module reporting, exports, and manager-facing analytics.',
        guideLabel: 'See Analytics Guide',
      },
      payroll: {
        accent: 'border-emerald-200 bg-emerald-50/60',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        category: 'premium',
        helper: 'Finance and HR controls',
        spotlight: 'Best for guided salary operations, payslips, and premium payroll activation.',
        guideLabel: 'See Payroll Guide',
      },
      geofence: {
        accent: 'border-cyan-200 bg-cyan-50/60',
        iconBg: 'bg-cyan-100',
        iconColor: 'text-cyan-600',
        category: 'premium',
        helper: 'Location-aware attendance',
        spotlight: 'Guide users through geo-based attendance before moving into plan activation.',
        guideLabel: 'See Geo-fence Guide',
      },
      'employee-tracking': {
        accent: 'border-cyan-200 bg-cyan-50/60',
        iconBg: 'bg-cyan-100',
        iconColor: 'text-cyan-600',
        category: 'premium',
        helper: 'Location tracking',
        spotlight: 'Manage live employee movement and field attendance after activation.',
        guideLabel: 'See Tracking Guide',
      },
      'shift-planner': {
        accent: 'border-sky-200 bg-sky-50/60',
        iconBg: 'bg-sky-100',
        iconColor: 'text-sky-600',
        category: 'premium',
        helper: 'Roster and shift control',
        spotlight: 'Enable shift planning when managers need roster control inside attendance.',
        guideLabel: 'See Shift Guide',
      },
      'manage-clients': {
        accent: 'border-amber-200 bg-amber-50/60',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        category: 'ops',
        helper: 'Client visit masters',
        spotlight: 'Use this when visit management needs client masters and assignment workflows.',
        guideLabel: 'See Client Guide',
      },
      'track-visit': {
        accent: 'border-amber-200 bg-amber-50/60',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        category: 'ops',
        helper: 'Visit tracking',
        spotlight: 'Let teams track scheduled visits, distance, and field movement.',
        guideLabel: 'See Visit Guide',
      },
      'face-recognition': {
        accent: 'border-indigo-200 bg-indigo-50/60',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        category: 'premium',
        helper: 'Identity and device flow',
        spotlight: 'Strong for organizations that want guided biometric attendance setup and adoption.',
        guideLabel: 'See Face Guide',
      },
      face_recognition: {
        accent: 'border-indigo-200 bg-indigo-50/60',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        category: 'premium',
        helper: 'Identity and device flow',
        spotlight: 'Strong for organizations that want guided biometric attendance setup and adoption.',
        guideLabel: 'See Face Guide',
      },
      'visitor-management': {
        accent: 'border-amber-200 bg-amber-50/60',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        category: 'ops',
        helper: 'Field and client visits',
        spotlight: 'Let teams understand visit scheduling, check-in proof, and follow-ups before buying.',
        guideLabel: 'See Visit Guide',
      },
      visitor_management: {
        accent: 'border-amber-200 bg-amber-50/60',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        category: 'ops',
        helper: 'Field and client visits',
        spotlight: 'Let teams understand visit scheduling, check-in proof, and follow-ups before buying.',
        guideLabel: 'See Visit Guide',
      },
      visitormanagement: {
        accent: 'border-amber-200 bg-amber-50/60',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        category: 'ops',
        helper: 'Field and client visits',
        spotlight: 'Let teams understand visit scheduling, check-in proof, and follow-ups before buying.',
        guideLabel: 'See Visit Guide',
      },
      timesheets: {
        accent: 'border-sky-200 bg-sky-50/60',
        iconBg: 'bg-sky-100',
        iconColor: 'text-sky-600',
        category: 'ops',
        helper: 'Work logging workflow',
        spotlight: 'Help teams review project logs and timesheet discipline before opening the module.',
        guideLabel: 'See Timesheet Guide',
      },
      projects: {
        accent: 'border-fuchsia-200 bg-fuchsia-50/60',
        iconBg: 'bg-fuchsia-100',
        iconColor: 'text-fuchsia-600',
        category: 'ops',
        helper: 'Delivery and task tracking',
        spotlight: 'Useful when project ownership, effort visibility, and linked work logs matter.',
        guideLabel: 'See Project Guide',
      },
      expenses: {
        accent: 'border-orange-200 bg-orange-50/60',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        category: 'premium',
        helper: 'Claims and reimbursement',
        spotlight: 'A good next module when employees need a guided claim submission and review flow.',
        guideLabel: 'See Expense Guide',
      },
    };

    const fallback = {
      accent: 'border-slate-200 bg-slate-50/70',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      category: 'premium' as AddonCategory,
      helper: 'Module workspace',
      spotlight: `Open the guide first, then continue into ${raw?.name ?? 'this module'} or billing.`,
      guideLabel: 'See Module Guide',
    };

    const meta = palettes[slug] ?? fallback;

    return {
      id: Number(raw?.id ?? 0),
      name: String(raw?.name ?? 'Add-on'),
      slug,
      description: String(raw?.description ?? `Manage ${raw?.name ?? 'add-on'} module with a guided launch and buying flow.`),
      isActive: Boolean(raw?.isActive),
      route: raw?.route ?? this.routeFor(slug),
      accent: meta.accent,
      iconBg: meta.iconBg,
      iconColor: meta.iconColor,
      category: meta.category,
      helper: meta.helper,
      spotlight: meta.spotlight,
      guideLabel: meta.guideLabel,
    };
  }

  private routeFor(slug: string): string | null {
    const routes: Record<string, string> = {
      analytics: '/reports',
      reports: '/reports',
      reports_analytics: '/reports',
      payroll: '/payroll',
      payroll_management: '/payroll',
      geofence: '/attendance?view=geofence',
      'employee-tracking': '/attendance?view=tracking',
      'shift-planner': '/attendance?view=shift-planner',
      'manage-clients': '/visit-management',
      'track-visit': '/visit-management',
      'face-recognition': '/face-registration',
      face_recognition: '/face-registration',
      'visitor-management': '/visit-management',
      visitor_management: '/visit-management',
      visitormanagement: '/visit-management',
      attendance: '/attendance',
      attendance_management: '/attendance',
      attendancemanagement: '/attendance',
      leaves: '/leaves',
      leave: '/leaves',
      leave_management: '/leaves',
      leaves_management: '/leaves',
      leavemanagement: '/leaves',
      projects: '/projects',
      project_management: '/projects',
      expenses: '/expenses',
      expense_management: '/expenses',
      timesheets: '/timesheets',
      timesheet: '/timesheets',
      timesheet_management: '/timesheets',
    };

    return routes[slug] ?? '/add-ons';
  }

  private normalizeSlug(value: unknown): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
