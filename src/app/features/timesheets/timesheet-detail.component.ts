import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { TimesheetRecord, TimesheetService } from '../../core/services/timesheet.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-timesheet-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <section class="rounded-md border border-slate-200 bg-white p-5 sm:p-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-violet-600">Timesheet Review</p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900">Review Timesheet</h1>
            <p class="mt-2 text-sm text-slate-600">Approve, reject, send back, or lock approved timesheets. Every action is written to audit history.</p>
          </div>
          <div class="flex flex-wrap gap-3">
            <a routerLink="/timesheet" class="rounded-md border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Back to Timesheet Module</a>
          </div>
        </div>
      </section>

      @if (!canManage()) {
        <section class="rounded-md border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          You do not have approval access for this module.
        </section>
      } @else {
        @if (record(); as item) {
        <div class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section class="rounded-md border border-slate-200 bg-white p-5 sm:p-6">
            <div class="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 class="text-xl font-black text-slate-900">{{ item.employeeName }}</h2>
                <p class="mt-1 text-sm text-slate-500">{{ item.employeeCode || 'No code' }}{{ item.department ? ' • ' + item.department : '' }}{{ item.designation ? ' • ' + item.designation : '' }}</p>
              </div>
              <span [class]="badgeClass(item.status)" class="rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.2em]">
                {{ statusLabel(item.status) }}
              </span>
            </div>

            <div class="mt-5 grid gap-4 md:grid-cols-2">
              <div class="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Work Date</p>
                <p class="mt-2 text-lg font-black text-slate-900">{{ item.workDate | date:'dd MMM yyyy' }}</p>
              </div>
              <div class="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Hours</p>
                <p class="mt-2 text-lg font-black text-slate-900">{{ item.totalHours | number:'1.0-2' }}h</p>
              </div>
              <div class="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Project / Task</p>
                <p class="mt-2 text-base font-bold text-slate-900">{{ item.projectName || 'General Worklog' }}</p>
                <p class="mt-1 text-sm text-slate-500">{{ item.taskName || 'No task linked' }}</p>
              </div>
              <div class="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Client / Billing</p>
                <p class="mt-2 text-base font-bold text-slate-900">{{ item.clientName || 'No client linked' }}</p>
                <p class="mt-1 text-sm text-slate-500">{{ item.isBillable ? 'Billable hours' : 'Non billable hours' }}</p>
              </div>
            </div>

            <div class="mt-5 rounded-md border border-slate-200 bg-white p-4">
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Description</p>
              <p class="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{{ item.description || 'No description provided' }}</p>
            </div>

            <div class="mt-5 rounded-md border border-slate-200 bg-white p-4">
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Attendance / Approval Snapshot</p>
              <div class="mt-3 grid gap-3 md:grid-cols-2 text-sm text-slate-600">
                <p><span class="font-bold text-slate-900">Submitted:</span> {{ item.submittedAt ? (item.submittedAt | date:'dd MMM yyyy, hh:mm a') : 'Not submitted' }}</p>
                <p><span class="font-bold text-slate-900">Reviewed:</span> {{ item.reviewedAt ? (item.reviewedAt | date:'dd MMM yyyy, hh:mm a') : 'Not reviewed' }}</p>
                <p><span class="font-bold text-slate-900">Locked:</span> {{ item.lockedAt ? (item.lockedAt | date:'dd MMM yyyy, hh:mm a') : 'No' }}</p>
                <p><span class="font-bold text-slate-900">Review Note:</span> {{ item.reviewNote || 'No review note' }}</p>
              </div>
            </div>
          </section>

          <section class="space-y-6">
            <div class="rounded-md border border-slate-200 bg-white p-5 sm:p-6">
              <h2 class="text-lg font-black text-slate-900">Review Action</h2>
              <p class="mt-2 text-sm text-slate-500">Comment is stored with approval or rejection history.</p>

              <textarea [(ngModel)]="reviewNote" class="app-field mt-4 min-h-[140px]" placeholder="Add review comment, rejection reason, or send-back instruction"></textarea>

              <div class="mt-5 grid gap-3">
                <button type="button" (click)="review('approve')" [disabled]="processing()" class="rounded-md bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">Approve</button>
                <button type="button" (click)="review('send_back')" [disabled]="processing()" class="rounded-md bg-orange-600 px-4 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-60">Send Back for Correction</button>
                <button type="button" (click)="review('reject')" [disabled]="processing()" class="rounded-md bg-rose-600 px-4 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60">Reject</button>
                @if (item.status === 'approved') {
                  <button type="button" (click)="review('lock')" [disabled]="processing()" class="rounded-md border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Lock Approved Timesheet</button>
                }
              </div>
            </div>

            <div class="rounded-md border border-slate-200 bg-white p-5 sm:p-6">
              <h2 class="text-lg font-black text-slate-900">Approval Timeline</h2>
              <div class="mt-4 space-y-4">
                @for (entry of item.timeline; track entry.createdAt + '-' + entry.action) {
                  <div class="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p class="text-sm font-bold text-slate-900">{{ entry.action.replace('_', ' ') }}</p>
                      <p class="text-xs text-slate-500">{{ entry.createdAt ? (entry.createdAt | date:'dd MMM yyyy, hh:mm a') : '--' }}</p>
                    </div>
                    <p class="mt-2 text-sm text-slate-600">{{ entry.note || 'No note recorded' }}</p>
                    <p class="mt-2 text-xs text-slate-500">By {{ entry.actorName || 'System' }}</p>
                  </div>
                } @empty {
                  <p class="text-sm text-slate-500">No approval actions have been recorded yet.</p>
                }
              </div>
            </div>
          </section>
        </div>
        }
      }
    </div>
  `,
})
export class TimesheetDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);
  private timesheetService = inject(TimesheetService);
  private toastService = inject(ToastService);

  readonly currentUser = signal(this.authService.getStoredUser());
  readonly record = signal<TimesheetRecord | null>(null);
  readonly processing = signal(false);

  reviewNote = '';

  constructor() {
    if (this.canManage()) {
      this.loadDetail();
    }
  }

  canManage(): boolean {
    return this.permissionService.isManagerialUser(this.currentUser());
  }

  loadDetail(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/timesheet']);
      return;
    }
    this.timesheetService.getApprovalDetail(id).subscribe({
      next: (item) => {
        if (!item) {
          this.toastService.error('Timesheet not found.');
          this.router.navigate(['/timesheet']);
          return;
        }
        this.record.set(item);
        this.reviewNote = item.reviewNote || '';
      },
      error: () => {
        this.toastService.error('Unable to load timesheet detail.');
        this.router.navigate(['/timesheet']);
      },
    });
  }

  review(action: 'approve' | 'reject' | 'send_back' | 'lock'): void {
    const item = this.record();
    if (!item) return;
    this.processing.set(true);
    this.timesheetService.reviewTimesheet(item.id, {
      action,
      note: this.reviewNote,
    }).subscribe({
      next: (updated) => {
        this.record.set(updated);
        this.reviewNote = updated.reviewNote || this.reviewNote;
        this.toastService.success(`Timesheet ${action.replace('_', ' ')} completed.`);
      },
      error: (error) => this.toastService.error(error?.error?.message || 'Unable to process review action.'),
      complete: () => this.processing.set(false),
    });
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
