import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LeaveRequest, LeaveService } from '../../core/services/leave.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-approval-center-leave',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 sm:p-5">
      <div class="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-4">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-[2rem] font-medium tracking-tight text-slate-900">{{ viewTitle() }}</h2>
        </div>
      </div>

      <div class="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div class="relative w-full xl:max-w-sm">
          <svg class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="9" cy="9" r="6"></circle>
            <path d="M14 14l4 4"></path>
          </svg>
          <input
            [(ngModel)]="searchTerm"
            type="text"
            [placeholder]="searchPlaceholder()"
            class="h-11 w-full rounded-md border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white"
          />
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              (click)="shiftWindow(-90)"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
            >
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5l-5 5 5 5"></path></svg>
            </button>

            <div class="inline-flex min-h-10 items-center px-4 text-sm font-medium text-slate-700">
              {{ formatDate(rangeStart()) }} - {{ formatDate(rangeEnd()) }}
            </div>

            <button
              type="button"
              (click)="shiftWindow(90)"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
            >
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 5l5 5-5 5"></path></svg>
            </button>
          </div>

          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-emerald-600 hover:bg-emerald-50"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 3v8"></path><path d="m7 8 3 3 3-3"></path><path d="M4 14v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2"></path></svg>
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Filter
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h12"></path><path d="M7 10h6"></path><path d="M9 15h2"></path></svg>
          </button>

          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-emerald-600 hover:bg-emerald-50"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 4v12"></path><path d="M13 4v12"></path><path d="M4 10h12"></path></svg>
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
        <div class="max-h-[560px] overflow-auto">
          <table class="min-w-full">
            <thead class="sticky top-0 bg-white">
              <tr class="border-b border-slate-200 text-left">
                <th class="px-5 py-4 text-sm font-semibold text-slate-800">
                  <button type="button" class="inline-flex items-center gap-2">
                    Employee Code
                    <svg class="h-3.5 w-3.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 5 6.5 8.5h7L10 5Zm0 10 3.5-3.5h-7L10 15Z"/></svg>
                  </button>
                </th>
                <th class="px-5 py-4 text-sm font-semibold text-slate-800">
                  <button type="button" class="inline-flex items-center gap-2">
                    Employee
                    <svg class="h-3.5 w-3.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 5 6.5 8.5h7L10 5Zm0 10 3.5-3.5h-7L10 15Z"/></svg>
                  </button>
                </th>
                <th class="px-5 py-4 text-sm font-semibold text-slate-800">
                  <button type="button" class="inline-flex items-center gap-2">
                    Leave Type
                    <svg class="h-3.5 w-3.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 5 6.5 8.5h7L10 5Zm0 10 3.5-3.5h-7L10 15Z"/></svg>
                  </button>
                </th>
                <th class="px-5 py-4 text-sm font-semibold text-slate-800">
                  <button type="button" class="inline-flex items-center gap-2">
                    Application Date
                    <svg class="h-3.5 w-3.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 5 6.5 8.5h7L10 5Zm0 10 3.5-3.5h-7L10 15Z"/></svg>
                  </button>
                </th>
                <th class="px-5 py-4 text-sm font-semibold text-slate-800">
                  <button type="button" class="inline-flex items-center gap-2">
                    Status
                    <svg class="h-3.5 w-3.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 5 6.5 8.5h7L10 5Zm0 10 3.5-3.5h-7L10 15Z"/></svg>
                  </button>
                </th>
                <th class="px-5 py-4 text-sm font-semibold text-slate-800">
                  <button type="button" class="inline-flex items-center gap-2">
                    Last Approver
                    <svg class="h-3.5 w-3.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 5 6.5 8.5h7L10 5Zm0 10 3.5-3.5h-7L10 15Z"/></svg>
                  </button>
                </th>
                <th class="px-5 py-4 text-center text-sm font-semibold text-slate-800">Action</th>
              </tr>
            </thead>
            <tbody>
              @for (item of filteredRows(); track item.id) {
                <tr class="border-b border-slate-100">
                  <td class="px-5 py-5 text-sm text-slate-700">{{ employeeCode(item) }}</td>
                  <td class="px-5 py-5 text-sm text-slate-700">{{ employeeName(item) }}</td>
                  <td class="px-5 py-5 text-sm text-slate-700">{{ item.leaveType?.typeName || 'Leave' }}</td>
                  <td class="px-5 py-5 text-sm text-slate-700">{{ formatDate(item.createdAt) }}</td>
                  <td class="px-5 py-5">
                    <span [class]="statusClass(item)">{{ statusLabel(item) }}</span>
                  </td>
                  <td class="px-5 py-5 text-sm text-slate-700">{{ lastApprover(item) }}</td>
                  <td class="relative px-5 py-5 text-center">
                    <button
                      type="button"
                      (click)="toggleRowMenu(item.id)"
                      class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    >
                      <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0 4.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0 4.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z"/></svg>
                    </button>
                    @if (openRowId() === item.id) {
                      <div class="absolute z-10 mt-2 w-36 -translate-x-16 rounded-xl border border-slate-200 bg-white p-2 text-left shadow-lg">
                        <button
                          type="button"
                          (click)="updateStatus(item.id, 'approved')"
                          class="block w-full rounded-lg px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          (click)="updateStatus(item.id, 'rejected')"
                          class="block w-full rounded-lg px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
                        >
                          Reject
                        </button>
                      </div>
                    }
                  </td>
                </tr>
              }
              @if (!loading() && filteredRows().length === 0) {
                <tr>
                  <td colspan="7" class="px-5 py-16 text-center text-sm text-slate-500">
                    {{ emptyMessage() }}
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
export class ApprovalCenterLeaveComponent implements OnInit {
  private readonly leaveService = inject(LeaveService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly rows = signal<LeaveRequest[]>([]);
  readonly rangeEnd = signal(this.startOfDay(new Date()));
  readonly rangeStart = signal(this.startOfDay(this.addDays(new Date(), -90)));
  readonly openRowId = signal<number | null>(null);
  readonly viewTitle = signal('Leave');
  readonly searchPlaceholder = signal('Search Leave Approvals');
  readonly emptyMessage = signal('No leave approvals found for the selected window.');
  readonly filterKind = signal<'all' | 'short-day' | 'time-off'>('all');
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
      .filter((item) => item.employeeId !== this.currentEmployeeId)
      .filter((item) => this.matchesRouteFilter(item))
      .filter((item) => {
        const created = this.startOfDay(new Date(item.createdAt)).getTime();
        return created >= start && created <= end;
      })
      .filter((item) => {
        if (!query) return true;
        const haystack = [
          this.employeeCode(item),
          this.employeeName(item),
          item.leaveType?.typeName,
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
    this.applyRouteConfig();
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
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

  toggleRowMenu(id: number): void {
    this.openRowId.set(this.openRowId() === id ? null : id);
  }

  updateStatus(id: number, status: string): void {
    this.openRowId.set(null);
    let rejectionNote: string | undefined;
    if (status === 'rejected') {
      rejectionNote =
        prompt('Please enter a reason for rejection (optional):') || undefined;
    }

    if (confirm(`Are you sure you want to ${status} this leave request?`)) {
      this.leaveService.updateLeaveStatus(id, status, rejectionNote).subscribe({
        next: () => {
          this.toastService.show(
            `Leave request ${status} successfully.`,
            'success',
          );
          this.loadData();
        },
        error: () => {
          this.toastService.show(
            `Failed to ${status} leave request. Please try again.`,
            'error',
          );
        },
      });
    }
  }

  employeeCode(item: LeaveRequest): string {
    const employee = item.employee as LeaveRequest['employee'] & {
      employeeCode?: string;
      employee_code?: string;
      code?: string;
    };
    return (
      employee?.employeeCode ||
      employee?.employee_code ||
      employee?.code ||
      (employee?.id
        ? `EMP${String(employee.id).padStart(5, '0')}`
        : `EMP${String(item.employeeId).padStart(5, '0')}`)
    );
  }

  employeeName(item: LeaveRequest): string {
    return (
      item.employee?.fullName ||
      [item.employee?.firstName, item.employee?.lastName]
        .filter(Boolean)
        .join(' ') ||
      'Employee'
    );
  }

  lastApprover(item: LeaveRequest): string {
    if (item.cancelledAt) {
      return 'Employee';
    }
    if (item.status === 'approved' || item.status === 'rejected') {
      return 'HR Manager';
    }
    return 'Manager / HR';
  }

  statusLabel(item: LeaveRequest): string {
    if (item.status === 'cancelled') return 'Withdrawn';
    if (item.status === 'pending') {
      const managerName =
        item.employee?.manager?.fullName ||
        [item.employee?.manager?.firstName, item.employee?.manager?.lastName]
          .filter(Boolean)
          .join(' ');
      return managerName ? `Pending at ${managerName}` : 'Pending at Hr Manager';
    }
    return item.status.charAt(0).toUpperCase() + item.status.slice(1);
  }

  statusClass(item: LeaveRequest): string {
    const base = 'inline-flex rounded-full px-3 py-1 text-sm font-medium ';
    switch (item.status) {
      case 'approved':
        return `${base} bg-emerald-100 text-emerald-700`;
      case 'cancelled':
        return `${base} bg-violet-100 text-violet-700`;
      case 'rejected':
        return `${base} bg-rose-100 text-rose-700`;
      default:
        return `${base} bg-amber-100 text-amber-800`;
    }
  }

  formatDate(value: string | Date): string {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  private applyRouteConfig(): void {
    const data = this.route.snapshot.data;
    this.viewTitle.set(data['title'] || 'Leave');
    this.searchPlaceholder.set(
      data['searchPlaceholder'] || 'Search Leave Approvals',
    );
    this.emptyMessage.set(
      data['emptyMessage'] ||
        'No leave approvals found for the selected window.',
    );
    this.filterKind.set(data['filterKind'] || 'all');
  }

  private matchesRouteFilter(item: LeaveRequest): boolean {
    const typeName = String(item.leaveType?.typeName || '').toLowerCase();
    if (this.filterKind() === 'short-day') {
      return typeName.includes('short day') || typeName.includes('short-day');
    }
    if (this.filterKind() === 'time-off') {
      return (
        typeName.includes('time off') ||
        typeName.includes('time-off') ||
        typeName.includes('timeoff')
      );
    }

    return (
      !typeName.includes('short day') &&
      !typeName.includes('short-day') &&
      !typeName.includes('time off') &&
      !typeName.includes('time-off') &&
      !typeName.includes('timeoff')
    );
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
