import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrganizationHoliday, OrganizationService } from '../../../../core/services/organization.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-holiday-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-7xl space-y-6">
      <section class="app-module-hero overflow-hidden">
        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div class="space-y-5">
            <div>
              <p class="app-module-kicker">Organisation Settings</p>
              <h1 class="app-module-title">Holiday Calendar</h1>
              <p class="app-module-text max-w-2xl">Manage organization holidays from one place so reports, attendance, and the self dashboard all stay aligned.</p>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Configured holidays</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ holidays().length }}</p>
                <p class="mt-1 text-xs text-slate-500">Calendar records</p>
              </div>
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Upcoming</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ upcomingCount() }}</p>
                <p class="mt-1 text-xs text-slate-500">Future holidays</p>
              </div>
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Editor mode</p>
                <p class="mt-2 text-lg font-black text-slate-900">{{ editingId() ? 'Edit holiday' : 'Create holiday' }}</p>
                <p class="mt-1 text-xs text-slate-500">Keep reports aligned</p>
              </div>
            </div>
          </div>

          <div class="app-module-highlight">
            <p class="app-module-highlight-label">Attendance sync</p>
            <p class="mt-3 app-module-highlight-value">Live calendar</p>
            <p class="mt-3 text-sm leading-6 text-white/80">These holiday records directly support attendance reporting and the self-service dashboard experience.</p>
            <div class="mt-4 rounded-md border border-white/15 bg-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              {{ editingId() ? 'Editing a live holiday record' : 'Ready to add a new calendar event' }}
            </div>
          </div>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section class="app-surface-card overflow-hidden">
          <div class="border-b border-slate-100 px-6 py-5">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ editingId() ? 'Update Holiday' : 'Create Holiday' }}</p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">Holiday master</h2>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              Publish official holiday dates here so calendars, dashboards, and
              attendance summaries stay aligned across the organisation.
            </p>
          </div>

          <div class="mx-6 mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p class="font-semibold">Calendar note</p>
            <p class="mt-1 leading-6">
              Use clear names and correct dates because these holidays directly
              influence what employees and managers see in attendance views.
            </p>
          </div>

          <form [formGroup]="holidayForm" (ngSubmit)="saveHoliday()" class="space-y-4 px-6 py-6">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Holiday Name</label>
              <input formControlName="name" class="app-field" placeholder="Independence Day" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Holiday Date</label>
              <input type="date" formControlName="holidayDate" class="app-field" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Holiday Type</label>
              <select formControlName="type" class="app-field">
                <option value="national">National</option>
                <option value="company">Company</option>
                <option value="optional">Optional</option>
              </select>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <button type="submit" [disabled]="holidayForm.invalid || saving()" class="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
                {{ saving() ? 'Saving...' : editingId() ? 'Update Holiday' : 'Save Holiday' }}
              </button>
              <button type="button" (click)="resetForm()" class="rounded-md border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                Reset
              </button>
            </div>
          </form>
        </section>

        <section class="app-surface-card overflow-hidden p-0">
          <div class="border-b border-slate-100 px-6 py-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Holiday Directory</p>
                <h2 class="mt-2 text-2xl font-black text-slate-900">Official calendar</h2>
              </div>
              <input [value]="searchQuery()" (input)="updateSearch($event)" class="app-field w-full max-w-sm" placeholder="Search holidays" />
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            @for (holiday of filteredHolidays(); track holiday.id) {
              <article class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div class="flex flex-wrap items-center gap-3">
                    <p class="text-lg font-black text-slate-900">{{ holiday.name }}</p>
                    <span class="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">{{ holiday.type }}</span>
                  </div>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{{ holiday.holidayDate | date:'dd MMM yyyy' }}</span>
                  </div>
                </div>
                <div class="flex gap-3">
                  <button type="button" (click)="editHoliday(holiday)" class="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Edit</button>
                  <button type="button" (click)="deleteHoliday(holiday.id)" class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">
                    Delete
                  </button>
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
                <p class="mt-4 text-base font-semibold text-slate-900">No holidays configured yet</p>
                <p class="mt-2 text-sm text-slate-500">
                  Add the first holiday to start building the organization’s
                  official calendar.
                </p>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `
})
export class HolidayComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly organizationService = inject(OrganizationService);
  private readonly toastService = inject(ToastService);

  holidays = signal<OrganizationHoliday[]>([]);
  searchQuery = signal('');
  saving = signal(false);
  editingId = signal<number | null>(null);

  holidayForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    holidayDate: ['', Validators.required],
    type: ['national' as OrganizationHoliday['type'], Validators.required]
  });

  filteredHolidays = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const items = [...this.holidays()].sort((a, b) => new Date(a.holidayDate).getTime() - new Date(b.holidayDate).getTime());
    if (!query) return items;
    return items.filter((holiday) => `${holiday.name} ${holiday.type} ${holiday.holidayDate}`.toLowerCase().includes(query));
  });

  upcomingCount = computed(() => this.holidays().filter((holiday) => new Date(holiday.holidayDate).getTime() >= Date.now()).length);

  ngOnInit(): void {
    this.loadHolidays();
  }

  loadHolidays(): void {
    this.organizationService.getHolidays().subscribe({
      next: (holidays) => this.holidays.set(holidays),
      error: () => {
        this.holidays.set([]);
        this.toastService.error('Failed to load holidays.');
      }
    });
  }

  updateSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  saveHoliday(): void {
    if (this.holidayForm.invalid) {
      this.holidayForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const payload = this.holidayForm.getRawValue();
    const request$ = this.editingId()
      ? this.organizationService.updateHoliday(this.editingId()!, payload)
      : this.organizationService.createHoliday(payload);

    request$.subscribe({
      next: (holiday) => {
        this.holidays.update((items) =>
          this.editingId()
            ? items.map((item) => item.id === holiday.id ? holiday : item)
            : [holiday, ...items.filter((item) => item.id !== holiday.id)]
        );
        this.resetForm();
        this.toastService.success(this.editingId() ? 'Holiday updated successfully.' : 'Holiday saved successfully.');
      },
      error: () => this.toastService.error('Failed to save holiday.'),
      complete: () => this.saving.set(false)
    });
  }

  editHoliday(holiday: OrganizationHoliday): void {
    this.editingId.set(holiday.id);
    this.holidayForm.patchValue({
      name: holiday.name,
      holidayDate: holiday.holidayDate,
      type: holiday.type
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.holidayForm.reset({ name: '', holidayDate: '', type: 'national' });
  }

  deleteHoliday(id: number): void {
    this.organizationService.deleteHoliday(id).subscribe({
      next: (ok) => {
        if (ok) {
          this.holidays.update((items) => items.filter((holiday) => holiday.id !== id));
          if (this.editingId() === id) {
            this.resetForm();
          }
          this.toastService.success('Holiday removed successfully.');
        } else {
          this.toastService.error('Unable to delete holiday.');
        }
      },
      error: () => this.toastService.error('Unable to delete holiday.')
    });
  }
}
