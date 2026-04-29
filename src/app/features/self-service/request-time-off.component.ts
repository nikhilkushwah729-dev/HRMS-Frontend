import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  RequestRecord,
  RequestStatus,
  RequestWorkflowService,
} from '../../core/services/request-workflow.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-request-time-off',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mx-auto max-w-7xl space-y-6">
      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.24em] text-rose-600">Time Off Request</p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Manage employee time off requests</h1>
            <p class="mt-2 max-w-3xl text-sm text-slate-500">
              This page follows the Angular_Web style more closely: application date, time off date, requested time window, status tracking, and direct action flow.
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <a routerLink="/self-service/requests" class="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">Back to Request Center</a>
            <a routerLink="/self-service/requests/time-off/apply" class="rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800">Apply Time Off</a>
          </div>
        </div>
      </section>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Total Requests</p><p class="mt-3 text-3xl font-black text-slate-900">{{ requests().length }}</p></article>
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Pending</p><p class="mt-3 text-3xl font-black text-amber-500">{{ countByStatus('pending') }}</p></article>
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Approved</p><p class="mt-3 text-3xl font-black text-emerald-600">{{ countByStatus('approved') }}</p></article>
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Cancelled / Rejected</p><p class="mt-3 text-3xl font-black text-rose-600">{{ countByStatus('cancelled') + countByStatus('rejected') }}</p></article>
      </section>

      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-black text-slate-900">My Time Off Requests</h2>
            <p class="mt-1 text-sm text-slate-500">Application date, requested time range, and approval flow for your own time off requests only.</p>
          </div>
        </div>

        @if (loading()) {
          <div class="mt-5 rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm font-semibold text-slate-500">Loading time off requests...</div>
        } @else {
          <div class="mt-5 overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200">
              <thead>
                <tr class="text-left text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  <th class="px-4 py-4">Application Date</th>
                  <th class="px-4 py-4">Time Off Date</th>
                  <th class="px-4 py-4">Requested Time</th>
                  <th class="px-4 py-4">Reason</th>
                  <th class="px-4 py-4">Status</th>
                  <th class="px-4 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (item of sortedRequests(); track item.id) {
                  <tr>
                    <td class="px-4 py-4 text-sm font-semibold text-slate-700">{{ displayApplicationDate(item) | date:'mediumDate' }}</td>
                    <td class="px-4 py-4 text-sm text-slate-600">{{ item.startDate || item.requestDate || item.createdAt | date:'mediumDate' }}</td>
                    <td class="px-4 py-4 text-sm font-black text-slate-900">{{ item.startTime || '--:--' }} to {{ item.endTime || '--:--' }}</td>
                    <td class="px-4 py-4">
                      <p class="text-sm font-black text-slate-900">{{ item.title }}</p>
                      <p class="mt-1 max-w-md text-xs text-slate-500">{{ item.reason }}</p>
                    </td>
                    <td class="px-4 py-4"><span class="rounded-full px-3 py-1 text-xs font-black" [ngClass]="statusBadge(item.status)">{{ prettyStatus(item.status) }}</span></td>
                    <td class="px-4 py-4">
                      <div class="flex justify-end gap-2">
                        <a [routerLink]="['/self-service/requests', item.id]" class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50">View</a>
                        @if (canCancel(item)) {
                          <button type="button" (click)="cancel(item.id)" class="rounded-lg border border-rose-200 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-50">Cancel</button>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="px-4 py-12 text-center text-sm font-semibold text-slate-500">No time off requests found yet.</td></tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>
  `,
})
export class RequestTimeOffComponent {
  private readonly requestService = inject(RequestWorkflowService);
  private readonly toastService = inject(ToastService);

  readonly loading = signal(true);
  readonly requests = signal<RequestRecord[]>([]);

  readonly sortedRequests = computed(() =>
    [...this.requests()].sort((a, b) =>
      String(this.displayApplicationDate(b)).localeCompare(String(this.displayApplicationDate(a))),
    ),
  );

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.requestService.getMyRequests({ requestType: 'time_off' }).subscribe({
      next: (items) => {
        this.requests.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.show('Unable to load time off requests.', 'error');
        this.loading.set(false);
      },
    });
  }

  displayApplicationDate(item: RequestRecord): string {
    return item.requestDate || item.submittedAt || item.startDate || item.createdAt;
  }

  countByStatus(status: RequestStatus): number {
    return this.requests().filter((item) => item.status === status).length;
  }

  prettyStatus(status: RequestStatus): string {
    return status.replace(/_/g, ' ');
  }

  canCancel(item: RequestRecord): boolean {
    return ['draft', 'pending', 'sent_back'].includes(item.status);
  }

  cancel(id: number): void {
    this.requestService.cancelRequest(id, 'Cancelled by employee.').subscribe({
      next: (item) => {
        if (!item) {
          this.toastService.show('This time off request can no longer be cancelled.', 'error');
          return;
        }
        this.toastService.show('Time off request cancelled successfully.', 'success');
        this.load();
      },
      error: () => this.toastService.show('Unable to cancel time off request right now.', 'error'),
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
}
