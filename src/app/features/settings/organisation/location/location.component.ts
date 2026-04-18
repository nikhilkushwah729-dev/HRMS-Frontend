import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrganizationService, OfficeLocation } from '../../../../core/services/organization.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-7xl space-y-6">
      <section class="app-module-hero overflow-hidden">
        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div class="space-y-5">
            <div>
              <p class="app-module-kicker">Organisation Settings</p>
              <h1 class="app-module-title">Locations</h1>
              <p class="app-module-text max-w-2xl">Maintain office locations with zone, address, and contact details so organisation masters stay clean and operational teams always see the right branch data.</p>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Tracked locations</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ locations().length }}</p>
                <p class="mt-1 text-xs text-slate-500">Saved records</p>
              </div>
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Visible now</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ filteredLocations().length }}</p>
                <p class="mt-1 text-xs text-slate-500">Matching current search</p>
              </div>
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Editor mode</p>
                <p class="mt-2 text-lg font-black text-slate-900">{{ editingId() ? 'Edit location' : 'Create location' }}</p>
                <p class="mt-1 text-xs text-slate-500">Keep branches up to date</p>
              </div>
            </div>
          </div>

          <div class="app-module-highlight">
            <p class="app-module-highlight-label">Workspace note</p>
            <p class="mt-3 app-module-highlight-value">Branch registry</p>
            <p class="mt-3 text-sm leading-6 text-white/80">Use locations to support attendance mapping, employee placement, and reporting references across the whole HRMS.</p>
            <div class="mt-4 rounded-md border border-white/15 bg-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              {{ editingId() ? 'Updating an existing branch record' : 'Ready to create a new branch record' }}
            </div>
          </div>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section class="app-surface-card overflow-hidden">
          <div class="border-b border-slate-100 px-6 py-5">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ editingId() ? 'Update Location' : 'Create Location' }}</p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">Office profile</h2>
            <p class="mt-2 text-sm leading-6 text-slate-500">Capture the branch name, zone, and address details once so admins can reuse the same location master across modules.</p>
          </div>

          <div class="mx-6 mt-6 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            <p class="font-semibold">Master data note</p>
            <p class="mt-1 leading-6">
              Clean location names and zone labels make attendance mapping,
              reporting, and employee assignment screens much easier to manage.
            </p>
          </div>

          <form [formGroup]="locationForm" (ngSubmit)="saveLocation()" class="space-y-4 px-6 py-6">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Location Name</label>
              <input formControlName="name" class="app-field" placeholder="Head Office">
            </div>
            <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{{ t('common.zone') }}</label>
              <input formControlName="zone" class="app-field" placeholder="North India">
            </div>
            <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{{ t('common.address') }}</label>
              <textarea formControlName="address" rows="3" class="app-field resize-none" placeholder="Full office address"></textarea>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{{ t('common.city') }}</label>
                <input formControlName="city" class="app-field" placeholder="Delhi">
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Pin Code</label>
                <input formControlName="pinCode" class="app-field" placeholder="110001">
              </div>
            </div>
            <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{{ t('common.contactNumber') }}</label>
              <input formControlName="contactNumber" class="app-field" placeholder="Office contact number">
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <button type="submit" [disabled]="locationForm.invalid || saving()" class="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
                {{ saving() ? 'Saving...' : editingId() ? 'Update Location' : 'Save Location' }}
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
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Location Directory</p>
                <h2 class="mt-2 text-2xl font-black text-slate-900">Operational branches</h2>
                <p class="mt-2 text-sm leading-6 text-slate-500">Search and manage branch records from one place.</p>
              </div>
              <input [value]="searchQuery()" (input)="updateSearch($event)" class="app-field w-full max-w-sm" placeholder="Search locations">
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            @for (location of filteredLocations(); track location.id) {
              <div class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div class="flex flex-wrap items-center gap-3">
                    <p class="text-lg font-black text-slate-900">{{ location.name }}</p>
                    <span class="rounded-full px-3 py-1 text-xs font-semibold" [ngClass]="location.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">
                      {{ location.isActive ? t('common.active') : t('common.inactive') }}
                    </span>
                  </div>
                  <p class="mt-1 text-sm text-slate-500">{{ location.zone || 'No zone' }} | {{ location.city || 'No city' }}</p>
                  <p class="mt-2 text-sm leading-7 text-slate-600">{{ location.address || 'No address available' }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <button (click)="editLocation(location)" class="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{{ t('common.edit') }}</button>
                  <button (click)="removeLocation(location.id)" class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">{{ t('common.delete') }}</button>
                </div>
              </div>
            } @empty {
              <div class="px-6 py-16 text-center">
                <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </div>
                <p class="mt-4 text-base font-semibold text-slate-900">{{ t('common.noResults') }}</p>
                <p class="mt-2 text-sm text-slate-500">
                  Add the first office or branch so organisation masters can
                  reference the correct working location.
                </p>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `
})
export class LocationComponent implements OnInit {
  private orgService = inject(OrganizationService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private languageService = inject(LanguageService);

  locations = signal<OfficeLocation[]>([]);
  searchQuery = signal('');
  saving = signal(false);
  editingId = signal<number | null>(null);

  locationForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    zone: [''],
    address: [''],
    city: [''],
    pinCode: [''],
    contactNumber: ['']
  });

  filteredLocations = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.locations();
    return this.locations().filter((location) =>
      (location.name || '').toLowerCase().includes(q) ||
      (location.zone || '').toLowerCase().includes(q) ||
      (location.address || '').toLowerCase().includes(q)
    );
  });

  ngOnInit() {
    this.loadLocations();
  }

  loadLocations() {
    this.orgService.getLocations().subscribe({
      next: (locations) => this.locations.set(locations),
      error: () => {
        this.locations.set([]);
        this.toastService.error('Failed to load locations');
      }
    });
  }

  updateSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  saveLocation() {
    if (this.locationForm.invalid) return;
    this.saving.set(true);
    const value = this.locationForm.getRawValue();
    const payload = {
      name: (value.name || '').trim(),
      zone: (value.zone || '').trim(),
      address: (value.address || '').trim(),
      city: (value.city || '').trim(),
      pinCode: (value.pinCode || '').trim(),
      contactNumber: (value.contactNumber || '').trim(),
      isActive: true
    };
    const request$ = this.editingId()
      ? this.orgService.updateLocation(this.editingId()!, payload)
      : this.orgService.createLocation(payload);

    request$.subscribe({
      next: (location) => {
        this.locations.update((list) =>
          this.editingId()
            ? list.map((item) => item.id === location.id ? location : item)
            : [location, ...list.filter((item) => item.id !== location.id)]
        );
        this.resetForm();
        this.toastService.success(this.editingId() ? 'Location updated successfully' : 'Location saved successfully');
      },
      error: () => this.toastService.error('Failed to save location'),
      complete: () => this.saving.set(false)
    });
  }

  editLocation(location: OfficeLocation) {
    this.editingId.set(location.id);
    this.locationForm.patchValue({
      name: location.name || '',
      zone: location.zone || '',
      address: location.address || '',
      city: location.city || '',
      pinCode: location.pinCode || '',
      contactNumber: location.contactNumber || '',
    });
  }

  resetForm() {
    this.editingId.set(null);
    this.locationForm.reset({ name: '', zone: '', address: '', city: '', pinCode: '', contactNumber: '' });
  }

  removeLocation(locationId?: number) {
    if (!locationId) return;
    this.orgService.deleteLocation(locationId).subscribe({
      next: () => {
        this.locations.update((list) => list.filter((location) => location.id !== locationId));
        if (this.editingId() === locationId) {
          this.resetForm();
        }
        this.toastService.success('Location removed successfully');
      },
      error: () => this.toastService.error('Failed to remove location')
    });
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    this.languageService.currentLanguage();
    return this.languageService.t(key, params);
  }
}
