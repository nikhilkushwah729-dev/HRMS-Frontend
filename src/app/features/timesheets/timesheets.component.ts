import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  TimesheetService,
  Timesheet,
} from '../../core/services/timesheet.service';
import { ProjectService } from '../../core/services/project.service';
import { ToastService } from '../../core/services/toast.service';
import { LanguageService } from '../../core/services/language.service';
import {
  UiSelectAdvancedComponent,
  SelectOption,
} from '../../core/components/ui/ui-select-advanced.component';

@Component({
  selector: 'app-timesheets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiSelectAdvancedComponent],
  template: `
    <div class="flex flex-col gap-8">
      <!-- Add Timesheet Modal -->
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
                <h2 class="text-xl font-bold text-slate-900">{{ t('timesheet.logTime') }}</h2>
                <p class="text-slate-400 text-sm mt-0.5">
                  {{ t('timesheet.recordHours') }}
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
              [formGroup]="timesheetForm"
              (ngSubmit)="submitTimesheet()"
              class="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-88px)]"
            >
              <div class="flex flex-col gap-1.5">
                <app-ui-select-advanced
                  formControlName="projectId"
                  [label]="t('timesheet.project')"
                  [placeholder]="t('timesheet.generalNoProject')"
                  [options]="projectOptions()"
                  [searchPlaceholder]="t('timesheet.searchProjects')"
                  [allowClear]="true"
                ></app-ui-select-advanced>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label
                    class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                    >{{ t('timesheet.workDate') }}</label
                  >
                  <input
                    type="date"
                    formControlName="workDate"
                    class="app-field"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label
                    class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                    >{{ t('timesheet.hoursWorked') }}</label
                  >
                  <input
                    type="number"
                    formControlName="hoursWorked"
                    class="app-field"
                    placeholder="e.g. 8"
                    min="0.5"
                    max="24"
                    step="0.5"
                  />
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                  >{{ t('timesheet.description') }}</label
                >
                <textarea
                  formControlName="description"
                  rows="3"
                  class="app-field resize-none"
                  placeholder="Describe what you worked on..."
                ></textarea>
              </div>
              <div
                class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-50"
              >
                <button
                  type="button"
                  (click)="toggleForm()"
                  class="px-5 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  {{ t('common.cancel') }}
                </button>
                <button
                  type="submit"
                  [disabled]="timesheetForm.invalid || processing()"
                  class="btn-primary min-w-[130px]"
                >
                  {{ processing() ? t('common.saving') : t('timesheet.logTime') }}
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
          <p class="app-module-kicker">{{ t('timesheet.workspace') }}</p>
          <h1 class="app-module-title mt-3">
            {{ t('timesheet.title') }}
          </h1>
          <p class="app-module-text mt-3">
            {{ t('timesheet.subtitle') }}
          </p>
        </div>
        <div class="flex flex-col gap-3 xl:items-end">
          <div class="app-module-highlight min-w-[240px]">
            <span class="app-module-highlight-label">{{ t('timesheet.thisMonth') }}</span>
            <div class="app-module-highlight-value mt-3">
              {{ totalHours() }}h
            </div>
            <p class="mt-2 text-sm text-white/80">
              {{ t('timesheet.thisMonthEffort') }}
            </p>
          </div>
          <button
            (click)="toggleForm()"
            class="w-full md:w-auto bg-primary-600 text-white px-5 py-3 rounded-md font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all"
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
            {{ t('timesheet.logTime') }}
          </button>
        </div>
      </header>

      <!-- Summary Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-md border border-slate-100 p-6">
          <p
            class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2"
          >
            {{ t('timesheet.totalHoursThisMonth') }}
          </p>
          <p class="text-3xl font-extrabold text-slate-900 tracking-tight">
            {{ totalHours() }}
            <span class="text-lg font-medium text-slate-400">hrs</span>
          </p>
        </div>
        <div class="bg-white rounded-md border border-slate-100 p-6">
          <p
            class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2"
          >
            {{ t('timesheet.pendingApproval') }}
          </p>
          <p class="text-3xl font-extrabold text-amber-500 tracking-tight">
            {{ pendingCount() }}
          </p>
        </div>
        <div class="bg-white rounded-md border border-slate-100 p-6">
          <p
            class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2"
          >
            {{ t('timesheet.approvedEntries') }}
          </p>
          <p class="text-3xl font-extrabold text-green-500 tracking-tight">
            {{ approvedCount() }}
          </p>
        </div>
      </div>

      <div
        class="bg-white rounded-md border border-slate-100 overflow-hidden shadow-sm"
      >
        <div
          class="p-5 border-b border-slate-50 flex justify-between items-center"
        >
          <h3 class="font-bold text-slate-900">{{ t('timesheet.timeLogHistory') }}</h3>
          @if (loading()) {
            <div
              class="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent"
            ></div>
          }
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100">
                <th
                  class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                >
                  {{ t('common.date') }}
                </th>
                <th
                  class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                >
                  {{ t('timesheet.project') }}
                </th>
                <th
                  class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                >
                  {{ t('dashboard.hours') }}
                </th>
                <th
                  class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                >
                  {{ t('common.status') }}
                </th>
                <th
                  class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                >
                  {{ t('timesheet.description') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @for (entry of timesheets(); track entry.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4">
                    <span class="text-sm font-semibold text-slate-700">{{
                      entry.workDate || entry.date || entry.log_date
                        | date: 'mediumDate'
                    }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-sm text-slate-500 font-medium">{{
                      entry.project?.name || t('timesheet.general')
                    }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-sm font-bold text-slate-900"
                      >{{
                        entry.hoursWorked ||
                          entry.hours ||
                          entry.hours_logged ||
                          '--'
                      }}
                      hrs</span
                    >
                  </td>
                  <td class="px-6 py-4">
                    <span
                      [class]="getStatusClass(entry.status)"
                      class="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter"
                    >
                      {{ entry.status || 'pending' }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <p class="text-xs text-slate-500 line-clamp-1 max-w-sm">
                      {{ entry.description || '--' }}
                    </p>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-6 py-16 text-center">
                    <div class="flex flex-col items-center gap-3">
                      <div
                        class="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          class="text-slate-300"
                        >
                          <path
                            d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
                          />
                          <path d="M13 2v7h7" />
                        </svg>
                      </div>
                      <p class="text-sm font-semibold text-slate-400">
                        {{ t('timesheet.noEntriesYet') }}
                      </p>
                      <button
                        (click)="toggleForm()"
                        class="text-primary-600 text-sm font-bold hover:underline"
                      >
                        {{ t('timesheet.noEntriesCta') }}
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
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
export class TimesheetsComponent implements OnInit {
  private timesheetService = inject(TimesheetService);
  private projectService = inject(ProjectService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private languageService = inject(LanguageService);

  timesheets = signal<Timesheet[]>([]);
  projects = signal<any[]>([]);
  loading = signal(false);
  showForm = signal(false);
  processing = signal(false);

  projectOptions = computed<SelectOption[]>(() =>
    this.projects().map((p) => ({ label: p.name, value: p.id })),
  );

  totalHours = signal(0);
  pendingCount = signal(0);
  approvedCount = signal(0);

  timesheetForm: FormGroup = this.fb.group({
    projectId: [null],
    workDate: [new Date().toISOString().split('T')[0], [Validators.required]],
    hoursWorked: [
      '',
      [Validators.required, Validators.min(0.5), Validators.max(24)],
    ],
    description: [''],
  });

  ngOnInit() {
    this.loadTimesheets();
    this.loadProjects();
  }

  loadTimesheets() {
    this.loading.set(true);
    this.timesheetService.getTimesheets().subscribe({
      next: (data) => {
        this.processTimesheets(data);
        this.loading.set(false);
      },
      error: () => {
        this.processTimesheets([]);
        this.loading.set(false);
        this.toastService.error(this.t('timesheet.timeLoggedFailed'));
      },
    });
  }

  private processTimesheets(data: any[]) {
    this.timesheets.set(data || []);
    const now = new Date();
    const thisMonth = (data || []).filter((t) => {
      const d = new Date(t.workDate || t.date || t.log_date || '');
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    });
    this.totalHours.set(
      thisMonth.reduce(
        (s, t) => s + (t.hoursWorked || t.hours || t.hours_logged || 0),
        0,
      ),
    );
    this.pendingCount.set(
      (data || []).filter((t) => !t.status || t.status === 'pending').length,
    );
    this.approvedCount.set(
      (data || []).filter((t) => t.status === 'approved').length,
    );
  }

  loadProjects() {
    this.projectService.getProjects().subscribe({
      next: (data) => this.projects.set(data),
      error: () => this.projects.set([]),
    });
  }

  toggleForm() {
    this.showForm.set(!this.showForm());
    if (!this.showForm()) {
      this.timesheetForm.reset({
        workDate: new Date().toISOString().split('T')[0],
        projectId: null,
      });
    }
  }

  submitTimesheet() {
    if (this.timesheetForm.invalid) return;
    this.processing.set(true);
    this.timesheetService.createTimesheet(this.timesheetForm.value).subscribe({
      next: () => {
        this.toastService.success(this.t('timesheet.timeLoggedSuccess'));
        this.loadTimesheets();
        this.toggleForm();
        this.processing.set(false);
      },
      error: (err) => {
        this.toastService.error(this.t('timesheet.timeLoggedFailed'));
        this.processing.set(false);
        console.error(err);
      },
    });
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    this.languageService.currentLanguage();
    return this.languageService.t(key, params);
  }

  getStatusClass(status?: string) {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-600';
      case 'pending':
        return 'bg-amber-50 text-amber-600';
      case 'rejected':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  }
}
