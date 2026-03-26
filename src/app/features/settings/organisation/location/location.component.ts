import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrganizationService, OfficeLocation } from '../../../../core/services/organization.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-7xl space-y-6 px-1 py-2">
      <section class="app-module-hero">
        <div>
          <p class="app-module-kicker">Organisation Settings</p>
          <h1 class="app-module-title">Locations</h1>
          <p class="app-module-text max-w-2xl">Maintain office locations with zone, address, and basic contact details even if backend support is partial.</p>
        </div>
        <div class="app-module-highlight">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tracked locations</p>
          <p class="mt-3 text-3xl font-black text-slate-900">{{ locations().length }}</p>
          <p class="mt-2 text-sm text-slate-600">Filtered results: {{ filteredLocations().length }}</p>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section class="app-surface-card">
          <div class="mb-6">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Create Location</p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">Office profile</h2>
          </div>

          <form [formGroup]="locationForm" (ngSubmit)="saveLocation()" class="space-y-4">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Location Name</label>
              <input formControlName="name" class="app-field" placeholder="Head Office">
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Zone</label>
              <input formControlName="zone" class="app-field" placeholder="North India">
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Address</label>
              <textarea formControlName="address" rows="3" class="app-field resize-none" placeholder="Full office address"></textarea>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">City</label>
                <input formControlName="city" class="app-field" placeholder="Delhi">
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Pin Code</label>
                <input formControlName="pinCode" class="app-field" placeholder="110001">
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Contact Number</label>
              <input formControlName="contactNumber" class="app-field" placeholder="Office contact number">
            </div>
            <button type="submit" [disabled]="locationForm.invalid || saving()" class="w-full rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
              {{ saving() ? 'Saving...' : 'Save Location' }}
            </button>
          </form>
        </section>

        <section class="app-surface-card overflow-hidden p-0">
          <div class="border-b border-slate-100 px-6 py-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Location Directory</p>
                <h2 class="mt-2 text-2xl font-black text-slate-900">Operational branches</h2>
              </div>
              <input [value]="searchQuery()" (input)="updateSearch($event)" class="app-field w-full max-w-sm" placeholder="Search locations">
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            @for (location of filteredLocations(); track location.id) {
              <div class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p class="text-lg font-black text-slate-900">{{ location.name }}</p>
                  <p class="mt-1 text-sm text-slate-500">{{ location.zone || 'No zone' }} | {{ location.city || 'No city' }}</p>
                  <p class="mt-2 text-sm leading-7 text-slate-600">{{ location.address || 'No address available' }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <button (click)="removeLocation(location.id)" class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">Delete</button>
                  <span class="rounded-full px-3 py-1 text-xs font-semibold" [ngClass]="location.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">
                    {{ location.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
            } @empty {
              <div class="px-6 py-14 text-center text-slate-500">No locations found.</div>
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

  locations = signal<OfficeLocation[]>([]);
  searchQuery = signal('');
  saving = signal(false);

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
    this.orgService.createLocation({
      name: (value.name || '').trim(),
      zone: (value.zone || '').trim(),
      address: (value.address || '').trim(),
      city: (value.city || '').trim(),
      pinCode: (value.pinCode || '').trim(),
      contactNumber: (value.contactNumber || '').trim(),
      isActive: true
    }).subscribe({
      next: (location) => {
        this.locations.update((list) => [location, ...list.filter((item) => item.id !== location.id)]);
        this.locationForm.reset({ name: '', zone: '', address: '', city: '', pinCode: '', contactNumber: '' });
        this.toastService.success('Location saved successfully');
      },
      error: () => this.toastService.error('Failed to save location'),
      complete: () => this.saving.set(false)
    });
  }

  removeLocation(locationId?: number) {
    if (!locationId) return;
    this.orgService.deleteLocation(locationId).subscribe({
      next: () => {
        this.locations.update((list) => list.filter((location) => location.id !== locationId));
        this.toastService.success('Location removed successfully');
      },
      error: () => this.toastService.error('Failed to remove location')
    });
  }
}
