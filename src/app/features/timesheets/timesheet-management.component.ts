import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { TimesheetFilters, TimesheetRecord, TimesheetService } from '../../core/services/timesheet.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-timesheet-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <section class="rounded-md border border-slate-200 bg-white p-5 sm:p-6">
        <div class="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div class="max-w-3xl">
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-violet-600">Admin / Manager Timesheet</p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Timesheet Management</h1>
            <p class="mt-3 text-sm leading-6 text-slate-600">
              Review all scoped timesheets, compare team effort, monitor pending approvals, and export timesheet data for reporting.
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <a routerLink="/timesheet/pending" class="inline-flex items-center justify-center rounded-md border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Pending Queue
            </a>
            <a routerLink="/timesheet/reports" class="inline-flex items-center justify-center rounded-md bg-violet-600 px-4 py-3 text-sm font-bold text-white hover:bg-violet-700">
              View Reports
            </a>
          </div>
        </div>
      </section>

      @if (!canManage()) {
        <section class="rounded-md border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          This workspace is reserved for managers, HR, and admins. You currently do not have approval scope for organization timesheets.
        </section>
      } @else {
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article class="rounded-md border border-slate-200 bg-white p-5">
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Entries</p>
            <p class="mt-3 text-3xl font-black text-slate-900">{{ entries().length }}</p>
          </article>
          <article class="rounded-md border border-slate-200 bg-white p-5">
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Pending</p>
            <p class="mt-3 text-3xl font-black text-amber-700">{{ pendingCount() }}</p>
          </article>
          <article class="rounded-md border border-slate-200 bg-white p-5">
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Approved</p>
            <p class="mt-3 text-3xl font-black text-emerald-700">{{ approvedCount() }}</p>
          </article>
          <article class="rounded-md border border-slate-200 bg-white p-5">
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Billable Hours</p>
            <p class="mt-3 text-3xl font-black text-slate-900">{{ billableHours() | number:'1.0-2' }}h</p>
          </article>
        </section>

        <section class="rounded-md border border-slate-200 bg-white p-5 sm:p-6">
          <form [formGroup]="filtersForm" class="grid gap-4 lg:grid-cols-6">
            <input class="app-field lg:col-span-2" type="text" formControlName="employeeId" placeholder="Employee ID" />
            <input class="app-field" type="text" formControlName="projectId" placeholder="Project ID" />
            <input class="app-field" type="text" formControlName="clientName" placeholder="Client" />
            <select class="app-field" formControlName="status">
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="sent_back">Sent Back</option>
              <option value="locked">Locked</option>
            </select>
            <input class="app-field" type="text" formControlName="department" placeholder="Department" />
            <input class="app-field" type="date" formControlName="startDate" />
            <input class="app-field" type="date" formControlName="endDate" />
            <div class="lg:col-span-6 flex flex-wrap gap-3">
              <button type="button" (click)="loadEntries()" class="rounded-md bg-violet-600 px-4 py-3 text-sm font-bold text-white hover:bg-violet-700">Apply Filters</button>
              <button type="button" (click)="resetFilters()" class="rounded-md border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Reset</button>
              <button type="button" (click)="exportCsv()" class="rounded-md border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Export CSV</button>
            </div>
          </form>
        </section>

        <section class="rounded-md border border-slate-200 bg-white">
          <div class="border-b border-slate-200 p-5">
            <h2 class="text-lg font-black text-slate-900">Approval and Monitoring Table</h2>
            <p class="mt-1 text-sm text-slate-500">Manager scope is limited to team data. HR/Admin can see all organization timesheets within permission scope.</p>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Employee</th>
                  <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Work Date</th>
                  <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Project / Client</th>
                  <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Hours</th>
                  <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Status</th>
                  <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (entry of entries(); track entry.id) {
                  <tr class="hover:bg-slate-50/70">
                    <td class="px-4 py-4">
                      <p class="font-semibold text-slate-900">{{ entry.employeeName }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ entry.employeeCode || 'No code' }}{{ entry.department ? ' • ' + entry.department : '' }}</p>
                    </td>
                    <td class="px-4 py-4 font-semibold text-slate-700">{{ entry.workDate | date:'dd MMM yyyy' }}</td>
                    <td class="px-4 py-4">
                      <p class="font-semibold text-slate-900">{{ entry.projectName || 'General Worklog' }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ entry.clientName || entry.taskName || 'No client / task' }}</p>
                    </td>
                    <td class="px-4 py-4 font-semibold text-slate-700">{{ entry.totalHours | number:'1.0-2' }}h</td>
                    <td class="px-4 py-4">
                      <span [class]="badgeClass(entry.status)" class="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
                        {{ statusLabel(entry.status) }}
                      </span>
                    </td>
                    <td class="px-4 py-4">
                      <button type="button" (click)="openDetail(entry.id)" class="font-bold text-violet-600 hover:text-violet-700">Review</button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="px-4 py-16 text-center text-sm text-slate-500">No scoped timesheets found for the selected filters.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>
  `,
})
export class TimesheetManagementComponent {
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);
  private timesheetService = inject(TimesheetService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  readonly currentUser = signal(this.authService.getStoredUser());
  readonly entries = signal<TimesheetRecord[]>([]);

  readonly filtersForm = this.fb.group({
    employeeId: [''],
    projectId: [''],
    clientName: [''],
    department: [''],
    status: [''],
    startDate: [''],
    endDate: [''],
  });

  readonly pendingCount = computed(() => this.entries().filter((entry) => entry.status === 'pending').length);
  readonly approvedCount = computed(() =>
    this.entries().filter((entry) => entry.status === 'approved' || entry.status === 'locked').length,
  );
  readonly billableHours = computed(() =>
    this.entries()
      .filter((entry) => entry.isBillable)
      .reduce((sum, entry) => sum + Number(entry.totalHours || 0), 0),
  );

  constructor() {
    if (this.canManage()) {
      this.loadEntries();
    }
  }

  canManage(): boolean {
    return this.permissionService.isManagerialUser(this.currentUser());
  }

  loadEntries(): void {
    const filters = this.filtersForm.getRawValue() as TimesheetFilters;
    this.timesheetService.getApprovalQueue(filters).subscribe({
      next: (items) => this.entries.set(items || []),
      error: () => {
        this.entries.set([]);
        this.toastService.error('Unable to load timesheet approval data.');
      },
    });
  }

  resetFilters(): void {
    this.filtersForm.reset({
      employeeId: '',
      projectId: '',
      clientName: '',
      department: '',
      status: '',
      startDate: '',
      endDate: '',
    });
    this.loadEntries();
  }

  openDetail(id: number): void {
    this.router.navigate(['/timesheet', id]);
  }

  exportCsv(): void {
    const rows = [
      ['Employee', 'Code', 'Work Date', 'Project', 'Client', 'Hours', 'Billable', 'Status'],
      ...this.entries().map((entry) => [
        entry.employeeName,
        entry.employeeCode || '',
        entry.workDate,
        entry.projectName || '',
        entry.clientName || '',
        `${entry.totalHours}`,
        entry.isBillable ? 'Yes' : 'No',
        entry.status,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'timesheet-management.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  badgeClass(status: string): string {
    switch (status) {
      case 'approved':
      case 'locked':
        return 'bg-emerald-50 text-emerald-700';
      case 'pending':
        return 'bg-amber-50 text-amber-700';
      case 'rejected':
        return 'bg-rose-50 text-rose-700';
      case 'sent_back':
        return 'bg-orange-50 text-orange-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }

  statusLabel(status: string): string {
    return status.replace('_', ' ');
  }
}
