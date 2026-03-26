import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, GeoFenceZone, GeoFenceSettings } from '../../core/services/attendance.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-geofence-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col gap-6 pb-10 max-w-5xl mx-auto">
      <!-- Header -->
      <header class="app-module-hero flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
        <div class="max-w-2xl">
          <p class="app-module-kicker">Geofence Control</p>
          <h1 class="app-module-title mt-3">Location rules for attendance validation</h1>
          <p class="app-module-text mt-3">Manage office zones, enable geofence enforcement, and control branch-safe attendance validation for your workforce.</p>
        </div>
        <div class="app-module-highlight min-w-[240px]">
          <span class="app-module-highlight-label">Active locations</span>
          <div class="app-module-highlight-value mt-3">{{ zones().length }}</div>
          <p class="mt-2 text-sm text-white/80">Configured office locations currently available for location-based attendance checks.</p>
        </div>
      </header>

      <!-- Geofence Toggle Card -->
      <div class="card p-6 rounded-md border border-slate-200 bg-white">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-md flex items-center justify-center"
                 [ngClass]="settings()?.geofence_enabled ? 'bg-green-100' : 'bg-slate-100'">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                   stroke="currentColor" stroke-width="2" 
                   [ngClass]="settings()?.geofence_enabled ? 'text-green-600' : 'text-slate-400'">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-slate-900 text-lg">Geofence Attendance</h3>
              <p class="text-sm text-slate-500">When enabled, employees must be within office location to mark attendance</p>
            </div>
          </div>
          <button (click)="toggleGeofence()" 
                  [disabled]="saving()"
                  class="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
                  [ngClass]="settings()?.geofence_enabled ? 'bg-green-500' : 'bg-slate-300'">
            <span class="inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform"
                  [ngClass]="settings()?.geofence_enabled ? 'translate-x-7' : 'translate-x-1'"></span>
          </button>
        </div>

        <!-- Additional Setting -->
        <div *ngIf="settings()?.geofence_enabled" class="mt-6 pt-6 border-t border-slate-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-bold text-slate-800">Require for All Employees</p>
              <p class="text-sm text-slate-500">When enabled, all employees must mark attendance within geofence</p>
            </div>
            <button (click)="toggleRequireAll()" 
                    [disabled]="saving()"
                    class="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
                    [ngClass]="settings()?.require_geofence_for_all ? 'bg-green-500' : 'bg-slate-300'">
              <span class="inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform"
                    [ngClass]="settings()?.require_geofence_for_all ? 'translate-x-7' : 'translate-x-1'"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- Add Zone Card -->
      <div *ngIf="settings()?.geofence_enabled" class="card p-6 rounded-md border border-slate-200 bg-white">
        <h3 class="font-bold text-slate-900 text-lg mb-4">Add New Location</h3>
        
        <form (ngSubmit)="addZone()" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Location Name</label>
              <input type="text" [(ngModel)]="newZone.name" name="name" 
                     placeholder="e.g., Main Office, Branch 1"
                     class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium" required>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Radius (meters)</label>
              <input type="number" [(ngModel)]="newZone.radius_meters" name="radius" 
                     placeholder="e.g., 100"
                     class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium" required>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Latitude</label>
              <input type="number" step="any" [(ngModel)]="newZone.latitude" name="latitude" 
                     placeholder="e.g., 28.6139"
                     class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium" required>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Longitude</label>
              <input type="number" step="any" [(ngModel)]="newZone.longitude" name="longitude" 
                     placeholder="e.g., 77.2090"
                     class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium" required>
            </div>
          </div>

          <!-- Current Location Button -->
          <div class="flex gap-2">
            <button type="button" (click)="getCurrentLocation()" 
                    [disabled]="gettingLocation()"
                    class="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex items-center gap-2">
              <svg *ngIf="!gettingLocation()" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
              </svg>
              <svg *ngIf="gettingLocation()" class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              {{ gettingLocation() ? 'Getting Location...' : 'Use Current Location' }}
            </button>
          </div>

          <div class="flex justify-end pt-2">
            <button type="submit" [disabled]="saving() || !newZone.name || !newZone.radius_meters"
                    class="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2">
              <svg *ngIf="saving()" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              {{ saving() ? 'Adding...' : 'Add Location' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Existing Zones List -->
      <div *ngIf="settings()?.geofence_enabled && zones().length > 0" class="card p-6 rounded-md border border-slate-200 bg-white">
        <h3 class="font-bold text-slate-900 text-lg mb-4">Office Locations</h3>
        
        <div class="space-y-3">
          <div *ngFor="let zone of zones()" 
               class="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                   [ngClass]="zone.is_active ? 'bg-green-100' : 'bg-slate-100'">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
                     stroke="currentColor" stroke-width="2"
                     [ngClass]="zone.is_active ? 'text-green-600' : 'text-slate-400'">
                  <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <p class="font-bold text-slate-800">{{ zone.name }}</p>
                <p class="text-xs text-slate-500">
                  Lat: {{ zone.center_lat | number:'1.4-4' }}, Lng: {{ zone.center_lng | number:'1.4-4' }} • 
                  Radius: {{ zone.radius_meters }}m
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <!-- Toggle Active -->
              <button (click)="toggleZoneActive(zone)" 
                      [disabled]="saving()"
                      class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      [ngClass]="zone.is_active 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'">
                {{ zone.is_active ? 'Active' : 'Inactive' }}
              </button>
              <!-- Delete -->
              <button (click)="deleteZone(zone)" 
                      [disabled]="saving()"
                      class="p-2 rounded-lg text-slate-400 hover:text-error hover:bg-red-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="settings()?.geofence_enabled && zones().length === 0" 
           class="card p-8 rounded-md border border-dashed border-slate-300 bg-slate-50 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" 
             stroke="currentColor" stroke-width="1.5" class="text-slate-300 mx-auto mb-4">
          <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <p class="font-bold text-slate-600">No locations added yet</p>
        <p class="text-sm text-slate-500 mt-1">Add at least one office location to enable geofence attendance</p>
      </div>

      <!-- Info Card -->
      <div class="card p-5 rounded-md border border-blue-100 bg-blue-50">
        <div class="flex gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
               stroke="currentColor" stroke-width="2" class="text-blue-600 flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/>
          </svg>
          <div>
            <p class="font-bold text-blue-800">How Geofence Attendance Works</p>
            <p class="text-sm text-blue-700 mt-1">
              When an employee tries to mark attendance, the system will verify their current location against 
              the defined office locations. If geofence is enabled and the employee is outside the allowed 
              radius, their attendance will be blocked. You can also assign specific locations to individual 
              employees if they work remotely or at different branches.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GeofenceSettingsComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private toastService = inject(ToastService);

  settings = signal<GeoFenceSettings | null>(null);
  zones = signal<GeoFenceZone[]>([]);
  saving = signal(false);
  gettingLocation = signal(false);

  newZone = {
    name: '',
    latitude: 0,
    longitude: 0,
    radius_meters: 100
  };

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.attendanceService.getGeoFenceSettings().subscribe({
      next: (data) => {
        this.settings.set(data);
        this.zones.set(data.zones || []);
      },
      error: (err) => {
        // If endpoint doesn't exist yet, use defaults
        this.settings.set({
          geofence_enabled: false,
          zones: [],
          require_geofence_for_all: false
        });
      }
    });
  }

  toggleGeofence() {
    const current = this.settings();
    if (!current) return;

    this.saving.set(true);
    this.attendanceService.updateGeoFenceSettings({ 
      geofence_enabled: !current.geofence_enabled 
    }).subscribe({
      next: (data) => {
        this.settings.set(data);
        this.toastService.success(data.geofence_enabled ? 'Geofence enabled' : 'Geofence disabled');
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error('Failed to update settings');
        this.saving.set(false);
      }
    });
  }

  toggleRequireAll() {
    const current = this.settings();
    if (!current) return;

    this.saving.set(true);
    this.attendanceService.updateGeoFenceSettings({ 
      require_geofence_for_all: !current.require_geofence_for_all 
    }).subscribe({
      next: (data) => {
        this.settings.set(data);
        this.toastService.success(data.require_geofence_for_all ? 'Required for all employees' : 'Optional for employees');
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error('Failed to update settings');
        this.saving.set(false);
      }
    });
  }

  addZone() {
    if (!this.newZone.name || !this.newZone.latitude || !this.newZone.longitude || !this.newZone.radius_meters) {
      this.toastService.error('Please fill all fields');
      return;
    }

    this.saving.set(true);
    this.attendanceService.createGeoFenceZone(this.newZone).subscribe({
      next: (zone) => {
        this.zones.update(z => [...z, zone]);
        this.newZone = { name: '', latitude: 0, longitude: 0, radius_meters: 100 };
        this.toastService.success('Location added successfully');
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to add location');
        this.saving.set(false);
      }
    });
  }

  toggleZoneActive(zone: GeoFenceZone) {
    this.saving.set(true);
    this.attendanceService.updateGeoFenceZone(zone.id, { 
      is_active: !zone.is_active 
    }).subscribe({
      next: (updated) => {
        this.zones.update(z => z.map(zone => 
          zone.id === updated.id ? updated : zone
        ));
        this.toastService.success(updated.is_active ? 'Location activated' : 'Location deactivated');
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error('Failed to update location');
        this.saving.set(false);
      }
    });
  }

  deleteZone(zone: GeoFenceZone) {
    if (!confirm(`Are you sure you want to delete "${zone.name}"?`)) {
      return;
    }

    this.saving.set(true);
    this.attendanceService.deleteGeoFenceZone(zone.id).subscribe({
      next: () => {
        this.zones.update(z => z.filter(zone => zone.id !== zone.id));
        this.toastService.success('Location deleted');
        this.saving.set(false);
        this.loadSettings();
      },
      error: (err) => {
        this.toastService.error('Failed to delete location');
        this.saving.set(false);
      }
    });
  }

  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.toastService.error('Geolocation not supported');
      return;
    }

    this.gettingLocation.set(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.newZone.latitude = position.coords.latitude;
        this.newZone.longitude = position.coords.longitude;
        this.gettingLocation.set(false);
        this.toastService.success('Location captured');
      },
      (error) => {
        this.gettingLocation.set(false);
        this.toastService.error('Failed to get location: ' + error.message);
      },
      { timeout: 10000 }
    );
  }
}

