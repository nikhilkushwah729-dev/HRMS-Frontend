import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AccessControlService } from './access-control.service';
import { AccessUser } from './access.models';
import { filterVisibleMenuItems } from './menu-filter';
import { SAAS_MENU_SECTIONS } from './menu.config';
import { HasAccessDirective } from './has-access.directive';

@Component({
  selector: 'app-access-menu-example',
  standalone: true,
  imports: [CommonModule, RouterModule, HasAccessDirective],
  template: `
    <section class="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header class="space-y-2">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Access control demo</p>
        <h2 class="text-2xl font-black text-slate-900">Dynamic menu for SaaS HRMS</h2>
        <p class="text-sm text-slate-500">
          This component shows how RBAC, addons, tabs, and userInfo combine to render only visible modules.
        </p>
      </header>

      <div class="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside class="space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          @for (section of visibleSections(); track section.id) {
            <div class="space-y-2">
              <div>
                <p class="text-sm font-black text-slate-900">{{ section.label }}</p>
                <p class="text-xs text-slate-500">{{ section.description }}</p>
              </div>
              <div class="space-y-1">
                @for (item of section.items; track item.id) {
                  <a
                    [routerLink]="item.route"
                    class="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:bg-white hover:text-indigo-700"
                  >
                    <span>{{ item.label }}</span>
                    <span class="text-[10px] uppercase tracking-[0.18em] text-slate-400">{{ item.permission || 'open' }}</span>
                  </a>
                }
              </div>
            </div>
          }
        </aside>

        <div class="space-y-4">
          <div class="rounded-xl border border-slate-100 p-5">
            <h3 class="text-lg font-bold text-slate-900">Current access profile</h3>
            <div class="mt-4 grid gap-3 md:grid-cols-3">
              <div class="rounded-lg bg-slate-50 p-4">
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Role</p>
                <p class="mt-1 text-base font-extrabold text-slate-900">{{ user().role }}</p>
              </div>
              <div class="rounded-lg bg-slate-50 p-4">
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Pay Slip</p>
                <p class="mt-1 text-base font-extrabold text-slate-900">{{ user().userInfo.paySlip ?? 'N/A' }}</p>
              </div>
              <div class="rounded-lg bg-slate-50 p-4">
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Visitor Add-on</p>
                <p class="mt-1 text-base font-extrabold text-slate-900">{{ user().addons.visitorManagement ? 'Enabled' : 'Disabled' }}</p>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-slate-100 p-5">
            <h3 class="text-lg font-bold text-slate-900">Directive example</h3>
            <p class="mt-2 text-sm text-slate-500">
              The button below only renders when the directive allows access to the provided module rule.
            </p>

            <div class="mt-4">
              <button
                *appHasAccess="demoModule(); user: user()"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                Visible module action
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class AccessMenuExampleComponent {
  private readonly accessControl = inject(AccessControlService);

  readonly user = signal<AccessUser>({
    role: 'employee',
    permissions: {
      'dashboard.view': true,
      'attendance.view': true,
      'leave.view': true,
      'leave.apply': true,
      'timesheets.view': true,
      'projects.view': true,
      'reports.view': true,
      'payroll.view': true,
      'employees.view': false,
      'visitorManagement.view': false,
      'settings.view': false,
      'addons.view': false,
      'audit.view': false,
      'announcements.view': false,
      'roles.view': false,
      'profile.view': true,
    },
    addons: {
      attendance: true,
      leave: true,
      payroll: true,
      visitorManagement: false,
      projects: true,
      expenses: true,
      timesheets: true,
      reports: true,
      settings: false,
    },
    tabs: {
      selfService: true,
      attendance: true,
      leave: true,
      payroll: true,
      employee: false,
      admin: false,
    },
    userInfo: {
      paySlip: 1,
      salarySlip: 0,
      shiftChangePerm: 1,
    },
  });

  readonly visibleSections = computed(() =>
    filterVisibleMenuItems(SAAS_MENU_SECTIONS, this.user(), this.accessControl),
  );

  demoModule(): { permission: string; addon: string; tab: string; userInfo: { key: 'paySlip'; operator: 'neq'; value: number }[] } {
    return {
      permission: 'payroll.view',
      addon: 'payroll',
      tab: 'payroll',
      userInfo: [{ key: 'paySlip', operator: 'neq', value: 0 }],
    };
  }
}
