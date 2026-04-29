import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Project, ProjectService, ProjectTask } from '../../core/services/project.service';
import { TimesheetPayload, TimesheetRecord, TimesheetService } from '../../core/services/timesheet.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-self-service-timesheet-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <section class="rounded-md border border-slate-200 bg-white p-5 sm:p-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-violet-600">Self Service Timesheet</p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900">Timesheet Detail</h1>
            <p class="mt-2 text-sm text-slate-600">Review your worklog, edit before approval, and resubmit if it was sent back or rejected.</p>
          </div>
          <div class="flex flex-wrap gap-3">
            <a routerLink="/self-service/timesheet" class="inline-flex items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Back to My Timesheet
            </a>
            @if (record()) {
              <span [class]="badgeClass(record()!.status)" class="inline-flex items-center rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.2em]">
                {{ statusLabel(record()!.status) }}
              </span>
            }
          </div>
        </div>
      </section>

      @if (record(); as item) {
        <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <form [formGroup]="form" class="rounded-md border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
            <div class="grid gap-5 md:grid-cols-2">
              <div>
                <label class="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Entry Mode</label>
                <select class="app-field" formControlName="entryMode" [disabled]="!canEdit()">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div>
                <label class="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Work Date</label>
                <input class="app-field" type="date" formControlName="workDate" [disabled]="!canEdit()" />
              </div>
            </div>

            <div class="grid gap-5 md:grid-cols-2">
              <div>
                <label class="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Project</label>
                <select class="app-field" formControlName="projectId" (change)="onProjectChange()" [disabled]="!canEdit()">
                  <option [ngValue]="null">Select project</option>
                  @for (project of projects(); track project.id) {
                    <option [ngValue]="project.id">{{ project.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Task</label>
                <select class="app-field" formControlName="taskId" [disabled]="!canEdit()">
                  <option [ngValue]="null">Select task</option>
                  @for (task of tasks(); track task.id) {
                    <option [ngValue]="task.id">{{ task.title }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="grid gap-5 md:grid-cols-2">
              <div>
                <label class="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Client</label>
                <input class="app-field" type="text" formControlName="clientName" [disabled]="!canEdit()" />
              </div>
              <div class="flex items-end">
                <label class="inline-flex items-center gap-3 rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                  <input type="checkbox" formControlName="isBillable" [disabled]="!canEdit()" class="h-4 w-4 rounded border-slate-300 text-violet-600" />
                  Billable entry
                </label>
              </div>
            </div>

            <div class="grid gap-5 md:grid-cols-3">
              <div>
                <label class="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Start Time</label>
                <input class="app-field" type="time" formControlName="startTime" [disabled]="!canEdit()" />
              </div>
              <div>
                <label class="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">End Time</label>
                <input class="app-field" type="time" formControlName="endTime" [disabled]="!canEdit()" />
              </div>
              <div>
                <label class="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Total Hours</label>
                <input class="app-field" type="number" min="0" max="24" step="0.25" formControlName="totalHours" [disabled]="!canEdit()" />
              </div>
            </div>

            <div>
              <label class="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Description</label>
              <textarea class="app-field min-h-[180px]" formControlName="description" [disabled]="!canEdit()"></textarea>
            </div>

            @if (message()) {
              <div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {{ message() }}
              </div>
            }

            @if (canEdit()) {
              <div class="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row">
                <button type="button" (click)="save('draft')" [disabled]="saving()" class="rounded-md border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                  Save Draft
                </button>
                <button type="button" (click)="save('pending')" [disabled]="saving()" class="rounded-md bg-violet-600 px-4 py-3 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-60">
                  {{ item.status === 'pending' ? 'Update Pending Entry' : 'Save and Submit' }}
                </button>
              </div>
            }
          </form>

          <section class="space-y-6">
            <div class="rounded-md border border-slate-200 bg-white p-5 sm:p-6">
              <h2 class="text-lg font-black text-slate-900">Submission Snapshot</h2>
              <div class="mt-4 space-y-3 text-sm text-slate-600">
                <p><span class="font-bold text-slate-900">Employee:</span> {{ item.employeeName }}</p>
                <p><span class="font-bold text-slate-900">Submitted At:</span> {{ item.submittedAt ? (item.submittedAt | date:'dd MMM yyyy, hh:mm a') : 'Not submitted yet' }}</p>
                <p><span class="font-bold text-slate-900">Reviewed At:</span> {{ item.reviewedAt ? (item.reviewedAt | date:'dd MMM yyyy, hh:mm a') : 'Not reviewed yet' }}</p>
                <p><span class="font-bold text-slate-900">Review Note:</span> {{ item.reviewNote || 'No review note available' }}</p>
                <p><span class="font-bold text-slate-900">Locked At:</span> {{ item.lockedAt ? (item.lockedAt | date:'dd MMM yyyy, hh:mm a') : 'Not locked' }}</p>
              </div>
            </div>

            <div class="rounded-md border border-slate-200 bg-white p-5 sm:p-6">
              <h2 class="text-lg font-black text-slate-900">Timeline</h2>
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
                  <p class="text-sm text-slate-500">No audit activity recorded yet.</p>
                }
              </div>
            </div>
          </section>
        </div>
      }
    </div>
  `,
})
export class SelfServiceTimesheetDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private timesheetService = inject(TimesheetService);
  private toastService = inject(ToastService);

  readonly record = signal<TimesheetRecord | null>(null);
  readonly projects = signal<Project[]>([]);
  readonly tasks = signal<ProjectTask[]>([]);
  readonly saving = signal(false);
  readonly message = signal('');

  readonly canEdit = computed(() => {
    const status = this.record()?.status;
    return status === 'draft' || status === 'pending' || status === 'rejected' || status === 'sent_back';
  });

  readonly form = this.fb.group({
    entryMode: ['daily', Validators.required],
    workDate: ['', Validators.required],
    projectId: [null as number | null],
    taskId: [null as number | null],
    clientName: [''],
    startTime: [''],
    endTime: [''],
    totalHours: [null as number | null],
    isBillable: [true],
    description: ['', [Validators.required, Validators.minLength(5)]],
  });

  constructor() {
    this.loadProjects();
    this.loadRecord();
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (items) => this.projects.set(items || []),
      error: () => this.projects.set([]),
    });
  }

  loadRecord(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/self-service/timesheet']);
      return;
    }
    this.timesheetService.getTimesheet(id).subscribe({
      next: (item) => {
        if (!item) {
          this.toastService.error('Timesheet not found.');
          this.router.navigate(['/self-service/timesheet']);
          return;
        }
        this.record.set(item);
        this.message.set(item.reviewNote || '');
        this.form.patchValue({
          entryMode: item.entryMode,
          workDate: item.workDate,
          projectId: item.projectId,
          taskId: item.taskId,
          clientName: item.clientName || '',
          startTime: item.startTime || '',
          endTime: item.endTime || '',
          totalHours: item.totalHours,
          isBillable: item.isBillable,
          description: item.description || '',
        });
        if (item.projectId) {
          this.projectService.getProjectTasks(item.projectId).subscribe({
            next: (tasks) => this.tasks.set(tasks || []),
            error: () => this.tasks.set([]),
          });
        }
      },
      error: () => {
        this.toastService.error('Unable to load timesheet detail.');
        this.router.navigate(['/self-service/timesheet']);
      },
    });
  }

  onProjectChange(): void {
    const projectId = Number(this.form.value.projectId || 0);
    this.form.patchValue({ taskId: null });
    if (!projectId) {
      this.tasks.set([]);
      return;
    }
    this.projectService.getProjectTasks(projectId).subscribe({
      next: (items) => this.tasks.set(items || []),
      error: () => this.tasks.set([]),
    });
  }

  save(status: 'draft' | 'pending'): void {
    const item = this.record();
    if (!item || !this.canEdit()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.set('Please complete the required fields before saving.');
      return;
    }
    const raw = this.form.getRawValue();
    const payload: TimesheetPayload = {
      entryMode: raw.entryMode === 'weekly' ? 'weekly' : 'daily',
      workDate: raw.workDate || item.workDate,
      projectId: raw.projectId ?? null,
      taskId: raw.taskId ?? null,
      clientName: raw.clientName || null,
      startTime: raw.startTime || null,
      endTime: raw.endTime || null,
      totalHours: raw.totalHours ?? null,
      isBillable: !!raw.isBillable,
      description: raw.description || '',
      status,
    };
    this.saving.set(true);
    this.timesheetService.updateTimesheet(item.id, payload).subscribe({
      next: (updated) => {
        this.record.set(updated);
        this.toastService.success(status === 'draft' ? 'Timesheet updated.' : 'Timesheet saved and submitted.');
        this.message.set(updated.reviewNote || 'Timesheet updated successfully.');
      },
      error: (error) => {
        this.message.set(error?.error?.message || 'Unable to update the timesheet.');
        this.toastService.error(this.message());
      },
      complete: () => this.saving.set(false),
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
