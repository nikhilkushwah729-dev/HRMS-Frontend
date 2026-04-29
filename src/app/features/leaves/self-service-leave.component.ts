import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  LeaveRequest,
  LeaveService,
  LeaveTypeBalance,
} from '../../core/services/leave.service';
import { ToastService } from '../../core/services/toast.service';

type CalendarCell = {
  day: number | null;
  iso: string | null;
  requests: LeaveRequest[];
};

@Component({
  selector: 'app-self-service-leave',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  template: `
    <div class="space-y-6">
      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-600">Self Service Leave</p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Manage your leave without leaving self service</h1>
            <p class="mt-2 max-w-2xl text-sm text-slate-500">
              Apply for leave, track approvals, view balances, and monitor upcoming approved days off from one dedicated employee workspace.
            </p>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <a
              routerLink="/self-service/leave/apply"
              class="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700"
            >
              Apply Leave
            </a>
            <a
              routerLink="/self-service/requests/leave"
              class="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Open Request Ledger
            </a>
          </div>
        </div>
      </section>

      @if (loading()) {
        <div class="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
          Loading your leave workspace...
        </div>
      } @else {
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Total Entitlement</p>
            <p class="mt-3 text-3xl font-black text-slate-900">{{ totalEntitlement() }}</p>
            <p class="mt-2 text-sm text-slate-500">Across all available leave types</p>
          </article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Remaining</p>
            <p class="mt-3 text-3xl font-black text-emerald-600">{{ totalRemaining() }}</p>
            <p class="mt-2 text-sm text-slate-500">Available to apply right now</p>
          </article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Pending Requests</p>
            <p class="mt-3 text-3xl font-black text-amber-500">{{ pendingCount() }}</p>
            <p class="mt-2 text-sm text-slate-500">Waiting for manager or HR action</p>
          </article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Approved This Year</p>
            <p class="mt-3 text-3xl font-black text-sky-600">{{ approvedCount() }}</p>
            <p class="mt-2 text-sm text-slate-500">Approved leave records in your history</p>
          </article>
        </section>

        <section class="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div class="space-y-5">
            <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h2 class="text-lg font-black text-slate-900">Leave Balance</h2>
                  <p class="mt-1 text-sm text-slate-500">Remaining, used, and total quota by leave type.</p>
                </div>
              </div>
              <div class="mt-4 grid gap-3 md:grid-cols-2">
                @for (balance of balances(); track balance.id) {
                  <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-sm font-black text-slate-900">{{ balance.typeName }}</p>
                        <p class="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {{ balance.isPaid ? 'Paid Leave' : 'Unpaid Leave' }}
                        </p>
                      </div>
                      <span class="rounded-full px-3 py-1 text-xs font-black" [style.background]="balance.color + '20'" [style.color]="balance.color">
                        {{ balance.remaining }} left
                      </span>
                    </div>
                    <div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div class="h-full rounded-full" [style.background]="balance.color" [style.width.%]="balance.total ? (balance.used / balance.total) * 100 : 0"></div>
                    </div>
                    <div class="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>Used {{ balance.used }}</span>
                      <span>Total {{ balance.total }}</span>
                    </div>
                  </div>
                }
              </div>
            </article>

            <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 class="text-lg font-black text-slate-900">My Leave History</h2>
                  <p class="mt-1 text-sm text-slate-500">View your pending, approved, rejected, and cancelled requests.</p>
                </div>
                <div class="flex flex-col gap-2 sm:flex-row">
                  <input
                    [value]="search()"
                    (input)="search.set(($any($event.target).value || '').toString())"
                    placeholder="Search by type or reason"
                    class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
                  />
                  <select
                    [value]="statusFilter()"
                    (change)="statusFilter.set(($any($event.target).value || 'all').toString())"
                    class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
                  >
                    <option value="all">All status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div class="mt-4 overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200">
                  <thead>
                    <tr class="text-left text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                      <th class="px-3 py-3">Leave</th>
                      <th class="px-3 py-3">Dates</th>
                      <th class="px-3 py-3">Days</th>
                      <th class="px-3 py-3">Status</th>
                      <th class="px-3 py-3">Reason</th>
                      <th class="px-3 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (item of filteredRequests(); track item.id) {
                      <tr>
                        <td class="px-3 py-4">
                          <div class="text-sm font-black text-slate-900">{{ item.leaveType?.typeName || 'Leave' }}</div>
                          <div class="mt-1 text-xs text-slate-500">Applied {{ item.createdAt | date:'mediumDate' }}</div>
                        </td>
                        <td class="px-3 py-4 text-sm text-slate-600">
                          {{ item.startDate | date:'mediumDate' }} - {{ item.endDate | date:'mediumDate' }}
                        </td>
                        <td class="px-3 py-4 text-sm font-bold text-slate-700">{{ item.totalDays }}</td>
                        <td class="px-3 py-4">
                          <span class="rounded-full px-3 py-1 text-xs font-black" [ngClass]="statusBadge(item.status)">
                            {{ item.status }}
                          </span>
                        </td>
                        <td class="px-3 py-4 text-sm text-slate-500">
                          <p class="max-w-[18rem] truncate">{{ item.reason || 'No reason added' }}</p>
                        </td>
                        <td class="px-3 py-4 text-right">
                          @if (item.status === 'pending') {
                            <button
                              type="button"
                              (click)="cancelLeave(item)"
                              class="rounded-lg border border-rose-200 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-50"
                            >
                              Cancel
                            </button>
                          } @else {
                            <span class="text-xs font-semibold text-slate-400">No action</span>
                          }
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="6" class="px-3 py-10 text-center text-sm font-semibold text-slate-500">
                          No leave records found for the selected filters.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </article>
          </div>

          <div class="space-y-5">
            <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 class="text-lg font-black text-slate-900">Upcoming Approved Leaves</h2>
              <p class="mt-1 text-sm text-slate-500">Your next approved time off, ready for planning.</p>
              <div class="mt-4 space-y-3">
                @for (leave of upcomingApproved(); track leave.id) {
                  <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-sm font-black text-slate-900">{{ leave.leaveType?.typeName || 'Leave' }}</p>
                        <p class="mt-1 text-sm text-slate-500">{{ leave.startDate | date:'mediumDate' }} - {{ leave.endDate | date:'mediumDate' }}</p>
                      </div>
                      <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                        {{ leave.totalDays }} day{{ leave.totalDays > 1 ? 's' : '' }}
                      </span>
                    </div>
                    <p class="mt-3 text-sm text-slate-500">{{ leave.reason || 'No reason added' }}</p>
                  </div>
                } @empty {
                  <div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                    No upcoming approved leaves.
                  </div>
                }
              </div>
            </article>

            <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-black text-slate-900">Leave Calendar</h2>
                  <p class="mt-1 text-sm text-slate-500">A month view of approved and pending leave dates.</p>
                </div>
                <div class="text-sm font-black text-slate-700">{{ monthLabel() }}</div>
              </div>
              <div class="mt-4 grid grid-cols-7 gap-2 text-center text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                @for (day of weekLabels; track day) { <div>{{ day }}</div> }
              </div>
              <div class="mt-3 grid grid-cols-7 gap-2">
                @for (cell of calendarDays(); track $index) {
                  <div class="min-h-[76px] rounded-2xl border p-2" [ngClass]="cell.day ? 'border-slate-200 bg-white' : 'border-transparent bg-transparent'">
                    @if (cell.day) {
                      <p class="text-xs font-black text-slate-700">{{ cell.day }}</p>
                      <div class="mt-2 space-y-1">
                        @for (item of cell.requests.slice(0, 2); track item.id) {
                          <div class="rounded-full px-2 py-1 text-[10px] font-black" [ngClass]="statusBadge(item.status)">
                            {{ item.leaveType?.typeName || 'Leave' }}
                          </div>
                        }
                        @if (cell.requests.length > 2) {
                          <div class="text-[10px] font-bold text-slate-400">+{{ cell.requests.length - 2 }} more</div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </article>

            <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 class="text-lg font-black text-slate-900">Quick Leave Requests</h2>
              <p class="mt-1 text-sm text-slate-500">Separate employee request shortcuts for short day, under-time, WFH, and outdoor duty.</p>
              <div class="mt-4 grid gap-3 sm:grid-cols-2">
                @for (shortcut of requestShortcuts; track shortcut.label) {
                  <button
                    type="button"
                    (click)="openShortcut(shortcut.kind)"
                    class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40"
                  >
                    <p class="text-sm font-black text-slate-900">{{ shortcut.label }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ shortcut.helper }}</p>
                  </button>
                }
              </div>
            </article>
          </div>
        </section>
      }
    </div>
  `,
})
export class SelfServiceLeaveComponent {
  private readonly leaveService = inject(LeaveService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly loading = signal(true);
  readonly requests = signal<LeaveRequest[]>([]);
  readonly balances = signal<LeaveTypeBalance[]>([]);
  readonly search = signal('');
  readonly statusFilter = signal('all');
  readonly monthCursor = signal(new Date());
  readonly weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly requestShortcuts = [
    { label: 'Short Day', kind: 'short-day', helper: 'Raise a short day leave or partial day exception.' },
    { label: 'Under-time', kind: 'under-time', helper: 'Request under-time approval for an early departure.' },
    { label: 'WFH', kind: 'wfh', helper: 'Submit a work from home request linked to leave workflow.' },
    { label: 'Outdoor Duty', kind: 'outdoor-duty', helper: 'Raise field duty or outdoor movement request.' },
  ] as const;

  readonly totalEntitlement = computed(() => this.balances().reduce((sum, item) => sum + item.total, 0));
  readonly totalRemaining = computed(() => this.balances().reduce((sum, item) => sum + item.remaining, 0));
  readonly pendingCount = computed(() => this.requests().filter((item) => item.status === 'pending').length);
  readonly approvedCount = computed(() => this.requests().filter((item) => item.status === 'approved').length);
  readonly upcomingApproved = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.requests()
      .filter((item) => item.status === 'approved' && item.endDate >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 4);
  });
  readonly filteredRequests = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.requests().filter((item) => {
      const statusOk = this.statusFilter() === 'all' || item.status === this.statusFilter();
      if (!statusOk) return false;
      if (!term) return true;
      const haystack = [
        item.leaveType?.typeName,
        item.reason,
        item.status,
        item.startDate,
        item.endDate,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  });
  readonly monthLabel = computed(() =>
    this.monthCursor().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
  );
  readonly calendarDays = computed<CalendarCell[]>(() => {
    const base = this.monthCursor();
    const year = base.getFullYear();
    const month = base.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leading = firstDay.getDay();
    const total = lastDay.getDate();
    const cells: CalendarCell[] = [];
    for (let i = 0; i < leading; i += 1) {
      cells.push({ day: null, iso: null, requests: [] });
    }
    for (let day = 1; day <= total; day += 1) {
      const iso = new Date(year, month, day).toISOString().slice(0, 10);
      const requests = this.requests().filter((item) => item.startDate <= iso && item.endDate >= iso);
      cells.push({ day, iso, requests });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, iso: null, requests: [] });
    }
    return cells;
  });

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      requests: this.leaveService.getLeaveHistory(),
      balances: this.leaveService.getLeaveBalances(new Date().getFullYear()),
    }).subscribe({
      next: ({ requests, balances }) => {
        this.requests.set(requests);
        this.balances.set(balances);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.show('Unable to load your leave data right now.', 'error');
        this.loading.set(false);
      },
    });
  }

  statusBadge(status: LeaveRequest['status']): string {
    const map: Record<LeaveRequest['status'], string> = {
      pending: 'bg-amber-50 text-amber-700',
      approved: 'bg-emerald-50 text-emerald-700',
      rejected: 'bg-rose-50 text-rose-700',
      cancelled: 'bg-slate-100 text-slate-600',
    };
    return map[status];
  }

  cancelLeave(item: LeaveRequest): void {
    if (item.status !== 'pending') return;
    this.leaveService.withdrawLeave(item.id).subscribe({
      next: () => {
        this.toastService.show('Leave request cancelled successfully.', 'success');
        this.load();
      },
      error: () => this.toastService.show('Unable to cancel this leave request.', 'error'),
    });
  }

  openShortcut(kind: 'short-day' | 'under-time' | 'wfh' | 'outdoor-duty'): void {
    this.router.navigate(['/self-service/requests/leave'], {
      queryParams: {
        source: 'self-service-leave',
        requestKind: kind,
      },
    });
  }
}
