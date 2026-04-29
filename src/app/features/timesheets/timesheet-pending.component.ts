import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TimesheetRecord, TimesheetService } from '../../core/services/timesheet.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-timesheet-pending',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <section class="rounded-md border border-slate-200 bg-white p-5 sm:p-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-violet-600">Approval Queue</p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900">Pending Timesheet Approvals</h1>
            <p class="mt-2 text-sm text-slate-600">Review pending entries, bulk approve or reject, and send back records that need corrections.</p>
          </div>
          <div class="flex flex-wrap gap-3">
            <a routerLink="/timesheet" class="rounded-md border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">All Timesheets</a>
            <button type="button" (click)="bulkAction('approve')" [disabled]="!selectedIds().length" class="rounded-md bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">Bulk Approve</button>
            <button type="button" (click)="bulkAction('reject')" [disabled]="!selectedIds().length" class="rounded-md bg-rose-600 px-4 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50">Bulk Reject</button>
          </div>
        </div>
      </section>

      <section class="grid gap-4 md:grid-cols-3">
        <article class="rounded-md border border-amber-200 bg-amber-50/60 p-5">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">Pending Count</p>
          <p class="mt-3 text-3xl font-black text-amber-700">{{ pendingEntries().length }}</p>
        </article>
        <article class="rounded-md border border-slate-200 bg-white p-5">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Selected</p>
          <p class="mt-3 text-3xl font-black text-slate-900">{{ selectedIds().length }}</p>
        </article>
        <article class="rounded-md border border-slate-200 bg-white p-5">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Total Pending Hours</p>
          <p class="mt-3 text-3xl font-black text-slate-900">{{ pendingHours() | number:'1.0-2' }}h</p>
        </article>
      </section>

      <section class="rounded-md border border-slate-200 bg-white">
        <div class="border-b border-slate-200 p-5">
          <h2 class="text-lg font-black text-slate-900">Pending Queue</h2>
          <p class="mt-1 text-sm text-slate-500">Use detail review for notes, or bulk actions for quick resolution.</p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-left"><input type="checkbox" [checked]="allSelected()" (change)="toggleAll($any($event.target).checked)" /></th>
                <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Employee</th>
                <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Date</th>
                <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Project</th>
                <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Hours</th>
                <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Billable</th>
                <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (entry of pendingEntries(); track entry.id) {
                <tr class="hover:bg-slate-50/70">
                  <td class="px-4 py-4"><input type="checkbox" [checked]="selectedIds().includes(entry.id)" (change)="toggleOne(entry.id, $any($event.target).checked)" /></td>
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
                    <span [class]="entry.isBillable ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'" class="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
                      {{ entry.isBillable ? 'Billable' : 'Non Billable' }}
                    </span>
                  </td>
                  <td class="px-4 py-4">
                    <button type="button" (click)="openDetail(entry.id)" class="font-bold text-violet-600 hover:text-violet-700">Review</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="px-4 py-16 text-center text-sm text-slate-500">No pending timesheets available for your approval scope.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
})
export class TimesheetPendingComponent {
  private timesheetService = inject(TimesheetService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  readonly entries = signal<TimesheetRecord[]>([]);
  readonly selectedIds = signal<number[]>([]);

  readonly pendingEntries = computed(() => this.entries().filter((entry) => entry.status === 'pending'));
  readonly pendingHours = computed(() =>
    this.pendingEntries().reduce((sum, entry) => sum + Number(entry.totalHours || 0), 0),
  );
  readonly allSelected = computed(
    () => !!this.pendingEntries().length && this.pendingEntries().every((entry) => this.selectedIds().includes(entry.id)),
  );

  constructor() {
    this.loadQueue();
  }

  loadQueue(): void {
    this.timesheetService.getApprovalQueue({ status: 'pending' }).subscribe({
      next: (items) => {
        this.entries.set(items || []);
        this.selectedIds.set([]);
      },
      error: () => {
        this.entries.set([]);
        this.toastService.error('Unable to load pending queue.');
      },
    });
  }

  toggleAll(checked: boolean): void {
    this.selectedIds.set(checked ? this.pendingEntries().map((entry) => entry.id) : []);
  }

  toggleOne(id: number, checked: boolean): void {
    const current = new Set(this.selectedIds());
    if (checked) current.add(id);
    else current.delete(id);
    this.selectedIds.set(Array.from(current));
  }

  openDetail(id: number): void {
    this.router.navigate(['/timesheet', id]);
  }

  bulkAction(action: 'approve' | 'reject'): void {
    if (!this.selectedIds().length) return;
    const note = window.prompt(`Add ${action === 'approve' ? 'approval' : 'rejection'} note`, '') || '';
    this.timesheetService.bulkReviewTimesheets({
      ids: this.selectedIds(),
      action,
      note,
    }).subscribe({
      next: () => {
        this.toastService.success(`Bulk ${action === 'approve' ? 'approval' : 'rejection'} completed.`);
        this.loadQueue();
      },
      error: () => this.toastService.error('Unable to process bulk action.'),
    });
  }
}
