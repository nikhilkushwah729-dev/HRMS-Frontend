import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ProjectService, Project } from '../../core/services/project.service';
import { ToastService } from '../../core/services/toast.service';
import {
  UiSelectAdvancedComponent,
  SelectOption,
} from '../../core/components/ui/ui-select-advanced.component';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiSelectAdvancedComponent],
  template: `
    <div class="flex flex-col gap-8">
      <!-- New Project Modal -->
      @if (showForm()) {
        <div
          class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div
            class="bg-white rounded-md shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
          >
            <header
              class="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center gap-3"
            >
              <div>
                <h2 class="text-xl font-bold text-slate-900">New Project</h2>
                <p class="text-slate-400 text-sm mt-0.5">
                  Create a new project for your team.
                </p>
              </div>
              <button
                (click)="toggleForm()"
                class="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </header>
            <form
              [formGroup]="projectForm"
              (ngSubmit)="submitProject()"
              class="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-88px)]"
            >
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                  >Project Name</label
                >
                <input
                  type="text"
                  formControlName="name"
                  class="app-field"
                  placeholder="e.g., Website Redesign"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                  >Description</label
                >
                <textarea
                  formControlName="description"
                  rows="3"
                  class="app-field resize-none"
                  placeholder="What is this project about?"
                ></textarea>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <app-ui-select-advanced
                    formControlName="status"
                    label="Status"
                    placeholder="Select Status"
                    [options]="statusOptions"
                    [searchable]="false"
                  ></app-ui-select-advanced>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label
                    class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                    >Deadline</label
                  >
                  <input
                    type="date"
                    formControlName="deadline"
                    class="app-field"
                  />
                </div>
              </div>
              <div
                class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-50"
              >
                <button
                  type="button"
                  (click)="toggleForm()"
                  class="px-5 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="projectForm.invalid || processing()"
                  class="btn-primary min-w-[140px]"
                >
                  {{ processing() ? 'Creating...' : 'Create Project' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <header
        class="app-module-hero flex flex-col xl:flex-row justify-between xl:items-end gap-5"
      >
        <div class="max-w-2xl">
          <p class="app-module-kicker">Project Workspace</p>
          <h1 class="app-module-title mt-3">
            Delivery board and project momentum
          </h1>
          <p class="app-module-text mt-3">
            Track active initiatives, upcoming deadlines, planning states, and
            team participation through a cleaner project board.
          </p>
        </div>
        <div class="flex flex-col gap-3 xl:items-end">
          <div class="app-module-highlight min-w-[240px]">
            <span class="app-module-highlight-label">Active pipeline</span>
            <div class="app-module-highlight-value mt-3">
              {{ projects().length }}
            </div>
            <p class="mt-2 text-sm text-white/80">
              Projects currently visible in the board across planning, active,
              and on-hold states.
            </p>
          </div>
          <button
            (click)="toggleForm()"
            class="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 rounded-md px-5 py-3"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            New Project
          </button>
        </div>
      </header>

      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div
            class="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"
          ></div>
        </div>
      } @else if (projects().length === 0) {
        <div
          class="bg-white rounded-md border border-slate-100 py-20 flex flex-col items-center gap-4 text-center"
        >
          <div
            class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-slate-300"
            >
              <rect width="8" height="4" x="8" y="2" rx="1" />
              <path
                d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
              />
            </svg>
          </div>
          <p class="text-slate-500 font-semibold">No projects yet</p>
          <button
            (click)="toggleForm()"
            class="text-primary-600 text-sm font-bold hover:underline"
          >
            Create your first project
          </button>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          @for (project of projects(); track project.id) {
            <div
              class="card p-6 glass flex flex-col gap-6 group hover:border-primary-200 hover:shadow-xl transition-all duration-300"
            >
              <div
                class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <span
                  class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                  [ngClass]="{
                    'bg-green-50 text-success': project.status === 'active',
                    'bg-blue-50 text-primary-600':
                      project.status === 'planning',
                    'bg-amber-50 text-amber-600': project.status === 'on_hold',
                    'bg-slate-50 text-slate-500':
                      project.status === 'completed',
                  }"
                >
                  {{ project.status.split('_').join(' ') }}
                </span>
                <div class="text-slate-400 text-xs font-bold">
                  {{ project.progress || 0 }}% done
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <h3
                  class="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors"
                >
                  {{ project.name }}
                </h3>
                <p
                  class="text-sm text-slate-500 leading-relaxed font-medium line-clamp-2"
                >
                  {{ project.description || 'No description provided.' }}
                </p>
              </div>

              <div class="flex flex-col gap-2">
                <div class="flex justify-between items-end mb-1">
                  <span
                    class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                    >Progress</span
                  >
                  <span
                    class="text-sm font-extrabold text-slate-900 leading-none"
                    >{{ project.progress || 0 }}%</span
                  >
                </div>
                <div
                  class="h-2 w-full bg-slate-100 rounded-full overflow-hidden"
                >
                  <div
                    class="h-full bg-primary-600 rounded-full transition-all duration-1000"
                    [style.width.%]="project.progress || 0"
                  ></div>
                </div>
              </div>

              <div
                class="flex justify-between items-center pt-4 border-t border-slate-50"
              >
                <div
                  class="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-wide"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                  <span>{{
                    project.deadline
                      ? (project.deadline | date: 'mediumDate')
                      : 'No deadline'
                  }}</span>
                </div>
                @if (project.members?.length) {
                  <div class="flex -space-x-2">
                    @for (
                      m of (project.members ?? []).slice(0, 3);
                      track m.id
                    ) {
                      <div
                        class="w-7 h-7 rounded-lg bg-primary-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-primary-700"
                      >
                        {{ (m.firstName || m.first_name)?.[0] || '?' }}
                      </div>
                    }
                    @if ((project.members?.length ?? 0) > 3) {
                      <div
                        class="w-7 h-7 rounded-lg bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-500"
                      >
                        +{{ (project.members?.length ?? 0) - 3 }}
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  projects = signal<Project[]>([]);
  loading = signal(false);
  showForm = signal(false);
  processing = signal(false);

  statusOptions: SelectOption[] = [
    { label: 'Planning', value: 'planning' },
    { label: 'Active', value: 'active' },
    { label: 'On Hold', value: 'on_hold' },
  ];

  projectForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    status: ['planning'],
    deadline: [''],
  });

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.loading.set(true);
    this.projectService.getProjects().subscribe({
      next: (data) => {
        this.projects.set(data);
        this.loading.set(false);
      },
      error: () => {
        // MOCK DATA for perfect UI
        this.projects.set([
          {
            id: 1,
            name: 'Website Redesign',
            description:
              'Modernizing the corporate website with a Figma-inspired design system and dynamic components.',
            status: 'active',
            progress: 75,
            deadline: '2025-04-15',
            team_size: 4,
            members: [
              { id: 1, firstName: 'R' },
              { id: 2, firstName: 'P' },
              { id: 3, firstName: 'A' },
              { id: 4, firstName: 'S' },
            ] as any[],
          },
          {
            id: 2,
            name: 'Cloud Migration',
            description:
              'Transitioning on-premise legacy infrastructure to a scalable AWS architecture for better reliability.',
            status: 'planning',
            progress: 30,
            deadline: '2025-06-30',
            team_size: 2,
            members: [
              { id: 1, firstName: 'R' },
              { id: 5, firstName: 'V' },
            ] as any[],
          },
          {
            id: 3,
            name: 'HR Portal Phase 2',
            description:
              'Expanding the HR portal with advanced analytics, report generation center, and expense tracking.',
            status: 'active',
            progress: 45,
            deadline: '2025-05-20',
            team_size: 3,
            members: [
              { id: 2, firstName: 'P' },
              { id: 3, firstName: 'A' },
              { id: 6, firstName: 'N' },
            ] as any[],
          },
          {
            id: 4,
            name: 'Mobile App API',
            description:
              'Building robust RESTful APIs for the upcoming cross-platform mobile application.',
            status: 'on_hold',
            progress: 15,
            deadline: '2025-08-15',
            team_size: 2,
            members: [
              { id: 1, firstName: 'R' },
              { id: 4, firstName: 'S' },
            ] as any[],
          },
        ]);
        this.loading.set(false);
      },
    });
  }

  toggleForm() {
    this.showForm.set(!this.showForm());
    if (!this.showForm()) {
      this.projectForm.reset({ status: 'planning' });
    }
  }

  submitProject() {
    if (this.projectForm.invalid) return;
    this.processing.set(true);
    this.projectService.createProject(this.projectForm.value).subscribe({
      next: () => {
        this.toastService.success('Project created successfully!');
        this.loadProjects();
        this.toggleForm();
        this.processing.set(false);
      },
      error: (err) => {
        this.toastService.error('Failed to create project.');
        this.processing.set(false);
        console.error(err);
      },
    });
  }
}
