import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AttendanceService,
  AttendanceShift,
} from '../../../../core/services/attendance.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  UiSelectAdvancedComponent,
  SelectOption,
} from '../../../../core/components/ui/ui-select-advanced.component';

@Component({
  selector: 'app-shift',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiSelectAdvancedComponent],
  template: `
    <div class="mx-auto max-w-7xl space-y-6 px-1 py-2">
      <section
        class="overflow-hidden rounded-md border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_38%),linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#eef2ff_100%)] shadow-sm"
      >
        <div
          class="grid gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:py-8"
        >
          <div class="space-y-5">
            <div
              class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
            >
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              Attendance Settings
            </div>
            <div>
              <h1
                class="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl"
              >
                Shift Policies
              </h1>
              <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Manage shift timings, grace windows, and roster-ready templates.
                This page now keeps form controls, status cards, and the shift
                library aligned on both desktop and mobile.
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div
                class="rounded-md border border-white/80 bg-white/90 px-4 py-4 shadow-sm"
              >
                <p
                  class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  Active shifts
                </p>
                <p class="mt-2 text-2xl font-black text-slate-900">
                  {{ activeCount() }}
                </p>
                <p class="mt-1 text-xs text-slate-500">Ready for scheduling</p>
              </div>
              <div
                class="rounded-md border border-white/80 bg-white/90 px-4 py-4 shadow-sm"
              >
                <p
                  class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  Visible now
                </p>
                <p class="mt-2 text-2xl font-black text-slate-900">
                  {{ filteredShifts().length }}
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  Matching current filter
                </p>
              </div>
              <div
                class="rounded-md border border-white/80 bg-white/90 px-4 py-4 shadow-sm"
              >
                <p
                  class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  Mode
                </p>
                <p class="mt-2 text-lg font-black text-slate-900">
                  {{ editingId() ? 'Edit Shift' : 'Create Shift' }}
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  Update or add a schedule
                </p>
              </div>
            </div>
          </div>

          <div
            class="rounded-md border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p
                  class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  Quick Controls
                </p>
                <h2 class="mt-1 text-lg font-black text-slate-900">
                  Shift library search
                </h2>
              </div>
              <button
                type="button"
                (click)="resetForm()"
                class="rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white"
              >
                Reset Form
              </button>
            </div>

            <div class="mt-4 space-y-3">
              <label
                class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >Search shifts</label
              >
              <div class="relative">
                <input
                  [value]="searchQuery()"
                  (input)="updateSearch($event)"
                  class="w-full rounded-md border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-200/60"
                  placeholder="Search by shift name or type"
                />
                <div
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
              </div>
              <div
                class="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
              >
                <p class="font-semibold text-slate-900">
                  Navbar controls aligned
                </p>
                <p class="mt-1 text-xs leading-5 text-slate-500">
                  Search, reset, status cards, and the form panel are now
                  grouped into one stable responsive header.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section class="app-surface-card overflow-hidden p-0">
          <div class="border-b border-slate-100 px-6 py-5">
            <p
              class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
            >
              {{ editingId() ? 'Update Shift' : 'Create Shift' }}
            </p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">
              Timing blueprint
            </h2>
            <p class="mt-2 text-sm leading-6 text-slate-600">
              Set the operational window, shift type, and grace tolerance for
              your team. The form stacks cleanly on small screens and stays
              readable on larger layouts.
            </p>
          </div>
          <div class="px-6 py-6">
            <form
              [formGroup]="shiftForm"
              (ngSubmit)="saveShift()"
              class="space-y-5"
            >
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >Shift Name</label
                >
                <input
                  formControlName="name"
                  class="app-field"
                  placeholder="General Shift"
                />
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div class="flex min-w-0 flex-col gap-2">
                  <label
                    class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                    >Start Time</label
                  >
                  <input
                    type="time"
                    formControlName="start_time"
                    class="app-field"
                  />
                </div>
                <div class="flex min-w-0 flex-col gap-2">
                  <label
                    class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                    >End Time</label
                  >
                  <input
                    type="time"
                    formControlName="end_time"
                    class="app-field"
                  />
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div class="flex min-w-0 flex-col gap-2">
                  <app-ui-select-advanced
                    formControlName="shift_type"
                    label="Shift Type"
                    placeholder="Select Shift Type"
                    [options]="shiftTypeOptions"
                    [searchable]="false"
                  ></app-ui-select-advanced>
                </div>
                <div class="flex min-w-0 flex-col gap-2">
                  <label
                    class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                    >Grace Time (minutes)</label
                  >
                  <input
                    type="number"
                    min="0"
                    formControlName="grace_time"
                    class="app-field"
                    placeholder="15"
                  />
                </div>
              </div>

              <label
                class="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
              >
                <input
                  type="checkbox"
                  formControlName="is_active"
                  class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                />
                Keep this shift active for scheduling
              </label>

              <div class="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  [disabled]="shiftForm.invalid || saving()"
                  class="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {{
                    saving()
                      ? 'Saving...'
                      : editingId()
                        ? 'Update Shift'
                        : 'Save Shift'
                  }}
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
          </div>
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
                  Shift Library
                </p>
                <h2 class="mt-2 text-2xl font-black text-slate-900">
                  Operational schedules
                </h2>
              </div>
              <div
                class="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
              >
                {{ filteredShifts().length }} record(s) shown
              </div>
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            @for (shift of filteredShifts(); track shift.id) {
              <article
                class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-3">
                    <p class="break-words text-lg font-black text-slate-900">
                      {{ shift.name }}
                    </p>
                    <span
                      class="rounded-full px-3 py-1 text-xs font-semibold"
                      [ngClass]="
                        shift.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      "
                      >{{ shift.is_active ? 'Active' : 'Inactive' }}</span
                    >
                    <span
                      class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                      >{{ shift.shift_type }}</span
                    >
                  </div>
                  <p class="mt-2 break-words text-sm leading-6 text-slate-600">
                    {{ shift.start_time }} to {{ shift.end_time }} |
                    {{ shift.working_hours }} hrs | Grace
                    {{ shift.grace_time }} mins
                  </p>
                </div>
                <div class="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    (click)="editShift(shift)"
                    class="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    (click)="deleteShift(shift.id)"
                    class="rounded-md border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            } @empty {
              <div class="px-6 py-14 text-center text-slate-500">
                No shifts found for the current search.
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `,
})
export class ShiftComponent implements OnInit {
  private fb = inject(FormBuilder);
  private attendanceService = inject(AttendanceService);
  private toastService = inject(ToastService);

