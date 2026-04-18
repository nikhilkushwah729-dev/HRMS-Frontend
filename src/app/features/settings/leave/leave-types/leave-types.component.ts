import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LeaveService, LeaveTypeBalance } from '../../../../core/services/leave.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-leave-types-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-7xl space-y-6">
      <section class="app-module-hero overflow-hidden">
        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div class="space-y-5">
            <div>
              <p class="app-module-kicker">Leave Settings</p>
              <h1 class="app-module-title">Leave Types</h1>
              <p class="app-module-text max-w-2xl">Manage leave buckets visible to the organization with real backend-backed policy masters.</p>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Available leave types</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ leaveTypes().length }}</p>
                <p class="mt-1 text-xs text-slate-500">Visible buckets</p>
              </div>
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Paid buckets</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ paidCount() }}</p>
                <p class="mt-1 text-xs text-slate-500">Compensated leave types</p>
              </div>
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Editor mode</p>
                <p class="mt-2 text-lg font-black text-slate-900">{{ editingId() ? 'Edit policy' : 'Create policy' }}</p>
                <p class="mt-1 text-xs text-slate-500">Live backend persistence</p>
              </div>
            </div>
          </div>

          <div class="app-module-highlight">
            <p class="app-module-highlight-label">Policy note</p>
            <p class="mt-3 app-module-highlight-value">Leave matrix</p>
            <p class="mt-3 text-sm leading-6 text-white/80">Leave type masters now save directly to backend so policies stay shared, stable, and production-ready.</p>
            <div class="mt-4 rounded-md border border-white/15 bg-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              {{ editingId() ? 'Editing a live leave policy' : 'Ready to create a new leave policy' }}
            </div>
          </div>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section class="app-surface-card overflow-hidden">
          <div class="border-b border-slate-100 px-6 py-5">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ editingId() ? 'Update Leave Type' : 'Add Leave Type' }}</p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">Leave policy bucket</h2>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              Define the buckets employees can request and keep policy names,
              entitlements, and paid status consistent across the HRMS.
            </p>
          </div>

          <div class="mx-6 mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p class="font-semibold">Backend sync</p>
            <p class="mt-1 leading-6">
              These leave types are backend-backed, so updates here affect the
              shared organization leave matrix instead of only local browser state.
            </p>
          </div>

          <form [formGroup]="leaveTypeForm" (ngSubmit)="save()" class="space-y-4 px-6 py-6">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Type Name</label>
              <input formControlName="typeName" class="app-field" placeholder="Casual Leave" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Days Allowed</label>
              <input type="number" formControlName="daysAllowed" class="app-field" placeholder="12" />
            </div>
            <label class="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input type="checkbox" formControlName="isPaid" class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500" />
              Paid leave
            </label>
            <div class="grid gap-3 sm:grid-cols-2">
              <button type="submit" [disabled]="leaveTypeForm.invalid || saving()" class="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
                {{ saving() ? 'Saving...' : editingId() ? 'Update Leave Type' : 'Save Leave Type' }}
              </button>
              <button type="button" (click)="resetForm()" class="rounded-md border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                {{ t('common.reset') }}
              </button>
            </div>
          </form>
        </section>

        <section class="app-surface-card overflow-hidden p-0">
          <div class="border-b border-slate-100 px-6 py-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Leave Type Directory</p>
                <h2 class="mt-2 text-2xl font-black text-slate-900">Configured buckets</h2>
              </div>
              <input [value]="searchQuery()" (input)="updateSearch($event)" class="app-field w-full max-w-sm" placeholder="Search leave types" />
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            @for (leaveType of filteredLeaveTypes(); track leaveType.id) {
              <article class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div class="flex flex-wrap items-center gap-3">
                    <p class="text-lg font-black text-slate-900">{{ leaveType.typeName }}</p>
                    <span class="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">Policy</span>
                  </div>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{{ leaveType.daysAllowed }} days</span>
                    <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{{ leaveType.isPaid ? 'Paid' : 'Unpaid' }}</span>
                    <span class="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">{{ leaveType.remaining }} remaining</span>
                  </div>
                </div>
                <div class="flex gap-3">
                  <button type="button" (click)="editLeaveType(leaveType)" class="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    {{ t('common.edit') }}
                  </button>
                  <button type="button" (click)="removeLeaveType(leaveType.id)" class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">
                    {{ t('common.delete') }}
                  </button>
                </div>
              </article>
            } @empty {
              <div class="px-6 py-16 text-center">
                <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                </div>
                <p class="mt-4 text-base font-semibold text-slate-900">{{ t('common.noResults') }}</p>
                <p class="mt-2 text-sm text-slate-500">
                  Create the first leave bucket to make policy options available
                  for employees and approval flows.
                </p>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `
})
export class LeaveTypesComponent implements OnInit {
  private readonly leaveService = inject(LeaveService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly languageService = inject(LanguageService);

  leaveTypes = signal<LeaveTypeBalance[]>([]);
  searchQuery = signal('');
  saving = signal(false);
  editingId = signal<number | null>(null);

  leaveTypeForm = this.fb.nonNullable.group({
    typeName: ['', [Validators.required, Validators.minLength(2)]],
    daysAllowed: [1, [Validators.required, Validators.min(1)]],
    isPaid: [true]
  });

  filteredLeaveTypes = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.leaveTypes();
    return this.leaveTypes().filter((item) => item.typeName.toLowerCase().includes(query));
  });

  paidCount = computed(() => this.leaveTypes().filter((item) => item.isPaid).length);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.leaveService.getLeaveTypes().subscribe({
      next: (response) => this.leaveTypes.set(response.data),
      error: () => {
        this.leaveTypes.set([]);
        this.toastService.warning('Backend leave types unavailable right now.');
      }
    });
  }

  updateSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  save(): void {
    if (this.leaveTypeForm.invalid) {
      this.leaveTypeForm.markAllAsTouched();
      return;
    }

    const value = this.leaveTypeForm.getRawValue();
    const payload = {
      typeName: value.typeName.trim(),
      daysAllowed: Number(value.daysAllowed),
      carryForward: false,
      maxCarryDays: 0,
      isPaid: value.isPaid,
      requiresDoc: false,
    };

    this.saving.set(true);
    const request$ = this.editingId()
      ? this.leaveService.updateLeaveType(this.editingId()!, payload)
      : this.leaveService.createLeaveType(payload);

    request$.subscribe({
      next: (saved) => {
        this.leaveTypes.update((items) =>
          this.editingId()
            ? items.map((item) => item.id === saved.id ? saved : item)
            : [saved, ...items]
        );
        this.resetForm();
        this.toastService.success(this.editingId() ? 'Leave type updated successfully.' : 'Leave type saved successfully.');
      },
      error: () => this.toastService.error('Failed to save leave type.'),
      complete: () => this.saving.set(false),
    });
  }

  editLeaveType(leaveType: LeaveTypeBalance): void {
    this.editingId.set(leaveType.id);
    this.leaveTypeForm.patchValue({
      typeName: leaveType.typeName,
      daysAllowed: leaveType.daysAllowed,
      isPaid: leaveType.isPaid,
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.leaveTypeForm.reset({ typeName: '', daysAllowed: 1, isPaid: true });
  }

  removeLeaveType(id: number): void {
    this.leaveService.deleteLeaveType(id).subscribe({
      next: (ok) => {
        if (!ok) {
          this.toastService.error('Failed to delete leave type.');
          return;
        }
        this.leaveTypes.update((items) => items.filter((item) => item.id !== id));
        if (this.editingId() === id) {
          this.resetForm();
        }
        this.toastService.success('Leave type removed successfully.');
      },
      error: () => this.toastService.error('Failed to delete leave type.'),
    });
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    this.languageService.currentLanguage();
    return this.languageService.t(key, params);
  }
}
