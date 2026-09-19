import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  AttendanceService,
  GeoFenceDashboard,
  GeoFenceSettings,
  GeoFenceZone,
} from '../../../../core/services/attendance.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LanguageService } from '../../../../core/services/language.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { User } from '../../../../core/models/auth.model';
import { CustomButtonComponent } from '../../../../core/components/button/custom-button.component';
import { GeofenceMapComponent, GeofenceMapInitialValue } from './geofence-map.component';
import { GeofenceMapService } from './geofence-map.service';
import { GeofencePolygonInitialValue, GeofencePolygonMapComponent } from './geofence-polygon-map.component';

@Component({
  selector: 'app-geo-fence',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomButtonComponent, GeofenceMapComponent, GeofencePolygonMapComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-7xl space-y-6 overflow-x-hidden">
      <section class="overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_38%),linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#ecfeff_100%)] shadow-sm">
        <div class="grid gap-5 px-4 py-5 sm:px-6 2xl:grid-cols-[minmax(0,1fr)_340px] lg:px-8 lg:py-6">
          <div class="space-y-4">
            <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              Attendance Settings
            </div>
            <div>
              <h1 class="text-3xl font-black tracking-tight text-slate-900 sm:text-[2.2rem]">Geo-Fence Controls</h1>
              <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Manage circular geo-fence sites and assign employees zone-wise like Angular_Web,
                without mixing attendance punching and settings screens.
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              <div class="rounded-2xl border border-white/80 bg-white/90 px-4 py-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Configured zones</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ zones().length }}</p>
                <p class="mt-1 text-xs text-slate-500">Live geo-fence sites</p>
              </div>
              <div class="rounded-2xl border border-white/80 bg-white/90 px-4 py-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Assigned employees</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ totalAssignedEmployees() }}</p>
                <p class="mt-1 text-xs text-slate-500">Mapped to a dedicated zone</p>
              </div>
              <div class="rounded-2xl border border-white/80 bg-white/90 px-4 py-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Enforcement</p>
                <p class="mt-2 text-lg font-black text-slate-900">{{ settings().geofence_enabled ? t('common.enabled') : t('common.disabled') }}</p>
                <p class="mt-1 text-xs text-slate-500">Attendance restriction status</p>
              </div>
              <div class="rounded-2xl border border-white/80 bg-white/90 px-4 py-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
                <p class="mt-2 text-lg font-black text-slate-900">{{ editingId() ? 'Update Zone' : 'Create Zone' }}</p>
                <p class="mt-1 text-xs text-slate-500">Circular setup and assignment</p>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace Guide</p>
                <h2 class="mt-1 text-lg font-black text-slate-900">Real geo-fence setup</h2>
              </div>
              <button type="button" (click)="resetForm()" class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white">
                {{ t('common.reset') }}
              </button>
            </div>

            <div class="mt-4 space-y-3">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{{ t('common.searchZones') }}</label>
              <div class="relative">
                <input [value]="searchQuery()" (input)="updateSearch($event)" class="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-200/60" placeholder="Search by zone name">
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p class="font-semibold text-slate-900">Primary flow</p>
                  <p class="mt-1 text-xs leading-5 text-slate-500">Create circular geo-fences, pin the exact center, then assign employees zone-wise.</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p class="font-semibold text-slate-900">Validation flow</p>
                  <p class="mt-1 text-xs leading-5 text-slate-500">Attendance is allowed only when the employee location is inside the assigned work boundary.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          <button type="button" (click)="setTab('circular')" class="rounded-xl px-4 py-3 text-sm font-bold transition" [ngClass]="activeTab() === 'circular' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'">Circular Geofence</button>
          <button type="button" (click)="setTab('polygon')" class="rounded-xl px-4 py-3 text-sm font-bold transition" [ngClass]="activeTab() === 'polygon' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'">Polygon Geofence</button>
          <button type="button" (click)="setTab('assignment')" class="rounded-xl px-4 py-3 text-sm font-bold transition" [ngClass]="activeTab() === 'assignment' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'">Assign Geofence</button>
          <button type="button" (click)="setTab('monitoring')" class="rounded-xl px-4 py-3 text-sm font-bold transition" [ngClass]="activeTab() === 'monitoring' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'">Monitoring</button>
          <button type="button" (click)="openAdvancedWorkspace()" class="rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100">Open Advanced Workspace</button>
        </div>
      </section>

      <div *ngIf="activeTab() === 'circular'" class="grid gap-6 2xl:grid-cols-[minmax(0,1.06fr)_minmax(360px,0.94fr)]">
        <section class="space-y-6">
          <article class="app-surface-card overflow-hidden p-0">
            <div class="border-b border-slate-100 px-6 py-5">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Enforcement</p>
              <h2 class="mt-2 text-2xl font-black text-slate-900">Attendance boundary rules</h2>
            </div>
            <div class="space-y-4 px-6 py-6">
              <label class="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm">
                <div>
                  <p class="text-sm font-semibold text-slate-900">Enable geo-fence validation</p>
                  <p class="mt-1 text-xs text-slate-500">Require attendance punches to be validated against allowed sites.</p>
                </div>
                <input type="checkbox" [checked]="settings().geofence_enabled" (change)="toggleSettings('geofence_enabled', $event)" class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500">
              </label>
              <label class="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm">
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
              <div class="flex flex-col gap-4">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ editingId() ? 'Update Circular Zone' : 'Create Circular Zone' }}</p>
                  <h2 class="mt-2 text-2xl font-black tracking-tight text-slate-900">Location boundary</h2>
                  <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Define the zone name, place the center point on the map, set the radius, and save one clean circular boundary for attendance validation.</p>
                </div>
                <div class="grid gap-3 sm:grid-cols-3 2xl:max-w-3xl">
                  <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Setup</p>
                    <p class="mt-1 text-sm font-bold text-slate-900">{{ editingId() ? 'Update' : 'Create' }}</p>
                  </div>
                  <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Center</p>
                    <p class="mt-1 text-sm font-bold text-slate-900">{{ currentZoneCenterLabel() }}</p>
                  </div>
                  <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p class="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Radius</p>
                    <p class="mt-1 text-sm font-bold text-emerald-900">{{ currentZoneRadiusLabel() }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="px-6 py-6">
              <app-geofence-map
                [initialGeofence]="editingGeofence()"
                [resetVersion]="circularResetVersion()"
                (saved)="handleGeofenceMapSaved($event)"
              />
            </div>
          </article>
        </section>

        <section class="app-surface-card overflow-hidden p-0 xl:sticky xl:top-6 xl:self-start">
          <div class="border-b border-slate-100 px-6 py-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Geo-Fence Directory</p>
                <h2 class="mt-2 text-2xl font-black tracking-tight text-slate-900">Protected sites</h2>
                <p class="mt-2 text-sm leading-6 text-slate-500">Review every configured zone, its radius, and current employee coverage from one clean panel.</p>
              </div>
              <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">{{ filteredZones().length }} record(s) shown</div>
            </div>
          </div>
          <div class="border-b border-slate-100 bg-slate-50/70 px-6 py-4 text-sm text-slate-600">Geo-fence zones created here are reused for attendance validation and employee geo assignment across the organization.</div>
          <div class="space-y-4 bg-slate-50/50 p-4 sm:p-5">
            <div class="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 xl:grid xl:grid-cols-[minmax(0,1.25fr)_0.8fr_0.9fr_132px] xl:gap-3">
              <span>Zone</span>
              <span>Coordinates</span>
              <span>Radius / Team</span>
              <span>Actions</span>
            </div>
            @for (zone of filteredZones(); track zone.id) {
              <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div class="flex min-w-0 flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1.25fr)_0.8fr_0.9fr_132px] xl:items-start xl:gap-3">
                  <div class="min-w-0 space-y-3">
                    <div class="flex flex-wrap items-center gap-3">
                      <p class="break-words text-lg font-black text-slate-900">{{ zone.name }}</p>
                      <span class="rounded-full px-3 py-1 text-xs font-semibold" [ngClass]="zone.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">{{ zone.is_active ? t('common.active') : t('common.inactive') }}</span>
                    </div>
                    <p class="text-sm leading-6 text-slate-500">{{ assignedSummary(zone.id) }}</p>
                  </div>
                  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Latitude</p>
                      <p class="mt-1 text-sm font-bold text-slate-900">{{ zone.center_lat | number:'1.4-4' }}</p>
                    </div>
                    <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Longitude</p>
                      <p class="mt-1 text-sm font-bold text-slate-900">{{ zone.center_lng | number:'1.4-4' }}</p>
                    </div>
                  </div>
                  <div class="grid gap-3">
                    <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <p class="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Radius</p>
                      <p class="mt-1 text-sm font-bold text-emerald-900">{{ zone.radius_meters }} meters</p>
                    </div>
                    <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Assigned</p>
                      <p class="mt-1 text-sm font-bold text-slate-900">{{ assignedCount(zone.id) }} employee(s)</p>
                    </div>
                  </div>
                  <div class="flex flex-col gap-3 sm:flex-row lg:flex-col">
                    <button type="button" (click)="editZone(zone)" class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{{ t('common.edit') }}</button>
                    <button type="button" (click)="openAssignModal(zone)" class="rounded-xl border border-teal-200 px-4 py-2.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-50">Assign</button>
                    <button type="button" (click)="deleteZone(zone.id)" class="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">{{ t('common.delete') }}</button>
                  </div>
                </div>
              </article>
            } @empty {
              <div class="px-6 py-16 text-center">
                <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
                </div>
                <p class="mt-4 text-base font-semibold text-slate-900">{{ t('common.noResults') }}</p>
                <p class="mt-2 text-sm text-slate-500">Add the first approved site to start validating attendance punches against real location boundaries.</p>
              </div>
            }
          </div>
        </section>
      </div>

      <div *ngIf="activeTab() === 'polygon'" class="grid gap-6">
        <section class="space-y-6">
          <article class="app-surface-card overflow-hidden p-0">
            <div class="border-b border-slate-100 px-6 py-5">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Polygon Geofence</p>
                <h2 class="mt-2 text-2xl font-black text-slate-900">Location boundary</h2>
                <p class="mt-2 text-sm leading-6 text-slate-500">Create one polygon attendance boundary with a clean map-first workspace and save it with a production-ready payload.</p>
              </div>
            </div>
            <div class="px-6 py-6">
              <app-geofence-polygon-map
                [initialGeofence]="editingPolygonGeofence()"
                [resetVersion]="polygonResetVersion()"
                (saved)="handlePolygonGeofenceSaved($event)"
              />
            </div>
          </article>
        </section>
      </div>

      <section *ngIf="activeTab() === 'assignment'" class="app-surface-card overflow-hidden p-0">
        <div class="border-b border-slate-100 px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Assign Geofence</p>
          <h2 class="mt-2 text-2xl font-black text-slate-900">Zone wise employee mapping</h2>
          <p class="mt-2 text-sm leading-6 text-slate-500">Pick a zone and assign employees exactly from one settings workspace, instead of opening every employee record one by one.</p>
        </div>
        <div class="grid gap-4 px-6 py-6 xl:grid-cols-2">
          <article *ngFor="let zone of filteredZones(); trackBy: trackZoneById" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="break-words text-lg font-black text-slate-900">{{ zone.name }}</p>
                <p class="mt-2 text-sm leading-6 text-slate-500">{{ zone.center_lat | number:'1.4-4' }}, {{ zone.center_lng | number:'1.4-4' }} | Radius {{ zone.radius_meters }} meters</p>
              </div>
              <span class="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">{{ assignedCount(zone.id) }} assigned</span>
            </div>
            <p class="mt-4 min-h-[40px] text-xs uppercase tracking-[0.16em] text-slate-400">{{ assignedSummary(zone.id) }}</p>
            <div class="mt-4">
              <app-custom-button (btnClick)="openAssignModal(zone)">Assign Employees</app-custom-button>
            </div>
          </article>
        </div>
      </section>

      <section *ngIf="activeTab() === 'monitoring'" class="app-surface-card overflow-hidden p-0">
        <div class="border-b border-slate-100 px-6 py-5">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Monitoring Dashboard</p>
              <h2 class="mt-2 text-2xl font-black text-slate-900">Geo-fence compliance overview</h2>
              <p class="mt-2 text-sm leading-6 text-slate-500">Track outside attempts, affected employees, and recent location violations from one place.</p>
            </div>
            <button
              type="button"
              (click)="loadDashboard()"
              class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white"
            >
              Refresh Dashboard
            </button>
          </div>
        </div>
        <div class="space-y-5 px-6 py-6">
          <div class="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Outside attempts</p>
              <p class="mt-2 text-2xl font-black text-slate-900">{{ dashboard().summary.total_violations }}</p>
              <p class="mt-1 text-xs text-slate-500">Recent blocked or flagged punches</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Employees impacted</p>
              <p class="mt-2 text-2xl font-black text-slate-900">{{ dashboard().summary.unique_employees }}</p>
              <p class="mt-1 text-xs text-slate-500">Unique employees in recent violations</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Active zones</p>
              <p class="mt-2 text-2xl font-black text-slate-900">{{ dashboard().summary.active_zones }}</p>
              <p class="mt-1 text-xs text-slate-500">Available allowed work locations</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Strict mode</p>
              <p class="mt-2 text-lg font-black text-slate-900">{{ dashboard().summary.strict_mode ? 'Enabled' : 'Optional' }}</p>
              <p class="mt-1 text-xs text-slate-500">Organization enforcement level</p>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recent Violation Logs</p>
                <p class="mt-1 text-sm text-slate-500">Employees who were outside the allowed work location during attendance validation.</p>
              </div>
              <span class="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-500">{{ dashboard().violations.length }} records</span>
            </div>

            <div class="mt-4 space-y-3">
              <article *ngFor="let violation of dashboard().violations; trackBy: trackViolationById" class="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-3">
                      <p class="break-words text-base font-black text-slate-900">{{ violation.employee_name }}</p>
                      <span *ngIf="violation.employee_code" class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{{ violation.employee_code }}</span>
                      <span class="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">{{ violation.zone_name || 'Outside Geo-fence' }}</span>
                    </div>
                    <div class="mt-3 grid gap-3 sm:grid-cols-3">
                      <div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Distance</p>
                        <p class="mt-1 text-sm font-bold text-slate-900">{{ violation.distance_meters ? (violation.distance_meters | number:'1.0-0') + ' m' : '--' }}</p>
                      </div>
                      <div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Action</p>
                        <p class="mt-1 text-sm font-bold text-slate-900">{{ violation.action_type || 'validation' }}</p>
                      </div>
                      <div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Time</p>
                        <p class="mt-1 text-sm font-bold text-slate-900">{{ violation.occurred_at | date:'medium' }}</p>
                      </div>
                    </div>
                    <p class="mt-3 text-sm leading-6 text-slate-500">{{ violation.violation_message || 'You are outside the allowed work location.' }}</p>
                  </div>
                  <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
                    {{ violation.latitude ?? '--' }}, {{ violation.longitude ?? '--' }}
                  </div>
                </div>
              </article>

              <div *ngIf="!dashboard().violations.length" class="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
                <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <p class="mt-4 text-base font-semibold text-slate-900">No recent geo-fence violations</p>
                <p class="mt-2 text-sm text-slate-500">Employees are currently marking attendance inside their allowed work locations.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div *ngIf="selectedZone()" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div class="w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div class="border-b border-slate-100 px-6 py-5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Assign Employees</p>
              <h3 class="mt-2 break-words text-2xl font-black text-slate-900">{{ selectedZone()?.name }}</h3>
              <p class="mt-2 text-sm leading-6 text-slate-500">Select employees who should punch attendance inside this geofence.</p>
            </div>
            <button type="button" (click)="closeAssignModal()" class="self-start rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Close</button>
          </div>
        </div>
        <div class="grid gap-6 px-6 py-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div class="space-y-4">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-slate-400"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
                  <input [ngModel]="assignmentSearch()" (ngModelChange)="assignmentSearch.set($event)" type="text" placeholder="Search employee" class="w-full border-0 bg-transparent text-sm text-slate-700 outline-none" />
                </div>
                <span class="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-500">{{ filteredEmployeesForAssignment().length }} employees</span>
              </div>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div class="mb-3 hidden rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 md:grid md:grid-cols-[42px_minmax(0,1fr)] md:gap-3">
                <span>Select</span>
                <span>Employee</span>
              </div>
              <div class="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
              <label *ngFor="let employee of filteredEmployeesForAssignment(); let index = index; trackBy: trackEmployeeById" class="flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition" [ngClass]="isSelected(employee) ? 'border-teal-300 bg-teal-50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'">
                <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" [checked]="isSelected(employee)" (change)="toggleEmployee(employee)" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-bold text-slate-900">{{ index + 1 }}. {{ employee.firstName }} {{ employee.lastName }}</p>
                  <p class="mt-1 truncate text-xs text-slate-500">
                    {{ employee.employeeCode || 'No Code' }}
                    <span *ngIf="employee.department?.name"> - {{ employee.department?.name }}</span>
                    <span *ngIf="employee.designation?.name"> - {{ employee.designation?.name }}</span>
                  </p>
                </div>
              </label>
              <div *ngIf="!filteredEmployeesForAssignment().length" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No employees found for this search.</div>
              </div>
            </div>
          </div>
          <div class="space-y-4">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Selected Employees</p>
              <p class="mt-2 text-2xl font-black text-slate-900">{{ selectedEmployees().length }}</p>
              <p class="mt-2 text-sm text-slate-500">These employees will be mapped to {{ selectedZone()?.name }}.</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Preview</p>
              <div class="mt-3 max-h-56 space-y-2 overflow-y-auto">
                <div *ngFor="let employee of selectedEmployees(); trackBy: trackEmployeeById" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">{{ employee.firstName }} {{ employee.lastName }}</div>
                <div *ngIf="!selectedEmployees().length" class="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No employees selected yet.</div>
              </div>
            </div>
            <div class="grid gap-3">
              <app-custom-button [disabled]="assignmentSaving() || !selectedZone()" (btnClick)="saveAssignments()">{{ assignmentSaving() ? 'Saving...' : 'Save Assignment' }}</app-custom-button>
              <app-custom-button type="secondary" [disabled]="assignmentSaving()" (btnClick)="closeAssignModal()">Cancel</app-custom-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .app-surface-card {
      border: 1px solid #e2e8f0;
      border-radius: 1.5rem;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.96) 100%);
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
    }
    .app-field {
      width: 100%;
      border: 1px solid #dbe3ee;
      border-radius: 1rem;
      background: #ffffff;
      padding: 0.85rem 0.95rem;
      font-size: 0.95rem;
      line-height: 1.4rem;
      color: #0f172a;
      outline: none;
      transition:
        border-color 0.18s ease,
        box-shadow 0.18s ease,
        background-color 0.18s ease;
      box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.03);
    }
    .app-field::placeholder {
      color: #94a3b8;
    }
    .app-field:hover {
      border-color: #cbd5e1;
    }
    .app-field:focus {
      border-color: #0f172a;
      box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.08);
    }
  `],
})
export class GeoFenceComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private toastService = inject(ToastService);
  private languageService = inject(LanguageService);
  private employeeService = inject(EmployeeService);
  private geofenceMapService = inject(GeofenceMapService);
  private router = inject(Router);

  zones = signal<GeoFenceZone[]>([]);
  employees = signal<User[]>([]);
  settings = signal<GeoFenceSettings>({
    geofence_enabled: true,
    require_geofence_for_all: false,
    zones: [],
  });
  activeTab = signal<'circular' | 'polygon' | 'assignment' | 'monitoring'>('circular');
  searchQuery = signal('');
  editingId = signal<number | null>(null);
  circularResetVersion = signal(0);
  polygonResetVersion = signal(0);
  selectedZone = signal<GeoFenceZone | null>(null);
  selectedEmployees = signal<User[]>([]);
  assignmentSearch = signal('');
  assignmentSaving = signal(false);
  employeesLoaded = signal(false);
  dashboard = signal<GeoFenceDashboard>({
    summary: {
      total_violations: 0,
      unique_employees: 0,
      active_zones: 0,
      strict_mode: false,
    },
    violations: [],
  });

  filteredZones = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.zones();
    return this.zones().filter((zone) => zone.name.toLowerCase().includes(query));
  });

  editingGeofence = computed<GeofenceMapInitialValue | null>(() => {
    const editingId = this.editingId();
    if (!editingId) {
      return null;
    }

    const zone = this.zones().find((item) => item.id === editingId);
    if (!zone) {
      return null;
    }

    return {
      id: zone.id,
      name: zone.name,
      latitude: zone.center_lat,
      longitude: zone.center_lng,
      radius: zone.radius_meters,
    };
  });
  editingPolygonGeofence = computed<GeofencePolygonInitialValue | null>(() => null);

  filteredEmployeesForAssignment = computed(() => {
    const query = this.assignmentSearch().trim().toLowerCase();
    if (!query) return this.employees();
    return this.employees().filter((employee) =>
      [employee.firstName, employee.lastName, employee.employeeCode, employee.department?.name, employee.designation?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  });
  employeeAssignments = computed(() => {
    const byZone = new Map<number, User[]>();
    for (const employee of this.employees()) {
      const zoneId = Number(employee.geofenceId ?? 0);
      if (!zoneId) {
        continue;
      }
      const bucket = byZone.get(zoneId);
      if (bucket) {
        bucket.push(employee);
      } else {
        byZone.set(zoneId, [employee]);
      }
    }
    return byZone;
  });

  totalAssignedEmployees = computed(() =>
    this.employees().filter((employee) => Number(employee.geofenceId ?? 0) > 0).length,
  );

  currentZoneCenterLabel(): string {
    const zone = this.editingGeofence();
    return zone ? `${Number(zone.latitude).toFixed(5)}, ${Number(zone.longitude).toFixed(5)}` : 'Select on map';
  }

  currentZoneRadiusLabel(): string {
    return `${this.editingGeofence()?.radius ?? 150} meters`;
  }

  ngOnInit(): void {
    this.loadZones();
    this.loadSettings();
    this.loadDashboard();
    void this.geofenceMapService.loadLeaflet();
  }

  loadDashboard(): void {
    this.attendanceService.getGeoFenceDashboard().subscribe({
      next: (dashboard) => this.dashboard.set(dashboard),
      error: () => {
        this.dashboard.set({
          summary: {
            total_violations: 0,
            unique_employees: 0,
            active_zones: this.zones().filter((zone) => zone.is_active).length,
            strict_mode: this.settings().require_geofence_for_all,
          },
          violations: [],
        });
      },
    });
  }

  loadZones(): void {
    this.attendanceService.getGeoFenceZones().subscribe({
      next: (zones) => this.zones.set(zones),
      error: () => this.toastService.error('Unable to load geo-fence zones right now.'),
    });
  }

  loadSettings(): void {
    this.attendanceService.getGeoFenceSettings().subscribe({
      next: (settings) => this.settings.set(settings),
      error: () => this.toastService.error('Unable to load geo-fence settings right now.'),
    });
  }

  loadEmployees(): void {
    if (this.employeesLoaded()) {
      return;
    }
    this.employeeService.getEmployees().pipe(catchError(() => of([]))).subscribe({
      next: (employees) => {
        this.employees.set(employees);
        this.employeesLoaded.set(true);
      },
      error: () => this.toastService.error('Unable to load employee list right now.'),
    });
  }

  updateSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  setTab(tab: 'circular' | 'polygon' | 'assignment' | 'monitoring'): void {
    this.activeTab.set(tab);
    if (tab === 'circular') {
      void this.geofenceMapService.loadLeaflet();
      return;
    }
    if (tab === 'polygon') {
      void this.geofenceMapService.loadLeaflet();
      return;
    }
    if (tab === 'assignment') {
      this.loadEmployees();
      return;
    }
    this.loadDashboard();
  }

  toggleSettings(key: 'geofence_enabled' | 'require_geofence_for_all', event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.settings.set({ ...this.settings(), [key]: checked });
    this.attendanceService.updateGeoFenceSettings({ [key]: checked }).subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.toastService.success('Geo-fence settings updated.');
      },
      error: () => this.toastService.error('Unable to update geo-fence settings right now.'),
    });
  }

  editZone(zone: GeoFenceZone): void {
    this.editingId.set(zone.id);
  }

  handleGeofenceMapSaved(savedZone: {
    id: number;
    name: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    type?: 'circle' | 'polygon';
  }): void {
    if (
      savedZone.type === 'polygon' ||
      !Number.isFinite(savedZone.latitude) ||
      !Number.isFinite(savedZone.longitude) ||
      !Number.isFinite(savedZone.radius)
    ) {
      return;
    }

    const normalizedZone: GeoFenceZone = {
      id: savedZone.id,
      name: savedZone.name,
      center_lat: Number(savedZone.latitude),
      center_lng: Number(savedZone.longitude),
      radius_meters: Number(savedZone.radius),
      is_active: true,
    };

    const existing = this.zones().some((zone) => zone.id === normalizedZone.id);
    if (existing) {
      this.zones.update((list) => list.map((zone) => (zone.id === normalizedZone.id ? { ...zone, ...normalizedZone } : zone)));
      this.toastService.success('Geo-fence updated successfully.');
    } else {
      this.zones.update((list) => [normalizedZone, ...list]);
      this.toastService.success('Geo-fence created successfully.');
    }

    this.settings.update((settings) => ({ ...settings, zones: this.zones() }));
    this.editingId.set(null);
    this.circularResetVersion.update((value) => value + 1);
  }

  handlePolygonGeofenceSaved(_savedZone: {
    id: number;
    name: string;
    type: 'polygon' | 'circle';
  }): void {
    this.toastService.success('Polygon geofence saved successfully.');
    this.polygonResetVersion.update((value) => value + 1);
  }

  deleteZone(id: number): void {
    if (!confirm('Are you sure you want to delete this geo-fence zone?')) {
      return;
    }
    this.attendanceService.deleteGeoFenceZone(id).subscribe({
      next: () => {
        this.zones.update((list) => list.filter((zone) => zone.id !== id));
        this.settings.update((settings) => ({ ...settings, zones: this.zones() }));
        this.employees.update((list) =>
          list.map((employee) =>
            employee.geofenceId === id ? { ...employee, geofenceId: undefined, geofenceRequired: false } : employee,
          ),
        );
        if (this.editingId() === id) {
          this.resetForm();
        }
        this.toastService.success('Geo-fence removed successfully.');
      },
      error: () => this.toastService.error('Unable to delete this geo-fence right now.'),
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.circularResetVersion.update((value) => value + 1);
    this.polygonResetVersion.update((value) => value + 1);
  }

  assignedCount(zoneId: number): number {
    return this.employeeAssignments().get(zoneId)?.length ?? 0;
  }

  assignedSummary(zoneId: number): string {
    const employees = this.employeeAssignments().get(zoneId) ?? [];
    if (!employees.length) return 'No employees assigned yet';
    const names = employees.slice(0, 4).map((employee) => `${employee.firstName} ${employee.lastName}`.trim());
    return employees.length > 4 ? `${names.join(', ')} +${employees.length - 4} more` : names.join(', ');
  }

  openAssignModal(zone: GeoFenceZone): void {
    this.loadEmployees();
    this.selectedZone.set(zone);
    this.assignmentSearch.set('');
    this.selectedEmployees.set(this.employees().filter((employee) => Number(employee.geofenceId ?? 0) === zone.id));
  }

  closeAssignModal(): void {
    this.selectedZone.set(null);
    this.selectedEmployees.set([]);
    this.assignmentSearch.set('');
    this.assignmentSaving.set(false);
  }

  isSelected(employee: User): boolean {
    const employeeId = Number(employee.id ?? employee.employeeId ?? 0);
    return this.selectedEmployees().some((selected) => Number(selected.id ?? selected.employeeId ?? 0) === employeeId);
  }

  toggleEmployee(employee: User): void {
    const employeeId = Number(employee.id ?? employee.employeeId ?? 0);
    if (!employeeId) return;
    if (this.isSelected(employee)) {
      this.selectedEmployees.update((list) => list.filter((item) => Number(item.id ?? item.employeeId ?? 0) !== employeeId));
      return;
    }
    this.selectedEmployees.update((list) => [...list, employee]);
  }

  saveAssignments(): void {
    const zone = this.selectedZone();
    if (!zone) return;

    const selectedIds = new Set(this.selectedEmployees().map((employee) => Number(employee.id ?? employee.employeeId ?? 0)).filter(Boolean));
    const currentlyAssignedIds = new Set(
      this.employees()
        .filter((employee) => Number(employee.geofenceId ?? 0) === zone.id)
        .map((employee) => Number(employee.id ?? employee.employeeId ?? 0))
        .filter(Boolean),
    );

    const requests = [
      ...Array.from(selectedIds)
        .filter((employeeId) => !currentlyAssignedIds.has(employeeId))
        .map((employeeId) =>
          this.attendanceService.setEmployeeGeofence(employeeId, {
            geofence_zone_id: zone.id,
            requires_geofence: true,
          }),
        ),
      ...Array.from(currentlyAssignedIds)
        .filter((employeeId) => !selectedIds.has(employeeId))
        .map((employeeId) =>
          this.attendanceService.setEmployeeGeofence(employeeId, {
            geofence_zone_id: null,
            requires_geofence: false,
          }),
        ),
    ];

    if (!requests.length) {
      this.toastService.success('Geofence assignment already up to date.');
      this.closeAssignModal();
      return;
    }

    this.assignmentSaving.set(true);
    forkJoin(requests).subscribe({
      next: () => {
        this.employees.update((list) =>
          list.map((employee) => {
            const employeeId = Number(employee.id ?? employee.employeeId ?? 0);
            if (!employeeId) return employee;
            if (selectedIds.has(employeeId)) {
              return { ...employee, geofenceId: zone.id, geofenceRequired: true, geofenceZoneName: zone.name };
            }
            if (currentlyAssignedIds.has(employeeId) && !selectedIds.has(employeeId)) {
              return { ...employee, geofenceId: undefined, geofenceRequired: false, geofenceZoneName: undefined };
            }
            return employee;
          }),
        );
        this.assignmentSaving.set(false);
        this.toastService.success('Geo-fence assignment updated.');
        this.closeAssignModal();
      },
      error: () => {
        this.assignmentSaving.set(false);
        this.toastService.error('Unable to update geo-fence assignment right now.');
      },
    });
  }

  openAdvancedWorkspace(): void {
    this.router.navigate(['/attendance'], { queryParams: { view: 'geofence' } });
  }

  trackZoneById = (_: number, zone: GeoFenceZone): number => zone.id;
  trackViolationById = (_: number, violation: GeoFenceDashboard['violations'][number]): number => violation.id;
  trackEmployeeById = (_: number, employee: User): number => Number(employee.id ?? employee.employeeId ?? 0);
  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    this.languageService.currentLanguage();
    return this.languageService.t(key, params);
  }
}
