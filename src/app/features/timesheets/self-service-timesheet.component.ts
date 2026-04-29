import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TimesheetRecord, TimesheetService } from '../../core/services/timesheet.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-self-service-timesheet',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <section class="rounded-md border border-slate-200 bg-white p-5 sm:p-6">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-violet-600">Self Service Timesheet</p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">My Timesheet</h1>
            <p class="mt-3 text-sm leading-6 text-slate-600">
              Fill daily or weekly worklogs, save drafts, submit for approval, and track only your own timesheet history.
            </p>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row">
            <a
              routerLink="/self-service/timesheet/create"
              class="inline-flex items-center justify-center rounded-md bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700"
            >
              Create Timesheet
            </a>
          </div>
        </div>
      </section>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article class="rounded-md border border-slate-200 bg-white p-5">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">This Week</p>
          <p class="mt-3 text-3xl font-black text-slate-900">{{ weeklyTotalHours() | number:'1.0-2' }}h</p>
          <p class="mt-2 text-sm text-slate-500">Weekly total hours from your current work week.</p>
        </article>
        <article class="rounded-md border border-slate-200 bg-white p-5">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Draft</p>
          <p class="mt-3 text-3xl font-black text-slate-900">{{ draftCount() }}</p>
          <p class="mt-2 text-sm text-slate-500">Entries saved but not yet submitted.</p>
        </article>
        <article class="rounded-md border border-amber-200 bg-amber-50/60 p-5">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">Pending</p>
          <p class="mt-3 text-3xl font-black text-amber-700">{{ pendingCount() }}</p>
          <p class="mt-2 text-sm text-amber-700/80">Submitted timesheets waiting for review.</p>
        </article>
        <article class="rounded-md border border-emerald-200 bg-emerald-50/60 p-5">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Approved</p>
          <p class="mt-3 text-3xl font-black text-emerald-700">{{ approvedCount() }}</p>
          <p class="mt-2 text-sm text-emerald-700/80">Approved and locked worklogs.</p>
        </article>
      </section>

      <section class="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div class="rounded-md border border-slate-200 bg-white">
          <div class="border-b border-slate-200 p-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 class="text-lg font-black text-slate-900">Weekly Calendar View</h2>
                <p class="mt-1 text-sm text-slate-500">A quick view of your current week entries and total effort.</p>
              </div>
              <div class="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                {{ weekLabel() }}
              </div>
            </div>
          </div>

          <div class="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-7">
            @for (day of currentWeekCards(); track day.date) {
              <div class="rounded-md border border-slate-200 bg-slate-50 p-4 min-w-0">
                <p class="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">{{ day.label }}</p>
                <p class="mt-2 text-lg font-black text-slate-900">{{ day.totalHours | number:'1.0-2' }}h</p>
                <p class="mt-2 text-xs text-slate-500">{{ day.entries }} entr{{ day.entries === 1 ? 'y' : 'ies' }}</p>
                @if (day.statuses.length) {
                  <div class="mt-3 flex flex-wrap gap-2">
                    @for (status of day.statuses; track status) {
                      <span [class]="badgeClass(status)" class="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
                        {{ statusLabel(status) }}
                      </span>
                    }
                  </div>
                } @else {
                  <p class="mt-3 text-xs text-slate-400">No entry</p>
                }
              </div>
            }
          </div>
        </div>

        <div class="rounded-md border border-slate-200 bg-white p-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-black text-slate-900">Upcoming Actions</h2>
              <p class="mt-1 text-sm text-slate-500">Fast actions for your current cycle.</p>
            </div>
          </div>

          <div class="mt-5 space-y-3">
            <a routerLink="/self-service/timesheet/create" class="flex items-center justify-between rounded-md border border-slate-200 px-4 py-4 transition hover:border-violet-300 hover:bg-violet-50/60">
              <div>
                <p class="text-sm font-bold text-slate-900">Add daily work entry</p>
                <p class="mt-1 text-xs text-slate-500">Create a new draft or submitted entry.</p>
              </div>
              <span class="text-violet-600">Open</span>
            </a>

            <div class="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p class="text-sm font-bold text-slate-900">Approval health</p>
              <p class="mt-2 text-sm text-slate-600">
                {{ pendingCount() > 0 ? pendingCount() + ' timesheet(s) are pending review.' : 'No pending approvals on your side right now.' }}
              </p>
            </div>

            <div class="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p class="text-sm font-bold text-slate-900">Weekly total</p>
              <p class="mt-2 text-sm text-slate-600">
                {{ weeklyTotalHours() | number:'1.0-2' }} hours recorded in the current week.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-md border border-slate-200 bg-white">
        <div class="border-b border-slate-200 p-5">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 class="text-lg font-black text-slate-900">My Timesheet History</h2>
              <p class="mt-1 text-sm text-slate-500">Draft, submitted, approved, and rejected entries.</p>
            </div>
            <button
              type="button"
              (click)="loadTimesheets()"
              class="inline-flex items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Date</th>
                <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Project / Task</th>
                <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Hours</th>
                <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Billable</th>
                <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Status</th>
                <th class="px-4 py-3 text-left font-bold uppercase tracking-[0.2em] text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (entry of entries(); track entry.id) {
                <tr class="hover:bg-slate-50/80">
                  <td class="px-4 py-4 font-semibold text-slate-700">{{ entry.workDate | date:'dd MMM yyyy' }}</td>
                  <td class="px-4 py-4">
                    <p class="font-semibold text-slate-900">{{ entry.projectName || 'General Worklog' }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ entry.taskName || entry.clientName || entry.description || 'No description added' }}</p>
                  </td>
                  <td class="px-4 py-4 font-semibold text-slate-700">{{ entry.totalHours | number:'1.0-2' }}h</td>
                  <td class="px-4 py-4">
                    <span class="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]" [class]="entry.isBillable ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'">
                      {{ entry.isBillable ? 'Billable' : 'Non Billable' }}
                    </span>
                  </td>
                  <td class="px-4 py-4">
                    <span [class]="badgeClass(entry.status)" class="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
                      {{ statusLabel(entry.status) }}
                    </span>
                  </td>
                  <td class="px-4 py-4">
                    <button
                      type="button"
                      (click)="openDetail(entry.id)"
                      class="font-bold text-violet-600 transition hover:text-violet-700"
                    >
                      View
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-4 py-16 text-center text-sm text-slate-500">
                    No timesheet entries found yet. Start by creating your first worklog.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
})
export class SelfServiceTimesheetComponent {
  private timesheetService = inject(TimesheetService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  readonly entries = signal<TimesheetRecord[]>([]);

  readonly weeklyTotalHours = computed(() =>
    this.entries()
      .filter((entry) => this.isCurrentWeek(entry.workDate))
      .reduce((sum, entry) => sum + Number(entry.totalHours || 0), 0),
  );

  readonly draftCount = computed(() => this.entries().filter((entry) => entry.status === 'draft').length);
  readonly pendingCount = computed(() => this.entries().filter((entry) => entry.status === 'pending').length);
  readonly approvedCount = computed(() =>
    this.entries().filter((entry) => entry.status === 'approved' || entry.status === 'locked').length,
  );

  readonly currentWeekCards = computed(() => {
    const start = this.startOfWeek(new Date());
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const iso = this.toIso(date);
      const dayEntries = this.entries().filter((entry) => entry.workDate === iso);
      return {
        date: iso,
        label: date.toLocaleDateString('en-IN', { weekday: 'short' }),
        totalHours: dayEntries.reduce((sum, entry) => sum + Number(entry.totalHours || 0), 0),
        entries: dayEntries.length,
        statuses: Array.from(new Set(dayEntries.map((entry) => entry.status))),
      };
    });
  });

  readonly weekLabel = computed(() => {
    const start = this.startOfWeek(new Date());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;
  });

  constructor() {
    this.loadTimesheets();
  }

  loadTimesheets(): void {
    this.timesheetService.getTimesheets().subscribe({
      next: (items) => this.entries.set(items),
      error: () => {
        this.entries.set([]);
        this.toastService.error('Unable to load timesheets.');
      },
    });
  }

  openDetail(id: number): void {
    this.router.navigate(['/self-service/timesheet', id]);
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

  private isCurrentWeek(value: string): boolean {
    const date = new Date(value);
    const start = this.startOfWeek(new Date());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return date >= start && date <= end;
  }

  private startOfWeek(value: Date): Date {
    const date = new Date(value);
    const diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  private toIso(date: Date): string {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  }
}
