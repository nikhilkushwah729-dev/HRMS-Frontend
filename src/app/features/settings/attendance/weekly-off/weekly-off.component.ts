import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../../../core/services/toast.service';
import { SettingsWorkspaceService } from '../../shared/settings-workspace.service';

interface WeeklyOffPolicy {
  id: string;
  name: string;
  offDays: string[];
  appliesTo: string;
  isActive: boolean;
}

@Component({
  selector: 'app-weekly-off',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-7xl space-y-6">
      <section class="app-module-hero overflow-hidden">
        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div class="space-y-5">
            <div>
              <p class="app-module-kicker">Attendance Settings</p>
              <h1 class="app-module-title">Weekly Off Policies</h1>
              <p class="app-module-text max-w-2xl">
                Configure recurring weekly off patterns for business units and
                keep roster rules structured, searchable, and easy to maintain.
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Policies</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ policies().length }}</p>
                <p class="mt-1 text-xs text-slate-500">Saved rule sets</p>
              </div>
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Active</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ activeCount() }}</p>
                <p class="mt-1 text-xs text-slate-500">Applied right now</p>
              </div>
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Off days</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ distinctOffDays() }}</p>
                <p class="mt-1 text-xs text-slate-500">Unique days configured</p>
              </div>
            </div>
          </div>

          <div class="app-module-highlight">
            <p class="app-module-highlight-label">Roster status</p>
            <p class="mt-3 app-module-highlight-value">Weekend coverage</p>
            <p class="mt-3 text-sm leading-6 text-white/80">
              Standardize rest-day patterns so shifts, attendance, and team
              planning stay aligned across locations.
            </p>
            <div class="mt-4 rounded-md border border-white/15 bg-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              {{ editingId() ? 'Editing an existing weekly-off rule' : 'Create and publish a new weekly-off rule' }}
            </div>
          </div>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section class="app-surface-card">
          <div class="mb-6">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ editingId() ? 'Update Policy' : 'Create Policy' }}</p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">Weekend cadence</h2>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              Map eligible teams to one or more recurring off days and keep the
              policy active only when it should apply operationally.
            </p>
          </div>

          <div class="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p class="font-semibold">Planning note</p>
            <p class="mt-1 leading-6">
              These policy masters feed broader attendance planning, so keeping
              names and audience groups clear will make roster setup easier.
            </p>
          </div>

          <form [formGroup]="policyForm" (ngSubmit)="savePolicy()" class="space-y-4">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Policy Name</label>
              <input formControlName="name" class="app-field" placeholder="Standard Weekend">
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Applies To</label>
              <input formControlName="appliesTo" class="app-field" placeholder="Corporate team">
            </div>

            <div class="flex flex-col gap-3">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Off Days</label>
              <div class="grid grid-cols-2 gap-2">
                @for (day of days; track day) {
                  <label class="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-3 text-sm text-slate-700 transition hover:bg-slate-50">
                    <input type="checkbox" [checked]="selectedDays().includes(day)" (change)="toggleDay(day, $event)" class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500">
                    {{ day }}
                  </label>
                }
              </div>
            </div>

            <label class="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input type="checkbox" formControlName="isActive" class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500">
              Keep this weekly off policy active
            </label>

            <div class="flex gap-3">
              <button type="submit" [disabled]="policyForm.invalid || selectedDays().length === 0" class="flex-1 rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">{{ editingId() ? 'Update Policy' : 'Save Policy' }}</button>
              <button type="button" (click)="resetForm()" class="rounded-md border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Reset</button>
            </div>
          </form>
        </section>

        <section class="app-surface-card overflow-hidden p-0">
          <div class="border-b border-slate-100 px-6 py-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Policy Directory</p>
                <h2 class="mt-2 text-2xl font-black text-slate-900">Saved weekly off rules</h2>
              </div>
              <input [value]="searchQuery()" (input)="updateSearch($event)" class="app-field w-full max-w-sm" placeholder="Search policies">
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            @for (policy of filteredPolicies(); track policy.id) {
              <article class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div class="flex flex-wrap items-center gap-3">
                    <p class="text-lg font-black text-slate-900">{{ policy.name }}</p>
                    <span class="rounded-full px-3 py-1 text-xs font-semibold" [ngClass]="policy.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">{{ policy.isActive ? 'Active' : 'Inactive' }}</span>
                  </div>
                  <p class="mt-2 text-sm text-slate-600">{{ policy.appliesTo }}</p>
                  <div class="mt-3 flex flex-wrap gap-2">
                    @for (day of policy.offDays; track day) {
                      <span class="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">{{ day }}</span>
                    }
                  </div>
                </div>
                <div class="flex gap-3">
                  <button type="button" (click)="editPolicy(policy)" class="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Edit</button>
                  <button type="button" (click)="deletePolicy(policy.id)" class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">Delete</button>
                </div>
              </article>
            } @empty {
              <div class="px-6 py-16 text-center">
                <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 2v4" />
                    <path d="M16 2v4" />
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M3 10h18" />
                  </svg>
                </div>
                <p class="mt-4 text-base font-semibold text-slate-900">No weekly off policies yet</p>
                <p class="mt-2 text-sm text-slate-500">
                  Add a policy to define weekend or alternate off-day patterns
                  for teams and locations.
                </p>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `
})
export class WeeklyOffComponent implements OnInit {
  private readonly storageKey = 'hrms_weekly_off_policies';
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
  private workspace = inject(SettingsWorkspaceService);

  readonly days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  policies = signal<WeeklyOffPolicy[]>([]);
  searchQuery = signal('');
  editingId = signal<string | null>(null);
  selectedDays = signal<string[]>([]);

  policyForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    appliesTo: ['', [Validators.required, Validators.minLength(2)]],
    isActive: [true]
  });

  filteredPolicies = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.policies();
    return this.policies().filter((policy) =>
      policy.name.toLowerCase().includes(query) || policy.appliesTo.toLowerCase().includes(query)
    );
  });

  activeCount = computed(() => this.policies().filter((policy) => policy.isActive).length);
  distinctOffDays = computed(() => new Set(this.policies().flatMap((policy) => policy.offDays)).size);

  ngOnInit(): void {
    this.loadPolicies();
  }

  private persist(): void {
    this.workspace
      .saveCollection(this.storageKey, this.policies())
      .subscribe((items) => this.policies.set(items));
  }

  private loadPolicies(): void {
    const seeds = [
      { id: 'weekly-1', name: 'Standard Weekend', offDays: ['Saturday', 'Sunday'], appliesTo: 'Corporate team', isActive: true },
      { id: 'weekly-2', name: 'Operations Rest', offDays: ['Monday'], appliesTo: 'Field operations', isActive: true }
    ];
    this.workspace.getCollection<WeeklyOffPolicy>(this.storageKey, seeds).subscribe((items) => {
      this.policies.set(items.length ? items : seeds);
    });
  }

  updateSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  toggleDay(day: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedDays.update((days) => checked ? [...days, day] : days.filter((item) => item !== day));
  }

  savePolicy(): void {
    if (this.policyForm.invalid || this.selectedDays().length === 0) {
      this.policyForm.markAllAsTouched();
      this.toastService.warning('Select at least one weekly off day.');
      return;
    }

    const value = this.policyForm.getRawValue();
    const policy: WeeklyOffPolicy = {
      id: this.editingId() ?? `weekly-${Date.now()}`,
      name: value.name.trim(),
      appliesTo: value.appliesTo.trim(),
      offDays: [...this.selectedDays()],
      isActive: value.isActive
    };

    if (this.editingId()) {
      this.policies.update((list) => list.map((item) => item.id === policy.id ? policy : item));
      this.toastService.success('Weekly off policy updated.');
    } else {
      this.policies.update((list) => [policy, ...list]);
      this.toastService.success('Weekly off policy created.');
    }

    this.persist();
    this.resetForm();
  }

  editPolicy(policy: WeeklyOffPolicy): void {
    this.editingId.set(policy.id);
    this.selectedDays.set([...policy.offDays]);
    this.policyForm.patchValue({
      name: policy.name,
      appliesTo: policy.appliesTo,
      isActive: policy.isActive
    });
  }

  deletePolicy(id: string): void {
    if (!confirm('Are you sure you want to delete this weekly off policy?')) {
      return;
    }

    this.policies.update((list) => list.filter((policy) => policy.id !== id));
    this.persist();
    if (this.editingId() === id) {
      this.resetForm();
    }
    this.toastService.success('Weekly off policy removed.');
  }

  resetForm(): void {
    this.editingId.set(null);
    this.selectedDays.set([]);
    this.policyForm.reset({
      name: '',
      appliesTo: '',
      isActive: true
    });
  }
}
