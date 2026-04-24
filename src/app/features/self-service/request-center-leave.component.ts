import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LeaveRequest, LeaveService } from '../../core/services/leave.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-request-center-leave',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-4 sm:p-5">
      <div class="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div class="relative w-full xl:max-w-sm">
          <svg class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="9" cy="9" r="6"></circle>
            <path d="M14 14l4 4"></path>
          </svg>
          <input
            [(ngModel)]="searchTerm"
            type="text"
            placeholder="Search Leave Request"
            class="h-11 w-full rounded-md border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white"
          />
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            (click)="shiftWindow(-90)"
            class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5l-5 5 5 5"></path></svg>
          </button>

          <div class="inline-flex min-h-10 items-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700">
            {{ formatDate(rangeStart()) }} - {{ formatDate(rangeEnd()) }}
          </div>

          <button
            type="button"
            (click)="shiftWindow(90)"
            class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 5l5 5-5 5"></path></svg>
          </button>

          <button
            type="button"
            (click)="resetWindow()"
            class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-emerald-600 hover:bg-emerald-50"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 10a6 6 0 1 1-1.76-4.24"></path><path d="M16 4v4h-4"></path></svg>
          </button>
        </div>
      </div>

      <div class="overflow-hidden rounded-lg">
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-slate-200 text-left">
                <th class="px-5 py-4 text-sm font-semibold text-slate-800">Leave Type</th>
                <th class="px-5 py-4 text-sm font-semibold text-slate-800">Application Date</th>
                <th class="px-5 py-4 text-sm font-semibold text-slate-800">From</th>
                <th class="px-5 py-4 text-sm font-semibold text-slate-800">To</th>
                <th class="px-5 py-4 text-sm font-semibold text-slate-800">Leave Days</th>
                <th class="px-5 py-4 text-sm font-semibold text-slate-800">Status</th>
                <th class="px-5 py-4 text-center text-sm font-semibold text-slate-800">Action</th>
              </tr>
            </thead>
            <tbody>
              @for (item of filteredRows(); track item.id) {
                <tr class="border-b border-slate-100">
                  <td class="px-5 py-5 text-sm text-slate-700">{{ item.leaveType?.typeName || 'Leave' }}</td>
                  <td class="px-5 py-5 text-sm text-slate-700">{{ formatDate(item.createdAt) }}</td>
                  <td class="px-5 py-5 text-sm text-slate-700">{{ formatDate(item.startDate) }}</td>
                  <td class="px-5 py-5 text-sm text-slate-700">{{ formatDate(item.endDate) }}</td>
                  <td class="px-5 py-5 text-sm text-slate-700">{{ item.totalDays }}</td>
                  <td class="px-5 py-5">
                    <span [class]="statusClass(item.status)">{{ statusLabel(item.status) }}</span>
                  </td>
                  <td class="px-5 py-5 text-center">
                    <button
                      type="button"
                      class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    >
                      <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0 4.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0 4.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z"/></svg>
                    </button>
                  </td>
                </tr>
              }
              @if (!loading() && filteredRows().length === 0) {
                <tr>
                  <td colspan="7" class="px-5 py-16 text-center text-sm text-slate-500">
                    No leave requests found for the selected window.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class RequestCenterLeaveComponent implements OnInit {
  private readonly leaveService = inject(LeaveService);
  private readonly authService = inject(AuthService);

  readonly loading = signal(true);
  readonly rows = signal<LeaveRequest[]>([]);
  readonly rangeEnd = signal(this.startOfDay(new Date()));
  readonly rangeStart = signal(this.startOfDay(this.addDays(new Date(), -90)));
  searchTerm = '';

  private readonly currentEmployeeId = Number(
    this.authService.getStoredUser()?.employeeId ??
      this.authService.getStoredUser()?.id ??
      0,
  );

  readonly filteredRows = computed(() => {
    const query = this.searchTerm.trim().toLowerCase();
    const start = this.rangeStart().getTime();
    const end = this.rangeEnd().getTime();

    return [...this.rows()]
      .filter((item) => item.employeeId === this.currentEmployeeId)
      .filter((item) => {
        const created = this.startOfDay(new Date(item.createdAt)).getTime();
        return created >= start && created <= end;
      })
      .filter((item) => {
        if (!query) return true;
        const haystack = [
          item.leaveType?.typeName,
          item.reason,
          item.status,
          item.startDate,
          item.endDate,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  });

  ngOnInit(): void {
    this.leaveService.getLeaveHistory().subscribe({
      next: (data) => {
        this.rows.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.loading.set(false);
      },
    });
  }

  shiftWindow(days: number): void {
    this.rangeStart.set(this.addDays(this.rangeStart(), days));
    this.rangeEnd.set(this.addDays(this.rangeEnd(), days));
  }

  resetWindow(): void {
    this.rangeEnd.set(this.startOfDay(new Date()));
    this.rangeStart.set(this.startOfDay(this.addDays(new Date(), -90)));
  }

  formatDate(value: string | Date): string {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  statusLabel(status: string): string {
    if (status === 'cancelled') return 'Withdrawn';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  statusClass(status: string): string {
    const base = 'inline-flex rounded-full px-3 py-1 text-sm font-medium ';
    switch (status) {
      case 'approved':
        return `${base} bg-emerald-100 text-emerald-700`;
      case 'cancelled':
        return `${base} bg-violet-100 text-violet-700`;
      case 'rejected':
        return `${base} bg-rose-100 text-rose-700`;
      default:
        return `${base} bg-amber-100 text-amber-700`;
    }
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return this.startOfDay(next);
  }

  private startOfDay(date: Date): Date {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
  }
}
