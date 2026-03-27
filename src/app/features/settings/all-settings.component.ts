import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PermissionService } from '../../core/services/permission.service';
import { AuthService } from '../../core/services/auth.service';
import { getSettingMenu, SettingCategory, SettingRoute } from './setting-menu';

@Component({
  selector: 'app-all-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="mx-auto flex h-full max-w-7xl flex-col gap-6 px-1 pb-8 pt-2">
      <section class="overflow-hidden rounded-md border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_38%),linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#eef2ff_100%)] shadow-sm">
        <div class="grid gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-8">
          <div class="space-y-5">
            <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              Control Center
            </div>
            <div class="space-y-3">
              <div class="flex items-center gap-3 text-slate-900">
                <div class="flex h-12 w-12 items-center justify-center rounded-md bg-slate-900 text-white shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </div>
                <div>
                  <h1 class="text-3xl font-black tracking-tight">System Settings</h1>
                  <p class="mt-1 text-sm text-slate-500">Manage configurations, organizations, policies, and system-wide behavior from one clean admin surface.</p>
                </div>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div class="rounded-md border border-white/80 bg-white/90 px-4 py-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Categories</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ totalCategories() }}</p>
                <p class="mt-1 text-xs text-slate-500">Visible admin groups</p>
              </div>
              <div class="rounded-md border border-white/80 bg-white/90 px-4 py-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Settings</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ totalVisibleSettings() }}</p>
                <p class="mt-1 text-xs text-slate-500">Routes available now</p>
              </div>
              <div class="rounded-md border border-white/80 bg-white/90 px-4 py-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Quick Access</p>
                <p class="mt-2 text-lg font-black text-slate-900">Approval + Import</p>
                <p class="mt-1 text-xs text-slate-500">Pinned admin actions</p>
              </div>
            </div>
          </div>

          <div class="flex min-w-0 flex-col gap-4 rounded-md border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Quick Search</p>
                <p class="mt-1 text-sm text-slate-500">Jump directly to a policy, module, or configuration page.</p>
              </div>
              <button type="button" (click)="closeSettings()" class="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div class="relative" data-settings-search>
              <input
                type="text"
                placeholder="Search settings, categories, modules..."
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearchChange($event)"
                class="w-full rounded-md border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-200/60"
              />
              <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>

              @if (isSearchOpen() && searchResults().length > 0) {
                <div class="absolute left-0 right-0 top-full z-50 mt-3 max-h-80 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 shadow-2xl">
                  @for (result of searchResults(); track result.route) {
                    <a [routerLink]="result.route" class="flex items-center justify-between gap-3 rounded-md px-3 py-3 transition hover:bg-slate-50">
                      <div class="flex min-w-0 items-center gap-3">
                        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                        </div>
                        <div class="min-w-0">
                          <p class="truncate text-sm font-semibold text-slate-900">{{ result.label }}</p>
                          <p class="truncate text-xs text-slate-500">{{ result.path }}</p>
                        </div>
                      </div>
                    </a>
                  }
                </div>
              }

              @if (isSearchOpen() && searchResults().length === 0) {
                <div class="absolute left-0 right-0 top-full z-50 mt-3 rounded-md border border-slate-200 bg-white px-4 py-5 text-center text-sm text-slate-500 shadow-2xl">
                  No settings found matching "{{ searchQuery() }}"
                </div>
              }
            </div>

            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              @for (route of featuredSettings(); track route.route) {
                <a [routerLink]="route.route" class="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-4 py-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
                  <p class="truncate text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ route.category }}</p>
                  <p class="mt-2 break-words text-sm font-bold leading-6 text-slate-900">{{ formatLabel(route.label) }}</p>
                </a>
              }
            </div>
          </div>
        </div>
      </section>

      <div class="flex-1">
        <div class="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
          @for (category of objectKeys(structuredSettings()); track category) {
            @if (structuredSettings()[category].per && structuredSettings()[category].routes.length > 0) {
              <section class="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div class="flex items-center gap-4 border-b border-slate-100 px-5 py-5">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-sm font-black uppercase" [ngClass]="[structuredSettings()[category].bgClass, structuredSettings()[category].colorClass]">
                    {{ categoryBadge(structuredSettings()[category].label) }}
                  </div>
                  <div class="min-w-0">
                    <h2 class="break-words text-lg font-black text-slate-900">{{ structuredSettings()[category].label }}</h2>
                    <p class="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{{ visibleRouteCount(structuredSettings()[category]) }} modules</p>
                  </div>
                </div>

                <div class="grid gap-3 bg-slate-50/70 p-4 xl:grid-cols-2">
                  @for (route of structuredSettings()[category].routes; track route.route) {
                    @if (route.per) {
                      <a [routerLink]="route.route" class="group min-w-0 rounded-md border border-transparent bg-white px-4 py-4 transition hover:border-slate-200 hover:shadow-sm">
                        <div class="flex items-start gap-3">
                          <div class="mt-1 h-2.5 w-2.5 rounded-full bg-slate-300 transition group-hover:bg-slate-900"></div>
                          <div class="min-w-0">
                            <p class="break-words text-sm font-bold leading-6 text-slate-900 group-hover:text-slate-950">{{ formatLabel(route.label) }}</p>
                            <p class="mt-1 break-words text-xs leading-5 text-slate-500">{{ route.path }}</p>
                          </div>
                        </div>
                      </a>
                    }
                  }
                </div>
              </section>
            }
          }
        </div>
      </div>

      <section class="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Quick Actions</p>
            <h2 class="mt-1 text-lg font-black text-slate-900">Shortcuts for admin work</h2>
          </div>
          <p class="text-sm text-slate-500">Fast access without covering the page on mobile.</p>
        </div>
        <div class="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row">
          <a routerLink="approval-flow" class="flex min-w-0 flex-1 items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold text-emerald-800 transition hover:-translate-y-0.5 hover:bg-emerald-100/80 hover:shadow-sm">
            <div class="rounded-md bg-emerald-100 p-2 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
            </div>
            <div class="min-w-0">
              <p class="break-words leading-6">Approval Flow Center</p>
              <p class="mt-1 break-words text-xs font-medium leading-5 text-emerald-700">Review rules and approval chains</p>
            </div>
          </a>

          <a routerLink="import-wizard" class="flex min-w-0 flex-1 items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
            <div class="rounded-md bg-white p-2 text-slate-500 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </div>
            <div class="min-w-0">
              <p class="break-words leading-6">Import Wizard</p>
              <p class="mt-1 break-words text-xs font-medium leading-5 text-slate-500">Bring policies and master data faster</p>
            </div>
          </a>
        </div>
      </section>
    </div>
  `
})
export class AllSettingsComponent implements OnInit, OnDestroy {
  private router = inject(Router);

  structuredSettings = signal<Record<string, SettingCategory>>({});
  
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

    document.addEventListener('click', this.handleDocumentClick);
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
    return this.allFlatRoutes.slice(0, 3);
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
    this.router.navigate(['/self-service']);
  }
}

