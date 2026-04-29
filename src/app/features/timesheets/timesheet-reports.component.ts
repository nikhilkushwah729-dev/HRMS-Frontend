import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TimesheetFilters, TimesheetReportResponse, TimesheetService } from '../../core/services/timesheet.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-timesheet-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <section class="rounded-md border border-slate-200 bg-white p-5 sm:p-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-violet-600">Timesheet Reports</p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900">Project and Employee Hours Report</h1>
            <p class="mt-2 text-sm text-slate-600">Track monthly summary, billable versus non-billable effort, and export scoped report data for payroll or project review.</p>
          </div>
          <div class="flex flex-wrap gap-3">
            <a routerLink="/timesheet" class="rounded-md border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Timesheet Module</a>
            <button type="button" (click)="exportEntries()" class="rounded-md bg-violet-600 px-4 py-3 text-sm font-bold text-white hover:bg-violet-700">Export CSV</button>
          </div>
        </div>
      </section>

      <section class="rounded-md border border-slate-200 bg-white p-5 sm:p-6">
        <form [formGroup]="filtersForm" class="grid gap-4 lg:grid-cols-5">
          <input class="app-field" type="date" formControlName="startDate" />
          <input class="app-field" type="date" formControlName="endDate" />
          <input class="app-field" type="text" formControlName="department" placeholder="Department" />
          <input class="app-field" type="text" formControlName="clientName" placeholder="Client" />
          <button type="button" (click)="loadReports()" class="rounded-md bg-violet-600 px-4 py-3 text-sm font-bold text-white hover:bg-violet-700">Load Report</button>
        </form>
      </section>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article class="rounded-md border border-slate-200 bg-white p-5">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Entries</p>
          <p class="mt-3 text-3xl font-black text-slate-900">{{ report().summary.totalEntries }}</p>
        </article>
        <article class="rounded-md border border-slate-200 bg-white p-5">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Total Hours</p>
          <p class="mt-3 text-3xl font-black text-slate-900">{{ report().summary.totalHours | number:'1.0-2' }}h</p>
        </article>
        <article class="rounded-md border border-emerald-200 bg-emerald-50/60 p-5">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Billable</p>
          <p class="mt-3 text-3xl font-black text-emerald-700">{{ report().summary.billableHours | number:'1.0-2' }}h</p>
        </article>
        <article class="rounded-md border border-slate-200 bg-white p-5">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Non Billable</p>
          <p class="mt-3 text-3xl font-black text-slate-900">{{ report().summary.nonBillableHours | number:'1.0-2' }}h</p>
        </article>
        <article class="rounded-md border border-amber-200 bg-amber-50/60 p-5">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">Pending</p>
          <p class="mt-3 text-3xl font-black text-amber-700">{{ report().summary.pendingEntries }}</p>
        </article>
      </section>

      <section class="grid gap-6 xl:grid-cols-2">
        <div class="rounded-md border border-slate-200 bg-white">
          <div class="border-b border-slate-200 p-5">
            <h2 class="text-lg font-black text-slate-900">Project-wise Hours</h2>
          </div>
          <div class="divide-y divide-slate-100">
            @for (row of report().byProject; track row.projectName) {
              <div class="flex items-center justify-between gap-4 p-4">
                <div class="min-w-0">
                  <p class="truncate font-semibold text-slate-900">{{ row.projectName || 'Unassigned' }}</p>
                  <p class="mt-1 text-xs text-slate-500">Billable {{ row.billableHours | number:'1.0-2' }}h • Non billable {{ row.nonBillableHours | number:'1.0-2' }}h</p>
                </div>
                <p class="text-lg font-black text-slate-900">{{ row.hours | number:'1.0-2' }}h</p>
              </div>
            } @empty {
              <div class="p-10 text-center text-sm text-slate-500">No project hours available for the selected period.</div>
            }
          </div>
        </div>

        <div class="rounded-md border border-slate-200 bg-white">
          <div class="border-b border-slate-200 p-5">
            <h2 class="text-lg font-black text-slate-900">Employee-wise Hours</h2>
          </div>
          <div class="divide-y divide-slate-100">
            @for (row of report().byEmployee; track row.employeeName + '-' + row.employeeCode) {
              <div class="flex items-center justify-between gap-4 p-4">
                <div class="min-w-0">
                  <p class="truncate font-semibold text-slate-900">{{ row.employeeName || 'Employee' }}</p>
                  <p class="mt-1 text-xs text-slate-500">{{ row.employeeCode || 'No code' }} • Billable {{ row.billableHours | number:'1.0-2' }}h</p>
                </div>
                <p class="text-lg font-black text-slate-900">{{ row.hours | number:'1.0-2' }}h</p>
              </div>
            } @empty {
              <div class="p-10 text-center text-sm text-slate-500">No employee data available for the selected period.</div>
            }
          </div>
        </div>
      </section>

      <section class="rounded-md border border-slate-200 bg-white">
        <div class="border-b border-slate-200 p-5">
          <h2 class="text-lg font-black text-slate-900">Detailed Entries</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Employee</th>
                <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Date</th>
                <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Project</th>
                <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Hours</th>
                <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (entry of report().entries; track entry.id) {
                <tr class="hover:bg-slate-50/70">
                  <td class="px-4 py-4">
                    <p class="font-semibold text-slate-900">{{ entry.employeeName }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ entry.employeeCode || 'No code' }}</p>
                  </td>
                  <td class="px-4 py-4 font-semibold text-slate-700">{{ entry.workDate | date:'dd MMM yyyy' }}</td>
                  <td class="px-4 py-4">
                    <p class="font-semibold text-slate-900">{{ entry.projectName || 'General Worklog' }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ entry.clientName || entry.taskName || 'No client / task' }}</p>
                  </td>
                  <td class="px-4 py-4 font-semibold text-slate-700">{{ entry.totalHours | number:'1.0-2' }}h</td>
                  <td class="px-4 py-4">
                    <span [class]="badgeClass(entry.status)" class="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
                      {{ entry.status.replace('_', ' ') }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-4 py-16 text-center text-sm text-slate-500">No detailed entries available for the selected period.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
})
export class TimesheetReportsComponent {
  private timesheetService = inject(TimesheetService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  readonly filtersForm = this.fb.group({
    startDate: [''],
    endDate: [''],
    department: [''],
    clientName: [''],
  });

  readonly report = signal<TimesheetReportResponse>({
    summary: {
      totalEntries: 0,
      totalHours: 0,
      billableHours: 0,
      nonBillableHours: 0,
      approvedEntries: 0,
      pendingEntries: 0,
    },
    byProject: [],
    byEmployee: [],
    entries: [],
  });

  constructor() {
    this.loadReports();
  }

  loadReports(): void {
    const filters = this.filtersForm.getRawValue() as TimesheetFilters;
    this.timesheetService.getReports(filters).subscribe({
      next: (data) => this.report.set(data),
      error: () => {
        this.toastService.error('Unable to load timesheet reports.');
      },
    });
  }

  exportEntries(): void {
    const rows = [
      ['Employee', 'Code', 'Date', 'Project', 'Client', 'Hours', 'Billable', 'Status'],
      ...this.report().entries.map((entry) => [
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
    anchor.download = 'timesheet-reports.csv';
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
}
