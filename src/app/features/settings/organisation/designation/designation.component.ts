import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrganizationService, Designation, Department } from '../../../../core/services/organization.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-designation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-7xl space-y-6 px-1 py-2">
      <section class="app-module-hero">
        <div>
          <p class="app-module-kicker">Organisation Settings</p>
          <h1 class="app-module-title">Designations</h1>
          <p class="app-module-text max-w-2xl">Maintain job titles with department mapping so employee profiles, approvals, and reporting stay more structured.</p>
        </div>
        <div class="app-module-highlight">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Live designations</p>
          <p class="mt-3 text-3xl font-black text-slate-900">{{ designations().length }}</p>
          <p class="mt-2 text-sm text-slate-600">Departments mapped: {{ departments().length }}</p>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section class="app-surface-card">
          <div class="mb-6">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Create Designation</p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">Designation master</h2>
          </div>

          <form [formGroup]="designationForm" (ngSubmit)="saveDesignation()" class="space-y-4">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Designation Name</label>
              <input formControlName="name" type="text" class="app-field" placeholder="Enter designation name">
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Department</label>
              <select formControlName="departmentId" class="app-select">
                <option [ngValue]="null">No Department</option>
                @for (dept of departments(); track dept.id) {
                  <option [ngValue]="dept.id">{{ dept.name }}</option>
                }
              </select>
            </div>
            <button type="submit" [disabled]="designationForm.invalid || saving()" class="w-full rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
              {{ saving() ? 'Saving...' : 'Save Designation' }}
            </button>
          </form>
        </section>

        <section class="app-surface-card overflow-hidden p-0">
          <div class="border-b border-slate-100 px-6 py-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Designation Directory</p>
                <h2 class="mt-2 text-2xl font-black text-slate-900">Current titles</h2>
              </div>
              <input [value]="searchQuery()" (input)="updateSearch($event)" class="app-field w-full max-w-sm" placeholder="Search designations">
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            @for (designation of filteredDesignations(); track designation.id) {
              <div class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p class="text-lg font-black text-slate-900">{{ designation.name }}</p>
                  <p class="mt-1 text-sm text-slate-500">Department: {{ getDepartmentName(designation.departmentId) }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <span class="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">Designation</span>
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">ID {{ designation.id }}</span>
                </div>
              </div>
            } @empty {
              <div class="px-6 py-14 text-center text-slate-500">No designations found.</div>
            }
          </div>
        </section>
      </div>
    </div>
  `
})
export class DesignationComponent implements OnInit {
  private orgService = inject(OrganizationService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  designations = signal<Designation[]>([]);
  departments = signal<Department[]>([]);
  searchQuery = signal('');
  saving = signal(false);

  designationForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    departmentId: [null as number | null]
  });

  filteredDesignations = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.designations();
    return this.designations().filter((designation) => designation.name.toLowerCase().includes(q));
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.orgService.getDepartments().subscribe({
      next: (departments) => this.departments.set(departments),
      error: () => this.departments.set([])
    });

    this.orgService.getDesignations().subscribe({
      next: (designations) => this.designations.set(designations),
      error: () => {
        this.designations.set([]);
        this.toastService.error('Failed to load designations');
      }
    });
  }

  updateSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  saveDesignation() {
    if (this.designationForm.invalid) return;
    this.saving.set(true);
    const value = this.designationForm.getRawValue();
    this.orgService.createDesignation({
      name: (value.name || '').trim(),
      departmentId: value.departmentId
    }).subscribe({
      next: (designation) => {
        this.designations.update((list) => [designation, ...list]);
        this.designationForm.reset({ name: '', departmentId: null });
        this.toastService.success('Designation saved successfully');
      },
      error: () => this.toastService.error('Failed to save designation'),
      complete: () => this.saving.set(false)
    });
  }

  getDepartmentName(departmentId?: number | null): string {
    if (!departmentId) return 'No Department';
    return this.departments().find((dept) => dept.id === departmentId)?.name || 'Unknown Department';
  }
}
