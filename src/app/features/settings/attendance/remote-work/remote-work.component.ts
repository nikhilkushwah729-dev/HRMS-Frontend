import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../../../core/services/toast.service';
import {
  UiSelectAdvancedComponent,
  SelectOption,
} from '../../../../core/components/ui/ui-select-advanced.component';

interface RemoteWorkPlan {
  id: string;
  name: string;
  allowedDays: number;
  approvalWindow: string;
  appliesTo: string;
  isActive: boolean;
}

@Component({
  selector: 'app-remote-work',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiSelectAdvancedComponent],
  template: `
    <div class="mx-auto max-w-7xl space-y-6 px-1 py-2">
      <section class="app-module-hero">
        <div>
          <p class="app-module-kicker">Attendance Settings</p>
          <h1 class="app-module-title">Remote Work Policies</h1>
          <p class="app-module-text max-w-2xl">
            Set clear WFH entitlements, approval cadence, and team-specific
            allowances while keeping the module reliably usable even before
            dedicated backend endpoints are finalized.
          </p>
        </div>
        <div class="app-module-highlight">
          <p
            class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
          >
            Configured plans
          </p>
          <p class="mt-3 text-3xl font-black text-slate-900">
            {{ plans().length }}
          </p>
          <p class="mt-2 text-sm text-slate-600">
            Active plans: {{ activeCount() }}
          </p>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section class="app-surface-card">
          <div class="mb-6">
            <p
              class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
            >
              {{ editingId() ? 'Update Plan' : 'Create Plan' }}
            </p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">
              Remote work allowance
            </h2>
          </div>

          <form
            [formGroup]="planForm"
            (ngSubmit)="savePlan()"
            class="space-y-4"
          >
            <div class="flex flex-col gap-2">
              <label
                class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >Plan Name</label
              >
              <input
                formControlName="name"
                class="app-field"
                placeholder="Standard WFH"
              />
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >Allowed Days / Month</label
                >
                <input
                  type="number"
                  min="1"
                  formControlName="allowedDays"
                  class="app-field"
                  placeholder="4"
                />
              </div>
              <div class="flex flex-col gap-2">
                <app-ui-select-advanced
                  formControlName="approvalWindow"
                  label="Approval Window"
                  placeholder="Select Approval Window"
                  [options]="approvalWindowOptions"
                  [searchable]="false"
                ></app-ui-select-advanced>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <label
                class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >Applies To</label
              >
              <input
                formControlName="appliesTo"
                class="app-field"
                placeholder="Engineering"
              />
            </div>

            <label
              class="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
            >
              <input
                type="checkbox"
                formControlName="isActive"
                class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
              />
              Keep this remote work plan active
            </label>

            <div class="flex gap-3">
              <button
                type="submit"
                [disabled]="planForm.invalid"
                class="flex-1 rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {{ editingId() ? 'Update Plan' : 'Save Plan' }}
              </button>
              <button
                type="button"
                (click)="resetForm()"
                class="rounded-md border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
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
                  Plan Directory
                </p>
                <h2 class="mt-2 text-2xl font-black text-slate-900">
                  Remote eligibility matrix
                </h2>
              </div>
              <input
                [value]="searchQuery()"
                (input)="updateSearch($event)"
                class="app-field w-full max-w-sm"
                placeholder="Search plans"
              />
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            @for (plan of filteredPlans(); track plan.id) {
              <article
                class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div class="flex flex-wrap items-center gap-3">
                    <p class="text-lg font-black text-slate-900">
                      {{ plan.name }}
                    </p>
                    <span
                      class="rounded-full px-3 py-1 text-xs font-semibold"
                      [ngClass]="
                        plan.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      "
                      >{{ plan.isActive ? 'Active' : 'Inactive' }}</span
                    >
                    <span
                      class="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700"
                      >{{ plan.allowedDays }} days / month</span
                    >
                  </div>
                  <p class="mt-2 text-sm text-slate-600">
                    {{ plan.appliesTo }} | {{ plan.approvalWindow }}
                  </p>
                </div>
                <div class="flex gap-3">
                  <button
                    type="button"
                    (click)="editPlan(plan)"
                    class="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    (click)="deletePlan(plan.id)"
                    class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            } @empty {
              <div class="px-6 py-14 text-center text-slate-500">
                No remote work plans found.
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `,
})
export class RemoteWorkComponent implements OnInit {
  private readonly storageKey = 'hrms_remote_work_plans';
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  plans = signal<RemoteWorkPlan[]>([]);
  searchQuery = signal('');
  editingId = signal<string | null>(null);

