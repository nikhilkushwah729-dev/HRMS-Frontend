import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  RequestRecord,
  RequestStatus,
  RequestWorkflowService,
} from '../../core/services/request-workflow.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-approval-center-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <div class="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500 shadow-sm">Loading approval detail...</div>
      } @else if (request()) {
        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p class="text-[11px] font-black uppercase tracking-[0.24em] text-violet-600">Approval Detail</p>
              <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{{ request()!.title }}</h1>
              <p class="mt-2 text-sm text-slate-500">{{ request()!.employeeName }} • {{ request()!.department || 'Department not set' }}</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button type="button" (click)="process('approved')" class="rounded-xl border border-emerald-200 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50">Approve</button>
              <button type="button" (click)="process('sent_back')" class="rounded-xl border border-sky-200 px-4 py-3 text-sm font-black text-sky-700 transition hover:bg-sky-50">Send Back</button>
              <button type="button" (click)="process('rejected')" class="rounded-xl border border-rose-200 px-4 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-50">Reject</button>
              <a routerLink="/approval-center/pending" class="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">Back</a>
            </div>
          </div>
        </section>

        <section class="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 class="text-lg font-black text-slate-900">Request Review</h2>
            <div class="mt-5 grid gap-4 sm:grid-cols-2">
              <div class="rounded-2xl border border-slate-200 px-4 py-3"><p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Type</p><p class="mt-2 text-sm font-black text-slate-900">{{ prettyType(request()!.requestType) }}</p></div>
              <div class="rounded-2xl border border-slate-200 px-4 py-3"><p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Status</p><p class="mt-2"><span class="rounded-full px-3 py-1 text-xs font-black" [ngClass]="statusBadge(request()!.status)">{{ prettyStatus(request()!.status) }}</span></p></div>
              <div class="rounded-2xl border border-slate-200 px-4 py-3"><p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Priority</p><p class="mt-2 text-sm font-black text-slate-900">{{ request()!.priority }}</p></div>
              <div class="rounded-2xl border border-slate-200 px-4 py-3"><p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Escalation</p><p class="mt-2 text-sm font-black text-slate-900">{{ request()!.escalationAt ? (request()!.escalationAt | date:'medium') : 'No escalation' }}</p></div>
            </div>
            <div class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Reason</p>
              <p class="mt-2 text-sm text-slate-600">{{ request()!.reason }}</p>
            </div>
            <div class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Description</p>
              <p class="mt-2 text-sm text-slate-600">{{ request()!.description || 'No extra description.' }}</p>
            </div>
          </article>

          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 class="text-lg font-black text-slate-900">Approval Timeline</h2>
            <div class="mt-5 space-y-4">
              @for (event of request()!.timeline; track event.id) {
                <div class="flex gap-3">
                  <div class="mt-1 h-3 w-3 rounded-full bg-violet-500"></div>
                  <div class="flex-1 rounded-2xl border border-slate-200 px-4 py-3">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <p class="text-sm font-black text-slate-900">{{ prettyEvent(event.action) }}</p>
                      <p class="text-xs text-slate-500">{{ event.createdAt | date:'medium' }}</p>
                    </div>
                    <p class="mt-1 text-xs font-semibold text-slate-500">{{ event.actorName || 'System' }}</p>
                    @if (event.note) {
                      <p class="mt-2 text-sm text-slate-600">{{ event.note }}</p>
                    }
                  </div>
                </div>
              }
            </div>
          </article>
        </section>
      } @else {
        <div class="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500 shadow-sm">Approval request not found or access denied.</div>
      }
    </div>
  `,
})
export class ApprovalCenterDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly requestService = inject(RequestWorkflowService);
  private readonly toastService = inject(ToastService);

  readonly loading = signal(true);
  readonly request = signal<RequestRecord | null>(null);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id') || 0);
    this.requestService.getRequestById(id).subscribe({
      next: (item) => {
        this.request.set(item);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.show('Unable to load approval detail.', 'error');
        this.loading.set(false);
      },
    });
  }

  process(action: 'approved' | 'rejected' | 'sent_back'): void {
    const id = this.request()?.id;
    if (!id) return;
    const comment =
      action === 'approved'
        ? window.prompt('Approval comment (optional)') ?? ''
        : window.prompt(
            action === 'rejected'
              ? 'Rejection reason'
              : 'Correction / send-back reason',
          ) ?? '';
    this.requestService.processRequest(id, action, comment || undefined).subscribe({
      next: (item) => {
        if (!item) {
          this.toastService.show('Unable to process this request.', 'error');
          return;
        }
        this.request.set(item);
        this.toastService.show(`Request ${action.replace('_', ' ')} successfully.`, 'success');
      },
      error: () => this.toastService.show('Unable to process this request.', 'error'),
    });
  }

  statusBadge(status: RequestStatus): string {
    const map: Record<RequestStatus, string> = {
      draft: 'bg-slate-100 text-slate-700',
      pending: 'bg-amber-50 text-amber-700',
      approved: 'bg-emerald-50 text-emerald-700',
      rejected: 'bg-rose-50 text-rose-700',
      cancelled: 'bg-slate-100 text-slate-700',
      sent_back: 'bg-sky-50 text-sky-700',
    };
    return map[status];
  }

  prettyStatus(status: RequestStatus): string {
    return status.replace(/_/g, ' ');
  }

  prettyType(value: string): string {
    return value.replace(/_/g, ' ');
  }

  prettyEvent(value: string): string {
    return value.replace(/_/g, ' ');
  }
}
