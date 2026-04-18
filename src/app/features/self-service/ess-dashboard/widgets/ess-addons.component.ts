import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { PermissionService } from '../../../../core/services/permission.service';

export interface AddonCard {
  id: number;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  route: string | null;
  accent: string;
  icon: string;
}

@Component({
  selector: 'app-ess-addons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="rounded-md border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-sm sm:rounded-md sm:p-5 lg:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-2xl">
          <p class="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Add-on Workspace</p>
          <h2 class="mt-2 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">Manage active modules and review suggested upgrades from one launcher</h2>
          <p class="mt-3 text-[13px] leading-6 text-slate-500 sm:text-sm">
            This launcher now follows the same active-versus-suggested pattern as Angular_Web. Users can manage live modules directly, or move locked modules into a guide-first upgrade journey.
          </p>
        </div>
        <div class="grid grid-cols-2 gap-3 sm:min-w-[260px]">
          <div class="rounded-md border border-slate-200 bg-white px-4 py-4">
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Active</p>
            <p class="mt-2 text-2xl font-black text-slate-900">{{ activeCount() }}</p>
          </div>
          <div class="rounded-md border border-slate-200 bg-white px-4 py-4">
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Suggested</p>
            <p class="mt-2 text-2xl font-black text-slate-900">{{ lockedCount() }}</p>
          </div>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          (click)="activeTab.set('active')"
          class="rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition"
          [ngClass]="activeTab() === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
        >
          Active {{ activeCount() }}
        </button>
        <button
          type="button"
          (click)="activeTab.set('suggested')"
          class="rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition"
          [ngClass]="activeTab() === 'suggested' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
        >
          Suggested {{ lockedCount() }}
        </button>
        <button
          type="button"
          (click)="openAddonsHub()"
          class="rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-300 hover:text-slate-900 sm:ml-auto"
        >
          Open Add-ons Page
        </button>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 sm:gap-5">
        @for (addon of visibleAddons(); track addon.id) {
          <div class="relative group h-full">
            <div
              class="flex h-full flex-col rounded-md border border-slate-200/80 bg-white/95 p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl sm:rounded-md sm:p-5 lg:rounded-md lg:p-6"
              [ngClass]="addon.accent"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-md bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100 sm:h-14 sm:w-14 sm:rounded-md">
                  <div class="h-8 w-8" [innerHTML]="getIcon(addon.icon)"></div>
                </div>
                <span
                  class="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]"
                  [ngClass]="addon.isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'"
                >
                  {{ addon.isActive ? 'Subscribed' : 'Suggested' }}
                </span>
              </div>

              <div class="mt-5">
                <h3 class="text-base font-black tracking-tight text-slate-900 sm:text-lg">{{ addon.name }}</h3>
                <p class="mt-3 text-[13px] leading-6 text-slate-500 sm:text-sm">
                  {{ addon.description }}
                </p>
              </div>

              <div class="mt-5 rounded-md border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Access flow</p>
                <p class="mt-2 text-[13px] font-semibold text-slate-700 sm:text-sm">
                  {{ addon.isActive ? 'Open the live module workspace from a dedicated page.' : 'Review the module first, then continue into the upgrade flow.' }}
                </p>
              </div>

              <div class="mt-auto grid gap-3 pt-5">
                <button
                  type="button"
                  (click)="openGuide(addon)"
                  class="inline-flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3 text-[13px] font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:text-sm"
                >
                  <span>{{ addon.isActive ? 'View Flow' : 'View Guide' }}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>

                <button
                  type="button"
                  (click)="handleAddonClick(addon, $event)"
                  class="inline-flex w-full items-center justify-between rounded-md px-4 py-3 text-[13px] font-bold transition sm:text-sm"
                  [ngClass]="addon.isActive ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-amber-500 text-white hover:bg-amber-600'"
                >
                  <span>{{ addon.isActive ? 'Manage' : 'Upgrade Plan' }}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          </div>
        }
      </div>

      @if (visibleAddons().length === 0) {
        <div class="mt-6 rounded-md border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center">
          <h3 class="text-lg font-black tracking-tight text-slate-900">No modules in this view yet</h3>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            Switch between active and suggested tabs, or open the dedicated add-ons page to review all modules with the full launcher flow.
          </p>
          <button
            type="button"
            (click)="openAddonsHub()"
            class="mt-4 rounded-md bg-slate-900 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-slate-800"
          >
            Open Add-ons Page
          </button>
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
  `]
})
export class EssAddonsComponent {
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);

  addons = input<AddonCard[]>([]);
  readonly activeTab = signal<'active' | 'suggested'>('active');
  readonly visibleAddons = computed(() =>
    this.addons().filter((addon) =>
      this.activeTab() === 'active' ? addon.isActive : !addon.isActive
    )
  );

  activeCount(): number {
    return this.addons().filter((addon) => addon.isActive).length;
  }

  lockedCount(): number {
    return this.addons().filter((addon) => !addon.isActive).length;
  }

  openAddonsHub(): void {
    this.router.navigateByUrl('/add-ons');
  }

  openGuide(addon: AddonCard): void {
    this.router.navigateByUrl(`/add-ons/guide/${addon.slug || addon.name}`);
  }

  getIcon(kind: string): SafeHtml {
    const icons: Record<string, string> = {
      'chart-column': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M8 16V9"/><path d="M12 16V6"/><path d="M16 16v-4"/></svg>',
      payroll: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h10"/><path d="M7 13h6"/></svg>',
      geofence: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s6-5.5 6-11a6 6 0 0 0-12 0c0 5.5 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></svg>',
      'shield-check': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>',
      'clipboard-list': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 6h6"/><path d="M8 6H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-1"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>',
      projects: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 11h18"/></svg>',
      'clock-3': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
      expenses: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3h10l4 4v14H3V3z"/><path d="M7 8h10"/><path d="M7 12h10"/><path d="M7 16h6"/></svg>',
      attendance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>',
      'calendar-plus': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M12 14v4"/><path d="M10 16h4"/></svg>',
      spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m13 2-2 7h7l-7 13 2-8H6z"/></svg>',
    };

    return this.sanitizer.bypassSecurityTrustHtml(icons[kind] || icons['spark']);
  }

  handleAddonClick(addon: AddonCard, event?: Event): void {
    event?.stopPropagation();

    if (!addon.isActive) {
      this.router.navigate(['/billing'], {
        queryParams: {
          source: 'addon',
          addon: addon.slug || addon.name,
          mode: 'upgrade',
        },
      });
      return;
    }

    const route = addon.route || `/add-ons/guide/${addon.slug || addon.name}`;
    const user = this.authService.getStoredUser();

    if (route && this.permissionService.canAccessRoute(user, route)) {
      this.router.navigateByUrl(route);
      return;
    }

    this.openGuide(addon);
  }
}
