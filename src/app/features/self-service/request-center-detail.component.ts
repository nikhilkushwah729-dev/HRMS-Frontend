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
  selector: 'app-request-center-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mx-auto max-w-6xl space-y-6">
      @if (loading()) {
        <div class="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500 shadow-sm">Loading request details...</div>
      } @else if (request()) {
        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p class="text-[11px] font-black uppercase tracking-[0.24em] text-sky-600">Request Detail</p>
              <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{{ request()!.title }}</h1>
              <p class="mt-2 text-sm text-slate-500">{{ request()!.reason }}</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <span class="rounded-full px-3 py-2 text-xs font-black" [ngClass]="statusBadge(request()!.status)">{{ prettyStatus(request()!.status) }}</span>
              @if (canCancel(request()!)) {
                <button type="button" (click)="cancel(request()!.id)" class="rounded-xl border border-rose-200 px-4 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-50">Cancel Request</button>
              }
              <a routerLink="/self-service/requests" class="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">Back</a>
            </div>
          </div>
        </section>

        <section class="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 class="text-lg font-black text-slate-900">Request Information</h2>
            <div class="mt-5 grid gap-4 sm:grid-cols-2">
              <div class="rounded-2xl border border-slate-200 px-4 py-3"><p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Type</p><p class="mt-2 text-sm font-black text-slate-900">{{ prettyType(request()!.requestType) }}</p></div>
              <div class="rounded-2xl border border-slate-200 px-4 py-3"><p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Priority</p><p class="mt-2 text-sm font-black text-slate-900">{{ request()!.priority }}</p></div>
              <div class="rounded-2xl border border-slate-200 px-4 py-3"><p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Application Date</p><p class="mt-2 text-sm font-black text-slate-900">{{ displayApplicationDate(request()!) | date:'mediumDate' }}</p></div>
              <div class="rounded-2xl border border-slate-200 px-4 py-3"><p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Date Range</p><p class="mt-2 text-sm font-black text-slate-900">{{ request()!.startDate || '-' }} to {{ request()!.endDate || '-' }}</p></div>
              @if (request()!.requestType === 'time_off') {
                <div class="rounded-2xl border border-slate-200 px-4 py-3"><p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Time Off Window</p><p class="mt-2 text-sm font-black text-slate-900">{{ request()!.startTime || '--:--' }} to {{ request()!.endTime || '--:--' }}</p></div>
              }
              <div class="rounded-2xl border border-slate-200 px-4 py-3"><p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Workflow</p><p class="mt-2 text-sm font-black text-slate-900">{{ request()!.workflowLabel || 'Standard Workflow' }}</p></div>
            </div>
            <div class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Description</p>
              <p class="mt-2 text-sm text-slate-600">{{ request()!.description || 'No extra description added.' }}</p>
            </div>
            @if (request()!.attachments?.length) {
              <div class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Attachments</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  @for (attachment of request()!.attachments; track attachment.id) {
                    <a [href]="attachment.url || null" [attr.download]="attachment.name" target="_blank" rel="noopener noreferrer" class="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-sky-300 hover:text-sky-700">{{ attachment.name }}</a>
                  }
                </div>
              </div>
            }
          </article>

          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 class="text-lg font-black text-slate-900">Timeline</h2>
            <div class="mt-5 space-y-4">
              @for (event of request()!.timeline; track event.id) {
                <div class="flex gap-3">
                  <div class="mt-1 h-3 w-3 rounded-full bg-sky-500"></div>
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
              } @empty {
                <div class="rounded-2xl border border-dashed border-slate-300 px-5 py-8 text-center text-sm font-semibold text-slate-500">No request timeline available.</div>
              }
            </div>
          </article>
        </section>
      } @else {
        <div class="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500 shadow-sm">Request not found or access denied.</div>
      }
    </div>
  `,
})
export class RequestCenterDetailComponent {
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
        this.toastService.show('Unable to load request detail.', 'error');
        this.loading.set(false);
      },
    });
  }

  canCancel(item: RequestRecord): boolean {
    return ['draft', 'pending', 'sent_back'].includes(item.status);
  }

  displayApplicationDate(item: RequestRecord): string {
    return item.requestDate || item.submittedAt || item.startDate || item.createdAt;
  }

  cancel(id: number): void {
    this.requestService.cancelRequest(id, 'Cancelled by employee.').subscribe({
      next: (item) => {
        if (!item) {
          this.toastService.show('This request can no longer be cancelled.', 'error');
          return;
        }
        this.request.set(item);
        this.toastService.show('Request cancelled successfully.', 'success');
      },
      error: () => this.toastService.show('Unable to cancel the request.', 'error'),
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
