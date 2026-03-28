import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  OrganizationService,
  Department,
  Designation,
} from '../../core/services/organization.service';
import { ToastService } from '../../core/services/toast.service';
import {
  UiSelectAdvancedComponent,
  SelectOption,
} from '../../core/components/ui/ui-select-advanced.component';

interface Module {
  id: number;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiSelectAdvancedComponent],
  template: `
    <div class="max-w-5xl mx-auto py-8">
      <header
        class="app-module-hero mb-10 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5"
      >
        <div class="max-w-2xl">
          <p class="app-module-kicker">Administration</p>
          <h1 class="app-module-title mt-3">
            System configuration and organization controls
          </h1>
          <p class="app-module-text mt-3">
            Control active modules, maintain departments, and manage
            designations through one clean administration workspace.
          </p>
        </div>
        <div class="app-module-highlight min-w-[240px]">
          <span class="app-module-highlight-label">Enabled modules</span>
          <div class="app-module-highlight-value mt-3">
            {{ activeModuleCount() }}
          </div>
          <p class="mt-2 text-sm text-white/80">
            Current organization modules available for employees and
            administrators.
          </p>
        </div>
      </header>

      <div class="app-chip-switch mb-8">
        <button
          (click)="activeTab.set('modules')"
          class="app-chip-button"
          [ngClass]="
            activeTab() === 'modules'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500'
          "
        >
          Modules
        </button>
        <button
          (click)="activeTab.set('departments')"
          class="app-chip-button"
          [ngClass]="
            activeTab() === 'departments'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500'
          "
        >
          Departments
        </button>
        <button
          (click)="activeTab.set('designations')"
          class="app-chip-button"
          [ngClass]="
            activeTab() === 'designations'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500'
          "
        >
          Designations
        </button>
      </div>

      @if (activeTab() === 'modules') {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (module of modules(); track module.id) {
            <div
              class="group relative bg-white rounded-md border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all duration-300 overflow-hidden"
            >
              <div
                class="absolute -right-10 -top-10 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl group-hover:bg-primary-500/10 transition-colors"
              ></div>
              <div class="flex flex-col h-full items-start">
                <div
                  class="w-14 h-14 bg-slate-50 rounded-md flex items-center justify-center mb-6 group-hover:bg-primary-50 text-slate-400 group-hover:text-primary-600 transition-all duration-300"
                >
                  @if (module.slug === 'attendance') {
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  } @else if (module.slug === 'payroll') {
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path
                        d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                      />
                    </svg>
                  } @else if (module.slug === 'projects') {
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M12 2H2v10c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-2"
                      />
                      <path d="M2 7h18" />
                      <path d="M9 2v12" />
                    </svg>
                  } @else {
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M12 3v19" />
                      <path d="M5 8h14" />
                      <path
                        d="M15 21a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6z"
                      />
                    </svg>
                  }
                </div>

                <h3 class="text-xl font-bold text-slate-900 mb-3">
                  {{ module.name }}
                </h3>
                <p
                  class="text-slate-500 text-sm leading-relaxed mb-8 flex-grow"
                >
                  {{ module.description }}
                </p>

                <div
                  class="w-full flex items-center justify-between pt-6 border-t border-slate-50"
                >
                  <span
                    class="text-sm font-bold tracking-tight"
                    [ngClass]="
                      module.isActive ? 'text-primary-600' : 'text-slate-400'
                    "
                  >
                    {{ module.isActive ? 'ENABLED' : 'DISABLED' }}
                  </span>

                  <button
                    (click)="toggleModule(module)"
                    class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
                    [ngClass]="
                      module.isActive ? 'bg-primary-600' : 'bg-slate-200'
                    "
                  >
                    <span
                      class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      [ngClass]="
                        module.isActive ? 'translate-x-5' : 'translate-x-0'
                      "
                    ></span>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      @if (activeTab() === 'departments') {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            class="lg:col-span-1 bg-white border border-slate-100 rounded-md p-6 shadow-sm"
          >
            <h3 class="text-lg font-bold text-slate-900 mb-4">
              Add Department
            </h3>
            <form
              [formGroup]="departmentForm"
              (ngSubmit)="addDepartment()"
              class="space-y-4"
            >
              <div class="space-y-1.5">
                <label class="app-field-label">Department Name</label>
                <input
                  formControlName="name"
                  type="text"
                  class="app-field"
                  placeholder="Department name"
                />
              </div>
              <div class="space-y-1.5">
                <label class="app-field-label">Parent Department</label>
                <app-ui-select-advanced
                  formControlName="parentId"
                  [options]="parentDepartmentOptions()"
                  placeholder="No Parent Department"
                  size="sm"
                  [searchable]="true"
                ></app-ui-select-advanced>
              </div>
              <div class="space-y-1.5">
                <label class="app-field-label">Description</label>
                <textarea
                  formControlName="description"
                  rows="2"
                  class="app-field resize-none"
                  placeholder="Description (optional)"
                ></textarea>
              </div>
              <button
                type="submit"
                [disabled]="departmentForm.invalid || savingDepartment()"
                class="w-full bg-primary-600 text-white py-2.5 rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50"
              >
                {{ savingDepartment() ? 'Saving...' : 'Add Department' }}
              </button>
            </form>
          </div>
          <div
            class="lg:col-span-2 bg-white border border-slate-100 rounded-md overflow-hidden"
          >
            <div class="px-6 py-4 border-b border-slate-100">
              <h3 class="text-lg font-bold text-slate-900">
                Departments ({{ departments().length }})
              </h3>
            </div>
            <div class="divide-y divide-slate-50">
              @for (dept of departments(); track dept.id) {
                <div class="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p class="font-semibold text-slate-900">{{ dept.name }}</p>
                    <p class="text-xs text-slate-400">
                      ID: {{ dept.id }} | Parent:
                      {{ getDepartmentName(dept.parentId) }}
                    </p>
                    @if (dept.description) {
                      <p class="text-xs text-slate-500 mt-1">
                        {{ dept.description }}
                      </p>
                    }
                  </div>
                  <span
                    class="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-slate-50 text-slate-500"
                    >Department</span
                  >
                </div>
              } @empty {
                <div class="px-6 py-12 text-center text-slate-400 font-medium">
                  No departments found.
                </div>
              }
            </div>
          </div>
        </div>
      }

      @if (activeTab() === 'designations') {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            class="lg:col-span-1 bg-white border border-slate-100 rounded-md p-6 shadow-sm"
          >
            <h3 class="text-lg font-bold text-slate-900 mb-4">
              Add Designation
            </h3>
            <form
              [formGroup]="designationForm"
              (ngSubmit)="addDesignation()"
              class="space-y-4"
            >
              <div class="space-y-1.5">
                <label class="app-field-label">Designation Name</label>
                <input
                  formControlName="name"
                  type="text"
                  class="app-field"
                  placeholder="Designation name"
                />
              </div>
              <div class="space-y-1.5">
                <label class="app-field-label">Department</label>
                <app-ui-select-advanced
                  formControlName="departmentId"
                  [options]="designationDepartmentOptions()"
                  placeholder="No Department"
                  size="sm"
                  [searchable]="true"
                ></app-ui-select-advanced>
              </div>
              <button
                type="submit"
                [disabled]="designationForm.invalid || savingDesignation()"
                class="w-full bg-primary-600 text-white py-2.5 rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50"
              >
                {{ savingDesignation() ? 'Saving...' : 'Add Designation' }}
              </button>
            </form>
          </div>
          <div
            class="lg:col-span-2 bg-white border border-slate-100 rounded-md overflow-hidden"
          >
            <div class="px-6 py-4 border-b border-slate-100">
              <h3 class="text-lg font-bold text-slate-900">
                Designations ({{ designations().length }})
              </h3>
            </div>
            <div class="divide-y divide-slate-50">
              @for (des of designations(); track des.id) {
                <div class="px-6 py-4 flex items-center justify-between gap-3">
                  <div>
                    <p class="font-semibold text-slate-900">{{ des.name }}</p>
                    <p class="text-xs text-slate-400">
                      Department: {{ getDepartmentName(des.departmentId) }}
                    </p>
                  </div>
                  <span
                    class="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-violet-50 text-violet-600"
                    >Designation</span
                  >
                </div>
              } @empty {
                <div class="px-6 py-12 text-center text-slate-400 font-medium">
                  No designations found.
                </div>
              }
            </div>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <div
            class="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"
          ></div>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class SettingsComponent implements OnInit {
  private orgService = inject(OrganizationService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  modules = signal<Module[]>([]);
  departments = signal<Department[]>([]);
  designations = signal<Designation[]>([]);
  loading = signal<boolean>(true);
  savingDepartment = signal<boolean>(false);
  savingDesignation = signal<boolean>(false);
  activeTab = signal<'modules' | 'departments' | 'designations'>('modules');

  departmentForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    parentId: [null as number | null],
    description: [''],
  });

  designationForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    departmentId: [null as number | null],
  });

  parentDepartmentOptions = computed<SelectOption[]>(() => [
    { label: 'No Parent Department', value: null },
    ...this.departments().map((dept) => ({ label: dept.name, value: dept.id })),
  ]);

  designationDepartmentOptions = computed<SelectOption[]>(() => [
    { label: 'No Department', value: null },
    ...this.departments().map((dept) => ({ label: dept.name, value: dept.id })),
  ]);

  ngOnInit() {
    this.fetchAll();
  }

  fetchAll() {
    this.loading.set(true);
    this.orgService.getAddons().subscribe({
      next: (addons) => {
        this.modules.set(addons);
        this.orgService.getDepartments().subscribe({
          next: (depts) => {
            this.departments.set(depts);
            this.orgService.getDesignations().subscribe({
              next: (desigs) => {
                this.designations.set(desigs);
                this.loading.set(false);
              },
              error: (err) => {
                console.error('Failed to load designations', err);
                this.toastService.error('Failed to load designations');
                this.loading.set(false);
              },
            });
          },
          error: (err) => {
            console.error('Failed to load departments', err);
            this.toastService.error('Failed to load departments');
            this.loading.set(false);
          },
        });
      },
      error: (err) => {
        console.error('Failed to load settings data', err);
        this.toastService.error('Failed to load system configuration');
        this.loading.set(false);
      },
    });
  }

  activeModuleCount(): number {
    return this.modules().filter((module) => module.isActive).length;
  }

  toggleModule(module: Module) {
    const newState = !module.isActive;

    // Optimistic UI update
    this.modules.update((mods) =>
      mods.map((m) => (m.id === module.id ? { ...m, isActive: newState } : m)),
    );

    this.orgService.toggleAddon(module.id, newState).subscribe({
      next: () => {
        this.toastService.success(
          `Module ${module.name} ${newState ? 'enabled' : 'disabled'}`,
        );
      },
      error: (err) => {
        console.error('Toggle error', err);
        this.toastService.error(`Failed to update ${module.name}`);
        // Revert UI on error
        this.modules.update((mods) =>
          mods.map((m) =>
            m.id === module.id ? { ...m, isActive: !newState } : m,
          ),
        );
      },
    });
  }

  addDepartment() {
    if (this.departmentForm.invalid) return;
    this.savingDepartment.set(true);
    const name = (this.departmentForm.value.name || '').trim();
    const parentId = this.departmentForm.value.parentId;
    const description = (this.departmentForm.value.description || '').trim();

    this.orgService
      .createDepartment({
        name,
        parentId,
        description: description || null,
        isActive: true,
      })
      .subscribe({
        next: (dept) => {
          this.departments.update((list) => [dept, ...list]);
          this.departmentForm.reset({
            parentId: null,
            description: '',
            name: '',
          });
          this.toastService.success('Department created successfully');
        },
        error: (err) => {
          console.error('Failed to create department', err);
          this.toastService.error('Failed to create department');
        },
        complete: () => this.savingDepartment.set(false),
      });
  }

  addDesignation() {
    if (this.designationForm.invalid) return;
    this.savingDesignation.set(true);
    const name = (this.designationForm.value.name || '').trim();
    const departmentId = this.designationForm.value.departmentId;

    this.orgService.createDesignation({ name, departmentId }).subscribe({
      next: (designation) => {
        this.designations.update((list) => [designation, ...list]);
        this.designationForm.reset({ departmentId: null, name: '' });
        this.toastService.success('Designation created successfully');
      },
      error: (err) => {
        console.error('Failed to create designation', err);
        this.toastService.error('Failed to create designation');
      },
      complete: () => this.savingDesignation.set(false),
    });
  }

  getDepartmentName(departmentId?: number | null): string {
    if (!departmentId) return 'No Department';
    return (
      this.departments().find((d) => d.id === departmentId)?.name ||
      'Unknown Department'
    );
  }
}
