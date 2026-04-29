import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { RequestWorkflowService } from '../../core/services/request-workflow.service';
import { PermissionService } from '../../core/services/permission.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-approval-center',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="space-y-6">
      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.24em] text-violet-600">Approval Center</p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Central approval queue for managers, HR, and admins</h1>
            <p class="mt-2 max-w-3xl text-sm text-slate-500">
              Review pending employee requests, approve or reject with reason, send back for correction, and keep employee self-service completely separate from approver operations.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <a routerLink="/approval-center/pending" class="rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800">Open Pending Queue</a>
          </div>
        </div>
      </section>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Pending Approvals</p><p class="mt-3 text-3xl font-black text-amber-500">{{ queueCount() }}</p></article>
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Approval Scope</p><p class="mt-3 text-xl font-black text-slate-900">{{ scopeLabel() }}</p></article>
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Workflow</p><p class="mt-3 text-xl font-black text-slate-900">Single + Multi-Level</p></article>
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Escalation</p><p class="mt-3 text-xl font-black text-rose-600">Tracked</p></article>
      </section>

      <section class="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-100 px-5 py-4">
          <div class="flex flex-wrap gap-2">
            <a routerLink="/approval-center" class="rounded-full px-4 py-2 text-sm font-black transition" routerLinkActive="bg-violet-600 text-white" [routerLinkActiveOptions]="{ exact: true }">Overview</a>
            <a routerLink="/approval-center/pending" class="rounded-full px-4 py-2 text-sm font-black transition" routerLinkActive="bg-violet-600 text-white">Pending Queue</a>
          </div>
        </div>
        <div class="p-5 sm:p-6">
          <router-outlet></router-outlet>
        </div>
      </section>
    </div>
  `,
})
export class ApprovalCenterComponent {
  private readonly requestService = inject(RequestWorkflowService);
  private readonly permissionService = inject(PermissionService);
  private readonly authService = inject(AuthService);
  readonly queueCount = signal(0);
  readonly currentUser = this.authService.getStoredUser();

  constructor() {
    this.requestService.getApprovalQueue({ status: 'pending' }).subscribe({
      next: (items) => this.queueCount.set(items.length),
      error: () => this.queueCount.set(0),
    });
  }

  scopeLabel(): string {
    const scope = this.permissionService.getAccessScope(this.currentUser);
    if (scope === 'organization') return 'Organization';
    if (scope === 'team') return 'Team';
    if (scope === 'global') return 'Global';
    return 'Restricted';
  }
}
