import { Component, inject, OnInit, signal } from '@angular/core';
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
    <app-custom-modal [openModal]="showModal()" (closeModal)="closeModal()" [crossButton]="true" maxWidth="max-w-md">
      <div class="p-1">
        <h2 class="text-xl font-bold text-slate-900 mb-2">{{ isEditing() ? 'Edit Geofence Zone' : 'Create New Zone' }}</h2>
        <p class="text-sm text-slate-500 mb-6 font-medium">Identify the physical boundaries for this area.</p>

        <form (ngSubmit)="saveZone()" class="space-y-4">
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-widest">Zone Name</label>
            <input type="text" [(ngModel)]="currentZone.name" name="name" class="app-field" placeholder="e.g., Head Office, Site A" required>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-widest">Latitude</label>
              <input type="number" step="any" [(ngModel)]="currentZone.latitude" name="latitude" class="app-field" placeholder="23.456789" required>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-widest">Longitude</label>
              <input type="number" step="any" [(ngModel)]="currentZone.longitude" name="longitude" class="app-field" placeholder="78.123456" required>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-widest">Radius (Meters)</label>
            <div class="relative">
              <input type="number" [(ngModel)]="currentZone.radius_meters" name="radius" class="app-field pr-12" placeholder="100" required>
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">m</span>
            </div>
            <p class="text-[10px] text-slate-400 font-medium italic">Recommended minimum radius is 50m for GPS accuracy.</p>
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
  `]
})
export class GeofenceManagementComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private toastService = inject(ToastService);

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
    this.currentZone = { id: 0, name: '', latitude: 0, longitude: 0, radius_meters: 100 };
    this.showModal.set(true);
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
  }

  closeModal() {
    this.showModal.set(false);
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
}
