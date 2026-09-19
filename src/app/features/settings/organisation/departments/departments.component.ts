import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  OrganizationService,
  Department,
} from '../../../../core/services/organization.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  UiSelectAdvancedComponent,
  SelectOption,
} from '../../../../core/components/ui/ui-select-advanced.component';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiSelectAdvancedComponent],
  template: `
    <div class="mx-auto max-w-7xl space-y-6">
      <section class="app-module-hero overflow-hidden">
        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div class="space-y-5">
            <div>
              <p class="app-module-kicker">Organisation Settings</p>
              <h1 class="app-module-title">Departments</h1>
              <p class="app-module-text max-w-2xl">
                Build a cleaner department structure for reporting lines,
                designation mapping, employee placement, and approval flows.
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Live departments</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ departments().length }}</p>
                <p class="mt-1 text-xs text-slate-500">Saved records</p>
              </div>
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Visible now</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ filteredDepartments().length }}</p>
                <p class="mt-1 text-xs text-slate-500">Matching current search</p>
              </div>
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Root departments</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ rootDepartmentCount() }}</p>
                <p class="mt-1 text-xs text-slate-500">Top-level teams</p>
              </div>
            </div>
          </div>

          <div class="app-module-highlight">
            <p class="app-module-highlight-label">Structure note</p>
            <p class="mt-3 app-module-highlight-value">Org hierarchy</p>
            <p class="mt-3 text-sm leading-6 text-white/80">
              Parent mapping keeps your organisation chart easier to scan and
              improves consistency for employee masters across modules.
            </p>
          </div>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section class="app-surface-card overflow-hidden p-0">
          <div class="border-b border-slate-100 px-6 py-5">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {{ editingId() ? 'Update Department' : 'Create Department' }}
            </p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">
              Department master
            </h2>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              Add department names, optional parent teams, and descriptions so
              admins can reuse the same structure everywhere.
            </p>
          </div>

          <form
            [formGroup]="departmentForm"
            (ngSubmit)="saveDepartment()"
            class="space-y-5 px-6 py-6"
          >
            <div class="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p class="font-bold">Admin note</p>
              <p class="mt-1 leading-6">
                Parent department is optional. Use it only when you want a
                reporting hierarchy between teams.
              </p>
            </div>
            <div class="flex flex-col gap-2">
              <label
                class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >Department Name</label
              >
              <input
                formControlName="name"
                type="text"
                class="app-field"
                placeholder="Enter department name"
              />
            </div>
            <div class="flex flex-col gap-2">
              <app-ui-select-advanced
                formControlName="parentId"
                label="Parent Department"
                placeholder="No Parent Department"
                [options]="departmentOptions()"
                searchPlaceholder="Search departments..."
                [allowClear]="true"
              ></app-ui-select-advanced>
            </div>
            <div class="flex flex-col gap-2">
              <label
                class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >Description</label
              >
              <textarea
                formControlName="description"
                rows="4"
                class="app-field resize-none"
                placeholder="Optional description"
              ></textarea>
            </div>
            <button
              type="submit"
              [disabled]="departmentForm.invalid || saving()"
              class="w-full rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {{ saving() ? 'Saving...' : editingId() ? 'Update Department' : 'Save Department' }}
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
                  Department Directory
                </p>
                <h2 class="mt-2 text-2xl font-black text-slate-900">
                  Active structure
                </h2>
                <p class="mt-2 text-sm leading-6 text-slate-500">
                  Search current departments and review hierarchy details before
                  mapping designations or employees.
                </p>
              </div>
              <input
                [value]="searchQuery()"
                (input)="updateSearch($event)"
                class="app-field w-full max-w-sm"
                placeholder="Search departments"
              />
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            @for (dept of filteredDepartments(); track dept.id) {
              <div
                class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div class="flex flex-wrap items-center gap-3">
                    <p class="text-lg font-black text-slate-900">
                      {{ dept.name }}
                    </p>
                    <span class="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      {{ dept.parentId ? 'Child team' : 'Root team' }}
                    </span>
                  </div>
                  <p class="mt-1 text-sm text-slate-500">
                    Parent: {{ getDepartmentName(dept.parentId) }}
                  </p>
                  @if (dept.description) {
                    <p class="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                      {{ dept.description }}
                    </p>
                  }
                </div>
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    (click)="editDepartment(dept)"
                    class="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {{ t('common.edit') }}
                  </button>
                  <button
                    type="button"
                    (click)="removeDepartment(dept.id)"
                    class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    {{ t('common.delete') }}
                  </button>
                  <span
                    class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                    >ID {{ dept.id }}</span
                  >
                  <span
                    class="rounded-full px-3 py-1 text-xs font-semibold"
                    [ngClass]="
                      dept.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    "
                  >
                    {{ dept.isActive ? t('common.active') : t('common.inactive') }}
                  </span>
                </div>
              </div>
            } @empty {
              <div class="px-6 py-16 text-center">
                <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 7h18" />
                    <path d="M6 12h12" />
                    <path d="M10 17h4" />
                  </svg>
                </div>
                <p class="mt-4 text-base font-semibold text-slate-900">{{ t('common.noResults') }}</p>
                <p class="mt-2 text-sm text-slate-500">Create your first department to build a cleaner organisation structure.</p>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `,
})
export class DepartmentsComponent implements OnInit {
  private orgService = inject(OrganizationService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private languageService = inject(LanguageService);

  departments = signal<Department[]>([]);
  searchQuery = signal('');
  saving = signal(false);
  editingId = signal<number | null>(null);

  departmentOptions = computed<SelectOption[]>(() =>
    this.departments().map((d) => ({ label: d.name, value: d.id })),
  );

  departmentForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    parentId: [null as number | null],
    description: [''],
  });

  filteredDepartments = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.departments();
    return this.departments().filter(
      (dept) =>
        dept.name.toLowerCase().includes(q) ||
        (dept.description || '').toLowerCase().includes(q),
    );
  });

  rootDepartmentCount = computed(
    () =>
      this.departments().filter((department) => !department.parentId).length,
  );

  ngOnInit() {
    this.loadDepartments();
  }

  loadDepartments() {
    this.orgService.getDepartments().subscribe({
      next: (departments) => this.departments.set(departments),
      error: () => {
        this.departments.set([]);
        this.toastService.error('Failed to load departments');
      },
    });
  }

  updateSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  saveDepartment() {
    if (this.departmentForm.invalid) return;
    this.saving.set(true);
    const value = this.departmentForm.getRawValue();
    const payload = {
      name: (value.name || '').trim(),
      parentId: value.parentId,
      description: (value.description || '').trim() || null,
      isActive: true,
    };
    const request$ = this.editingId()
      ? this.orgService.updateDepartment(this.editingId()!, payload)
      : this.orgService.createDepartment(payload);

    request$
      .subscribe({
        next: (department) => {
          this.departments.update((list) =>
            this.editingId()
              ? list.map((item) => item.id === department.id ? department : item)
              : [department, ...list]
          );
          this.resetForm();
          this.toastService.success(this.editingId() ? 'Department updated successfully' : 'Department saved successfully');
        },
        error: () => this.toastService.error('Failed to save department'),
        complete: () => this.saving.set(false),
      });
  }

  editDepartment(department: Department) {
    this.editingId.set(department.id);
    this.departmentForm.patchValue({
      name: department.name,
      parentId: department.parentId ?? null,
      description: department.description ?? '',
    });
  }

  removeDepartment(departmentId: number) {
    this.orgService.deleteDepartment(departmentId).subscribe({
      next: (ok) => {
        if (!ok) {
          this.toastService.error('Failed to remove department');
          return;
        }
        this.departments.update((list) => list.filter((department) => department.id !== departmentId));
        if (this.editingId() === departmentId) {
          this.resetForm();
        }
        this.toastService.success('Department removed successfully');
      },
      error: () => this.toastService.error('Failed to remove department'),
    });
  }

  resetForm() {
    this.editingId.set(null);
    this.departmentForm.reset({
      name: '',
      parentId: null,
      description: '',
    });
  }

  getDepartmentName(parentId?: number | null): string {
    if (!parentId) return 'No parent department';
    return (
      this.departments().find((dept) => dept.id === parentId)?.name ||
      'Unknown department'
    );
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    this.languageService.currentLanguage();
    return this.languageService.t(key, params);
  }
}
