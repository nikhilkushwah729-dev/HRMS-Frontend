import { Component, ElementRef, ViewChild, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, GeoFenceZone, GeoFenceSettings } from '../../../core/services/attendance.service';
import { ToastService } from '../../../core/services/toast.service';
import { CustomButtonComponent } from '../../../core/components/button/custom-button.component';
import { CustomModalComponent } from '../../../core/components/modal/custom-modal.component';

@Component({
  selector: 'app-geofence-management',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomButtonComponent, CustomModalComponent],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Settings Header -->
      <div class="bg-white border border-slate-200 rounded-md p-6 shadow-sm">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Geofence Settings</h2>
            <p class="text-sm text-slate-500">Configure virtual boundaries for automated attendance.</p>
          </div>
          <div class="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
            <span class="text-sm font-bold text-slate-700">Global Geofence</span>
            <button (click)="toggleGlobalGeofence()" 
                    [class]="settings().geofence_enabled ? 'bg-primary-600' : 'bg-slate-300'"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none">
              <span [class]="settings().geofence_enabled ? 'translate-x-6' : 'translate-x-1'"
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"></span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
            <div>
              <p class="text-sm font-bold text-slate-900">Require for all employees</p>
              <p class="text-xs text-slate-500">Force geofence validation for every clock-in/out.</p>
            </div>
            <button (click)="toggleRequireAll()" 
                    [class]="settings().require_geofence_for_all ? 'bg-primary-600' : 'bg-slate-300'"
                    class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none">
              <span [class]="settings().require_geofence_for_all ? 'translate-x-5' : 'translate-x-1'"
                    class="inline-block h-3 w-3 transform rounded-full bg-white transition-transform"></span>
            </button>
          </div>
          <div class="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
            <div>
              <p class="text-sm font-bold text-slate-900">Active Zones</p>
              <p class="text-xs text-slate-500">Current number of operational geofences.</p>
            </div>
            <span class="text-lg font-black text-primary-600">{{ activeZonesCount() }}</span>
          </div>
        </div>
      </div>

      <!-- Zones List -->
      <div class="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
        <div class="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 class="font-bold text-slate-900 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary-500">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/>
            </svg>
            Geofence Zones
          </h3>
          <app-custom-button (btnClick)="openCreateModal()" class="!w-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add New Zone
          </app-custom-button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zone name</th>
                <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Coordinates</th>
                <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Radius</th>
                <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngIf="zones().length === 0">
                <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                  <p class="font-medium">No geofence zones defined yet.</p>
                  <p class="text-xs mt-1">Create your first zone to enable location-based attendance.</p>
                </td>
              </tr>
              <tr *ngFor="let zone of zones()" class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-4">
                  <span class="font-bold text-slate-900 block">{{ zone.name }}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-xs text-slate-500">Lat: {{ zone.center_lat.toFixed(6) }}</span>
                    <span class="text-xs text-slate-500">Lng: {{ zone.center_lng.toFixed(6) }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-700">{{ zone.radius_meters }}m</span>
                </td>
                <td class="px-6 py-4 text-center">
                  <button (click)="toggleZoneStatus(zone)" 
                          [class]="zone.is_active ? 'text-success hover:text-green-700' : 'text-slate-300 hover:text-slate-400'"
                          class="transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10" class="opacity-10"/>
                      <circle cx="12" cy="12" r="5"/>
                    </svg>
                  </button>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-2">
                    <button (click)="editZone(zone)" class="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary-600 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                    </button>
                    <button (click)="deleteZone(zone)" class="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <app-custom-modal [openModal]="showModal()" (closeModal)="closeModal()" [crossButton]="true" maxWidth="max-w-3xl">
      <div class="p-1">
        <h2 class="text-xl font-bold text-slate-900 mb-2">{{ isEditing() ? 'Edit Geofence Zone' : 'Create New Zone' }}</h2>
        <p class="text-sm text-slate-500 mb-6 font-medium">Identify the physical boundaries for this area.</p>

        <form (ngSubmit)="saveZone()" class="space-y-5">
          <div class="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
            <div class="space-y-4">
              <div class="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <div class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                  <div>
                    <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Map Picker</p>
                    <p class="mt-1 text-sm font-semibold text-slate-800">Click on the map to select the geofence center.</p>
                  </div>
                  <button
                    type="button"
                    (click)="useCurrentLocation()"
                    class="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700 transition hover:border-blue-500 hover:bg-blue-100"
                  >
                    Use Current Location
                  </button>
                </div>
                <div #zoneMapContainer class="h-[320px] w-full"></div>
              </div>
              <p class="text-xs text-slate-500">
                Tip: move to the exact office or branch point on the map, click once, then adjust the radius until the green circle matches the allowed attendance area.
              </p>
            </div>

            <div class="space-y-4">
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-widest">Zone Name</label>
                <input type="text" [(ngModel)]="currentZone.name" name="name" class="app-field" placeholder="e.g., Head Office, Site A" required>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                  <label class="text-xs font-bold text-slate-400 uppercase tracking-widest">Latitude</label>
                  <input type="number" step="any" [(ngModel)]="currentZone.latitude" (ngModelChange)="syncMapShapes()" name="latitude" class="app-field" placeholder="23.456789" required>
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-xs font-bold text-slate-400 uppercase tracking-widest">Longitude</label>
                  <input type="number" step="any" [(ngModel)]="currentZone.longitude" (ngModelChange)="syncMapShapes()" name="longitude" class="app-field" placeholder="78.123456" required>
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-widest">Radius (Meters)</label>
                <div class="relative">
                  <input type="number" [(ngModel)]="currentZone.radius_meters" (ngModelChange)="onRadiusChanged()" name="radius" class="app-field pr-12" placeholder="100" required>
                  <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">m</span>
                </div>
                <p class="text-[10px] text-slate-400 font-medium italic">Recommended minimum radius is 50m for GPS accuracy.</p>
              </div>

              <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Selected Zone Summary</p>
                <div class="mt-3 space-y-2 text-sm text-emerald-900">
                  <p><span class="font-bold">Center:</span> {{ currentZone.latitude | number:'1.4-6' }}, {{ currentZone.longitude | number:'1.4-6' }}</p>
                  <p><span class="font-bold">Radius:</span> {{ currentZone.radius_meters }} meters</p>
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-3 pt-4">
            <app-custom-button type="secondary" (btnClick)="closeModal()">Cancel</app-custom-button>
            <app-custom-button [disabled]="submitting()" (btnClick)="saveZone()">
              {{ submitting() ? 'Saving...' : 'Save Zone' }}
            </app-custom-button>
          </div>
        </form>
      </div>
    </app-custom-modal>
  `,
  styles: [`
    :host { display: block; }
    :host ::ng-deep .leaflet-container {
      font-family: inherit;
      z-index: 0;
    }
  `]
})
export class GeofenceManagementComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private toastService = inject(ToastService);
  @ViewChild('zoneMapContainer') zoneMapContainer?: ElementRef<HTMLDivElement>;

  settings = signal<GeoFenceSettings>({ geofence_enabled: false, zones: [], require_geofence_for_all: false });
  zones = signal<GeoFenceZone[]>([]);
  activeZonesCount = signal<number>(0);

  showModal = signal(false);
  isEditing = signal(false);
  submitting = signal(false);

  currentZone = {
    id: 0,
    name: '',
    latitude: 0,
    longitude: 0,
    radius_meters: 100
  };
  private leafletLib: any = null;
  private zoneMap: any = null;
  private zoneMarker: any = null;
  private zoneRadiusCircle: any = null;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.attendanceService.getGeoFenceSettings().subscribe({
      next: (s) => this.settings.set(s),
      error: (err) => console.error('Failed to load geofence settings', err)
    });

    this.attendanceService.getGeoFenceZones().subscribe({
      next: (z) => {
        this.zones.set(z);
        this.activeZonesCount.set(z.filter(x => x.is_active).length);
      },
      error: (err) => console.error('Failed to load zones', err)
    });
  }

  toggleGlobalGeofence() {
    const newVal = !this.settings().geofence_enabled;
    this.attendanceService.updateGeoFenceSettings({ geofence_enabled: newVal }).subscribe({
      next: (s) => {
        this.settings.set(s);
        this.toastService.success(`Global geofence ${newVal ? 'enabled' : 'disabled'}`);
      }
    });
  }

  toggleRequireAll() {
    const newVal = !this.settings().require_geofence_for_all;
    this.attendanceService.updateGeoFenceSettings({ require_geofence_for_all: newVal }).subscribe({
      next: (s) => {
        this.settings.set(s);
        this.toastService.success(`Strict geofence mode ${newVal ? 'on' : 'off'}`);
      }
    });
  }

  toggleZoneStatus(zone: GeoFenceZone) {
    this.attendanceService.updateGeoFenceZone(zone.id, { is_active: !zone.is_active }).subscribe({
      next: () => {
        this.loadData();
        this.toastService.success(`${zone.name} status updated`);
      }
    });
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.currentZone = { id: 0, name: '', latitude: 23.2599, longitude: 77.4126, radius_meters: 100 };
    this.showModal.set(true);
    this.scheduleMapSetup();
  }

  editZone(zone: GeoFenceZone) {
    this.isEditing.set(true);
    this.currentZone = { 
        id: zone.id, 
        name: zone.name, 
        latitude: zone.center_lat, 
        longitude: zone.center_lng, 
        radius_meters: zone.radius_meters 
    };
    this.showModal.set(true);
    this.scheduleMapSetup();
  }

  closeModal() {
    this.showModal.set(false);
    this.destroyMapInstance();
  }

  saveZone() {
    if (!this.currentZone.name || !this.currentZone.latitude || !this.currentZone.longitude) {
      this.toastService.error('Please fill all required fields');
      return;
    }

    this.submitting.set(true);
    if (this.isEditing()) {
      this.attendanceService.updateGeoFenceZone(this.currentZone.id, this.currentZone).subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeModal();
          this.loadData();
          this.toastService.success('Zone updated successfully');
        },
        error: () => this.submitting.set(false)
      });
    } else {
        this.attendanceService.createGeoFenceZone(this.currentZone).subscribe({
            next: () => {
                this.submitting.set(false);
                this.closeModal();
                this.loadData();
                this.toastService.success('Zone created successfully');
            },
            error: () => this.submitting.set(false)
        });
    }
  }

  deleteZone(zone: GeoFenceZone) {
    if (confirm(`Are you sure you want to delete "${zone.name}"?`)) {
      this.attendanceService.deleteGeoFenceZone(zone.id).subscribe({
        next: () => {
          this.loadData();
          this.toastService.success('Zone deleted');
        }
      });
    }
  }

  onRadiusChanged() {
    this.syncMapShapes();
  }

  async useCurrentLocation() {
    if (!navigator.geolocation) {
      this.toastService.error('Geolocation is not supported in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.currentZone.latitude = Number(position.coords.latitude.toFixed(6));
        this.currentZone.longitude = Number(position.coords.longitude.toFixed(6));
        this.syncMapShapes(true);
      },
      () => this.toastService.error('Unable to fetch current location.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  private scheduleMapSetup() {
    setTimeout(() => {
      void this.initializeZoneMap();
    }, 150);
  }

  private async initializeZoneMap() {
    if (!this.showModal() || !this.zoneMapContainer?.nativeElement) {
      return;
    }

    if (!this.leafletLib) {
      this.leafletLib = await import('leaflet');
    }

    const L = this.leafletLib;

    if (!this.zoneMap) {
      this.zoneMap = L.map(this.zoneMapContainer.nativeElement, {
        zoomControl: true,
        attributionControl: true,
      }).setView([this.currentZone.latitude, this.currentZone.longitude], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(this.zoneMap);

      this.zoneMap.on('click', (event: any) => {
        this.currentZone.latitude = Number(event.latlng.lat.toFixed(6));
        this.currentZone.longitude = Number(event.latlng.lng.toFixed(6));
        this.syncMapShapes();
      });
    }

    this.syncMapShapes(true);
  }

  syncMapShapes(shouldCenter = false) {
    if (!this.zoneMap || !this.leafletLib) {
      return;
    }

    const L = this.leafletLib;
    const latLng = L.latLng(this.currentZone.latitude, this.currentZone.longitude);

    if (!this.zoneMarker) {
      this.zoneMarker = L.circleMarker(latLng, {
        radius: 8,
        color: '#0f172a',
        weight: 2,
        fillColor: '#22c55e',
        fillOpacity: 0.9,
      }).addTo(this.zoneMap);
    } else {
      this.zoneMarker.setLatLng(latLng);
    }

    if (!this.zoneRadiusCircle) {
      this.zoneRadiusCircle = L.circle(latLng, {
        radius: this.currentZone.radius_meters,
        color: '#16a34a',
        fillColor: '#22c55e',
        fillOpacity: 0.14,
        weight: 2,
      }).addTo(this.zoneMap);
    } else {
      this.zoneRadiusCircle.setLatLng(latLng);
      this.zoneRadiusCircle.setRadius(this.currentZone.radius_meters);
    }

    if (shouldCenter) {
      this.zoneMap.setView(latLng, 16);
    }

    setTimeout(() => this.zoneMap.invalidateSize(), 0);
  }

  private destroyMapInstance() {
    if (this.zoneMap) {
      this.zoneMap.off();
      this.zoneMap.remove();
    }
    this.zoneMap = null;
    this.zoneMarker = null;
    this.zoneRadiusCircle = null;
  }
}
