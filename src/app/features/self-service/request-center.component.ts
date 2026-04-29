import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  RequestRecord,
  RequestStatus,
  RequestType,
  RequestWorkflowService,
} from '../../core/services/request-workflow.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-request-center',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.24em] text-sky-600">Request Center</p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Employee self-service requests and request history</h1>
            <p class="mt-2 max-w-3xl text-sm text-slate-500">
              Create requests, track approval status, review timelines, and cancel requests before approval without mixing approver workflows into this page.
            </p>
          </div>
          <a routerLink="/self-service/requests/create" class="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800">
            Create New Request
          </a>
        </div>
      </section>

      @if (loading()) {
        <div class="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
          Loading your request center...
        </div>
      } @else {
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Total Requests</p><p class="mt-3 text-3xl font-black text-slate-900">{{ requests().length }}</p></article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Pending</p><p class="mt-3 text-3xl font-black text-amber-500">{{ countByStatus('pending') }}</p></article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Approved</p><p class="mt-3 text-3xl font-black text-emerald-600">{{ countByStatus('approved') }}</p></article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Rejected</p><p class="mt-3 text-3xl font-black text-rose-600">{{ countByStatus('rejected') }}</p></article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Upcoming Approved</p><p class="mt-3 text-3xl font-black text-sky-700">{{ upcomingApproved().length }}</p></article>
        </section>

        <section class="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-lg font-black text-slate-900">My Requests</h2>
                <p class="mt-1 text-sm text-slate-500">Only your own requests are visible here.</p>
              </div>
            </div>

            <div class="mt-5 grid gap-3 md:grid-cols-4">
              <input [(ngModel)]="search" placeholder="Search title or reason" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 md:col-span-2" />
              <select [(ngModel)]="type" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400">
                <option value="">All request types</option>
                @for (option of requestTypes(); track option.key) {
                  <option [value]="option.key">{{ option.label }}</option>
                }
              </select>
              <select [(ngModel)]="status" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400">
                <option value="">All status</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
                <option value="sent_back">Sent Back</option>
              </select>
            </div>

            <div class="mt-5 overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr class="text-left text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    <th class="px-4 py-4">Request</th>
                    <th class="px-4 py-4">Type</th>
                    <th class="px-4 py-4">Application Date</th>
                    <th class="px-4 py-4">Status</th>
                    <th class="px-4 py-4">Priority</th>
                    <th class="px-4 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (item of filteredRequests(); track item.id) {
                    <tr>
                      <td class="px-4 py-4">
                        <p class="text-sm font-black text-slate-900">{{ item.title }}</p>
                        <p class="mt-1 max-w-md text-xs text-slate-500">{{ item.reason }}</p>
                        @if (item.requestType === 'time_off' && (item.startTime || item.endTime)) {
                          <p class="mt-2 text-[11px] font-bold text-sky-700">Time Off: {{ item.startTime || '--:--' }} to {{ item.endTime || '--:--' }}</p>
                        }
                      </td>
                      <td class="px-4 py-4 text-sm text-slate-600">{{ requestTypeLabel(item.requestType) }}</td>
                      <td class="px-4 py-4 text-sm text-slate-600">{{ displayApplicationDate(item) | date:'mediumDate' }}</td>
                      <td class="px-4 py-4"><span class="rounded-full px-3 py-1 text-xs font-black" [ngClass]="statusBadge(item.status)">{{ prettyStatus(item.status) }}</span></td>
                      <td class="px-4 py-4"><span class="rounded-full px-3 py-1 text-xs font-black" [ngClass]="priorityBadge(item.priority)">{{ item.priority }}</span></td>
                      <td class="px-4 py-4">
                        <div class="flex justify-end gap-2">
                          <a [routerLink]="['/self-service/requests', item.id]" class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50">View</a>
                          @if (canCancel(item)) {
                            <button type="button" (click)="cancel(item)" class="rounded-lg border border-rose-200 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-50">Cancel</button>
                          }
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="6" class="px-4 py-12 text-center text-sm font-semibold text-slate-500">No requests found for the selected filters.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </article>

          <article class="space-y-5">
            <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 class="text-lg font-black text-slate-900">Request Types</h2>
              <div class="mt-4 grid gap-3">
                @for (option of requestTypes(); track option.key) {
                  <a [routerLink]="requestTypeRoute(option.key)" [queryParams]="option.key === 'time_off' ? null : { type: option.key }" class="rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-sky-200 hover:bg-sky-50">
                    <p class="text-sm font-black text-slate-900">{{ option.label }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ option.description }}</p>
                  </a>
                }
              </div>
            </section>

            <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 class="text-lg font-black text-slate-900">Upcoming Approved Requests</h2>
              <div class="mt-4 space-y-3">
                @for (item of upcomingApproved(); track item.id) {
                  <a [routerLink]="['/self-service/requests', item.id]" class="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50">
                    <p class="text-sm font-black text-slate-900">{{ item.title }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ requestTypeLabel(item.requestType) }} • {{ displayApplicationDate(item) | date:'mediumDate' }}{{ item.requestType === 'time_off' && (item.startTime || item.endTime) ? (' • ' + (item.startTime || '--:--') + ' to ' + (item.endTime || '--:--')) : '' }}</p>
                  </a>
                } @empty {
                  <div class="rounded-2xl border border-dashed border-slate-300 px-5 py-8 text-center text-sm font-semibold text-slate-500">
                    No upcoming approved requests.
                  </div>
                }
              </div>
            </section>
          </article>
        </section>
      }
    </div>
  `,
})
export class RequestCenterComponent {
  private readonly requestService = inject(RequestWorkflowService);
  private readonly toastService = inject(ToastService);

  readonly loading = signal(true);
  readonly requests = signal<RequestRecord[]>([]);
  readonly requestTypes = signal(this.requestService.getRequestTypes());

  search = '';
  type = '';
  status = '';

  readonly filteredRequests = computed(() =>
    this.requests().filter((item) => {
      if (this.type && item.requestType !== this.type) return false;
      if (this.status && item.status !== this.status) return false;
      if (!this.search.trim()) return true;
      return [item.title, item.reason, item.description]
        .join(' ')
        .toLowerCase()
        .includes(this.search.toLowerCase());
    }),
  );

  readonly upcomingApproved = computed(() =>
    this.requests()
      .filter((item) => item.status === 'approved')
      .sort((left, right) =>
        String(this.displayApplicationDate(left)).localeCompare(
          String(this.displayApplicationDate(right)),
        ),
      )
      .slice(0, 5),
  );

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.requestService.getMyRequests().subscribe({
      next: (items) => {
        this.requests.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.show('Unable to load request center data.', 'error');
        this.loading.set(false);
      },
    });
  }

  countByStatus(status: RequestStatus): number {
    return this.requests().filter((item) => item.status === status).length;
  }

  requestTypeLabel(type: RequestType): string {
    return (
      this.requestTypes().find((item) => item.key === type)?.label ??
      type.replace(/_/g, ' ')
    );
  }

  requestTypeRoute(type: RequestType): string[] {
    if (type === 'time_off') {
      return ['/self-service/requests/time-off'];
    }
    return ['/self-service/requests/create'];
  }

  prettyStatus(status: RequestStatus): string {
    return status.replace(/_/g, ' ');
  }

  canCancel(item: RequestRecord): boolean {
    return ['draft', 'pending', 'sent_back'].includes(item.status);
  }

  displayApplicationDate(item: RequestRecord): string {
    return item.requestDate || item.submittedAt || item.startDate || item.createdAt;
  }

  cancel(item: RequestRecord): void {
    this.requestService.cancelRequest(item.id, 'Cancelled by employee.').subscribe({
      next: (result) => {
        if (!result) {
          this.toastService.show('This request can no longer be cancelled.', 'error');
          return;
        }
        this.toastService.show('Request cancelled successfully.', 'success');
        this.load();
      },
      error: () => this.toastService.show('Unable to cancel request right now.', 'error'),
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

  priorityBadge(priority: RequestRecord['priority']): string {
    const map: Record<RequestRecord['priority'], string> = {
      low: 'bg-slate-100 text-slate-700',
      medium: 'bg-indigo-50 text-indigo-700',
      high: 'bg-orange-50 text-orange-700',
      urgent: 'bg-rose-50 text-rose-700',
    };
    return map[priority];
  }
}