  shifts = signal<AttendanceShift[]>([]);
  searchQuery = signal('');
  editingId = signal<number | null>(null);
  saving = signal(false);

  shiftTypeOptions: SelectOption[] = [
    { label: 'Fixed', value: 'Fixed' },
    { label: 'Flexi', value: 'Flexi' },
    { label: 'Rotational', value: 'Rotational' },
  ];

  shiftForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    start_time: ['09:00', Validators.required],
    end_time: ['18:00', Validators.required],
    shift_type: ['Fixed', Validators.required],
    grace_time: [15, [Validators.required, Validators.min(0)]],
    is_active: [true],
  });

  filteredShifts = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.shifts();
    return this.shifts().filter(
      (shift) =>
        shift.name.toLowerCase().includes(query) ||
        shift.shift_type.toLowerCase().includes(query),
    );
  });

  activeCount = computed(
    () => this.shifts().filter((shift) => shift.is_active).length,
  );

  ngOnInit(): void {
    this.loadShifts();
  }

  loadShifts(): void {
    this.attendanceService.getShifts().subscribe({
      next: (shifts) => this.shifts.set(shifts),
      error: () => this.toastService.error('Unable to load shifts right now.'),
    });
  }

  updateSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  saveShift(): void {
    if (this.shiftForm.invalid) {
      this.shiftForm.markAllAsTouched();
      return;
    }

    const value = this.shiftForm.getRawValue();
    this.saving.set(true);

    const request$ = this.editingId()
      ? this.attendanceService.updateShift(this.editingId()!, value)
      : this.attendanceService.createShift(value);

    request$.subscribe({
      next: (savedShift) => {
        if (this.editingId()) {
          this.shifts.update((list) =>
            list.map((shift) =>
              shift.id === savedShift.id ? savedShift : shift,
            ),
          );
          this.toastService.success('Shift updated successfully.');
        } else {
          this.shifts.update((list) => [
            savedShift,
            ...list.filter((shift) => shift.id !== savedShift.id),
          ]);
          this.toastService.success('Shift created successfully.');
        }
        this.resetForm();
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.toastService.error('Unable to save this shift right now.');
      },
    });
  }

  editShift(shift: AttendanceShift): void {
    this.editingId.set(shift.id);
    this.shiftForm.patchValue({
      name: shift.name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      shift_type: shift.shift_type,
      grace_time: shift.grace_time,
      is_active: shift.is_active,
    });
  }

  deleteShift(id: number): void {
    if (!confirm('Are you sure you want to delete this shift?')) {
      return;
    }

    this.attendanceService.deleteShift(id).subscribe({
      next: () => {
        this.shifts.update((list) => list.filter((shift) => shift.id !== id));
        if (this.editingId() === id) {
          this.resetForm();
        }
        this.toastService.success('Shift removed successfully.');
      },
      error: () =>
        this.toastService.error('Unable to delete this shift right now.'),
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.shiftForm.reset({
      name: '',
      start_time: '09:00',
      end_time: '18:00',
      shift_type: 'Fixed',
      grace_time: 15,
      is_active: true,
    });
  }
}
