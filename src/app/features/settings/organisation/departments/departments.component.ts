import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrganizationService, Department } from '../../../../core/services/organization.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-7xl space-y-6 px-1 py-2">
      <section class="app-module-hero">
        <div>
          <p class="app-module-kicker">Organisation Settings</p>
          <h1 class="app-module-title">Departments</h1>
          <p class="app-module-text max-w-2xl">Create department records, keep parent structure visible, and maintain cleaner organization masters for employees and admin flows.</p>
        </div>
        <div class="app-module-highlight">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Live departments</p>
          <p class="mt-3 text-3xl font-black text-slate-900">{{ departments().length }}</p>
          <p class="mt-2 text-sm text-slate-600">Filtered results: {{ filteredDepartments().length }}</p>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section class="app-surface-card">
          <div class="mb-6">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Create Department</p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">Department master</h2>
          </div>

          <form [formGroup]="departmentForm" (ngSubmit)="saveDepartment()" class="space-y-4">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Department Name</label>
              <input formControlName="name" type="text" class="app-field" placeholder="Enter department name">
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Parent Department</label>
              <select formControlName="parentId" class="app-select">
                <option [ngValue]="null">No Parent Department</option>
                @for (dept of departments(); track dept.id) {
                  <option [ngValue]="dept.id">{{ dept.name }}</option>
                }
              </select>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Description</label>
              <textarea formControlName="description" rows="4" class="app-field resize-none" placeholder="Optional description"></textarea>
            </div>
            <button type="submit" [disabled]="departmentForm.invalid || saving()" class="w-full rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
              {{ saving() ? 'Saving...' : 'Save Department' }}
            </button>
          </form>
        </section>

        <section class="app-surface-card overflow-hidden p-0">
          <div class="border-b border-slate-100 px-6 py-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Department Directory</p>
                <h2 class="mt-2 text-2xl font-black text-slate-900">Active structure</h2>
              </div>
              <input [value]="searchQuery()" (input)="updateSearch($event)" class="app-field w-full max-w-sm" placeholder="Search departments">
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            @for (dept of filteredDepartments(); track dept.id) {
              <div class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p class="text-lg font-black text-slate-900">{{ dept.name }}</p>
                  <p class="mt-1 text-sm text-slate-500">Parent: {{ getDepartmentName(dept.parentId) }}</p>
                  @if (dept.description) {
                    <p class="mt-2 text-sm leading-7 text-slate-600">{{ dept.description }}</p>
                  }
                </div>
                <div class="flex items-center gap-3">
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">ID {{ dept.id }}</span>
                  <span class="rounded-full px-3 py-1 text-xs font-semibold" [ngClass]="dept.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">
                    {{ dept.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
            } @empty {
              <div class="px-6 py-14 text-center text-slate-500">No departments found.</div>
            }
          </div>
        </section>
      </div>
    </div>
  `
})
export class DepartmentsComponent implements OnInit {
  private orgService = inject(OrganizationService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  departments = signal<Department[]>([]);
  searchQuery = signal('');
  saving = signal(false);

  departmentForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    parentId: [null as number | null],
    description: ['']
  });

  filteredDepartments = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.departments();
    return this.departments().filter((dept) =>
      dept.name.toLowerCase().includes(q) ||
      (dept.description || '').toLowerCase().includes(q)
    );
  });

  ngOnInit() {
    this.loadDepartments();
  }

  loadDepartments() {
    this.orgService.getDepartments().subscribe({
      next: (departments) => this.departments.set(departments),
      error: () => {
        this.departments.set([]);
        this.toastService.error('Failed to load departments');
      }
    });
  }

  updateSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  saveDepartment() {
    if (this.departmentForm.invalid) return;
    this.saving.set(true);
    const value = this.departmentForm.getRawValue();
    this.orgService.createDepartment({
      name: (value.name || '').trim(),
      parentId: value.parentId,
      description: (value.description || '').trim() || null,
      isActive: true
    }).subscribe({
      next: (department) => {
        this.departments.update((list) => [department, ...list]);
        this.departmentForm.reset({ name: '', parentId: null, description: '' });
        this.toastService.success('Department saved successfully');
      },
      error: () => this.toastService.error('Failed to save department'),
      complete: () => this.saving.set(false)
    });
  }

  getDepartmentName(parentId?: number | null): string {
    if (!parentId) return 'No parent department';
    return this.departments().find((dept) => dept.id === parentId)?.name || 'Unknown department';
  }
}