  approvalWindowOptions: SelectOption[] = [
    { label: 'Manager Approval', value: 'Manager Approval' },
    { label: 'Auto Approved', value: 'Auto Approved' },
    { label: 'Manager + HR', value: 'Manager + HR' },
  ];

  planForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    allowedDays: [4, [Validators.required, Validators.min(1)]],
    approvalWindow: ['Manager Approval', Validators.required],
    appliesTo: ['', [Validators.required, Validators.minLength(2)]],
    isActive: [true],
  });

  filteredPlans = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.plans();
    return this.plans().filter(
      (plan) =>
        plan.name.toLowerCase().includes(query) ||
        plan.appliesTo.toLowerCase().includes(query) ||
        plan.approvalWindow.toLowerCase().includes(query),
    );
  });

  activeCount = computed(
    () => this.plans().filter((plan) => plan.isActive).length,
  );

  ngOnInit(): void {
    this.loadPlans();
  }

  private persist(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.plans()));
  }

  private loadPlans(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.plans.set(JSON.parse(stored));
        return;
      }
    } catch {}

    this.plans.set([
      {
        id: 'remote-1',
        name: 'Standard WFH',
        allowedDays: 4,
        approvalWindow: 'Manager Approval',
        appliesTo: 'Corporate team',
        isActive: true,
      },
      {
        id: 'remote-2',
        name: 'Engineering Flex',
        allowedDays: 8,
        approvalWindow: 'Manager + HR',
        appliesTo: 'Engineering',
        isActive: true,
      },
    ]);
  }

  updateSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  savePlan(): void {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    const value = this.planForm.getRawValue();
    const plan: RemoteWorkPlan = {
      id: this.editingId() ?? `remote-${Date.now()}`,
      name: value.name.trim(),
      allowedDays: Number(value.allowedDays),
      approvalWindow: value.approvalWindow,
      appliesTo: value.appliesTo.trim(),
      isActive: value.isActive,
    };

    if (this.editingId()) {
      this.plans.update((list) =>
        list.map((item) => (item.id === plan.id ? plan : item)),
      );
      this.toastService.success('Remote work plan updated.');
    } else {
      this.plans.update((list) => [plan, ...list]);
      this.toastService.success('Remote work plan created.');
    }

    this.persist();
    this.resetForm();
  }

  editPlan(plan: RemoteWorkPlan): void {
    this.editingId.set(plan.id);
    this.planForm.patchValue({
      name: plan.name,
      allowedDays: plan.allowedDays,
      approvalWindow: plan.approvalWindow,
      appliesTo: plan.appliesTo,
      isActive: plan.isActive,
    });
  }

  deletePlan(id: string): void {
    if (!confirm('Are you sure you want to delete this remote work plan?')) {
      return;
    }

    this.plans.update((list) => list.filter((plan) => plan.id !== id));
    this.persist();
    if (this.editingId() === id) {
      this.resetForm();
    }
    this.toastService.success('Remote work plan removed.');
  }

  resetForm(): void {
    this.editingId.set(null);
    this.planForm.reset({
      name: '',
      allowedDays: 4,
      approvalWindow: 'Manager Approval',
      appliesTo: '',
      isActive: true,
    });
  }
}
