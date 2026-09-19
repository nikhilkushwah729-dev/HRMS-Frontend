import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../../../core/services/toast.service';
import { SettingsWorkspaceService } from '../../shared/settings-workspace.service';
import { LanguageService } from '../../../../core/services/language.service';

interface Zone {
  id: string;
  name: string;
  mappedLocations: number;
  noOfEmployees: number;
  isActive: boolean;
}

@Component({
  selector: 'app-zones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-7xl space-y-6">
      <section class="app-module-hero">
        <div>
          <p class="app-module-kicker">Organisation Settings</p>
          <h1 class="app-module-title">Zones</h1>
          <p class="app-module-text max-w-2xl">Define broader operational regions to group multiple locations and deployment clusters with a cleaner create-edit flow.</p>
        </div>
        <div class="app-module-highlight">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Active zones</p>
          <p class="mt-3 text-3xl font-black text-slate-900">{{ zones().length }}</p>
          <p class="mt-2 text-sm text-slate-600">Filtered results: {{ filteredZones().length }}</p>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section class="app-surface-card">
          <div class="mb-6">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ editingId() ? 'Update Zone' : 'Create Zone' }}</p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">Regional cluster</h2>
          </div>
          <form [formGroup]="zoneForm" (ngSubmit)="saveZone()" class="space-y-4">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Zone Name</label>
              <input formControlName="name" class="app-field" placeholder="North India">
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Mapped Locations</label>
                <input formControlName="mappedLocations" type="number" class="app-field" placeholder="0">
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Employees</label>
                <input formControlName="noOfEmployees" type="number" class="app-field" placeholder="0">
              </div>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <button type="submit" [disabled]="zoneForm.invalid" class="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
                {{ editingId() ? 'Update Zone' : 'Save Zone' }}
              </button>
              <button type="button" (click)="resetForm()" class="rounded-md border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">{{ t('common.reset') }}</button>
            </div>
          </form>
        </section>

        <section class="app-surface-card overflow-hidden p-0">
          <div class="border-b border-slate-100 px-6 py-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Zone Directory</p>
                <h2 class="mt-2 text-2xl font-black text-slate-900">Regional groups</h2>
              </div>
              <input [value]="searchQuery()" (input)="updateSearch($event)" class="app-field w-full max-w-sm" placeholder="Search zones">
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            @for (zone of filteredZones(); track zone.id) {
              <div class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p class="text-lg font-black text-slate-900">{{ zone.name }}</p>
                  <p class="mt-1 text-sm text-slate-500">{{ zone.mappedLocations }} mapped locations | {{ zone.noOfEmployees }} employees</p>
                </div>
                <div class="flex items-center gap-3">
                  <span class="rounded-full px-3 py-1 text-xs font-semibold" [ngClass]="zone.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">{{ zone.isActive ? t('common.active') : t('common.inactive') }}</span>
                  <button (click)="editZone(zone)" class="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{{ t('common.edit') }}</button>
                  <button (click)="deleteZone(zone.id)" class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">{{ t('common.delete') }}</button>
                </div>
              </div>
            } @empty {
              <div class="px-6 py-14 text-center text-slate-500">{{ t('common.noResults') }}</div>
            }
          </div>
        </section>
      </div>
    </div>
  `
})
export class ZonesComponent implements OnInit {
  private readonly storageKey = 'hrms_zone_master';
  private fb = new FormBuilder();
  private toastService = inject(ToastService);
  private workspace = inject(SettingsWorkspaceService);
  private languageService = inject(LanguageService);

  zones = signal<Zone[]>([]);
  searchQuery = signal('');
  editingId = signal<string | null>(null);

  zoneForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    mappedLocations: [0, [Validators.required]],
    noOfEmployees: [0, [Validators.required]]
  });

  filteredZones = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.zones();
    return this.zones().filter((zone) => zone.name.toLowerCase().includes(q));
  });

  ngOnInit() {
    const seeds = [
      { id: '1', name: 'North America', mappedLocations: 12, noOfEmployees: 340, isActive: true },
      { id: '2', name: 'EMEA', mappedLocations: 5, noOfEmployees: 85, isActive: true }
    ];
    this.workspace.getCollection<Zone>(this.storageKey, seeds).subscribe((items) => {
      this.zones.set(items.length ? items : seeds);
    });
  }

  persist() {
    this.workspace
      .saveCollection(this.storageKey, this.zones())
      .subscribe((items) => this.zones.set(items));
  }

  updateSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  saveZone() {
    if (this.zoneForm.invalid) return;
    const value = this.zoneForm.getRawValue();
    const zone: Zone = {
      id: this.editingId() ?? Date.now().toString(),
      name: (value.name || '').trim(),
      mappedLocations: Number(value.mappedLocations || 0),
      noOfEmployees: Number(value.noOfEmployees || 0),
      isActive: true
    };

    if (this.editingId()) {
      this.zones.update((list) => list.map((item) => item.id === zone.id ? zone : item));
      this.toastService.success('Zone updated successfully.');
    } else {
      this.zones.update((list) => [zone, ...list]);
      this.toastService.success('Zone saved successfully.');
    }

    this.persist();
    this.resetForm();
  }

  editZone(zone: Zone) {
    this.editingId.set(zone.id);
    this.zoneForm.patchValue({
      name: zone.name,
      mappedLocations: zone.mappedLocations,
      noOfEmployees: zone.noOfEmployees
    });
  }

  deleteZone(id: string) {
    this.zones.update((list) => list.filter((zone) => zone.id !== id));
    this.persist();
    if (this.editingId() === id) {
      this.resetForm();
    }
    this.toastService.success('Zone removed successfully.');
  }

  resetForm() {
    this.editingId.set(null);
    this.zoneForm.reset({ name: '', mappedLocations: 0, noOfEmployees: 0 });
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    this.languageService.currentLanguage();
    return this.languageService.t(key, params);
  }
}
