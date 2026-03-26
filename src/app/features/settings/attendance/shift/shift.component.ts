import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AttendanceService, AttendanceShift } from '../../../../core/services/attendance.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-shift',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-7xl space-y-6 px-1 py-2">
      <section class="app-module-hero">
        <div>
          <p class="app-module-kicker">Attendance Settings</p>
          <h1 class="app-module-title">Shift Policies</h1>
          <p class="app-module-text max-w-2xl">Manage shift timings, grace windows, and roster-ready templates. The screen now reads real backend shifts when available and safely falls back to local policies when the backend is still expanding.</p>
        </div>
        <div class="app-module-highlight">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Active shifts</p>
          <p class="mt-3 text-3xl font-black text-slate-900">{{ activeCount() }}</p>
          <p class="mt-2 text-sm text-slate-600">Filtered records: {{ filteredShifts().length }}</p>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section class="app-surface-card">
          <div class="mb-6">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ editingId() ? 'Update Shift' : 'Create Shift' }}</p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">Timing blueprint</h2>
            <p class="mt-2 text-sm text-slate-600">Set the operational window and default grace tolerance for the team.</p>
          </div>

          <form [formGroup]="shiftForm" (ngSubmit)="saveShift()" class="space-y-4">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Shift Name</label>
              <input formControlName="name" class="app-field" placeholder="General Shift">
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Start Time</label>
                <input type="time" formControlName="start_time" class="app-field">
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">End Time</label>
                <input type="time" formControlName="end_time" class="app-field">
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Shift Type</label>
                <select formControlName="shift_type" class="app-field">
                  <option value="Fixed">Fixed</option>
                  <option value="Flexi">Flexi</option>
                  <option value="Rotational">Rotational</option>
                </select>
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Grace Time (minutes)</label>
                <input type="number" min="0" formControlName="grace_time" class="app-field" placeholder="15">
              </div>
            </div>

            <label class="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input type="checkbox" formControlName="is_active" class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500">
              Keep this shift active for scheduling
            </label>

            <div class="flex gap-3">
              <button type="submit" [disabled]="shiftForm.invalid || saving()" class="flex-1 rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
                {{ saving() ? 'Saving...' : editingId() ? 'Update Shift' : 'Save Shift' }}
              </button>
              <button type="button" (click)="resetForm()" class="rounded-md border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Reset</button>
            </div>
          </form>
        </section>

        <section class="app-surface-card overflow-hidden p-0">
          <div class="border-b border-slate-100 px-6 py-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Shift Library</p>
                <h2 class="mt-2 text-2xl font-black text-slate-900">Operational schedules</h2>
              </div>
              <input [value]="searchQuery()" (input)="updateSearch($event)" class="app-field w-full max-w-sm" placeholder="Search shifts">
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            @for (shift of filteredShifts(); track shift.id) {
              <article class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div class="flex flex-wrap items-center gap-3">
                    <p class="text-lg font-black text-slate-900">{{ shift.name }}</p>
                    <span class="rounded-full px-3 py-1 text-xs font-semibold" [ngClass]="shift.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">{{ shift.is_active ? 'Active' : 'Inactive' }}</span>
                    <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{{ shift.shift_type }}</span>
                  </div>
                  <p class="mt-2 text-sm text-slate-600">{{ shift.start_time }} to {{ shift.end_time }} | {{ shift.working_hours }} hrs | Grace {{ shift.grace_time }} mins</p>
                </div>
                <div class="flex gap-3">
                  <button type="button" (click)="editShift(shift)" class="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Edit</button>
                  <button type="button" (click)="deleteShift(shift.id)" class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">Delete</button>
                </div>
              </article>
            } @empty {
              <div class="px-6 py-14 text-center text-slate-500">No shifts found for the current search.</div>
            }
          </div>
        </section>
      </div>
    </div>
  `
})
export class ShiftComponent implements OnInit {
  private fb = inject(FormBuilder);
  private attendanceService = inject(AttendanceService);
  private toastService = inject(ToastService);

  shifts = signal<AttendanceShift[]>([]);
  searchQuery = signal('');
  editingId = signal<number | null>(null);
  saving = signal(false);

  shiftForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    start_time: ['09:00', Validators.required],
    end_time: ['18:00', Validators.required],
    shift_type: ['Fixed', Validators.required],
    grace_time: [15, [Validators.required, Validators.min(0)]],
    is_active: [true]
  });

  filteredShifts = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.shifts();
    return this.shifts().filter((shift) =>
      shift.name.toLowerCase().includes(query) || shift.shift_type.toLowerCase().includes(query)
    );
  });

  activeCount = computed(() => this.shifts().filter((shift) => shift.is_active).length);

  ngOnInit(): void {
    this.loadShifts();
  }

  loadShifts(): void {
    this.attendanceService.getShifts().subscribe({
      next: (shifts) => this.shifts.set(shifts),
      error: () => this.toastService.error('Unable to load shifts right now.')
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
          this.shifts.update((list) => list.map((shift) => shift.id === savedShift.id ? savedShift : shift));
          this.toastService.success('Shift updated successfully.');
        } else {
          this.shifts.update((list) => [savedShift, ...list.filter((shift) => shift.id !== savedShift.id)]);
          this.toastService.success('Shift created successfully.');
        }
        this.resetForm();
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.toastService.error('Unable to save this shift right now.');
      }
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
      is_active: shift.is_active
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
      error: () => this.toastService.error('Unable to delete this shift right now.')
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
      is_active: true
    });
  }
}
