import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProjectService, Project, ProjectTask } from '../../core/services/project.service';
import { TimesheetPayload, TimesheetService } from '../../core/services/timesheet.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-self-service-timesheet-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <section class="rounded-md border border-slate-200 bg-white p-5 sm:p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-violet-600">Self Service Timesheet</p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900">Create Timesheet Entry</h1>
            <p class="mt-2 text-sm text-slate-600">Add project, task, client, work date, hours, and description. Save draft or submit for approval.</p>
          </div>
          <a routerLink="/self-service/timesheet" class="inline-flex items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Back to My Timesheet
          </a>
        </div>
      </section>

      <form [formGroup]="form" class="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section class="rounded-md border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
          <div class="grid gap-5 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Entry Mode</label>
              <select class="app-field" formControlName="entryMode">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label class="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Work Date</label>
              <input class="app-field" type="date" formControlName="workDate" />
            </div>
          </div>

          <div class="grid gap-5 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Project</label>
              <select class="app-field" formControlName="projectId" (change)="onProjectChange()">
                <option [ngValue]="null">Select project</option>
                @for (project of projects(); track project.id) {
                  <option [ngValue]="project.id">{{ project.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Task</label>
              <select class="app-field" formControlName="taskId">
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
              <input class="app-field" type="text" formControlName="clientName" placeholder="Client or account name" />
            </div>
            <div class="flex items-end">
              <label class="inline-flex items-center gap-3 rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" formControlName="isBillable" class="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                Mark as billable
              </label>
            </div>
          </div>

          <div class="grid gap-5 md:grid-cols-3">
            <div>
              <label class="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Start Time</label>
              <input class="app-field" type="time" formControlName="startTime" />
            </div>
            <div>
              <label class="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">End Time</label>
              <input class="app-field" type="time" formControlName="endTime" />
            </div>
            <div>
              <label class="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Total Hours</label>
              <input class="app-field" type="number" min="0" max="24" step="0.25" formControlName="totalHours" placeholder="Optional if start/end time used" />
            </div>
          </div>

          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Work Description</label>
            <textarea class="app-field min-h-[160px]" formControlName="description" placeholder="Describe your work, deliverables, blockers, or meeting outcomes."></textarea>
          </div>
        </section>

        <section class="rounded-md border border-slate-200 bg-white p-5 sm:p-6">
          <h2 class="text-lg font-black text-slate-900">Submission Controls</h2>
          <p class="mt-2 text-sm text-slate-500">Backend calculates final total hours. Use save draft for partial worklogs, or submit directly for approval.</p>

          <div class="mt-5 space-y-4">
            <div class="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Current Preview</p>
              <div class="mt-3 space-y-2 text-sm text-slate-600">
                <p><span class="font-bold text-slate-900">Date:</span> {{ form.value.workDate || 'Not selected' }}</p>
                <p><span class="font-bold text-slate-900">Project:</span> {{ selectedProjectName() }}</p>
                <p><span class="font-bold text-slate-900">Task:</span> {{ selectedTaskName() }}</p>
                <p><span class="font-bold text-slate-900">Billable:</span> {{ form.value.isBillable ? 'Yes' : 'No' }}</p>
              </div>
            </div>

            @if (errorMessage()) {
              <div class="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {{ errorMessage() }}
              </div>
            }

            <button type="button" (click)="save('draft')" [disabled]="submitting()" class="w-full rounded-md border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
              {{ submitting() ? 'Saving...' : 'Save as Draft' }}
            </button>
            <button type="button" (click)="save('pending')" [disabled]="submitting()" class="w-full rounded-md bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
              {{ submitting() ? 'Submitting...' : 'Submit Timesheet' }}
            </button>
          </div>
        </section>
      </form>
    </div>
  `,
})
export class SelfServiceTimesheetCreateComponent {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private timesheetService = inject(TimesheetService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  readonly projects = signal<Project[]>([]);
  readonly tasks = signal<ProjectTask[]>([]);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.group({
    entryMode: ['daily', Validators.required],
    workDate: [this.today(), Validators.required],
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
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (items) => this.projects.set(items || []),
      error: () => this.projects.set([]),
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
    this.errorMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Please complete the required fields before continuing.');
      return;
    }

    if (!this.form.value.startTime && !this.form.value.endTime && !this.form.value.totalHours) {
      this.errorMessage.set('Provide start and end time or enter total hours.');
      return;
    }

    const raw = this.form.getRawValue();
    const payload: TimesheetPayload = {
      entryMode: raw.entryMode === 'weekly' ? 'weekly' : 'daily',
      workDate: raw.workDate || this.today(),
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

    this.submitting.set(true);
    this.timesheetService.createTimesheet(payload).subscribe({
      next: (record) => {
        this.toastService.success(status === 'draft' ? 'Timesheet draft saved.' : 'Timesheet submitted for approval.');
        this.router.navigate(['/self-service/timesheet', record.id]);
      },
      error: (error) => {
        this.errorMessage.set(error?.error?.message || 'Unable to save the timesheet.');
        this.toastService.error(this.errorMessage());
        this.submitting.set(false);
      },
      complete: () => this.submitting.set(false),
    });
  }

  selectedProjectName(): string {
    return this.projects().find((project) => project.id === Number(this.form.value.projectId))?.name || 'Not selected';
  }

  selectedTaskName(): string {
    return this.tasks().find((task) => task.id === Number(this.form.value.taskId))?.title || 'Not selected';
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }
}
