import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  OrganizationService,
  Designation,
  Department,
} from '../../../../core/services/organization.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  UiSelectAdvancedComponent,
  SelectOption,
} from '../../../../core/components/ui/ui-select-advanced.component';

@Component({
  selector: 'app-designation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiSelectAdvancedComponent],
  template: `
    <div class="mx-auto max-w-7xl space-y-6">
      <section class="app-module-hero overflow-hidden">
        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div class="space-y-5">
            <div>
              <p class="app-module-kicker">Organisation Settings</p>
              <h1 class="app-module-title">Designations</h1>
              <p class="app-module-text max-w-2xl">
                Maintain job titles with clean department mapping so employee
                profiles, approvals, and reporting remain consistent.
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Live designations</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ designations().length }}</p>
                <p class="mt-1 text-xs text-slate-500">Saved titles</p>
              </div>
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Departments</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ departments().length }}</p>
                <p class="mt-1 text-xs text-slate-500">Mapped masters</p>
              </div>
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Unmapped</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ unmappedDesignationCount() }}</p>
                <p class="mt-1 text-xs text-slate-500">Need department link</p>
              </div>
            </div>
          </div>

          <div class="app-module-highlight">
            <p class="app-module-highlight-label">Role note</p>
            <p class="mt-3 app-module-highlight-value">Job title matrix</p>
            <p class="mt-3 text-sm leading-6 text-white/80">
              A cleaner designation library makes employee onboarding, manager
              approvals, and reporting hierarchies easier to maintain.
            </p>
          </div>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section class="app-surface-card overflow-hidden p-0">
          <div class="border-b border-slate-100 px-6 py-5">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {{ editingId() ? 'Update Designation' : 'Create Designation' }}
            </p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">
              Designation master
            </h2>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              Add job titles and optionally map them to departments to keep HR
              structure readable across the system.
            </p>
          </div>

          <form
            [formGroup]="designationForm"
            (ngSubmit)="saveDesignation()"
            class="space-y-5 px-6 py-6"
          >
            <div class="rounded-md border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
              <p class="font-bold">Quick tip</p>
              <p class="mt-1 leading-6">
                Map titles to departments where possible. It helps keep
                reporting and employee assignment cleaner later.
              </p>
            </div>
            <div class="flex flex-col gap-2">
              <label
                class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >Designation Name</label
              >
              <input
                formControlName="name"
                type="text"
                class="app-field"
                placeholder="Enter designation name"
              />
            </div>
            <div class="flex flex-col gap-2">
              <app-ui-select-advanced
                formControlName="departmentId"
                label="Department"
                placeholder="No Department"
                [options]="departmentOptions()"
                searchPlaceholder="Search departments..."
                [allowClear]="true"
              ></app-ui-select-advanced>
            </div>
            <button
              type="submit"
              [disabled]="designationForm.invalid || saving()"
              class="w-full rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {{ saving() ? 'Saving...' : editingId() ? 'Update Designation' : 'Save Designation' }}
            </button>
          </form>
        </section>

        <section class="app-surface-card overflow-hidden p-0">
          <div class="border-b border-slate-100 px-6 py-5">
            <div
              class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <p
                  class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                >
                  Designation Directory
                </p>
                <h2 class="mt-2 text-2xl font-black text-slate-900">
                  Current titles
                </h2>
                <p class="mt-2 text-sm leading-6 text-slate-500">
                  Search designation masters and verify their mapped department
                  before using them in employee records.
                </p>
              </div>
              <input
                [value]="searchQuery()"
                (input)="updateSearch($event)"
                class="app-field w-full max-w-sm"
                placeholder="Search designations"
              />
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            @for (designation of filteredDesignations(); track designation.id) {
              <div
                class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div class="flex flex-wrap items-center gap-3">
                    <p class="text-lg font-black text-slate-900">
                      {{ designation.name }}
                    </p>
                    <span class="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                      Job title
                    </span>
                  </div>
                  <p class="mt-1 text-sm text-slate-500">
                    Department:
                    {{ getDepartmentName(designation.departmentId) }}
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    (click)="editDesignation(designation)"
                    class="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    (click)="removeDesignation(designation.id)"
                    class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    Delete
                  </button>
                  <span
                    class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                    >ID {{ designation.id }}</span
                  >
                </div>
              </div>
            } @empty {
              <div class="px-6 py-16 text-center">
                <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 3v18" />
                    <path d="M8 7h8" />
                    <path d="M8 12h8" />
                    <path d="M8 17h8" />
                  </svg>
                </div>
                <p class="mt-4 text-base font-semibold text-slate-900">No designations found</p>
                <p class="mt-2 text-sm text-slate-500">Create job titles here so employee masters and approvals stay structured.</p>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `,
})
export class DesignationComponent implements OnInit {
  private orgService = inject(OrganizationService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  designations = signal<Designation[]>([]);
  departments = signal<Department[]>([]);
  searchQuery = signal('');
  saving = signal(false);
  editingId = signal<number | null>(null);

  departmentOptions = computed<SelectOption[]>(() =>
    this.departments().map((d) => ({ label: d.name, value: d.id })),
  );

  designationForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    departmentId: [null as number | null],
  });

  filteredDesignations = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.designations();
    return this.designations().filter((designation) =>
      designation.name.toLowerCase().includes(q),
    );
  });

  unmappedDesignationCount = computed(
    () =>
      this.designations().filter((designation) => !designation.departmentId)
        .length,
  );

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.orgService.getDepartments().subscribe({
      next: (departments) => this.departments.set(departments),
      error: () => this.departments.set([]),
    });

    this.orgService.getDesignations().subscribe({
      next: (designations) => this.designations.set(designations),
      error: () => {
        this.designations.set([]);
        this.toastService.error('Failed to load designations');
      },
    });
  }

  updateSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  saveDesignation() {
    if (this.designationForm.invalid) return;
    this.saving.set(true);
    const value = this.designationForm.getRawValue();
    const payload = {
      name: (value.name || '').trim(),
      departmentId: value.departmentId,
    };
    const request$ = this.editingId()
      ? this.orgService.updateDesignation(this.editingId()!, payload)
      : this.orgService.createDesignation(payload);

    request$
      .subscribe({
        next: (designation) => {
          this.designations.update((list) =>
            this.editingId()
              ? list.map((item) => item.id === designation.id ? designation : item)
              : [designation, ...list]
          );
          this.resetForm();
          this.toastService.success(this.editingId() ? 'Designation updated successfully' : 'Designation saved successfully');
        },
        error: () => this.toastService.error('Failed to save designation'),
        complete: () => this.saving.set(false),
      });
  }

  editDesignation(designation: Designation) {
    this.editingId.set(designation.id);
    this.designationForm.patchValue({
      name: designation.name,
      departmentId: designation.departmentId ?? null,
    });
  }

  removeDesignation(designationId: number) {
    this.orgService.deleteDesignation(designationId).subscribe({
      next: (ok) => {
        if (!ok) {
          this.toastService.error('Failed to remove designation');
          return;
        }
        this.designations.update((list) => list.filter((designation) => designation.id !== designationId));
        if (this.editingId() === designationId) {
          this.resetForm();
        }
        this.toastService.success('Designation removed successfully');
      },
      error: () => this.toastService.error('Failed to remove designation'),
    });
  }

  resetForm() {
    this.editingId.set(null);
    this.designationForm.reset({ name: '', departmentId: null });
  }

  getDepartmentName(departmentId?: number | null): string {
    if (!departmentId) return 'No Department';
    return (
      this.departments().find((dept) => dept.id === departmentId)?.name ||
      'Unknown Department'
    );
  }
}
