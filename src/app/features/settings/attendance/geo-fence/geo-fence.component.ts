import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AttendanceService, GeoFenceSettings, GeoFenceZone } from '../../../../core/services/attendance.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-geo-fence',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-7xl space-y-6">
      <section class="overflow-hidden rounded-md border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_38%),linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#ecfeff_100%)] shadow-sm">
        <div class="grid gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:py-8">
          <div class="space-y-5">
            <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              Attendance Settings
            </div>
            <div>
              <h1 class="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Geo-Fence Controls</h1>
              <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Keep attendance restricted to approved sites. This page now aligns enforcement settings, zone creation, and directory search into one cleaner responsive workspace.</p>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div class="rounded-md border border-white/80 bg-white/90 px-4 py-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Configured zones</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ zones().length }}</p>
                <p class="mt-1 text-xs text-slate-500">Saved boundary points</p>
              </div>
              <div class="rounded-md border border-white/80 bg-white/90 px-4 py-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Enforcement</p>
                <p class="mt-2 text-lg font-black text-slate-900">{{ settings().geofence_enabled ? t('common.enabled') : t('common.disabled') }}</p>
                <p class="mt-1 text-xs text-slate-500">Attendance restriction status</p>
              </div>
              <div class="rounded-md border border-white/80 bg-white/90 px-4 py-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ t('common.mode') }}</p>
                <p class="mt-2 text-lg font-black text-slate-900">{{ editingId() ? t('common.edit') : t('common.create') }} Zone</p>
                <p class="mt-1 text-xs text-slate-500">Manage office boundary</p>
              </div>
            </div>
          </div>

          <div class="rounded-md border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Quick Search</p>
                <h2 class="mt-1 text-lg font-black text-slate-900">Find protected sites</h2>
              </div>
              <button type="button" (click)="resetForm()" class="rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white">
                {{ t('common.reset') }}
              </button>
            </div>

            <div class="mt-4 space-y-3">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{{ t('common.searchZones') }}</label>
              <div class="relative">
                <input [value]="searchQuery()" (input)="updateSearch($event)" class="w-full rounded-md border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-200/60" placeholder="Search by zone name">
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
              </div>
              <div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p class="font-semibold text-slate-900">Geo-fence status</p>
                <p class="mt-1 text-xs leading-5 text-slate-500">Use the toggles below to decide whether geo validation is optional or mandatory across the organisation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section class="space-y-6">
          <article class="app-surface-card overflow-hidden p-0">
            <div class="border-b border-slate-100 px-6 py-5">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Enforcement</p>
              <h2 class="mt-2 text-2xl font-black text-slate-900">Attendance boundary rules</h2>
            </div>

            <div class="space-y-4 px-6 py-6">
              <label class="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
                <div>
                  <p class="text-sm font-semibold text-slate-900">Enable geo-fence validation</p>
                  <p class="mt-1 text-xs text-slate-500">Require attendance punches to be validated against allowed sites.</p>
                </div>
                <input type="checkbox" [checked]="settings().geofence_enabled" (change)="toggleSettings('geofence_enabled', $event)" class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500">
              </label>

              <label class="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
                <div>
                  <p class="text-sm font-semibold text-slate-900">Mandatory for all employees</p>
                  <p class="mt-1 text-xs text-slate-500">Force all mapped employees to punch only inside configured geo-fences.</p>
                </div>
                <input type="checkbox" [checked]="settings().require_geofence_for_all" (change)="toggleSettings('require_geofence_for_all', $event)" class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500">
              </label>
            </div>
          </article>

          <article class="app-surface-card overflow-hidden p-0">
            <div class="border-b border-slate-100 px-6 py-5">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ editingId() ? 'Update Zone' : 'Create Zone' }}</p>
              <h2 class="mt-2 text-2xl font-black text-slate-900">Location boundary</h2>
            </div>

            <form [formGroup]="zoneForm" (ngSubmit)="saveZone()" class="space-y-5 px-6 py-6">
              <div class="flex min-w-0 flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Zone Name</label>
                <input formControlName="name" class="app-field" placeholder="Head Office Campus">
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div class="flex min-w-0 flex-col gap-2">
                  <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Latitude</label>
                  <input type="number" step="0.000001" formControlName="latitude" class="app-field" placeholder="28.6139">
                </div>
                <div class="flex min-w-0 flex-col gap-2">
                  <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Longitude</label>
                  <input type="number" step="0.000001" formControlName="longitude" class="app-field" placeholder="77.2090">
                </div>
              </div>

              <div class="flex min-w-0 flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Radius (meters)</label>
                <input type="number" min="25" formControlName="radius_meters" class="app-field" placeholder="150">
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <button type="submit" [disabled]="zoneForm.invalid || saving()" class="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">{{ saving() ? 'Saving...' : editingId() ? 'Update Zone' : 'Save Zone' }}</button>
                <button type="button" (click)="resetForm()" class="rounded-md border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Reset</button>
              </div>
            </form>
          </article>
        </section>

        <section class="app-surface-card overflow-hidden p-0">
          <div class="border-b border-slate-100 px-6 py-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Geo-Fence Directory</p>
                <h2 class="mt-2 text-2xl font-black text-slate-900">Protected sites</h2>
              </div>
              <div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                {{ filteredZones().length }} record(s) shown
              </div>
            </div>
          </div>

          <div class="border-b border-slate-100 bg-slate-50/70 px-6 py-4 text-sm text-slate-600">
            Geo-fence zones created here are reused for attendance validation and
            employee geo assignment across the organization.
          </div>

          <div class="divide-y divide-slate-100">
            @for (zone of filteredZones(); track zone.id) {
              <article class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-3">
                    <p class="break-words text-lg font-black text-slate-900">{{ zone.name }}</p>
                    <span class="rounded-full px-3 py-1 text-xs font-semibold" [ngClass]="zone.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">{{ zone.is_active ? t('common.active') : t('common.inactive') }}</span>
                  </div>
                  <p class="mt-2 break-words text-sm leading-6 text-slate-600">{{ zone.center_lat | number:'1.4-4' }}, {{ zone.center_lng | number:'1.4-4' }} | Radius {{ zone.radius_meters }} meters</p>
                </div>
                <div class="flex flex-col gap-3 sm:flex-row">
                  <button type="button" (click)="editZone(zone)" class="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{{ t('common.edit') }}</button>
                  <button type="button" (click)="deleteZone(zone.id)" class="rounded-md border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">{{ t('common.delete') }}</button>
                </div>
              </article>
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
                  Add the first approved site to start validating attendance
                  punches against real location boundaries.
                </p>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `
})
export class GeoFenceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private attendanceService = inject(AttendanceService);
  private toastService = inject(ToastService);
  private languageService = inject(LanguageService);

  zones = signal<GeoFenceZone[]>([]);
  settings = signal<GeoFenceSettings>({
    geofence_enabled: true,
    require_geofence_for_all: false,
    zones: []
  });
  searchQuery = signal('');
  editingId = signal<number | null>(null);
  saving = signal(false);

  zoneForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    latitude: [28.6139, [Validators.required]],
    longitude: [77.2090, [Validators.required]],
    radius_meters: [150, [Validators.required, Validators.min(25)]]
  });

  filteredZones = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.zones();
    return this.zones().filter((zone) => zone.name.toLowerCase().includes(query));
  });

  ngOnInit(): void {
    this.loadZones();
    this.loadSettings();
  }

  loadZones(): void {
    this.attendanceService.getGeoFenceZones().subscribe({
      next: (zones) => this.zones.set(zones),
      error: () => this.toastService.error('Unable to load geo-fence zones right now.')
    });
  }

  loadSettings(): void {
    this.attendanceService.getGeoFenceSettings().subscribe({
      next: (settings) => this.settings.set(settings),
      error: () => this.toastService.error('Unable to load geo-fence settings right now.')
    });
  }

  updateSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  toggleSettings(key: 'geofence_enabled' | 'require_geofence_for_all', event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const nextSettings = { ...this.settings(), [key]: checked };
    this.settings.set(nextSettings);
    this.attendanceService.updateGeoFenceSettings({ [key]: checked }).subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.toastService.success('Geo-fence settings updated.');
      },
      error: () => this.toastService.error('Unable to update geo-fence settings right now.')
    });
  }

  saveZone(): void {
    if (this.zoneForm.invalid) {
      this.zoneForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const value = this.zoneForm.getRawValue();
    const request$ = this.editingId()
      ? this.attendanceService.updateGeoFenceZone(this.editingId()!, value)
      : this.attendanceService.createGeoFenceZone(value);

    request$.subscribe({
      next: (savedZone) => {
        if (this.editingId()) {
          this.zones.update((list) => list.map((zone) => zone.id === savedZone.id ? savedZone : zone));
          this.toastService.success('Geo-fence updated successfully.');
        } else {
          this.zones.update((list) => [savedZone, ...list.filter((zone) => zone.id !== savedZone.id)]);
          this.toastService.success('Geo-fence created successfully.');
        }
        this.settings.update((settings) => ({ ...settings, zones: this.zones() }));
        this.resetForm();
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.toastService.error('Unable to save this geo-fence right now.');
      }
    });
  }

  editZone(zone: GeoFenceZone): void {
    this.editingId.set(zone.id);
    this.zoneForm.patchValue({
      name: zone.name,
      latitude: zone.center_lat,
      longitude: zone.center_lng,
      radius_meters: zone.radius_meters
    });
  }

  deleteZone(id: number): void {
    if (!confirm('Are you sure you want to delete this geo-fence zone?')) {
      return;
    }

    this.attendanceService.deleteGeoFenceZone(id).subscribe({
      next: () => {
        this.zones.update((list) => list.filter((zone) => zone.id !== id));
        this.settings.update((settings) => ({ ...settings, zones: this.zones() }));
        if (this.editingId() === id) {
          this.resetForm();
        }
        this.toastService.success('Geo-fence removed successfully.');
      },
      error: () => this.toastService.error('Unable to delete this geo-fence right now.')
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.zoneForm.reset({
      name: '',
      latitude: 28.6139,
      longitude: 77.2090,
      radius_meters: 150
    });
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    this.languageService.currentLanguage();
    return this.languageService.t(key, params);
  }
}
