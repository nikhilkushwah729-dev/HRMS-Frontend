import { Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

interface ClientZone {
  id: string;
  name: string;
  clientName: string;
  noOfEmployees: number;
  isActive: boolean;
}

@Component({
  selector: 'app-client-zones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-7xl space-y-6 px-1 py-2">
      <section class="app-module-hero">
        <div>
          <p class="app-module-kicker">Organisation Settings</p>
          <h1 class="app-module-title">Client zones</h1>
          <p class="app-module-text max-w-2xl">Track client-specific deployment clusters so staffing references stay visible even when backend client-zone APIs are not fully available.</p>
        </div>
        <div class="app-module-highlight">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Client zones</p>
          <p class="mt-3 text-3xl font-black text-slate-900">{{ zones().length }}</p>
          <p class="mt-2 text-sm text-slate-600">Filtered results: {{ filteredZones().length }}</p>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section class="app-surface-card">
          <div class="mb-6">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Create Client Zone</p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">Client deployment cluster</h2>
          </div>
          <form [formGroup]="clientZoneForm" (ngSubmit)="saveZone()" class="space-y-4">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Zone Name</label>
              <input formControlName="name" class="app-field" placeholder="London Tech Hub">
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Client Name</label>
              <input formControlName="clientName" class="app-field" placeholder="Innovate UK Ltd">
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Deployed Resources</label>
              <input formControlName="noOfEmployees" type="number" class="app-field" placeholder="0">
            </div>
            <button type="submit" [disabled]="clientZoneForm.invalid" class="w-full rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">Save Client Zone</button>
          </form>
        </section>

        <section class="app-surface-card overflow-hidden p-0">
          <div class="border-b border-slate-100 px-6 py-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Client Zone Directory</p>
                <h2 class="mt-2 text-2xl font-black text-slate-900">Saved client clusters</h2>
              </div>
              <input [value]="searchQuery()" (input)="updateSearch($event)" class="app-field w-full max-w-sm" placeholder="Search client zones">
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            @for (zone of filteredZones(); track zone.id) {
              <div class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p class="text-lg font-black text-slate-900">{{ zone.name }}</p>
                  <p class="mt-1 text-sm text-slate-500">Client: {{ zone.clientName }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <span class="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-semibold text-fuchsia-700">{{ zone.noOfEmployees }} deployed</span>
                  <button (click)="deleteZone(zone.id)" class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">Delete</button>
                </div>
              </div>
            } @empty {
              <div class="px-6 py-14 text-center text-slate-500">No client zones found.</div>
            }
          </div>
        </section>
      </div>
    </div>
  `
})
export class ClientZonesComponent implements OnInit {
  private readonly storageKey = 'hrms_client_zone_master';
  private fb = new FormBuilder();

  zones = signal<ClientZone[]>([]);
  searchQuery = signal('');

  clientZoneForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    clientName: ['', [Validators.required, Validators.minLength(2)]],
    noOfEmployees: [0, [Validators.required]]
  });

  filteredZones = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.zones();
    return this.zones().filter((zone) => zone.name.toLowerCase().includes(q) || zone.clientName.toLowerCase().includes(q));
  });

  ngOnInit() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.zones.set(JSON.parse(saved));
        return;
      }
    } catch {}
    this.zones.set([
      { id: '1', name: 'NYC Finance District', clientName: 'Goldman Corp', noOfEmployees: 45, isActive: true },
      { id: '2', name: 'London Tech Hub', clientName: 'Innovate UK Ltd', noOfEmployees: 23, isActive: true }
    ]);
  }

  persist() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.zones()));
  }

  updateSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  saveZone() {
    if (this.clientZoneForm.invalid) return;
    const value = this.clientZoneForm.getRawValue();
    const zone: ClientZone = {
      id: Date.now().toString(),
      name: (value.name || '').trim(),
      clientName: (value.clientName || '').trim(),
      noOfEmployees: Number(value.noOfEmployees || 0),
      isActive: true
    };
    this.zones.update((list) => [zone, ...list]);
    this.persist();
    this.clientZoneForm.reset({ name: '', clientName: '', noOfEmployees: 0 });
  }

  deleteZone(id: string) {
    this.zones.update((list) => list.filter((zone) => zone.id !== id));
    this.persist();
  }
}
