import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PlatformModuleSummary,
  PlatformOrganizationSummary,
  PlatformOverview,
  PlatformService,
} from '../../core/services/platform.service';

type PlatformView = 'organizations' | 'modules' | 'subscriptions' | 'analytics';

@Component({
  selector: 'app-platform-control',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mx-auto flex max-w-7xl flex-col gap-6 pb-10">
      <header class="app-module-hero flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div class="max-w-3xl">
          <p class="app-module-kicker">Platform Control</p>
          <h1 class="app-module-title mt-3">
            Multi-organization management, modules, and subscription pulse
          </h1>
          <p class="app-module-text mt-3">
            Keep tenant setup, module activation, subscription state, and usage analytics in a role-aware control plane.
          </p>
        </div>
        <div class="app-module-highlight min-w-[250px]">
          <span class="app-module-highlight-label">{{ overview()?.scope === 'platform' ? 'Platform scope' : 'Organization scope' }}</span>
          <div class="app-module-highlight-value mt-3">{{ totals().organizations }}</div>
          <p class="mt-2 text-sm text-white/80">
            {{ overview()?.scope === 'platform' ? 'Organizations managed across the platform.' : 'Current organization workspace.' }}
          </p>
        </div>
      </header>

      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        @for (card of statCards(); track card.label) {
          <div class="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{{ card.label }}</p>
            <p class="mt-3 text-3xl font-black tracking-tight text-slate-900">{{ card.value }}</p>
            <p class="mt-2 text-sm text-slate-500">{{ card.help }}</p>
          </div>
        }
      </section>

      <nav class="app-chip-switch w-fit max-w-full overflow-x-auto">
        @for (tab of tabs; track tab.id) {
          <button
            type="button"
            class="app-chip-button shrink-0"
            (click)="setView(tab.id)"
            [ngClass]="currentView() === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'"
          >
            {{ tab.label }}
          </button>
        }
      </nav>

      @if (currentView() === 'organizations') {
        <section class="rounded-lg border border-slate-100 bg-white shadow-sm">
          <div class="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-lg font-black text-slate-900">Organizations</h2>
              <p class="mt-1 text-sm text-slate-500">Tenant list with users, modules, plan, and status.</p>
            </div>
            <button type="button" (click)="go('/billing')" class="rounded-md bg-slate-900 px-4 py-2 text-xs font-bold text-white">
              Manage Plan
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-100 text-sm">
              <thead class="bg-slate-50 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th class="px-5 py-3">Organization</th>
                  <th class="px-5 py-3">Users</th>
                  <th class="px-5 py-3">Modules</th>
                  <th class="px-5 py-3">Plan</th>
                  <th class="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (org of organizations(); track org.id) {
                  <tr class="hover:bg-slate-50/70">
                    <td class="px-5 py-4">
                      <p class="font-bold text-slate-900">{{ org.name }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ org.email || 'No email' }}</p>
                    </td>
                    <td class="px-5 py-4 font-semibold text-slate-700">{{ org.employeeCount }}</td>
                    <td class="px-5 py-4 font-semibold text-slate-700">{{ org.activeModules }}</td>
                    <td class="px-5 py-4 font-semibold text-slate-700">{{ org.planName || 'No plan' }}</td>
                    <td class="px-5 py-4">
                      <span class="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
                            [ngClass]="statusClass(org.subscriptionStatus)">
                        {{ org.subscriptionStatus || org.status || 'inactive' }}
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="px-5 py-10 text-center text-sm font-semibold text-slate-400">
                      No organization data available yet.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }

      @if (currentView() === 'modules') {
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          @for (module of modules(); track module.slug) {
            <article class="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h3 class="text-base font-black text-slate-900">{{ module.name }}</h3>
                  <p class="mt-1 text-sm text-slate-500">Enabled organizations</p>
                </div>
                <span class="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
                  {{ module.activeOrganizations }}/{{ module.totalOrganizations }}
                </span>
              </div>
              <div class="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-cyan-500" [style.width.%]="moduleCoverage(module)"></div>
              </div>
            </article>
          } @empty {
            <div class="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-400">
              No module usage data available.
            </div>
          }
        </section>
      }

      @if (currentView() === 'subscriptions') {
        <section class="grid gap-4 lg:grid-cols-3">
          @for (item of subscriptionCards(); track item.label) {
            <div class="rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
              <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{{ item.label }}</p>
              <p class="mt-3 text-4xl font-black text-slate-900">{{ item.value }}</p>
              <p class="mt-2 text-sm text-slate-500">{{ item.help }}</p>
            </div>
          }
        </section>
      }

      @if (currentView() === 'analytics') {
        <section class="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div class="rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-black text-slate-900">Usage Analytics</h2>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              This screen is API-ready for deeper platform analytics. Current live snapshot combines organization count,
              active users, enabled modules, and subscription state.
            </p>
            <div class="mt-6 grid gap-3 sm:grid-cols-2">
              @for (card of statCards(); track card.label) {
                <div class="rounded-md bg-slate-50 p-4">
                  <p class="text-xs font-bold text-slate-500">{{ card.label }}</p>
                  <p class="mt-2 text-2xl font-black text-slate-900">{{ card.value }}</p>
                </div>
              }
            </div>
          </div>
          <div class="rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-black text-slate-900">Next Actions</h2>
            <div class="mt-5 space-y-3">
              <button type="button" (click)="go('/add-ons')" class="w-full rounded-md border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50">
                Enable or disable modules
              </button>
              <button type="button" (click)="go('/admin/roles')" class="w-full rounded-md border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50">
                Review RBAC roles
              </button>
              <button type="button" (click)="go('/admin/audit')" class="w-full rounded-md border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50">
                Open audit trail
              </button>
            </div>
          </div>
        </section>
      }
    </div>
  `,
})
export class PlatformControlComponent implements OnInit {
  private readonly platformService = inject(PlatformService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  overview = signal<PlatformOverview | null>(null);
  currentView = signal<PlatformView>('organizations');

  tabs: Array<{ id: PlatformView; label: string }> = [
    { id: 'organizations', label: 'Organizations' },
    { id: 'modules', label: 'Modules' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'analytics', label: 'Analytics' },
  ];

  totals = computed(() => this.overview()?.totals ?? {
    organizations: 0,
    activeUsers: 0,
    modulesEnabled: 0,
    subscriptions: 0,
  });
  organizations = computed<PlatformOrganizationSummary[]>(() => this.overview()?.organizations ?? []);
  modules = computed<PlatformModuleSummary[]>(() => this.overview()?.modules ?? []);
  subscription = computed(() => this.overview()?.subscription ?? {
    active: 0,
    trial: 0,
    expired: 0,
    revenue: 0,
    currency: 'INR',
  });
  statCards = computed(() => [
    { label: 'Organizations', value: this.totals().organizations, help: 'Tenant workspaces' },
    { label: 'Active Users', value: this.totals().activeUsers, help: 'Active employees' },
    { label: 'Enabled Modules', value: this.totals().modulesEnabled, help: 'Total enabled module links' },
    { label: 'Subscriptions', value: this.totals().subscriptions, help: 'Active paid/trial subscriptions' },
  ]);
  subscriptionCards = computed(() => [
    { label: 'Active', value: this.subscription().active, help: 'Organizations currently active' },
    { label: 'Trial', value: this.subscription().trial, help: 'Organizations evaluating the platform' },
    { label: 'Expired', value: this.subscription().expired, help: 'Organizations needing billing action' },
    { label: 'Revenue', value: `${this.subscription().currency} ${this.subscription().revenue}`, help: 'Confirmed billing total' },
  ]);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const view = params.get('view');
      if (this.isPlatformView(view)) {
        this.currentView.set(view);
      }
    });
    this.platformService.getOverview().subscribe((overview) => this.overview.set(overview));
  }

  setView(view: PlatformView): void {
    this.currentView.set(view);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view },
      queryParamsHandling: 'merge',
    });
  }

  go(route: string): void {
    this.router.navigateByUrl(route);
  }

  moduleCoverage(module: PlatformModuleSummary): number {
    if (!module.totalOrganizations) return 0;
    return Math.min(100, Math.round((module.activeOrganizations / module.totalOrganizations) * 100));
  }

  statusClass(status: string): string {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('active')) return 'bg-emerald-50 text-emerald-700';
    if (normalized.includes('trial')) return 'bg-amber-50 text-amber-700';
    if (normalized.includes('expired') || normalized.includes('grace')) return 'bg-rose-50 text-rose-700';
    return 'bg-slate-100 text-slate-600';
  }

  private isPlatformView(view: string | null): view is PlatformView {
    return view === 'organizations' || view === 'modules' || view === 'subscriptions' || view === 'analytics';
  }
}
