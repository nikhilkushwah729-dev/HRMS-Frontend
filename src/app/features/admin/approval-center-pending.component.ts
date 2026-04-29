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
  selector: 'app-approval-center-pending',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-5">
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <input [(ngModel)]="search" placeholder="Search employee, title, reason" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 xl:col-span-2" />
        <select [(ngModel)]="type" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400">
          <option value="">All request types</option>
          @for (option of requestTypes(); track option.key) {
            <option [value]="option.key">{{ option.label }}</option>
          }
        </select>
        <select [(ngModel)]="status" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400">
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="sent_back">Sent Back</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button type="button" (click)="bulkApprove()" class="rounded-2xl border border-emerald-200 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50">Bulk Approve</button>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200">
          <thead>
            <tr class="text-left text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              <th class="px-4 py-4"><input type="checkbox" [checked]="allVisibleSelected()" (change)="toggleAll($event)" /></th>
              <th class="px-4 py-4">Request</th>
              <th class="px-4 py-4">Employee</th>
              <th class="px-4 py-4">Type</th>
              <th class="px-4 py-4">Status</th>
              <th class="px-4 py-4">Priority</th>
              <th class="px-4 py-4">Escalation</th>
              <th class="px-4 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (item of filteredItems(); track item.id) {
              <tr>
                <td class="px-4 py-4"><input type="checkbox" [checked]="selectedIds().has(item.id)" (change)="toggleOne(item.id)" /></td>
                <td class="px-4 py-4">
                  <p class="text-sm font-black text-slate-900">{{ item.title }}</p>
                  <p class="mt-1 text-xs text-slate-500">{{ item.reason }}</p>
                </td>
                <td class="px-4 py-4">
                  <p class="text-sm font-black text-slate-900">{{ item.employeeName }}</p>
                  <p class="mt-1 text-xs text-slate-500">{{ item.department || 'Department not set' }}</p>
                </td>
                <td class="px-4 py-4 text-sm text-slate-600">{{ prettyType(item.requestType) }}</td>
                <td class="px-4 py-4"><span class="rounded-full px-3 py-1 text-xs font-black" [ngClass]="statusBadge(item.status)">{{ item.status.replace('_', ' ') }}</span></td>
                <td class="px-4 py-4"><span class="rounded-full px-3 py-1 text-xs font-black" [ngClass]="priorityBadge(item.priority)">{{ item.priority }}</span></td>
                <td class="px-4 py-4 text-sm text-slate-600">{{ item.escalationAt ? (item.escalationAt | date:'short') : 'No escalation' }}</td>
                <td class="px-4 py-4">
                  <div class="flex justify-end gap-2">
                    <a [routerLink]="['/approval-center', item.id]" class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50">View</a>
                    <button type="button" (click)="process(item.id, 'approved')" class="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-50">Approve</button>
                    <button type="button" (click)="process(item.id, 'sent_back')" class="rounded-lg border border-sky-200 px-3 py-2 text-xs font-black text-sky-700 transition hover:bg-sky-50">Send Back</button>
                    <button type="button" (click)="process(item.id, 'rejected')" class="rounded-lg border border-rose-200 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-50">Reject</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="px-4 py-12 text-center text-sm font-semibold text-slate-500">No approval requests found for the selected filters.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ApprovalCenterPendingComponent {
  private readonly requestService = inject(RequestWorkflowService);
  private readonly toastService = inject(ToastService);

  readonly items = signal<RequestRecord[]>([]);
  readonly selectedIds = signal<Set<number>>(new Set());
  readonly requestTypes = signal(this.requestService.getRequestTypes());

  search = '';
  type = '';
  status = 'pending';

  readonly filteredItems = computed(() =>
    this.items().filter((item) => {
      if (this.type && item.requestType !== this.type) return false;
      if (this.status && item.status !== this.status) return false;
      if (!this.search.trim()) return true;
      return [item.title, item.reason, item.employeeName, item.department]
        .join(' ')
        .toLowerCase()
        .includes(this.search.toLowerCase());
    }),
  );

  readonly allVisibleSelected = computed(
    () =>
      this.filteredItems().length > 0 &&
      this.filteredItems().every((item) => this.selectedIds().has(item.id)),
  );

  constructor() {
    this.load();
  }

  private load(): void {
    this.requestService.getApprovalQueue().subscribe({
      next: (items) => this.items.set(items),
      error: () =>
        this.toastService.show('Unable to load approval queue.', 'error'),
    });
  }

  prettyType(type: RequestType): string {
    return (
      this.requestTypes().find((item) => item.key === type)?.label ??
      type.replace(/_/g, ' ')
    );
  }

  toggleOne(id: number): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  toggleAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedIds.set(
      checked ? new Set(this.filteredItems().map((item) => item.id)) : new Set(),
    );
  }

  process(id: number, action: 'approved' | 'rejected' | 'sent_back'): void {
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
          this.toastService.show('Unable to update this request.', 'error');
          return;
        }
        this.toastService.show(`Request ${action.replace('_', ' ')} successfully.`, 'success');
        this.load();
      },
      error: () =>
        this.toastService.show('Unable to process the request right now.', 'error'),
    });
  }

  bulkApprove(): void {
    const ids = Array.from(this.selectedIds());
    if (!ids.length) {
      this.toastService.show('Select requests before using bulk approval.', 'error');
      return;
    }
    this.requestService.bulkProcessRequests(ids, 'approved', 'Bulk approved by approver.').subscribe({
      next: () => {
        this.toastService.show('Selected requests approved successfully.', 'success');
        this.selectedIds.set(new Set());
        this.load();
      },
      error: () =>
        this.toastService.show('Unable to bulk approve selected requests.', 'error'),
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
