import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { User } from '../../core/models/auth.model';

@Component({
  selector: 'app-admin-attendance-management',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mx-auto flex max-w-7xl flex-col gap-5 pb-8">
      <header class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-600">Attendance Module</p>
            <h1 class="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">Admin attendance module for all employees</h1>
            <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              This workspace is dedicated to HR and admin attendance operations: register review, correction workflows,
              regularization approvals, shift planning, geofence controls, and reporting.
            </p>
          </div>
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Access scope</p>
            <p class="mt-2 text-lg font-black text-slate-900">{{ accessRoleLabel() }}</p>
            <p class="mt-2 text-sm text-slate-500">Employees are intentionally routed to Self Service Attendance instead of this management workspace.</p>
          </div>
        </div>
      </header>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        @for (metric of metrics(); track metric.label) {
          <article class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{{ metric.label }}</p>
            <p class="mt-3 text-2xl font-black text-slate-900">{{ metric.value }}</p>
            <p class="mt-2 text-sm text-slate-500">{{ metric.helper }}</p>
          </article>
        }
      </section>

      <section class="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Attendance Operations</p>
              <h2 class="mt-2 text-xl font-black text-slate-900">Management workspace</h2>
              <p class="mt-2 text-sm leading-6 text-slate-500">
                Open the exact admin page you need without mixing employee self-service flows into attendance management.
              </p>
            </div>
          </div>

          <div class="mt-5 grid gap-4 md:grid-cols-2">
            @for (item of adminCards(); track item.title) {
              <a
                [routerLink]="item.route"
                class="group rounded-lg border border-slate-200 bg-slate-50/80 p-4 transition hover:border-sky-200 hover:bg-white hover:shadow-sm"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{{ item.kicker }}</p>
                    <h3 class="mt-2 text-lg font-black text-slate-900">{{ item.title }}</h3>
                    <p class="mt-2 text-sm leading-6 text-slate-500">{{ item.description }}</p>
                  </div>
                  <span class="rounded-md border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">
                    Open
                  </span>
                </div>
              </a>
            }
          </div>
        </div>

        <aside class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Module Boundary</p>
          <h2 class="mt-2 text-xl font-black text-slate-900">Separate from Self Service</h2>
          <ul class="mt-4 space-y-3 text-sm text-slate-600">
            <li class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">Employees should use <span class="font-bold text-slate-900">/self-service/attendance</span> for their own punches and history.</li>
            <li class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">HR/Admin should use <span class="font-bold text-slate-900">/admin/attendance/*</span> for register, approvals, and policy controls.</li>
            <li class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">Shared backend logic is fine, but routes, UI, and workflows stay separate.</li>
          </ul>
        </aside>
      </section>
    </div>
  `,
})
export class AdminAttendanceManagementComponent {
  private readonly authService = inject(AuthService);
  private readonly permissionService = inject(PermissionService);

  private readonly currentUser: User | null = this.authService.getStoredUser();

  accessRoleLabel = computed(() => {
    if (this.permissionService.isSuperAdminUser(this.currentUser)) return 'Super Admin';
    if (this.permissionService.isAdminUser(this.currentUser)) return 'Admin';
    if (this.permissionService.isHrManagerUser(this.currentUser)) return 'HR Manager';
    if (this.permissionService.isManagerialUser(this.currentUser)) return 'Manager';
    return 'Employee';
  });

  metrics = computed(() => [
    { label: 'Primary screen', value: 'Register', helper: 'Daily attendance review and employee-level filters.' },
    { label: 'Approval flow', value: 'Regularization', helper: 'Approve or reject attendance correction requests.' },
    { label: 'Compliance', value: 'Geofence', helper: 'Location rules and branch-safe attendance validation.' },
    { label: 'Analytics', value: 'Reports', helper: 'Exports, summaries, and attendance insights.' },
  ]);

  adminCards = computed(() => [
    {
      kicker: 'Daily control',
      title: 'Attendance Register',
      description: 'View all employees, apply filters, and review status by team, department, and date.',
      route: '/admin/attendance/register',
    },
    {
      kicker: 'Corrections',
      title: 'Regularization Queue',
      description: 'Approve or reject missed punch, late arrival, and attendance correction requests.',
      route: '/admin/attendance/regularizations',
    },
    {
      kicker: 'Operations',
      title: 'Advanced Workspace',
      description: 'Open admin attendance workspace for shift planner, tracking, and operational tools.',
      route: '/admin/attendance/workspace',
    },
    {
      kicker: 'Policy',
      title: 'Geofence Controls',
      description: 'Manage geo-boundary rules and location-based attendance checks.',
      route: '/admin/attendance/geofence',
    },
    {
      kicker: 'Setup',
      title: 'Integrations',
      description: 'Biometric, face recognition, and attendance integration setup.',
      route: '/admin/attendance/integrations',
    },
    {
      kicker: 'Insights',
      title: 'Attendance Reports',
      description: 'Open analytics, exports, and operational attendance reporting.',
      route: '/admin/attendance/reports',
    },
  ]);
}
