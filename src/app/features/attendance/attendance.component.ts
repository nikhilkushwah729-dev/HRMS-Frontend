import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  inject,
  ViewChild,
  ElementRef,
  computed,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, interval, forkJoin, firstValueFrom } from 'rxjs';
import {
  AttendanceService,
  AttendanceRecord,
  TodayAttendance,
  AttendanceStats,
  BreakRecord,
  GeoFenceZone,
} from '../../core/services/attendance.service';
import { FaceRecognitionService } from '../../core/services/face-recognition.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/auth.model';
import { ToastService } from '../../core/services/toast.service';
import { PermissionService } from '../../core/services/permission.service';
import { OrganizationService } from '../../core/services/organization.service';
import {
  LiveRefreshService,
  LiveRefreshTrigger,
} from '../../core/services/live-refresh.service';
import { GeofenceManagementComponent } from './components/geofence-management.component';
import { EmployeeTrackingComponent } from './components/employee-tracking.component';
import { ShiftPlannerComponent } from './components/shift-planner.component';
import {
  UiSelectAdvancedComponent,
  SelectOption,
} from '../../core/components/ui/ui-select-advanced.component';
import { AttendanceDataTableComponent } from './components/attendance-table.component';
import { AttendancePunchComponent } from './components/attendance-punch.component';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    RouterLink,
    GeofenceManagementComponent,
    EmployeeTrackingComponent,
    ShiftPlannerComponent,
    UiSelectAdvancedComponent,
    AttendanceDataTableComponent,
    AttendancePunchComponent,
  ],
  template: `
    <div class="attendance-clean-panel mx-auto flex max-w-7xl flex-col gap-4 pb-8 sm:gap-5 lg:gap-6 lg:pb-10">
      <!-- Header -->
      <header
        class="overflow-hidden rounded-2xl border border-slate-900/10 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.24),_transparent_30%),linear-gradient(135deg,#ffffff_0%,#f8fafc_45%,#eefbf8_100%)] p-3.5 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.45)] sm:p-4 lg:p-4.5"
      >
        <div class="grid grid-cols-12 items-start gap-3 lg:gap-4">
          <div class="col-span-12 min-w-0 xl:col-span-5">
            <p class="text-[10px] font-black uppercase tracking-[0.24em] text-teal-700">
              {{ isSelfServiceWorkspace() ? 'My Attendance' : 'Attendance Management' }}
            </p>
            <h1 class="mt-2 break-words text-[1.7rem] font-black leading-tight text-slate-950 max-sm:text-lg">
              {{
                isSelfServiceWorkspace()
                  ? 'Check-in, history, working hours, and today status'
                  : 'Register, tracking, shift, and compliance workspaces'
              }}
            </h1>
            <p class="mt-2 max-w-3xl break-words text-sm leading-6 text-slate-600">
              {{
                isSelfServiceWorkspace()
                  ? 'This attendance workspace is focused on your own punches, shift timing, history, overtime, and regularization requests.'
                  : 'This admin workspace is focused on attendance operations, employee tracking, shift planning, and compliance controls.'
              }}
            </p>
            <div *ngIf="isSelfServiceWorkspace()" class="mt-4 flex flex-wrap gap-2">
              <span class="rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm">Punch first workflow</span>
              <span class="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700">Selfie + biometric ready</span>
            </div>
          </div>
          <div class="col-span-12 grid grid-cols-1 gap-3 sm:grid-cols-3 xl:col-span-4">
            <div class="flex h-full min-h-[92px] flex-col justify-between rounded-[20px] border border-white/80 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
              <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Today's status</p>
              <p class="mt-2 text-base font-black text-slate-950">{{ todayStatusHeadline() }}</p>
              <p class="mt-1 text-xs text-slate-500">
                {{ todayStatusSupportingText() }}
              </p>
            </div>
            <div class="flex h-full min-h-[92px] flex-col justify-between rounded-[20px] border border-emerald-200/80 bg-emerald-50/85 px-4 py-3 shadow-sm">
              <p class="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">Mode</p>
              <p class="mt-2 text-base font-black text-emerald-800">{{ currentViewLabel() }}</p>
              <p class="mt-1 text-xs text-emerald-700/80">
                {{ isSelfServiceWorkspace() ? 'Employee-only workspace' : 'Operations workspace' }}
              </p>
            </div>
            <div class="flex h-full min-h-[92px] flex-col justify-between rounded-[20px] border border-cyan-200/80 bg-cyan-50/85 px-4 py-3 shadow-sm">
              <p class="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-500">Day Health</p>
              <p class="mt-2 text-base font-black text-cyan-800">{{ attendanceHealthLabel() }}</p>
              <p class="mt-1 text-xs text-cyan-700/80">
                {{ formatHours(todayAttendance()?.total_work_hours || 0) }} logged so far
              </p>
            </div>
          </div>
          <div class="col-span-12 min-w-0 flex flex-col gap-3 xl:col-span-3 xl:items-end xl:self-stretch">
            <div *ngIf="isAdminAttendanceWorkspace()" class="flex flex-wrap justify-start gap-2 xl:justify-end">
            <button
              type="button"
              (click)="openAttendanceAddons()"
              class="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100"
            >
              Attendance Add-ons
            </button>
            <button
              type="button"
              (click)="openAttendanceUpgrade('attendance')"
              class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 transition hover:border-amber-300 hover:bg-amber-100"
            >
              {{ attendanceAddonActive() ? 'Manage Plan' : 'Upgrade' }}
            </button>
          </div>
          <div
            class="app-chip-switch flex max-w-full flex-wrap gap-1.5 overflow-x-auto no-scrollbar rounded-[20px] border border-white/80 bg-white/80 p-1.5 shadow-sm xl:justify-end"
          >
            <button
              *ngIf="isSelfServiceWorkspace()"
              (click)="setView('punch')"
              [ngClass]="
                currentView() === 'punch'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-stone-100'
              "
              class="app-chip-button shrink-0"
            >
              Mark Attendance
            </button>
            <button
              *ngIf="isSelfServiceWorkspace()"
              (click)="setView('calendar')"
              [ngClass]="
                currentView() === 'calendar'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-stone-100'
              "
              class="app-chip-button shrink-0"
            >
              Calendar
            </button>
            <button
              *ngIf="isSelfServiceWorkspace()"
              (click)="setView('stats')"
              [ngClass]="
                currentView() === 'stats'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-stone-100'
              "
              class="app-chip-button shrink-0"
            >
              Statistics
            </button>
            <button
              *ngIf="isAdminAttendanceWorkspace() && canAccessTrackingWorkspace()"
              (click)="setView('tracking')"
              [ngClass]="
                currentView() === 'tracking'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-stone-100'
              "
              class="app-chip-button shrink-0"
            >
              Tracking
            </button>
            <button
              *ngIf="isAdminAttendanceWorkspace() && canAccessGeofenceWorkspace()"
              (click)="setView('geofence')"
              [ngClass]="
                currentView() === 'geofence'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-stone-100'
              "
              class="app-chip-button shrink-0"
            >
              Geofence
            </button>
            <button
              *ngIf="isSelfServiceWorkspace()"
              (click)="setView('records')"
              [ngClass]="
                currentView() === 'records'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-stone-100'
              "
              class="app-chip-button shrink-0"
            >
              Records
            </button>
            <button
              *ngIf="isAdminAttendanceWorkspace() && canAccessShiftPlannerWorkspace()"
              (click)="setView('shift-planner')"
              [ngClass]="
                currentView() === 'shift-planner'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-stone-100'
              "
              class="app-chip-button shrink-0"
            >
              Shift Planner
            </button>
          </div>
          </div>
        </div>
      </header>

      <!-- Punch Workspace -->
      <section *ngIf="isSelfServiceWorkspace() && currentView() === 'punch'" class="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)]">
          <div class="mb-5 rounded-[28px] border border-slate-900/10 bg-[radial-gradient(circle_at_top_right,_rgba(45,212,191,0.24),_transparent_28%),linear-gradient(135deg,#0f172a_0%,#111827_45%,#134e4a_100%)] px-5 py-5 text-white">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-[0.22em] text-white/60">Today Punch Desk</p>
                <h3 class="mt-2 break-words text-xl font-black leading-tight sm:text-[2rem]">{{ nextAttendanceActionLabel() }}</h3>
                <p class="mt-2 max-w-2xl break-words text-sm leading-6 text-white/75">
                  {{ nextAttendanceActionDescription() }}
                </p>
              </div>
              <div class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div class="rounded-[22px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">Progress</p>
                  <p class="mt-1 break-words text-xl font-black sm:text-2xl">{{ attendanceProgress() }}%</p>
                </div>
                <div class="rounded-[22px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">Work Hours</p>
                  <p class="mt-1 break-words text-xl font-black sm:text-2xl">{{ formatHours(todayAttendance()?.total_work_hours || 0) }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Punch workspace</p>
              <h3 class="mt-2 break-words text-xl font-black text-slate-950 sm:text-[1.4rem]">Mark attendance</h3>
              <p class="mt-2 max-w-2xl break-words text-sm leading-6 text-slate-500">
                Choose a capture mode, review your current status, then mark attendance from one clean modal flow.
              </p>
            </div>
            <span class="break-words rounded-full px-2.5 py-1.5 text-[11px] font-bold self-start shadow-sm sm:px-3 sm:text-xs" [ngClass]="todayAttendance()?.is_clocked_in ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'">
              {{ todayAttendance()?.is_clocked_in ? 'Ready For Check Out' : 'Ready For Check In' }}
            </span>
          </div>

          <div class="mt-5 grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-2">
            <button
              *ngFor="let mode of visibleModes()"
              type="button"
              (click)="setMode(mode.id)"
              class="overflow-hidden rounded-[24px] border px-4 py-4 text-left transition-all duration-200"
              [ngClass]="isModeSelected(mode.id) ? 'border-teal-300 bg-[linear-gradient(180deg,#f0fdfa_0%,#ecfeff_100%)] shadow-[0_18px_35px_-28px_rgba(13,148,136,0.9)]' : 'border-slate-200 bg-slate-50/70 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm'"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex h-11 w-11 items-center justify-center rounded-[18px]" [ngClass]="isModeSelected(mode.id) ? 'bg-teal-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700'">
                  <ng-container [ngSwitch]="mode.id">
                    <svg *ngSwitchCase="'camera'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
                      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H8l1.3-1.6A2 2 0 0 1 10.85 4h2.3a2 2 0 0 1 1.55.74L16 6h1.5A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"></path>
                      <path d="M9.5 13a2.5 2.5 0 1 1 5 0"></path>
                      <path d="M8.75 16a4.6 4.6 0 0 1 6.5 0"></path>
                    </svg>
                    <svg *ngSwitchCase="'biometric'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
                      <path d="M12 3a4 4 0 0 0-4 4v2"></path>
                      <path d="M8 18a4 4 0 0 0 8 0v-2"></path>
                      <path d="M6.2 10.5A6 6 0 0 1 12 6"></path>
                      <path d="M17.8 10.5A6 6 0 0 0 12 6"></path>
                      <path d="M5 13.5c.8-1.6 2.3-2.5 4-2.5"></path>
                      <path d="M19 13.5c-.8-1.6-2.3-2.5-4-2.5"></path>
                      <path d="M10 12.5v5.5"></path>
                      <path d="M14 11.5v6.5"></path>
                      <path d="M12 10.5v8.5"></path>
                    </svg>
                  </ng-container>
                </div>
                <span *ngIf="isModeSelected(mode.id)" class="rounded-full bg-teal-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">Selected</span>
              </div>
              <h4 class="mt-4 text-sm font-black text-slate-900">{{ mode.label }}</h4>
              <p class="mt-1 text-xs leading-5 text-slate-500">{{ modeCardDescription(mode.id) }}</p>
            </button>
          </div>

          <div class="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
            <div class="overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-4">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Quick actions</p>
              <div class="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  (click)="openPrimaryAttendanceModal()"
                  [disabled]="processing()"
                  class="rounded-2xl bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_100%)] px-4 py-3.5 text-sm font-black text-white shadow-[0_18px_30px_-20px_rgba(13,148,136,0.85)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-300 sm:col-span-2"
                >
                  {{ primaryAttendanceButtonLabel() }}
                </button>
                <button
                  type="button"
                  (click)="handleBreak()"
                  [disabled]="processing() || !todayAttendance()?.is_clocked_in || todayAttendance()?.is_clocked_out"
                  class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {{ isOnBreak() ? 'End Break' : 'Start Break' }}
                </button>
                <button
                  type="button"
                  (click)="openManualRequest()"
                  class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  Manual Request
                </button>
              </div>
              <div class="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
                Use the primary action first. Break and manual request actions stay secondary to avoid accidental punches.
              </div>
            </div>

            <div class="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Today snapshot</p>
              <div class="mt-4 space-y-3">
                <div class="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                  <span class="text-sm font-semibold text-slate-500">Check in</span>
                  <span class="min-w-0 break-words text-right text-sm font-black text-slate-900">{{ todayAttendance()?.check_in ? (todayAttendance()?.check_in | date:'shortTime') : '--:--' }}</span>
                </div>
                <div class="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                  <span class="text-sm font-semibold text-slate-500">Check out</span>
                  <span class="min-w-0 break-words text-right text-sm font-black text-slate-900">{{ todayAttendance()?.check_out ? (todayAttendance()?.check_out | date:'shortTime') : '--:--' }}</span>
                </div>
                <div class="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                  <span class="text-sm font-semibold text-slate-500">Break time</span>
                  <span class="min-w-0 break-words text-right text-sm font-black text-slate-900">{{ todayAttendance()?.break_time_minutes || 0 }}m</span>
                </div>
                <div class="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                  <span class="text-sm font-semibold text-slate-500">Working hours</span>
                  <span class="min-w-0 break-words text-right text-sm font-black text-slate-900">{{ formatHours(todayAttendance()?.total_work_hours || 0) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-5">
          <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Current status</p>
            <h3 class="mt-2 break-words text-lg font-black text-slate-950 sm:text-xl">{{ nextAttendanceActionLabel() }}</h3>
            <p class="mt-2 break-words text-sm leading-6 text-slate-500">
              {{ nextAttendanceActionDescription() }}
            </p>
            <div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
              <div class="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all" [style.width.%]="attendanceProgress()"></div>
            </div>
            <div class="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
              <span class="break-words rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] sm:px-3 sm:text-xs">Mode {{ selectedModeLabel() }}</span>
              <span class="break-words rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] sm:px-3 sm:text-xs">{{ currentTime() }}</span>
              <span class="break-words rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] sm:px-3 sm:text-xs">Pending requests {{ pendingManualRequestCount() }}</span>
            </div>
          </div>

          <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="min-w-0">
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Recent requests</p>
                <h3 class="mt-2 break-words text-base font-bold text-slate-900 sm:text-lg">Manual request queue</h3>
              </div>
              <span class="self-start rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 sm:px-3 sm:text-xs">{{ manualRequests().length }}</span>
            </div>

            <div class="mt-4 space-y-3" *ngIf="manualRequests().length; else noManualRequests">
              <div *ngFor="let request of manualRequests().slice(0, 4)" class="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-slate-900">{{ request.date | date:'mediumDate' }}</p>
                    <p class="mt-1 break-words text-xs text-slate-500">{{ request.reason || 'No reason added' }}</p>
                  </div>
                  <span class="self-start rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]" [ngClass]="request.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : request.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'">
                    {{ request.status }}
                  </span>
                </div>
              </div>
            </div>
            <ng-template #noManualRequests>
              <div class="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
                No manual correction requests yet.
              </div>
            </ng-template>
          </div>
        </div>
      </section>

      <section
        *ngIf="isAdminAttendanceWorkspace()"
        class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div
          class="rounded-md border border-slate-200 bg-white px-5 py-4 shadow-sm"
        >
          <p
            class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400"
          >
            Current Workspace
          </p>
          <div class="mt-2 flex flex-col gap-1">
            <h2 class="text-lg font-bold text-slate-900">
              {{ viewMeta().title }}
            </h2>
            <p class="text-sm text-slate-500">{{ viewMeta().description }}</p>
            <div *ngIf="isSelfServiceWorkspace()" class="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
              <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Today {{ getStatusText() }}</span>
              <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Progress {{ attendanceProgress() }}%</span>
              <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Pending requests {{ pendingManualRequestCount() }}</span>
            </div>
          </div>
        </div>
        <div
          class="rounded-md border border-slate-200 bg-slate-50/80 px-5 py-4"
        >
          <p
            class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400"
          >
            Today Focus
          </p>
          <div class="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <p class="break-words text-sm font-semibold text-slate-700">
                {{
                  isSelfServiceWorkspace()
                    ? todayFocusHeadline()
                    : (todayAttendance()?.is_clocked_in ? 'Attendance operations are live right now' : 'Management workspace is ready for review')
                }}
              </p>
              <p class="mt-1 break-words text-xs text-slate-500">
                {{
                  isSelfServiceWorkspace()
                    ? todayFocusDescription()
                    : 'Switch between management views without mixing employee self-service workflows.'
                }}
              </p>
            </div>
            <span
              class="self-start rounded-full px-3 py-1 text-xs font-bold"
              [ngClass]="
                todayAttendance()?.is_clocked_in
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-200 text-slate-600'
              "
            >
              {{ todayAttendance()?.is_clocked_in ? 'Live' : 'Standby' }}
            </span>
          </div>
        </div>
      </section>

      <section *ngIf="isAdminAttendanceWorkspace()" class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div class="max-w-3xl">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Admin Workspace
            </p>
            <h2 class="mt-1 text-lg font-black text-slate-900">
              Manage the operations tool, not the employee self-service screen
            </h2>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              Employees should stay on <span class="font-bold text-slate-700">My Attendance</span>. HR and Admin should use
              this workspace only for tracking, geofence, shift planning, and follow-up actions.
            </p>
          </div>
          <div class="grid gap-2 sm:grid-cols-2 xl:w-[420px]">
            <a
              routerLink="/attendance/register"
              class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-teal-200 hover:bg-white"
            >
              Team Register
            </a>
            <a
              routerLink="/attendance/regularizations"
              class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:bg-white"
            >
              Regularizations
            </a>
            <a
              routerLink="/attendance/reports"
              class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-orange-200 hover:bg-white"
            >
              Reports
            </a>
            <button
              type="button"
              (click)="openAttendanceAddons()"
              class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:border-cyan-200 hover:bg-white"
            >
              Attendance Add-ons
            </button>
          </div>
        </div>
      </section>

      <section *ngIf="isSelfServiceWorkspace() && currentView() === 'punch'" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <a
          routerLink="/timesheets"
          class="group overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
        >
          <div class="flex min-w-0 items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Logs
              </p>
              <h3 class="mt-2 break-words text-base font-bold text-slate-900 sm:text-lg">Timesheets</h3>
              <p class="mt-2 break-words text-sm text-slate-500">
                Track work hours, break time, and daily logs in one timeline.
              </p>
            </div>
            <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 sm:px-3 sm:text-xs">
              Hours
            </span>
          </div>
        </a>

        <button
          type="button"
          (click)="openSelfServiceRequest('regularization')"
          class="group overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
        >
          <div class="flex min-w-0 items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Corrections
              </p>
              <h3 class="mt-2 break-words text-base font-bold text-slate-900 sm:text-lg">Regularization</h3>
              <p class="mt-2 break-words text-sm text-slate-500">
                Raise missed punch, correction, or time-fix requests without opening admin attendance.
              </p>
            </div>
            <span class="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 sm:px-3 sm:text-xs">
              {{ pendingManualRequestCount() }} Pending
            </span>
          </div>
        </button>

        <button
          type="button"
          (click)="openSelfServiceRequest('request-center')"
          class="group overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
        >
          <div class="flex min-w-0 items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Requests
              </p>
              <h3 class="mt-2 break-words text-base font-bold text-slate-900 sm:text-lg">Short Day, Under-time, WFH, Outdoor Duty</h3>
              <p class="mt-2 break-words text-sm text-slate-500">
                Submit attendance-related day requests from a separate employee request flow.
              </p>
            </div>
            <span class="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700 sm:px-3 sm:text-xs">
              Open
            </span>
          </div>
        </button>
      </section>

      <!-- Attendance Pulse -->
      <section *ngIf="isSelfServiceWorkspace() && currentView() === 'punch'" class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Attendance Pulse
              </p>
              <h3 class="mt-2 break-words text-lg font-bold text-slate-900 sm:text-xl">
                Quick view of today and the selected period
              </h3>
              <p class="mt-2 max-w-2xl break-words text-sm text-slate-500">
                A compact operational summary based on your current attendance state, recent history, and approval queue.
              </p>
            </div>
            <span
              class="rounded-full px-2.5 py-1 text-[11px] font-bold self-start sm:self-auto sm:px-3 sm:text-xs"
              [ngClass]="attendanceHealthTone()"
            >
              {{ attendanceHealthLabel() }}
            </span>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            <div class="flex h-full min-h-[138px] flex-col rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Work hours</p>
              <p class="mt-2 break-words text-lg font-black text-slate-900 sm:text-2xl">{{ formatHours(stats()?.total_work_hours || todayAttendance()?.total_work_hours || 0) }}</p>
              <p class="mt-1 text-xs leading-5 text-slate-500">Logged for the current period</p>
            </div>
            <div class="flex h-full min-h-[138px] flex-col rounded-[22px] border border-slate-100 bg-emerald-50/70 p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700/70">Punctuality</p>
              <p class="mt-2 break-words text-lg font-black text-emerald-700 sm:text-2xl">{{ stats()?.punctuality_percentage || 0 }}%</p>
              <p class="mt-1 text-xs leading-5 text-emerald-700/80">Selected period performance</p>
            </div>
            <div class="flex h-full min-h-[138px] flex-col rounded-[22px] border border-slate-100 bg-amber-50/70 p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700/70">Break time</p>
              <p class="mt-2 break-words text-lg font-black text-amber-700 sm:text-2xl">{{ todayAttendance()?.break_time_minutes || 0 }}m</p>
              <p class="mt-1 text-xs leading-5 text-amber-700/80">Consumed today</p>
            </div>
            <div class="flex h-full min-h-[138px] flex-col rounded-[22px] border border-slate-100 bg-rose-50/70 p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-700/70">Late status</p>
              <p class="mt-2 break-words text-base font-black text-rose-700 sm:text-lg">{{ todayLateStatusLabel() }}</p>
              <p class="mt-1 text-xs leading-5 text-rose-700/80">Based on today check-in and shift start</p>
            </div>
            <div class="flex h-full min-h-[138px] flex-col rounded-[22px] border border-slate-100 bg-cyan-50/70 p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700/70">Early leaving</p>
              <p class="mt-2 break-words text-base font-black text-cyan-700 sm:text-lg">{{ todayEarlyLeavingLabel() }}</p>
              <p class="mt-1 text-xs leading-5 text-cyan-700/80">Based on today check-out and shift end</p>
            </div>
            <div class="flex h-full min-h-[138px] flex-col rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Pending</p>
              <p class="mt-2 break-words text-lg font-black text-slate-900 sm:text-2xl">{{ pendingManualRequestCount() }}</p>
              <p class="mt-1 text-xs leading-5 text-slate-500">Manual requests waiting for review</p>
            </div>
          </div>

          <div class="mt-5 rounded-[24px] border border-slate-100 bg-slate-50/70 p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="min-w-0">
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Today progress</p>
                <p class="mt-1 break-words text-sm font-semibold text-slate-700">
                  {{ todayAttendance()?.is_clocked_in ? 'You are active for today' : 'Ready to start your day' }}
                </p>
              </div>
              <span class="self-start text-sm font-bold text-slate-700 sm:self-auto">{{ attendanceProgress() }}%</span>
            </div>
            <div class="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500"
                [style.width.%]="attendanceProgress()"
              ></div>
            </div>
            <div class="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
              <span class="break-words rounded-full bg-white px-2.5 py-1 text-[11px] border border-slate-200 sm:px-3 sm:text-xs">Clock in {{ todayAttendance()?.check_in ? (todayAttendance()?.check_in | date:'shortTime') : '--:--' }}</span>
              <span class="break-words rounded-full bg-white px-2.5 py-1 text-[11px] border border-slate-200 sm:px-3 sm:text-xs">Clock out {{ todayAttendance()?.check_out ? (todayAttendance()?.check_out | date:'shortTime') : '--:--' }}</span>
              <span class="break-words rounded-full bg-white px-2.5 py-1 text-[11px] border border-slate-200 sm:px-3 sm:text-xs">Break {{ todayAttendance()?.break_time_minutes || 0 }}m</span>
            </div>
          </div>
        </div>

        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Recent trail</p>
              <h3 class="mt-2 break-words text-lg font-bold text-slate-900 sm:text-xl">Latest attendance entries</h3>
            </div>
            <span class="self-start rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 sm:px-3 sm:text-xs">
              {{ recentHistoryPreview().length }} records
            </span>
          </div>

          <div class="mt-4 space-y-3">
            <div
              *ngFor="let record of recentHistoryPreview()"
              class="overflow-hidden rounded-[22px] border border-slate-100 bg-slate-50/70 p-4"
            >
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <p class="text-sm font-bold text-slate-900">{{ record.date | date:'mediumDate' }}</p>
                  <p class="mt-1 break-words text-xs text-slate-500">
                    In {{ record.check_in ? (record.check_in | date:'shortTime') : '--:--' }}
                    <span class="px-1.5">•</span>
                    Out {{ record.check_out ? (record.check_out | date:'shortTime') : '--:--' }}
                  </p>
                </div>
                <span
                  class="self-start rounded-full px-3 py-1 text-xs font-bold"
                  [ngClass]="getStatusClass(record.status)"
                >
                  {{ getRecordStatusLabel(record.status) }}
                </span>
              </div>

              <div class="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Work hours</span>
                <span class="font-bold text-slate-700">{{ formatHours(record.work_hours || 0) }}</span>
              </div>

              <div class="mt-3 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-slate-700 to-slate-500"
                  [style.width.%]="recordProgress(record)"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Calendar View -->
      <div
        *ngIf="currentView() === 'calendar'"
        class="grid grid-cols-1 gap-5 xl:items-start xl:grid-cols-[minmax(0,1.12fr)_390px]"
      >
        <div class="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.32)] sm:p-6">
          <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-wrap items-center gap-2 sm:gap-4">
              <button
                (click)="previousMonth()"
                class="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <div class="min-w-0">
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">My attendance calendar</p>
                <h3 class="break-words text-lg font-bold text-slate-900">
                  {{ getMonthYearString() }}
                </h3>
                <p class="mt-1 text-sm text-slate-500">Select any workday to review your punch timing, status, and proof.</p>
              </div>
              <button
                (click)="nextMonth()"
                class="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
            <button
              (click)="goToToday()"
              class="self-start rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-white"
            >
              Today
            </button>
          </div>

          <div class="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div class="rounded-[22px] border border-slate-100 bg-slate-50/75 px-4 py-3.5">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Selected view</p>
              <p class="mt-2 text-sm font-black text-slate-900">Monthly attendance</p>
              <p class="mt-1 text-xs text-slate-500">Your own workdays only</p>
            </div>
            <div class="rounded-[22px] border border-emerald-100 bg-emerald-50/75 px-4 py-3.5">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-500">Today status</p>
              <p class="mt-2 text-sm font-black text-emerald-800">{{ todayStatusHeadline() }}</p>
              <p class="mt-1 text-xs text-emerald-700/80">{{ todayStatusSupportingText() }}</p>
            </div>
            <div class="rounded-[22px] border border-cyan-100 bg-cyan-50/75 px-4 py-3.5">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-500">Quick help</p>
              <p class="mt-2 text-sm font-black text-cyan-800">Tap any highlighted date</p>
              <p class="mt-1 text-xs text-cyan-700/80">Day details open on the right</p>
            </div>
          </div>

          <div class="rounded-[26px] border border-slate-100 bg-slate-50/65 p-2.5 sm:p-3">
          <div class="grid grid-cols-7 gap-1.5 sm:gap-2">
            <div
              *ngFor="let day of weekDays"
              class="py-2 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400"
            >
              {{ day }}
            </div>
            <div
              *ngFor="let day of calendarDays(); let i = index"
              class="relative p-0.5 sm:p-1"
              [ngClass]="{
                'cursor-pointer': day.date,
              }"
              (click)="day.date && selectDate(day.date)"
            >
              <div
                *ngIf="day.date"
                class="flex h-[58px] w-full flex-col items-center justify-center rounded-[20px] border transition-all sm:h-[66px] lg:h-[72px]"
                [ngClass]="{
                  'bg-teal-600 text-white border-teal-600 shadow-sm': day.isToday,
                  'bg-slate-100 border-slate-300 shadow-sm': day.isSelected && !day.isToday,
                  'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50': !day.isSelected && !day.isToday && day.isCurrentMonth,
                  'border-transparent bg-transparent': !day.isCurrentMonth
                }"
              >
                <span
                  class="text-sm font-bold"
                  [ngClass]="{
                    'text-white': day.isToday,
                    'text-slate-900': !day.isToday,
                  }"
                  >{{ day.dayNumber }}</span
                >
                <div
                  *ngIf="day.attendance"
                  class="w-1.5 h-1.5 rounded-full mt-1"
                  [ngClass]="getCalendarStatusColor(day.attendance.status)"
                ></div>
              </div>
            </div>
          </div>
          </div>

          <div class="mt-6 border-t border-slate-100 pt-4">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Status legend</p>
            <div class="mt-3 flex flex-wrap gap-2.5">
              <div
                *ngFor="let item of statusLegend"
                class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                <div class="h-2.5 w-2.5 shrink-0 rounded-full" [ngClass]="item.color"></div>
                <span class="whitespace-nowrap">{{ item.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="self-start overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.32)] xl:sticky xl:top-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Workday details</p>
              <h3 class="mt-2 break-words text-xl font-bold text-slate-900">
                {{ selectedAttendanceDateLabel() }}
              </h3>
              <p class="mt-1 text-sm text-slate-500">Your selected day summary, timing, and any captured proof.</p>
            </div>
            <span class="break-words rounded-full px-3 py-1 text-xs font-bold" [ngClass]="selectedAttendanceStatusClass()">
              {{ selectedAttendanceStatusLabel() }}
            </span>
          </div>

          <div *ngIf="selectedAttendanceRecord(); else noAttendanceSelected" class="mt-5 space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-[20px] border border-slate-100 bg-slate-50/75 p-3.5">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Time In</p>
                <p class="mt-2 text-base font-black text-slate-900">{{ selectedAttendanceRecord()?.check_in ? formatShortTime(selectedAttendanceRecord()?.check_in) : '--:--' }}</p>
              </div>
              <div class="rounded-[20px] border border-slate-100 bg-slate-50/75 p-3.5">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Time Out</p>
                <p class="mt-2 text-base font-black text-slate-900">{{ selectedAttendanceRecord()?.check_out ? formatShortTime(selectedAttendanceRecord()?.check_out) : '--:--' }}</p>
              </div>
              <div class="rounded-[20px] border border-slate-100 bg-slate-50/75 p-3.5">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Work Hours</p>
                <p class="mt-2 text-base font-black text-slate-900">{{ formatHours(selectedAttendanceRecord()?.work_hours || 0) }}</p>
              </div>
              <div class="rounded-[20px] border border-slate-100 bg-slate-50/75 p-3.5">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Late Mark</p>
                <p class="mt-2 text-base font-black text-slate-900">{{ selectedAttendanceRecord()?.is_late ? 'Yes' : 'No' }}</p>
              </div>
            </div>

            <div class="rounded-[22px] border border-slate-100 bg-slate-50/75 p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Location Details</p>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                {{ selectedAttendanceRecord()?.location_address || 'Location details were not captured for this record.' }}
              </p>
            </div>

            <div *ngIf="selectedAttendanceCheckInImage() || selectedAttendanceCheckOutImage() || selectedAttendanceAvatarFallback()" class="grid gap-4 sm:grid-cols-2">
              <div *ngIf="selectedAttendanceCheckInImage()" class="rounded-[22px] border border-slate-100 bg-slate-50/75 p-4">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Time In Image</p>
                <img [src]="selectedAttendanceCheckInImage()" alt="Time In Image" class="mt-3 h-32 w-full rounded-2xl object-cover border border-slate-200" />
              </div>

              <div *ngIf="selectedAttendanceCheckOutImage()" class="rounded-[22px] border border-slate-100 bg-slate-50/75 p-4">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Time Out Image</p>
                <img [src]="selectedAttendanceCheckOutImage()" alt="Time Out Image" class="mt-3 h-32 w-full rounded-2xl object-cover border border-slate-200" />
              </div>

              <div *ngIf="!selectedAttendanceCheckInImage() && !selectedAttendanceCheckOutImage() && selectedAttendanceAvatarFallback()" class="rounded-[22px] border border-slate-100 bg-slate-50/75 p-4 sm:col-span-2">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Profile Avatar</p>
                <img [src]="selectedAttendanceAvatarFallback()" alt="Profile Avatar" class="mt-3 h-32 w-32 rounded-2xl object-cover border border-slate-200" />
              </div>
            </div>

            <div class="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                (click)="setView('records')"
                class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                Open My Records
              </button>
              <button
                type="button"
                (click)="openManualRequest()"
                class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
              >
                Request My Correction
              </button>
            </div>
          </div>

          <ng-template #noAttendanceSelected>
            <div class="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-center">
              <p class="text-sm font-bold text-slate-700">Select a workday</p>
              <p class="mt-2 text-sm text-slate-500">Choose any date from your calendar to review your attendance timing, status, and captured details.</p>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Statistics View -->
      <div *ngIf="currentView() === 'stats'" class="space-y-5">
        <div class="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.32)] sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Performance snapshot</p>
            <h3 class="mt-2 text-lg font-bold text-slate-900">
              My Attendance Statistics
            </h3>
            <p class="mt-1 text-sm text-slate-500">
              Switch between weekly, monthly, and yearly views of your own attendance performance.
            </p>
          </div>
          <div
            class="flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-sm"
          >
            <button
              (click)="setStatsPeriod('week')"
              [ngClass]="
                statsPeriod() === 'week'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              "
              class="rounded-xl px-4 py-2 text-sm font-bold transition-all"
            >
              Week
            </button>
            <button
              (click)="setStatsPeriod('month')"
              [ngClass]="
                statsPeriod() === 'month'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              "
              class="rounded-xl px-4 py-2 text-sm font-bold transition-all"
            >
              Month
            </button>
            <button
              (click)="setStatsPeriod('year')"
              [ngClass]="
                statsPeriod() === 'year'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              "
              class="rounded-xl px-4 py-2 text-sm font-bold transition-all"
            >
              Year
            </button>
          </div>
        </div>
        <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
            <div class="mb-3 flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="text-success"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span class="text-sm font-bold text-slate-500">Present</span>
            </div>
            <p class="text-3xl font-black text-slate-900">
              {{ stats()?.total_present || 0 }}
            </p>
          </div>

          <div class="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
            <div class="mb-3 flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="text-error"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </div>
              <span class="text-sm font-bold text-slate-500">Absent</span>
            </div>
            <p class="text-3xl font-black text-slate-900">
              {{ stats()?.total_absent || 0 }}
            </p>
          </div>

          <div class="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
            <div class="mb-3 flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="text-warning"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span class="text-sm font-bold text-slate-500"
                >Late Arrivals</span
              >
            </div>
            <p class="text-3xl font-black text-slate-900">
              {{ stats()?.total_late || 0 }}
            </p>
          </div>

          <div class="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
            <div class="mb-3 flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="text-blue-600"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span class="text-sm font-bold text-slate-500">Overtime</span>
            </div>
            <p class="text-3xl font-black text-slate-900">
              {{ formatHours(stats()?.overtime_hours || 0) }}
            </p>
          </div>

          <div
            class="rounded-[26px] border border-slate-100 bg-slate-50/65 p-5 shadow-sm md:col-span-2"
          >
            <h3 class="font-bold text-slate-800 mb-4">Punctuality Rate</h3>
            <div class="flex items-center gap-4">
              <div class="relative w-24 h-24">
                <svg
                  class="w-full h-full transform -rotate-90"
                  viewBox="0 0 36 36"
                >
                  <path
                    class="text-slate-100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  />
                  <path
                    class="text-primary-600"
                    [attr.stroke-dasharray]="
                      stats()?.punctuality_percentage + ', 100'
                    "
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  />
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-xl font-black text-slate-900"
                    >{{ stats()?.punctuality_percentage || 0 }}%</span
                  >
                </div>
              </div>
              <div class="flex-1">
                <p class="text-sm text-slate-500">
                  <span *ngIf="(stats()?.punctuality_percentage || 0) >= 90"
                    >Excellent! You're consistently on time.</span
                  >
                  <span
                    *ngIf="
                      (stats()?.punctuality_percentage || 0) >= 70 &&
                      (stats()?.punctuality_percentage || 0) < 90
                    "
                    >Good performance. Keep it up!</span
                  >
                  <span *ngIf="(stats()?.punctuality_percentage || 0) < 70"
                    >Room for improvement. Try to arrive on time.</span
                  >
                </p>
              </div>
            </div>
          </div>

          <div
            class="rounded-[26px] border border-slate-100 bg-slate-50/65 p-5 shadow-sm md:col-span-2"
          >
            <h3 class="font-bold text-slate-800 mb-4">Average Stats</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-slate-500"
                  >Average Arrival Time</span
                >
                <span class="font-bold text-slate-900">{{
                  stats()?.average_arrival_time || '--:--'
                }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-slate-500"
                  >Total Work Hours</span
                >
                <span class="font-bold text-slate-900">{{
                  formatHours(stats()?.total_work_hours || 0)
                }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-slate-500"
                  >Half Days</span
                >
                <span class="font-bold text-slate-900">{{
                  stats()?.total_half_day || 0
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tracking View -->
      <app-employee-tracking
        *ngIf="currentView() === 'tracking'"
        class="animate-in fade-in slide-in-from-bottom-4 duration-500"
      ></app-employee-tracking>

      <!-- Geofence View -->
      <app-geofence-management
        *ngIf="currentView() === 'geofence'"
        class="animate-in fade-in slide-in-from-bottom-4 duration-500"
      ></app-geofence-management>

      <!-- Shift Planner View -->
      <app-shift-planner
        *ngIf="currentView() === 'shift-planner'"
        class="animate-in fade-in slide-in-from-bottom-4 duration-500"
      ></app-shift-planner>

      <!-- Records View -->
      <section *ngIf="isSelfServiceWorkspace() && currentView() === 'records'" class="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.32)] sm:p-6">
        <div class="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">My attendance records</p>
            <h3 class="mt-2 break-words text-xl font-bold text-slate-900">Search and review your attendance history</h3>
            <p class="mt-2 max-w-2xl break-words text-sm leading-6 text-slate-500">
              Check every recorded workday with your status, in and out time, work hours, and available selfie proof.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              (click)="openManualRequest()"
              class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Raise Correction
            </button>
            <button
              type="button"
              (click)="setView('calendar')"
              class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
            >
              Open Calendar
            </button>
          </div>
        </div>

        <div class="mt-5 grid gap-3 lg:grid-cols-3">
          <div class="rounded-[22px] border border-slate-100 bg-slate-50/75 px-4 py-3.5">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">History loaded</p>
            <p class="mt-2 text-sm font-black text-slate-900">{{ history().length }} records</p>
            <p class="mt-1 text-xs text-slate-500">Visible workdays in your current timeline</p>
          </div>
          <div class="rounded-[22px] border border-cyan-100 bg-cyan-50/75 px-4 py-3.5">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-500">Quick action</p>
            <p class="mt-2 text-sm font-black text-cyan-800">Open calendar for day review</p>
            <p class="mt-1 text-xs text-cyan-700/80">Switch to daily proof and timing view anytime</p>
          </div>
          <div class="rounded-[22px] border border-emerald-100 bg-emerald-50/75 px-4 py-3.5">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-500">Correction support</p>
            <p class="mt-2 text-sm font-black text-emerald-800">Raise a correction when needed</p>
            <p class="mt-1 text-xs text-emerald-700/80">Use this if timing or status needs a manual update</p>
          </div>
        </div>

        <div class="mt-5 overflow-hidden rounded-[24px] border border-slate-100 bg-white">
          <app-attendance-table [adminMode]="false"></app-attendance-table>
        </div>
      </section>

    </div>

    <!-- Mark Attendance Modal -->
    <div
      *ngIf="showCameraModal()"
      class="fixed inset-0 z-[10001] overflow-y-auto bg-slate-950/50 p-3 sm:p-4 backdrop-blur-sm"
    >
      <div class="absolute inset-0" (click)="closeCameraModal()"></div>
      <div class="relative z-[10002] mx-auto my-3 w-full max-w-3xl overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 text-left sm:my-5">
          <header class="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3.5 sm:px-5">
            <div class="min-w-0">
              <h2 class="text-lg font-black text-slate-900">{{ punchModalTitle() }}</h2>
              <p class="mt-1 max-w-2xl break-words text-sm leading-6 text-slate-500">{{ punchModalDescription() }}</p>
            </div>
            <button
              type="button"
              (click)="closeCameraModal()"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </header>

          <div class="max-h-[min(calc(100vh-10rem),680px)] overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
            <div class="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(280px,0.95fr)]">
            <div class="space-y-4">
            <div class="grid grid-cols-1 gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Date</p>
                <p class="mt-1 text-base font-semibold text-slate-800">{{ punchModalDate() | date:'d MMMM, y' }}</p>
              </div>
              <div>
                <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Time</p>
                <p class="mt-1 text-base font-semibold text-slate-800">{{ punchModalTime() }}</p>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Location</p>

              <div *ngIf="punchLocationAvailability() === 'checking'" class="mt-2 flex flex-col gap-3 text-sm text-amber-700 sm:flex-row sm:items-center sm:justify-between">
                <p class="break-words">Checking your current location...</p>
                <button
                  type="button"
                  (click)="requestPunchLocationPreview()"
                  class="rounded-lg bg-amber-50 px-4 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                >
                  Retry
                </button>
              </div>

              <div *ngIf="punchLocationAvailability() === 'idle'" class="mt-2 flex flex-col gap-3 text-sm text-red-500 sm:flex-row sm:items-center sm:justify-between">
                <p class="break-words">Enable location permission to improve attendance accuracy.</p>
                <button
                  type="button"
                  (click)="requestPunchLocationPreview()"
                  class="rounded-lg bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-800 transition hover:bg-slate-200"
                >
                  Enable
                </button>
              </div>

              <div *ngIf="punchLocationAvailability() === 'unavailable'" class="mt-2 rounded-lg border-s-4 border-red-500 bg-red-50 p-4">
                <div class="flex gap-3">
                  <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-200 text-red-800">
                    <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </span>
                  <div>
                    <p class="font-semibold text-slate-900">Location unavailable</p>
                    <p class="text-sm text-slate-600">{{ punchLocationCoords() || 'Please allow location permission from browser settings.' }}</p>
                  </div>
                </div>
              </div>

              <div *ngIf="punchLocationAvailability() === 'ready'" class="mt-2 space-y-3">
                <div class="flex flex-col gap-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
                  <p class="min-w-0 flex-1 break-words">{{ punchLocationSummary() }}</p>
                  <button
                    type="button"
                    (click)="requestPunchLocationPreview()"
                    class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-white transition hover:bg-green-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 12a9 9 0 0 1-9 9"></path>
                      <path d="M3 12a9 9 0 0 1 15.5-6.36"></path>
                      <path d="M21 3v6h-6"></path>
                    </svg>
                  </button>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="inline-flex rounded-full px-3 py-1 text-xs font-bold"
                    [ngClass]="locationStatus() === 'inside'
                      ? 'bg-emerald-600 text-white'
                      : locationStatus() === 'outside'
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-200 text-slate-700'"
                  >
                    {{ locationStatus() === 'inside' ? 'Within Geofence' : locationStatus() === 'outside' ? 'Outside Geofence' : 'Geofence Unknown' }}
                  </span>
                  <span *ngIf="currentDistance() !== null" class="text-xs text-slate-500">
                    Distance: {{ currentDistance() }} km
                  </span>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Mode</p>
              <div class="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  *ngFor="let mode of visibleModes()"
                  type="button"
                  (click)="setMode(mode.id)"
                  class="rounded-xl border px-3 py-3 text-left text-sm font-bold transition"
                  [ngClass]="isModeSelected(mode.id) ? 'border-teal-300 bg-teal-50 text-teal-700 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'"
                >
                  <span class="flex items-center gap-2">
                    <span class="inline-flex h-8 w-8 items-center justify-center rounded-full" [ngClass]="isModeSelected(mode.id) ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'">
                      <ng-container [ngSwitch]="mode.id">
                        <svg *ngSwitchCase="'camera'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H8l1.3-1.6A2 2 0 0 1 10.85 4h2.3a2 2 0 0 1 1.55.74L16 6h1.5A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"></path>
                          <path d="M9.5 13a2.5 2.5 0 1 1 5 0"></path>
                          <path d="M8.75 16a4.6 4.6 0 0 1 6.5 0"></path>
                        </svg>
                        <svg *ngSwitchCase="'biometric'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M12 3a4 4 0 0 0-4 4v2"></path>
                          <path d="M8 18a4 4 0 0 0 8 0v-2"></path>
                          <path d="M6.2 10.5A6 6 0 0 1 12 6"></path>
                          <path d="M17.8 10.5A6 6 0 0 0 12 6"></path>
                          <path d="M5 13.5c.8-1.6 2.3-2.5 4-2.5"></path>
                          <path d="M19 13.5c-.8-1.6-2.3-2.5-4-2.5"></path>
                          <path d="M10 12.5v5.5"></path>
                          <path d="M14 11.5v6.5"></path>
                          <path d="M12 10.5v8.5"></path>
                        </svg>
                      </ng-container>
                    </span>
                    <span>{{ mode.label }}</span>
                  </span>
                </button>
              </div>
              <p class="mt-3 text-xs text-slate-500">Choose selfie or biometric. Selfie mode already includes smart face detect, automatic capture, and no-camera fallback when needed.</p>
            </div>
            </div>

            <div class="space-y-4">
            <div class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                {{ checkInMode() === 'biometric' ? 'Biometric Verification' : 'Selfie' }}
              </p>

              <ng-container *ngIf="checkInMode() !== 'biometric'; else biometricVerificationPanel">

              <div *ngIf="cameraAvailability() === 'idle' && !attendanceSuccess()" class="mt-2 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <p class="break-words">Selfie is optional. Allow camera permission if you want to attach a live capture.</p>
                <button
                  type="button"
                  (click)="retryPunchCamera()"
                  class="rounded-lg bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-800 transition hover:bg-slate-200"
                >
                  Retry Camera
                </button>
              </div>

              <div *ngIf="cameraAvailability() === 'checking' && !attendanceSuccess()" class="mt-2 text-sm text-amber-700">
                Starting selfie camera...
              </div>

              <div *ngIf="cameraAvailability() === 'unavailable' && !attendanceSuccess()" class="mt-2 rounded-lg border-s-4 border-red-500 bg-red-50 p-4">
                <div class="flex gap-3">
                  <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-200 text-red-800">
                    <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="font-semibold text-slate-900">Camera unavailable</p>
                    <p class="text-sm text-slate-600">{{ punchModalStatusText() }}</p>
                    <button
                      type="button"
                      (click)="retryPunchCamera()"
                      class="mt-3 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100"
                    >
                      Retry Camera
                    </button>
                  </div>
                </div>
              </div>

              <div class="mt-5 flex justify-center">
                <div class="relative flex h-40 w-40 items-center justify-center rounded-full bg-slate-100 ring-8 ring-slate-100 shadow-inner shadow-slate-200/70 sm:h-48 sm:w-48">
                <div class="relative h-36 w-36 overflow-hidden rounded-full bg-slate-950 shadow-inner sm:h-44 sm:w-44">
                  <video
                    #videoElement
                    id="attendance-camera-preview"
                    autoplay
                    muted
                    playsinline
                    class="h-full w-full object-cover"
                    [class.hidden]="capturedPhotoData() || attendanceSuccess()"
                  ></video>
                  <img
                    *ngIf="capturedPhotoData() && checkInMode() !== 'face' && !attendanceSuccess()"
                    [src]="capturedPhotoData()!"
                    alt="Snapshot"
                    class="h-full w-full object-cover -scale-x-100"
                  />
                  <div *ngIf="attendanceSuccess()" class="flex h-full w-full items-center justify-center bg-emerald-600 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </div>
                  <div *ngIf="!isCameraReady() && !attendanceSuccess()" class="absolute inset-0 flex items-center justify-center bg-slate-950 text-center text-xs font-semibold text-white">
                    {{
                      cameraAvailability() === 'checking'
                        ? 'Preparing selfie...'
                        : cameraAvailability() === 'unavailable'
                          ? 'Camera preview unavailable'
                          : 'Tap retry to start selfie camera'
                    }}
                  </div>
                </div>
                </div>
              </div>

              <div *ngIf="checkInMode() === 'face' && !attendanceSuccess()" class="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-center text-sm text-slate-600">
                {{ faceScanStatus() || 'Look at the camera and turn slightly. Selfie detect will capture attendance automatically.' }}
              </div>

              <div *ngIf="attendanceSuccess()" class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <p class="text-sm font-black text-emerald-700">Attendance marked successfully</p>
                <p class="mt-1 text-xs text-emerald-600">Thank you. Closing this window...</p>
              </div>
              </ng-container>

              <ng-template #biometricVerificationPanel>
                <div class="mt-3 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4">
                  <div class="flex items-start gap-3">
                    <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 3a4 4 0 0 0-4 4v2"></path>
                        <path d="M8 18a4 4 0 0 0 8 0v-2"></path>
                        <path d="M6.2 10.5A6 6 0 0 1 12 6"></path>
                        <path d="M17.8 10.5A6 6 0 0 0 12 6"></path>
                        <path d="M5 13.5c.8-1.6 2.3-2.5 4-2.5"></path>
                        <path d="M19 13.5c-.8-1.6-2.3-2.5-4-2.5"></path>
                        <path d="M10 12.5v5.5"></path>
                        <path d="M14 11.5v6.5"></path>
                        <path d="M12 10.5v8.5"></path>
                      </svg>
                    </span>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-black text-slate-900">Use your fingerprint or Windows Hello</p>
                      <p class="mt-1 text-sm leading-6 text-slate-600">{{ biometricPromptText() }}</p>
                    </div>
                  </div>
                </div>

                <div class="mt-4 grid gap-3 sm:grid-cols-2">
                  <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Biometric Status</p>
                    <p class="mt-1 text-sm font-black text-slate-900">{{ biometricStatusLabel() }}</p>
                  </div>
                  <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Verification Flow</p>
                    <p class="mt-1 text-sm font-black text-slate-900">Confirm and mark attendance</p>
                  </div>
                </div>

                <div class="mt-4 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  {{ biometricSupportMessage() }}
                </div>

                <div *ngIf="attendanceSuccess()" class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <p class="text-sm font-black text-emerald-700">Attendance marked successfully</p>
                  <p class="mt-1 text-xs text-emerald-600">Thank you. Closing this window...</p>
                </div>
              </ng-template>
            </div>

            <div class="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Punch Summary</p>
              <div class="mt-3 grid gap-3 sm:grid-cols-2">
                <div class="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p class="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Action</p>
                  <p class="mt-1 text-sm font-black text-slate-900">{{ primaryAttendanceAction() === 'out' ? 'Check Out' : 'Check In' }}</p>
                </div>
                <div class="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p class="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Status</p>
                  <p class="mt-1 text-sm font-black text-slate-900">{{ punchModalPrimaryLabel() }}</p>
                </div>
              </div>
            </div>
            </div>
            </div>
          </div>

          <div class="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <button
              type="button"
              (click)="closeCameraModal()"
              [disabled]="processing()"
              class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              *ngIf="checkInMode() === 'face'"
              type="button"
              (click)="handleFaceModalPrimaryAction()"
              [disabled]="processing() || attendanceSuccess()"
              class="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {{ punchModalPrimaryLabel() }}
            </button>
            <button
              *ngIf="checkInMode() !== 'face'"
              type="button"
              (click)="submitCameraModalPunch()"
              [disabled]="processing() || attendanceSuccess() || (cameraAvailability() === 'checking') || isPunchBlockedByLocation()"
              class="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {{ processing() ? 'Submitting Attendance...' : punchModalPrimaryLabel() }}
            </button>
            </div>
          </div>
      </div>
    </div>

    <!-- Manual Request Modal -->
    <div
      *ngIf="showManualModal()"
      class="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <div
        class="relative z-[10002] w-full max-w-md overflow-hidden rounded-md bg-white shadow-2xl"
      >
          <header
            class="p-5 border-b border-slate-100 flex justify-between items-center"
          >
            <h2 class="text-lg font-bold text-slate-900">
              Manual Attendance Request
            </h2>
            <button
              (click)="closeManualModal()"
              class="p-1.5 hover:bg-slate-100 rounded-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </header>
          <form (ngSubmit)="submitManualRequest()" class="p-5 space-y-4">
            <div>
              <label
                class="block text-xs font-bold text-slate-400 uppercase mb-1"
                >Date</label
              >
              <input
                type="date"
                [(ngModel)]="manualRequest.date"
                name="date"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                required
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label
                  class="block text-xs font-bold text-slate-400 uppercase mb-1"
                  >Check In</label
                >
                <input
                  type="time"
                  [(ngModel)]="manualRequest.check_in"
                  name="check_in"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label
                  class="block text-xs font-bold text-slate-400 uppercase mb-1"
                  >Check Out</label
                >
                <input
                  type="time"
                  [(ngModel)]="manualRequest.check_out"
                  name="check_out"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label
                class="block text-xs font-bold text-slate-400 uppercase mb-1"
                >Reason</label
              >
              <textarea
                [(ngModel)]="manualRequest.reason"
                name="reason"
                rows="3"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                placeholder="Explain why you need this correction..."
                required
              ></textarea>
            </div>
            <div class="flex gap-3 pt-2">
              <button
                type="button"
                (click)="closeManualModal()"
                class="flex-1 px-4 py-2.5 rounded-lg font-bold text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="submitting()"
                class="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50"
              >
                {{ submitting() ? 'Submitting...' : 'Submit Request' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .scan-line {
        animation: scan 2s cubic-bezier(0.53, 0.21, 0.29, 0.67) infinite
          alternate;
      }
      :host ::ng-deep .attendance-clean-panel .card,
      :host ::ng-deep .attendance-clean-panel .app-surface-card,
      :host ::ng-deep .attendance-clean-panel .app-glass-card {
        background: #ffffff !important;
        border: 0 !important;
        border-radius: 0.5rem !important;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04) !important;
        --tw-ring-color: transparent !important;
      }
      :host ::ng-deep .attendance-clean-panel section,
      :host ::ng-deep .attendance-clean-panel article,
      :host ::ng-deep .attendance-clean-panel a.group,
      :host ::ng-deep .attendance-clean-panel button.group {
        border-radius: 0.5rem !important;
      }
      :host ::ng-deep .attendance-clean-panel .hover\\:-translate-y-0\\.5:hover,
      :host ::ng-deep .attendance-clean-panel .hover\\:-translate-y-1:hover {
        transform: none !important;
      }
      :host ::ng-deep .attendance-clean-panel .shadow-2xl,
      :host ::ng-deep .attendance-clean-panel .shadow-xl {
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1) !important;
      }
      :host ::ng-deep .attendance-clean-panel .app-chip-switch {
        border-radius: 0.5rem !important;
        background: rgb(248 250 252 / 1) !important;
        box-shadow: none !important;
      }
      :host ::ng-deep .attendance-clean-panel .app-chip-button {
        border-radius: 0.375rem !important;
        letter-spacing: 0 !important;
      }
      @keyframes scan {
        0% {
          top: 10%;
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          top: 90%;
          opacity: 0;
        }
      }
    `,
  ],
})
export class AttendanceComponent implements OnInit, OnDestroy {
  private attendanceService = inject(AttendanceService);
  private faceRecognitionService = inject(FaceRecognitionService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private permissionService = inject(PermissionService);
  private organizationService = inject(OrganizationService);
  private liveRefreshService = inject(LiveRefreshService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  // Core data signals
  history = signal<AttendanceRecord[]>([]);
  todayAttendance = signal<TodayAttendance | null>(null);
  stats = signal<AttendanceStats | null>(null);

  breaks = signal<BreakRecord[]>([]);
  shifts = signal<any[]>([]);
  manualRequests = signal<any[]>([]);

  // UI State
  currentView = signal<
    'punch' | 'calendar' | 'stats' | 'tracking' | 'geofence' | 'shift-planner' | 'records'
  >('punch');
  checkInMode = signal<'web' | 'camera' | 'biometric' | 'face'>('camera');
  processing = signal<boolean>(false);
  isCameraReady = signal<boolean>(false);
  cameraAvailability = signal<'idle' | 'checking' | 'ready' | 'unavailable'>('idle');
  punchLocationAvailability = signal<'idle' | 'checking' | 'ready' | 'unavailable'>('idle');
  punchLocationLabel = signal<string>('Location not checked yet');
  punchLocationCoords = signal<string>('');
  punchLocationAddress = signal<string>('');
  punchModalDate = signal<Date>(new Date());
  punchModalTime = signal<string>('');
  capturedPhotoData = signal<string | null>(null);
  faceScanStatus = signal<string>('');
  faceScanAttempts = signal<number>(0);
  faceConfirmationReady = signal<boolean>(false);
  facePresenceStreak = signal<number>(0);
  attendanceSuccess = signal<boolean>(false);
  showCameraModal = signal<boolean>(false);
  pendingPunchAction = signal<'in' | 'out' | null>(null);
  showManualModal = signal<boolean>(false);
  submitting = signal<boolean>(false);

  // Real-time state
  currentTime = signal<string>('');
  clockInTime = signal<string>('--:--');
  isOnBreak = signal<boolean>(false);
  selectedShiftId = signal<number | null>(null);
  statsPeriod = signal<'week' | 'month' | 'year'>('month');
  historyStatusFilter = signal<'all' | AttendanceRecord['status']>('all');

  shiftOptions = computed<SelectOption[]>(() => [
    { label: 'No shift', value: null },
    ...this.shifts().map((s: any) => ({
      label: `${s.name} (${s.start_time})`,
      value: s.id,
    })),
  ]);

  historyStatusOptions: SelectOption[] = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Present', value: 'present' },
    { label: 'Late', value: 'late' },
    { label: 'Half Day', value: 'half_day' },
    { label: 'Absent', value: 'absent' },
    { label: 'On Leave', value: 'on_leave' },
  ];

  // Geofence state
  locationStatus = signal<'unknown' | 'inside' | 'outside'>('unknown');
  currentDistance = signal<number | null>(null);
  geofenceEnabled = signal(false);
  geofenceRequired = signal(false);

  // Calendar
  currentMonth = signal<number>(new Date().getMonth());
  currentYear = signal<number>(new Date().getFullYear());
  calendarDays = signal<any[]>([]);
  selectedDate = signal<string | null>(null);

  // Manual request
  manualRequest = {
    date: '',
    check_in: '',
    check_out: '',
    reason: '',
  };

  // Polling
  private pollingSubscription?: Subscription;
  private clockSubscription?: Subscription;
  private routeSubscription?: Subscription;
  private faceScanSubscription?: Subscription;
  private faceAutoTriggered = false;
  private faceScanBusy = false;
  private faceTurnAway = false;
  private autoOpenPunchModalConsumed = false;

  private cameraStream: MediaStream | null = null;
  private currentUser: User | null = null;
  workspaceMode = signal<'self' | 'admin'>('self');
  isSelfServiceWorkspace = computed(() => this.workspaceMode() === 'self');
  isAdminAttendanceWorkspace = computed(() => this.workspaceMode() === 'admin');
  biometricAvailability = signal<'checking' | 'available' | 'unsupported' | 'restricted'>('checking');
  biometricConfiguredForUser = signal(false);
  biometricTestMode = signal(false);

  modes: {
    id: 'web' | 'camera' | 'face' | 'biometric';
    label: string;
    icon: string;
  }[] = [
    {
      id: 'camera',
      label: 'Selfie',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H8l1.3-1.6A2 2 0 0 1 10.85 4h2.3a2 2 0 0 1 1.55.74L16 6h1.5A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/><path d="M9.5 13a2.5 2.5 0 1 1 5 0"/><path d="M8.75 16a4.6 4.6 0 0 1 6.5 0"/></svg>',
    },
    {
      id: 'face',
      label: 'Auto Detect',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3H5a2 2 0 0 0-2 2v2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M3 17v2a2 2 0 0 0 2 2h2"/><path d="M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0"/></svg>',
    },
    {
      id: 'biometric',
      label: 'Bio',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a4 4 0 0 0-4 4v2"/><path d="M8 18a4 4 0 0 0 8 0v-2"/><path d="M6.2 10.5A6 6 0 0 1 12 6"/><path d="M17.8 10.5A6 6 0 0 0 12 6"/><path d="M5 13.5c.8-1.6 2.3-2.5 4-2.5"/><path d="M19 13.5c-.8-1.6-2.3-2.5-4-2.5"/><path d="M10 12.5v5.5"/><path d="M14 11.5v6.5"/><path d="M12 10.5v8.5"/></svg>',
    },
  ];
  visibleModes = computed(() =>
    this.modes.filter((mode) => mode.id !== 'web' && mode.id !== 'face'),
  );

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  statusLegend = [
    { status: 'present', label: 'Present', color: 'bg-green-500' },
    { status: 'late', label: 'Late', color: 'bg-amber-500' },
    { status: 'absent', label: 'Absent', color: 'bg-red-500' },
    { status: 'on_leave', label: 'Leave', color: 'bg-blue-500' },
    { status: 'holiday', label: 'Holiday', color: 'bg-purple-500' },
    { status: 'weekend', label: 'Weekly Off', color: 'bg-slate-400' },
  ];

  // Computed
  isClockedIn = computed(() => this.todayAttendance()?.is_clocked_in || false);
  isClockedOut = computed(
    () => this.todayAttendance()?.is_clocked_out || false,
  );
  filteredHistory = computed(() => {
    const selectedStatus = this.historyStatusFilter();
    const records = this.history();
    if (selectedStatus === 'all') {
      return records;
    }

    return records.filter((record) => record.status === selectedStatus);
  });
  pendingManualRequestCount = computed(
    () =>
      this.manualRequests().filter((request) => request.status === 'pending')
        .length,
  );
  attendanceAddonActive = computed(() => this.organizationService.isModuleEnabled('attendance'));
  attendanceAddonCards = computed(() => [
    {
      name: 'Employee Tracking',
      slug: 'employee-tracking',
      short: 'ET',
      tone: 'bg-cyan-100 text-cyan-700',
      route: '/attendance/workspace?view=tracking',
      active: this.canAccessTrackingWorkspace(),
      description: 'Track employee location from phone or desktop and monitor live field movement.',
    },
    {
      name: 'Geo-Fence',
      slug: 'geofence',
      short: 'GF',
      tone: 'bg-violet-100 text-violet-700',
      route: '/attendance/geofence',
      active: this.canAccessGeofenceWorkspace(),
      description: 'Enable location boundaries and attendance compliance for allowed zones.',
    },
    {
      name: 'Shift Planner',
      slug: 'shift-planner',
      short: 'SP',
      tone: 'bg-emerald-100 text-emerald-700',
      route: '/attendance/workspace?view=shift-planner',
      active: this.canAccessShiftPlannerWorkspace(),
      description: 'Plan shifts, rosters, and scheduling visibility for managers.',
    },
    {
      name: 'Face Recognition',
      slug: 'face-recognition',
      short: 'FR',
      tone: 'bg-indigo-100 text-indigo-700',
      route: '/face-registration',
      active: this.canAccessFaceRegistrationRoute(),
      description: 'Add face-based attendance authentication and employee identity verification.',
    },
  ]);
  currentViewLabel = computed(() => {
    const labels: Record<
      'punch' | 'calendar' | 'stats' | 'tracking' | 'geofence' | 'shift-planner' | 'records',
      string
    > = {
      punch: 'Mark Attendance',
      calendar: 'Calendar',
      stats: 'Statistics',
      tracking: 'Tracking',
      geofence: 'Geofence',
      'shift-planner': 'Shift Planner',
      records: 'Records',
    };

    return labels[this.currentView()];
  });
  viewMeta = computed(() => {
    const currentView = this.currentView();
    const meta: Record<
      typeof currentView,
      { title: string; description: string }
    > = {
      punch: {
        title: 'Punch in, break tracking, and shift-aware actions',
        description:
          'Use this view for real-time attendance actions including selfie, smart auto detect, biometric, or no-camera fallback check-ins.',
      },
      calendar: {
        title: 'Monthly attendance calendar and day-by-day review',
        description:
          'Review presence, leave, late marks, and date-specific records in one place.',
      },
      stats: {
        title: 'Attendance analytics and performance trends',
        description:
          'Monitor work-hour trends, punctuality, and attendance summaries for the selected period.',
      },
      tracking: {
        title: 'Employee movement and live activity tracking',
        description:
          'Watch location-aware attendance updates and active field tracking when enabled.',
      },
      geofence: {
        title: 'Geofence setup and compliance controls',
        description:
          'Configure location boundaries and check whether attendance actions respect geofence policy.',
      },
      'shift-planner': {
        title: 'Shift planning and assignment management',
        description:
          'Manage shift allocation, scheduling visibility, and operational attendance readiness.',
      },
      records: {
        title: this.isSelfServiceWorkspace()
          ? 'Detailed Attendance Records'
          : 'Attendance records are managed from the team register',
        description: this.isSelfServiceWorkspace()
          ? 'View and search your complete attendance history with selfie and location data.'
          : 'Use the team attendance register to review who marked attendance, when they marked it, and the daily status across employees.',
      },
    };

    return meta[currentView];
  });

  ngOnInit() {
    this.currentUser = this.authService.getStoredUser();
    this.workspaceMode.set(this.resolveWorkspaceMode());
    this.currentView.set(this.resolveDefaultViewForWorkspace());
    this.routeSubscription = this.route.queryParamMap.subscribe((params) => {
      const view = params.get('view');
      if (this.isAttendanceView(view)) {
        this.setView(view);
      }

      const shouldOpenModal =
        this.isSelfServiceWorkspace() &&
        params.get('openModal') === '1' &&
        !this.autoOpenPunchModalConsumed;

      if (shouldOpenModal) {
        this.autoOpenPunchModalConsumed = true;
        this.currentView.set('punch');
        setTimeout(() => {
          this.openPrimaryAttendanceModal();
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { openModal: null },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
        }, 0);
      }
    });
    void this.detectBiometricSupport();
    void this.faceRecognitionService.primeFaceEngine();
    this.organizationService.getAddons().subscribe({ error: () => {} });
    this.startClock();
    this.loadInitialData();
    this.startPolling();
  }

  ngOnDestroy() {
    this.stopPolling();
    this.stopClock();
    this.routeSubscription?.unsubscribe();
    this.stopFaceAutoScan();
    this.stopCamera();
  }

  // ============ INITIALIZATION ============

  loadInitialData() {
    forkJoin({
      today: this.attendanceService.getTodayAttendance(),
      shifts: this.attendanceService.getShifts(),
      breaks: this.attendanceService.getTodayBreaks(),
    }).subscribe({
      next: (data) => {
        this.todayAttendance.set(data.today);
        this.shifts.set(data.shifts || []);
        this.breaks.set(data.breaks || []);

        if (data.today?.check_in) {
          const checkInDate = new Date(data.today.check_in);
          this.clockInTime.set(
            checkInDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          );
        }

        this.isOnBreak.set(data.today?.current_status === 'on_break');
      },
      error: () => {
        this.todayAttendance.set(null);
        this.shifts.set([]);
        this.breaks.set([]);
        this.clockInTime.set('--:--');
        this.isOnBreak.set(false);
        this.toastService.error('Unable to load attendance data right now.');
      },
    });

    this.loadDataForCurrentView();
    this.generateCalendar();
  }

  private loadDataForCurrentView(): void {
    const view = this.currentView();

    if (this.isAdminAttendanceWorkspace() && this.isSelfOnlyView(view)) {
      return;
    }

    if (view === 'stats') {
      this.loadStatsForPeriod(this.statsPeriod());
      return;
    }

    if (view === 'calendar') {
      this.loadMonthData();
      return;
    }

    this.attendanceService.getAttendanceHistory().subscribe({
      next: (data) => this.history.set(data),
      error: () => this.history.set([]),
    });

    this.attendanceService.getManualAttendanceRequests().subscribe({
      next: (data) => this.manualRequests.set(data || []),
      error: () => this.manualRequests.set([]),
    });
  }

  startClock() {
    this.updateClock();
    this.clockSubscription = interval(1000).subscribe(() => {
      this.updateClock();
    });
  }

  stopClock() {
    this.clockSubscription?.unsubscribe();
  }

  updateClock() {
    const now = new Date();
    this.currentTime.set(
      now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    );
  }

  // ============ POLLING ============

  startPolling() {
    this.pollingSubscription = this.liveRefreshService.createStream(60000).subscribe((trigger) => {
      if (trigger === 'interval' && typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      this.refreshData(trigger === 'interval' ? 'live' : 'full');
    });
  }

  stopPolling() {
    this.pollingSubscription?.unsubscribe();
  }

  refreshData(mode: 'full' | 'live' = 'full') {
    this.attendanceService.getTodayAttendance().subscribe({
      next: (data) => {
        this.todayAttendance.set(data);
        if (data?.check_in) {
          const checkInDate = new Date(data.check_in);
          this.clockInTime.set(
            checkInDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          );
        }
        this.isOnBreak.set(data?.current_status === 'on_break');
      },
    });

    this.attendanceService.getTodayBreaks().subscribe({
      next: (data) => this.breaks.set(data),
    });

    if (mode === 'full' || this.currentView() === 'punch') {
      this.attendanceService.getAttendanceHistory().subscribe({
        next: (data) => this.history.set(data),
      });

      this.attendanceService.getManualAttendanceRequests().subscribe({
        next: (data) => this.manualRequests.set(data || []),
        error: () => this.manualRequests.set([]),
      });
    }

    if (mode === 'full' || this.currentView() === 'stats') {
      this.attendanceService.getAttendanceStats(this.statsPeriod()).subscribe({
        next: (data) => this.stats.set(data),
      });
    }
  }

  // ============ VIEW SWITCHING ============

  setView(
    view:
      | 'punch'
      | 'calendar'
      | 'stats'
      | 'tracking'
      | 'geofence'
      | 'shift-planner'
      | 'records',
  ) {
    if (this.isSelfServiceWorkspace() && this.isAdminOnlyView(view)) return;
    if (this.isAdminAttendanceWorkspace() && this.isSelfOnlyView(view)) return;
    if (view === 'tracking' && !this.canAccessTrackingWorkspace()) return;
    if (view === 'geofence' && !this.canAccessGeofenceWorkspace()) return;
    if (view === 'shift-planner' && !this.canAccessShiftPlannerWorkspace()) return;
    this.currentView.set(view);
    if (view === 'stats') {
      this.loadStatsForPeriod(this.statsPeriod());
    }
    if (view === 'calendar') {
      this.loadMonthData();
      this.generateCalendar();
    }
    if (view === 'punch') {
      this.attendanceService.getAttendanceHistory().subscribe({
        next: (data) => this.history.set(data),
        error: () => this.history.set([]),
      });

      this.attendanceService.getManualAttendanceRequests().subscribe({
        next: (data) => this.manualRequests.set(data || []),
        error: () => this.manualRequests.set([]),
      });
    }
    if (view === 'records') {
      this.attendanceService.getAttendanceHistory().subscribe({
        next: (data) => this.history.set(data),
        error: () => this.history.set([]),
      });
    }
  }

  private isAttendanceView(
    view: string | null,
  ): view is
    | 'punch'
    | 'calendar'
    | 'stats'
    | 'tracking'
    | 'geofence'
    | 'shift-planner'
    | 'records' {
    return (
      view === 'punch' ||
      view === 'calendar' ||
      view === 'stats' ||
      view === 'tracking' ||
      view === 'geofence' ||
      view === 'shift-planner' ||
      view === 'records'
    );
  }

  private isAdminOnlyView(
    view:
      | 'punch'
      | 'calendar'
      | 'stats'
      | 'tracking'
      | 'geofence'
      | 'shift-planner'
      | 'records',
  ): boolean {
    return view === 'tracking' || view === 'geofence' || view === 'shift-planner';
  }

  private isSelfOnlyView(
    view:
      | 'punch'
      | 'calendar'
      | 'stats'
      | 'tracking'
      | 'geofence'
      | 'shift-planner'
      | 'records',
  ): boolean {
    return (
      view === 'punch' ||
      view === 'calendar' ||
      view === 'stats' ||
      view === 'records'
    );
  }

  private resolveDefaultViewForWorkspace():
    | 'punch'
    | 'calendar'
    | 'stats'
    | 'tracking'
    | 'geofence'
    | 'shift-planner'
    | 'records' {
    if (this.isSelfServiceWorkspace()) {
      return 'calendar';
    }

    if (this.canAccessTrackingWorkspace()) {
      return 'tracking';
    }

    if (this.canAccessShiftPlannerWorkspace()) {
      return 'shift-planner';
    }

    if (this.canAccessGeofenceWorkspace()) {
      return 'geofence';
    }

    return 'tracking';
  }

  setStatsPeriod(period: 'week' | 'month' | 'year') {
    this.statsPeriod.set(period);
    this.loadStatsForPeriod(period);
  }

  canAccessTrackingWorkspace(): boolean {
    return this.hasRawPermission('module518_view') && this.hasRawPermission('module518_UserView');
  }

  canAccessGeofenceWorkspace(): boolean {
    return this.hasRawPermission('module318_view') && this.hasRawPermission('module318_UserView');
  }

  canAccessShiftPlannerWorkspace(): boolean {
    return (
      (this.hasRawPermission('module443_view') && this.hasRawPermission('module443_UserView')) ||
      (this.hasRawPermission('module508_view') && this.hasRawPermission('module508_UserView'))
    );
  }

  private hasRawPermission(key: string): boolean {
    const user: any = this.currentUser || this.authService.getStoredUser();
    if (this.permissionService.isSuperAdminUser(user)) return true;

    const sources = [
      user?.permissions,
      user?.permission,
      user?.allUserPermissions?.permission,
      user?.rawPermissions,
      user?.userPermissions,
    ];

    return sources.some((source) => {
      if (!source) return false;
      if (Array.isArray(source)) {
        return source.some((item) => {
          if (typeof item === 'string') return item === key;
          if (item?.key === key) return this.toBoolean(item?.allowed ?? item?.value ?? true);
          if (item?.name === key) return this.toBoolean(item?.allowed ?? item?.value ?? true);
          return false;
        });
      }
      if (typeof source === 'object') {
        return this.toBoolean(source[key]);
      }
      return false;
    });
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === '1' || normalized === 'true' || normalized === 'yes';
    }
    return Boolean(value);
  }

  canAccessTeamAttendanceRoute(): boolean {
    return this.permissionService.canAccessRoute(this.currentUser, '/attendance/register');
  }

  canAccessRegularizationRoute(): boolean {
    return this.permissionService.canAccessRoute(this.currentUser, '/attendance/regularizations');
  }

  canAccessFaceRegistrationRoute(): boolean {
    return this.hasRawPermission('module507_view') && this.hasRawPermission('module507_UserView');
  }

  canAccessIntegrationsRoute(): boolean {
    return this.permissionService.canAccessRoute(this.currentUser, '/attendance/integrations');
  }

  openAttendanceAddons(): void {
    this.router.navigate(['/add-ons'], {
      queryParams: {
        category: 'premium',
        focus: 'attendance',
      },
    });
  }

  openAttendanceUpgrade(addon: string): void {
    this.router.navigate(['/billing'], {
      queryParams: {
        source: 'attendance',
        addon,
        mode: 'upgrade',
      },
    });
  }

  openAttendanceAddon(addon: { route: string; slug: string }): void {
    const [path, query] = addon.route.split('?');
    if (!query) {
      this.router.navigateByUrl(path);
      return;
    }

    const queryParams: Record<string, string> = {};
    new URLSearchParams(query).forEach((value, key) => {
      queryParams[key] = value;
    });
    this.router.navigate([path], { queryParams });
  }

  openSelfServiceRequest(
    kind:
      | 'regularization'
      | 'overtime'
      | 'short-day'
      | 'under-time'
      | 'wfh'
      | 'outdoor-duty'
      | 'request-center',
  ): void {
    if (kind === 'regularization') {
      this.router.navigate(['/requests/regularization'], {
        queryParams: { source: 'self-attendance' },
      });
      return;
    }

    if (kind === 'overtime') {
      this.router.navigate(['/requests/overtime'], {
        queryParams: { source: 'self-attendance' },
      });
      return;
    }

    this.router.navigate(['/requests/leave'], {
      queryParams: {
        source: 'self-attendance',
        requestKind: kind,
      },
    });
  }

  todayLateStatusLabel(): string {
    const attendance = this.todayAttendance();
    const checkIn = attendance?.check_in;
    const shiftStart = attendance?.shift?.start_time;

    if (!checkIn) return 'Awaiting Check In';
    if (!shiftStart) return attendance?.is_clocked_in ? 'On Time Window' : 'Completed';

    return this.minutesDifferenceFromShift(checkIn, shiftStart) > 0
      ? 'Late Today'
      : 'On Time';
  }

  todayEarlyLeavingLabel(): string {
    const attendance = this.todayAttendance();
    const checkOut = attendance?.check_out;
    const shiftEnd = attendance?.shift?.end_time;

    if (!checkOut) return attendance?.is_clocked_in ? 'Pending Check Out' : 'No Check Out';
    if (!shiftEnd) return 'Completed';

    return this.minutesDifferenceFromShift(checkOut, shiftEnd) < 0
      ? 'Early Check Out'
      : 'Normal Exit';
  }

  private minutesDifferenceFromShift(dateTime: string, shiftTime: string): number {
    const date = new Date(dateTime);
    if (Number.isNaN(date.getTime()) || !shiftTime) return 0;

    const [hoursString = '0', minutesString = '0'] = shiftTime.split(':');
    const shiftDate = new Date(date);
    shiftDate.setHours(Number(hoursString), Number(minutesString), 0, 0);

    return Math.round((date.getTime() - shiftDate.getTime()) / 60000);
  }

  loadStatsForPeriod(period: 'week' | 'month' | 'year') {
    this.attendanceService.getAttendanceStats(period).subscribe({
      next: (data) => this.stats.set(data),
      error: () =>
        this.toastService.error('Failed to load attendance statistics'),
    });
  }

  setMode(mode: 'web' | 'camera' | 'biometric' | 'face') {
    if (this.processing()) return;

    const resolvedMode: 'web' | 'camera' | 'biometric' | 'face' =
      mode === 'camera' ? 'face' : mode;

    if (resolvedMode === 'biometric' && !this.canUseBiometricMode()) {
      this.toastService.error(this.biometricSupportMessage());
      this.checkInMode.set('camera');
      return;
    }

    this.checkInMode.set(resolvedMode);
    this.capturedPhotoData.set(null);
    this.faceScanStatus.set('');
    this.faceScanAttempts.set(0);
    this.faceConfirmationReady.set(false);
    this.facePresenceStreak.set(0);
    this.attendanceSuccess.set(false);
    this.faceAutoTriggered = false;

    if (this.showCameraModal()) {
      if (resolvedMode === 'face') {
        void this.startCameraAfterModalRender('face');
        return;
      }

      if (resolvedMode === 'web') {
        this.cameraAvailability.set('idle');
        this.stopCamera();
        this.stopFaceAutoScan();
        void this.startCameraAfterModalRender('camera', true);
        return;
      }

      this.cameraAvailability.set('idle');
      this.stopCamera();
      this.stopFaceAutoScan();
      return;
    }

    this.pendingPunchAction.set(null);
    this.stopCamera();
    this.stopFaceAutoScan();
  }

  // Wrapper for template - handles string from template binding
  setModeFromTemplate(modeId: string) {
    this.setMode(modeId as 'web' | 'camera' | 'biometric' | 'face');
  }

  isCameraMode(): boolean {
    const m = this.checkInMode();
    return m === 'camera' || m === 'face';
  }

  onPunchAction(action: 'in' | 'out') {
    this.openCameraModal(action);
  }

  openPrimaryAttendanceModal() {
    if (this.todayAttendance()?.is_clocked_out || this.processing()) {
      return;
    }

    this.checkInMode.set('face');
    this.pendingPunchAction.set(this.primaryAttendanceAction());
    this.showCameraModal.set(true);
    this.cameraAvailability.set('idle');
    this.punchLocationAvailability.set('idle');
    this.punchLocationLabel.set('Location not checked yet');
    this.punchLocationCoords.set('');
    this.punchLocationAddress.set('');
    this.capturedPhotoData.set(null);
    this.faceScanStatus.set('');
    this.faceScanAttempts.set(0);
    this.faceConfirmationReady.set(false);
    this.facePresenceStreak.set(0);
    this.attendanceSuccess.set(false);
    this.faceAutoTriggered = false;
    this.stopCamera();
    this.stopFaceAutoScan();
    this.cdr.detectChanges();

    setTimeout(() => {
      if (this.showCameraModal()) {
        this.preparePunchModal();
        void this.startCameraAfterModalRender('face');
      }
    }, 80);
  }

  openCameraModal(action: 'in' | 'out') {
    if (this.processing()) {
      return;
    }

    this.pendingPunchAction.set(action);
    this.showCameraModal.set(true);
    this.cdr.detectChanges();
    this.cameraAvailability.set('idle');
    this.capturedPhotoData.set(null);
    this.faceScanStatus.set('');
    this.faceScanAttempts.set(0);
    this.faceConfirmationReady.set(false);
    this.facePresenceStreak.set(0);
    this.attendanceSuccess.set(false);
    this.faceAutoTriggered = false;
    this.stopCamera();
    this.stopFaceAutoScan();

    setTimeout(() => {
      if (!this.showCameraModal()) {
        return;
      }

      this.preparePunchModal();
      const mode = this.checkInMode();
      if (mode === 'face') {
        void this.startCameraAfterModalRender('face');
        return;
      }
      if (mode === 'camera' || mode === 'web') {
        void this.startCameraAfterModalRender('camera', true);
      }
    }, 120);
  }

  closeCameraModal() {
    this.showCameraModal.set(false);
    this.pendingPunchAction.set(null);
    this.cameraAvailability.set('idle');
    this.punchLocationAvailability.set('idle');
    this.punchLocationLabel.set('Location not checked yet');
    this.punchLocationCoords.set('');
    this.capturedPhotoData.set(null);
    this.faceScanStatus.set('');
    this.faceScanAttempts.set(0);
    this.faceConfirmationReady.set(false);
    this.facePresenceStreak.set(0);
    this.attendanceSuccess.set(false);
    this.faceAutoTriggered = false;
    this.stopFaceAutoScan();
    this.stopCamera();
  }

  submitCameraModalPunch() {
    const action = this.pendingPunchAction();
    if (!action) {
      return;
    }

    if (this.checkInMode() === 'face' && !this.faceConfirmationReady()) {
      return;
    }

    void this.handlePunch(action);
  }

  handleFaceModalPrimaryAction() {
    if (this.faceConfirmationReady()) {
      this.submitCameraModalPunch();
      return;
    }

    this.restartFaceModalScan();
  }

  restartFaceModalScan() {
    if (this.checkInMode() !== 'face' || !this.showCameraModal()) {
      return;
    }

    this.capturedPhotoData.set(null);
    this.faceScanAttempts.set(0);
    this.facePresenceStreak.set(0);
    this.faceScanStatus.set('');
    this.faceConfirmationReady.set(false);
    this.attendanceSuccess.set(false);
    this.faceAutoTriggered = false;

    if (!this.isCameraReady()) {
      this.startCamera('face');
      return;
    }

    this.startFaceAutoScan();
  }

  // ============ CAMERA ============

  async startCamera(mode: 'camera' | 'face', allowFallback = false) {
    this.stopCamera();
    this.stopFaceAutoScan();
    this.isCameraReady.set(false);
    this.cameraAvailability.set('checking');
    this.faceAutoTriggered = false;

    try {
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        throw new Error(
          'Camera works only on HTTPS or localhost. Open this HRMS page on a secure URL and try again.',
        );
      }

      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera API is not available in this browser.');
      }
      const constraintsToTry: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { ideal: 'user' },
            width: { ideal: 640 },
            height: { ideal: 640 },
          },
          audio: false,
        },
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 640 },
          },
          audio: false,
        },
        {
          video: true,
          audio: false,
        },
      ];

      let stream: MediaStream | null = null;
      let lastError: unknown = null;
      for (const constraints of constraintsToTry) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!stream) {
        throw lastError instanceof Error ? lastError : new Error('Unable to access camera.');
      }

      this.cameraStream = stream;
      const video = await this.waitForCameraElement(mode);
      if (!video) {
        throw new Error('Camera preview could not be prepared in time.');
      }

      video.setAttribute('playsinline', 'true');
      video.muted = true;
      video.autoplay = true;
      video.srcObject = this.cameraStream;
      video.onloadedmetadata = async () => {
        try {
          await video.play();
        } catch {
          // Ignore autoplay timing issues; the video element still becomes usable.
        }
        this.isCameraReady.set(true);
        this.cameraAvailability.set('ready');
        if (mode === 'face') {
          this.startFaceAutoScan();
        }
      };

      if (video.readyState >= 1) {
        video.onloadedmetadata?.(new Event('loadedmetadata'));
      }
    } catch (err) {
      const cameraErrorName =
        err && typeof err === 'object' && 'name' in err
          ? String((err as { name?: string }).name)
          : '';
      if (
        cameraErrorName === 'NotAllowedError' ||
        cameraErrorName === 'PermissionDeniedError'
      ) {
        console.warn('Camera access was denied by the browser.');
      } else {
        console.error('Camera error:', err);
      }
      this.stopCamera();
      this.cameraAvailability.set('unavailable');
      const errorMessage = this.formatCameraAccessError(err);
      if (allowFallback) {
        this.toastService.error(errorMessage);
        this.faceScanStatus.set(`${errorMessage} You can still continue without selfie.`);
        return;
      }
      if (mode === 'face') {
        this.checkInMode.set('camera');
        this.faceScanStatus.set(
          `${errorMessage} Smart detect is unavailable on this device. You can continue with a normal selfie punch.`,
        );
        return;
      }
      this.faceScanStatus.set(`${errorMessage} Please allow permission and try again.`);
      this.cameraAvailability.set('unavailable');
    }
  }

  private formatCameraAccessError(error: unknown): string {
    if (error && typeof error === 'object') {
      const namedError = error as { name?: string; message?: string };
      switch (namedError.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          return 'Camera permission was denied. Allow camera access in your browser site settings and try again.';
        case 'NotFoundError':
        case 'DevicesNotFoundError':
          return 'No camera device was found on this system.';
        case 'NotReadableError':
        case 'TrackStartError':
          return 'Camera is busy in another app or browser tab. Close the other app and try again.';
        case 'SecurityError':
          return 'Camera is blocked by browser security rules. Open this page on HTTPS or localhost and try again.';
        case 'AbortError':
          return 'Camera start was interrupted. Please try again.';
        case 'OverconstrainedError':
        case 'ConstraintNotSatisfiedError':
          return 'This camera does not support the requested capture settings. Try again and we will use a simpler mode.';
      }

      if (typeof namedError.message === 'string' && namedError.message.trim()) {
        return namedError.message.trim();
      }
    }

    return 'Camera access failed on this device.';
  }

  private async waitForCameraElement(
    mode: 'camera' | 'face',
    attempts = 140,
  ): Promise<HTMLVideoElement | null> {
    for (let index = 0; index < attempts; index += 1) {
      const video =
        this.videoElement?.nativeElement ??
        (document.getElementById('attendance-camera-preview') as HTMLVideoElement | null) ??
        (document.querySelector('video[autoplay][playsinline]') as HTMLVideoElement | null);

      if (video) {
        return video;
      }

      this.cdr.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 25));
    }

    return null;
  }

  private async startCameraAfterModalRender(
    mode: 'camera' | 'face',
    allowFallback = false,
  ): Promise<void> {
    try {
      this.cdr.detectChanges();
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      await new Promise((resolve) => setTimeout(resolve, 180));
      await this.startCamera(mode, allowFallback);
    } catch (error) {
      this.cameraAvailability.set('unavailable');
      this.faceScanStatus.set(this.formatCameraAccessError(error));
    }
  }

  stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = null;
    }
    this.isCameraReady.set(false);
    if (this.cameraAvailability() !== 'unavailable') {
      this.cameraAvailability.set('idle');
    }
  }

  stopFaceAutoScan() {
    this.faceScanSubscription?.unsubscribe();
    this.faceScanSubscription = undefined;
    this.faceScanBusy = false;
    this.faceTurnAway = false;
  }

  getFaceScanProgress(): number {
    return Math.min(100, Math.round((this.faceScanAttempts() / 3) * 100));
  }

  private playSuccessTone(): void {
    try {
      const AudioContextCtor =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextCtor) return;

      const context = new AudioContextCtor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1170, context.currentTime + 0.12);
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.28);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.3);
      oscillator.onended = () => context.close().catch(() => undefined);
    } catch {
      // Silent fallback if audio is blocked.
    }
  }

  startFaceAutoScan() {
    this.stopFaceAutoScan();
    if (this.checkInMode() !== 'face') return;

    this.faceScanAttempts.set(0);
    this.facePresenceStreak.set(0);
    this.faceConfirmationReady.set(false);
    this.faceTurnAway = false;
    this.faceScanStatus.set(
      'Scanning your selfie. Turn your head slightly left or right to confirm.',
    );

    void this.runFaceAutoScanTick();
    this.faceScanSubscription = interval(500).subscribe(() => {
      void this.runFaceAutoScanTick();
    });
  }

  private async runFaceAutoScanTick() {
    if (
      !this.isCameraReady() ||
      this.processing() ||
      this.faceAutoTriggered ||
      this.faceScanBusy
    ) {
      return;
    }

    const video = this.videoElement?.nativeElement;
    if (!video || !video.videoWidth) return;

    this.faceScanBusy = true;
    try {
      const sample = await firstValueFrom(
        this.faceRecognitionService.detectLivenessSampleFromVideo(video),
      ).catch(() => null);

      if (!sample?.detected) {
        this.facePresenceStreak.set(0);
        this.faceTurnAway = false;
        const attempts = this.faceScanAttempts() + 1;
        this.faceScanAttempts.set(attempts);
        this.faceScanStatus.set(
          attempts >= 3
            ? 'No face detected in the selfie frame. Please face the camera clearly.'
            : `No clear selfie detected yet. Retrying ${attempts}/3...`,
        );

        if (attempts >= 3) {
          this.stopFaceAutoScan();
        }
        return;
      }

      const streak = this.facePresenceStreak() + 1;
      this.facePresenceStreak.set(streak);
      this.faceScanStatus.set(
        streak >= 1
          ? 'Selfie detected. Step 1: turn your head slightly left or right.'
          : 'Selfie detected. Hold still for confirmation...',
      );

      if (streak < 1) {
        return;
      }

      const turnThreshold = 0.04;
      const centerThreshold = 0.055;

      if (!this.faceTurnAway) {
        if (Math.abs(sample.headTurnRatio) >= turnThreshold) {
          this.faceTurnAway = true;
          this.faceScanStatus.set(
            'Turn detected. Step 2: return your head to center.',
          );
        } else {
          this.faceScanStatus.set(
            'Step 1: turn your head slightly left or right.',
          );
        }
        return;
      }

      if (Math.abs(sample.headTurnRatio) <= centerThreshold) {
        const frame = this.captureFrame();
        if (frame) {
          this.capturedPhotoData.set(frame);
        }
        this.faceAutoTriggered = true;
        this.faceConfirmationReady.set(true);
        this.stopFaceAutoScan();
        this.faceScanStatus.set(
          `Selfie captured successfully. Review and confirm to ${this.pendingPunchAction() === 'out' ? 'check out' : 'check in'}.`,
        );
      } else {
        this.faceScanStatus.set(
          'Step 2: return your head to center to confirm your selfie.',
        );
      }
    } finally {
      this.faceScanBusy = false;
    }
  }

  captureFrame(): string | null {
    const videoEl = this.videoElement?.nativeElement;
    if (!videoEl || !this.canvasElement) return null;

    const video = videoEl;
    const canvas = this.canvasElement.nativeElement;

    if (video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.8);
      }
    }
    return null;
  }

  // ============ ATTENDANCE ACTIONS ============

  async handlePunch(action: 'in' | 'out') {
    const user = this.currentUser || this.authService.getStoredUser();
    if (!user) {
      this.toastService.error('Please sign in again to mark attendance.');
      return;
    }

    const locationAllowed = await this.ensurePunchWithinGeofence();
    if (!locationAllowed) {
      return;
    }

    this.processing.set(true);

    let payload: any = { source: this.checkInMode() };
    const orgId = Number(user?.orgId ?? user?.organizationId ?? 0) || 0;

    if (this.checkInMode() === 'face') {
      if (!orgId) {
        this.toastService.error('Organization context missing. Please sign in again.');
        this.processing.set(false);
        return;
      }
      try {
        const hasFace = await firstValueFrom(
          this.faceRecognitionService.hasRegisteredFace(user.id!),
        );

        if (!hasFace) {
          this.toastService.error(
            'Face not registered yet. Please register your face first.',
          );
          void this.router.navigate(['/face-registration'], {
            queryParams: { returnUrl: '/attendance' },
          });
          this.processing.set(false);
          this.stopFaceAutoScan();
          return;
        }
      } catch {
        this.toastService.error(
          'Unable to verify face registration. Please register your face first.',
        );
        void this.router.navigate(['/face-registration'], {
          queryParams: { returnUrl: '/attendance' },
        });
        this.processing.set(false);
        this.stopFaceAutoScan();
        return;
      }
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
          });
        },
      );
      payload.latitude = position.coords.latitude;
      payload.longitude = position.coords.longitude;
    } catch (e) {
      payload.latitude = 0;
      payload.longitude = 0;
    }

    if (action === 'in' && this.selectedShiftId()) {
      payload.shiftId = this.selectedShiftId();
    }

    if (this.checkInMode() === 'biometric' && !this.canUseBiometricMode()) {
      this.toastService.error(this.biometricSupportMessage());
      this.processing.set(false);
      return;
    }

    if (this.checkInMode() === 'face') {
      try {
        const video = this.videoElement?.nativeElement;

        const verification = video
          ? await firstValueFrom(
              this.faceRecognitionService.verifyAndMarkAttendanceFromVideo(
                user.id!,
                orgId,
                video,
                action === 'in' ? 'check_in' : 'check_out',
              ),
            )
          : null;

        if (verification && !verification?.matched) {
          const attempts = this.faceScanAttempts() + 1;
          this.faceScanAttempts.set(attempts);
          this.facePresenceStreak.set(0);
          this.faceScanStatus.set(
            attempts >= 3
              ? 'Face mismatch. Redirecting to registration.'
              : `Face did not match. Retrying ${attempts}/3...`,
          );
          this.toastService.error(
            'Face did not match the registered profile.',
          );
          if (attempts >= 3) {
            this.stopFaceAutoScan();
            void this.router.navigate(['/face-registration'], {
              queryParams: { returnUrl: '/attendance' },
            });
          } else {
            this.faceAutoTriggered = false;
            this.faceTurnAway = false;
            this.startFaceAutoScan();
          }
          this.processing.set(false);
          this.capturedPhotoData.set(null);
          this.faceConfirmationReady.set(false);
          return;
        }

        const frame = this.capturedPhotoData() || this.captureFrame();
        if (frame) {
          this.capturedPhotoData.set(frame);
          payload.selfieUrl = frame;
        }
        await new Promise((r) => setTimeout(r, 250));
      } catch (err: any) {
        const message =
          err?.friendlyMessage ||
          err?.error?.message ||
          'Face verification failed';
        this.toastService.error(message);
        this.processing.set(false);
        this.capturedPhotoData.set(null);
        this.faceConfirmationReady.set(false);
        this.faceAutoTriggered = false;
        this.facePresenceStreak.set(0);
        this.faceTurnAway = false;
        this.startFaceAutoScan();
        return;
      }
    } else if (this.showCameraModal() && this.isCameraReady()) {
      const frame = this.captureFrame();
      if (frame) {
        this.capturedPhotoData.set(frame);
        payload.selfieUrl = frame;
      }
      await new Promise((r) => setTimeout(r, 500));
    } else if (this.checkInMode() === 'biometric') {
      const biometricRef = await this.prepareBiometricRef();
      if (!biometricRef) {
        this.processing.set(false);
        return;
      }
      payload.biometricRef = biometricRef;
    } else {
      await new Promise((r) => setTimeout(r, 500));
    }

    const obs$ =
      action === 'in'
        ? this.attendanceService.checkIn(payload)
        : this.attendanceService.checkOut(payload);

    obs$.subscribe({
      next: () => {
        const displayName =
          `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'there';
        this.toastService.success(
          action === 'in'
            ? 'Clocked in successfully!'
            : 'Clocked out successfully!',
        );
        this.faceRecognitionService.speakAttendanceSuccess(displayName);
        this.playSuccessTone();
        this.stopFaceAutoScan();
        this.stopCamera();
        this.refreshData();
        this.processing.set(false);
        this.capturedPhotoData.set(null);
        this.faceConfirmationReady.set(false);
        this.faceScanStatus.set('Attendance captured successfully.');
        this.attendanceSuccess.set(true);
        setTimeout(() => this.closeCameraModal(), 1800);
      },
      error: (err) => {
        this.toastService.error(
          err.error?.message || 'Failed to process attendance',
        );
        this.processing.set(false);
        this.capturedPhotoData.set(null);
        this.faceConfirmationReady.set(false);
        this.faceAutoTriggered = false;
        this.facePresenceStreak.set(0);
        this.faceTurnAway = false;
        if (this.checkInMode() === 'face') {
          this.faceScanStatus.set('Retrying face capture...');
          this.startFaceAutoScan();
        }
      },
    });
  }

  canUseBiometricMode(): boolean {
    return (
      this.biometricConfiguredForUser() &&
      ['available', 'restricted'].includes(this.biometricAvailability())
    );
  }

  biometricPromptText(): string {
    return this.canUseBiometricMode()
      ? this.biometricAvailability() === 'available' || this.biometricTestMode()
        ? 'Use your laptop fingerprint or Windows Hello before attendance is marked'
        : 'Use your laptop fingerprint, Windows Hello, or approved device verification'
      : 'Biometric attendance is not ready on this device';
  }

  biometricSupportMessage(): string {
    if (!this.biometricConfiguredForUser()) {
      return 'Biometric attendance is not enabled for your account or organization yet.';
    }

    if (this.biometricTestMode()) {
      switch (this.biometricAvailability()) {
        case 'available':
          return 'Laptop biometric test mode is ready. We will use Windows Hello or the available platform authenticator for attendance testing.';
        case 'restricted':
          return 'Biometric test mode is on. Browser support is limited, so we will use device-level verification as the attendance reference.';
        case 'unsupported':
          return 'This laptop browser does not expose a supported biometric authenticator for testing.';
      }
    }

    switch (this.biometricAvailability()) {
      case 'available':
        return 'Platform biometric support detected. We will ask for your laptop fingerprint or Windows Hello before attendance is marked.';
      case 'restricted':
        return 'This browser can detect biometric capability, but direct fingerprint verification still needs configured WebAuthn or native device integration.';
      case 'unsupported':
        return 'This browser or device does not expose a supported biometric authenticator for web attendance.';
      default:
        return 'Checking biometric support for this device...';
    }
  }

  punchModalTitle(): string {
    return 'Mark Your Attendance';
  }

  punchModalDescription(): string {
    if (this.checkInMode() === 'face') {
      return 'Keep your selfie centered in the frame, turn slightly, and return to center. We will auto detect, capture, then ask you to confirm before attendance is marked.';
    }

    if (this.checkInMode() === 'biometric') {
      return 'Use fingerprint, Windows Hello, or the approved platform authenticator. Attendance will be marked only after biometric verification is completed.';
    }

    if (this.cameraAvailability() === 'ready') {
      return 'Selfie preview is ready. Confirm to capture the image and mark your attendance in one step.';
    }

    if (this.cameraAvailability() === 'checking') {
      return 'Checking camera permission for selfie capture before submitting your attendance.';
    }

    return 'If selfie permission is available we will attach a live camera capture, otherwise attendance will continue without camera.';
  }

  preparePunchModal(): void {
    this.punchModalDate.set(new Date());
    this.punchModalTime.set(
      new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    );
    void this.requestPunchLocationPreview();
  }

  punchModalBadge(): string {
    if (this.checkInMode() === 'face') return 'Selfie Auto Detect';
    if (this.checkInMode() === 'biometric') return 'Biometric Verify';
    if (this.cameraAvailability() === 'ready') return 'Selfie Ready';
    if (this.cameraAvailability() === 'checking') return 'Checking Camera';
    return 'No Camera Required';
  }

  punchModalStatusText(): string {
    if (this.faceScanStatus()) {
      return this.faceScanStatus();
    }

    if (this.locationStatus() === 'outside') {
      return 'Outside Geofence. Attendance cannot be marked from this location.';
    }

    if (
      this.punchLocationAvailability() === 'unavailable' ||
      (this.punchLocationAvailability() === 'ready' && this.locationStatus() !== 'inside')
    ) {
      return 'Verify your location and move within the assigned geofence before marking attendance.';
    }

    if (this.checkInMode() === 'face') {
      if (this.faceConfirmationReady()) {
        return 'Selfie captured. Review the preview and confirm to continue.';
      }
      return this.faceScanStatus() || 'Waiting for a clear selfie frame for smart auto capture.';
    }

    if (this.checkInMode() === 'biometric') {
      return this.biometricPromptText();
    }

    if (this.cameraAvailability() === 'ready') {
      return 'Camera is ready. Confirm to capture selfie and submit attendance.';
    }

    if (this.cameraAvailability() === 'checking') {
      return 'Checking camera access...';
    }

    return 'Camera permission is unavailable or skipped. You can continue with a normal punch.';
  }

  punchModalPrimaryLabel(): string {
    const verb = this.pendingPunchAction() === 'out' ? 'Check Out' : 'Check In';
    if (this.checkInMode() === 'face') {
      return this.faceConfirmationReady()
        ? `Confirm ${verb}`
        : 'Retry Selfie Detect';
    }
    if (this.checkInMode() === 'biometric') {
      return `Verify Biometric & ${verb}`;
    }
    return this.cameraAvailability() === 'ready'
      ? `Capture Selfie & ${verb}`
      : `Continue ${verb}`;
  }

  punchLocationSummary(): string {
    const label = this.punchLocationLabel();
    const address = this.punchLocationAddress();
    const coords = this.punchLocationCoords();
    return address ? `${label}, ${address}` : coords ? `${label}, ${coords}` : label;
  }

  isPunchBlockedByLocation(): boolean {
    if (this.punchLocationAvailability() === 'checking') {
      return true;
    }

    if (this.locationStatus() === 'outside') {
      return true;
    }

    return (
      this.punchLocationAvailability() !== 'ready' ||
      this.locationStatus() !== 'inside'
    );
  }

  primaryAttendanceAction(): 'in' | 'out' {
    return this.todayAttendance()?.is_clocked_in ? 'out' : 'in';
  }

  primaryAttendanceButtonLabel(): string {
    if (this.todayAttendance()?.is_clocked_out) {
      return 'Attendance Already Marked';
    }

    if (this.checkInMode() === 'biometric' && this.canUseBiometricMode()) {
      return this.primaryAttendanceAction() === 'out'
        ? 'Verify Biometric For Check Out'
        : 'Verify Biometric For Check In';
    }

    return this.primaryAttendanceAction() === 'out'
      ? 'Mark Attendance For Check Out'
      : 'Mark Attendance For Check In';
  }

  selectedModeLabel(): string {
    if (this.checkInMode() === 'face') {
      return 'Selfie';
    }
    return this.modes.find((mode) => mode.id === this.checkInMode())?.label || 'Selfie';
  }

  isModeSelected(modeId: 'web' | 'camera' | 'face' | 'biometric'): boolean {
    if (modeId === 'camera') {
      return this.checkInMode() === 'camera' || this.checkInMode() === 'face';
    }

    return this.checkInMode() === modeId;
  }

  modeCardDescription(modeId: 'web' | 'camera' | 'face' | 'biometric'): string {
    switch (modeId) {
      case 'camera':
        return 'Use one selfie flow for face detect, automatic capture, and attendance submit. If camera is blocked, normal attendance can still continue.';
      case 'face':
        return 'Use one selfie flow for face detect, automatic capture, and attendance submit.';
      case 'biometric':
        return this.biometricStatusLabel();
      default:
        return 'Continue with a normal browser attendance flow.';
    }
  }

  async requestPunchLocationPreview(): Promise<void> {
    this.punchLocationAvailability.set('checking');
    this.punchLocationLabel.set('Checking your current location...');
    this.punchLocationCoords.set('');
    this.punchLocationAddress.set('');
    this.locationStatus.set('unknown');
    this.currentDistance.set(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true,
        });
      });

      const lat = Number(position.coords.latitude.toFixed(5));
      const lng = Number(position.coords.longitude.toFixed(5));
      this.punchLocationAvailability.set('ready');
      this.punchLocationCoords.set(
        `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      );
      this.punchLocationAddress.set(await this.resolvePunchLocationAddress(lat, lng));

      const validation =
        (await this.resolveAssignedGeofenceValidation(lat, lng)) ??
        (await this.resolveRemoteGeofenceValidation(lat, lng));

      if (validation) {
        this.locationStatus.set(validation.valid ? 'inside' : 'outside');
        this.currentDistance.set(validation.distance);
        this.punchLocationLabel.set(validation.label);
        return;
      }

      this.locationStatus.set('unknown');
      this.currentDistance.set(null);
      this.punchLocationLabel.set('Geofence could not be verified for this location');
    } catch {
      this.punchLocationAvailability.set('unavailable');
      this.punchLocationLabel.set('Location permission unavailable');
      this.punchLocationAddress.set('');
      this.punchLocationCoords.set('You can still continue if location access is blocked.');
      this.locationStatus.set('unknown');
      this.currentDistance.set(null);
    }
  }

  private async ensurePunchWithinGeofence(): Promise<boolean> {
    if (
      this.punchLocationAvailability() !== 'ready' ||
      this.locationStatus() === 'unknown'
    ) {
      await this.requestPunchLocationPreview();
    }

    if (this.locationStatus() === 'inside') {
      return true;
    }

    if (this.locationStatus() === 'outside') {
      this.toastService.error('Outside Geofence. Attendance cannot be marked.');
      return false;
    }

    this.toastService.error(
      'Location could not be verified. Please allow location and move within your geofence.',
    );
    return false;
  }

  private async resolveRemoteGeofenceValidation(
    lat: number,
    lng: number,
  ): Promise<{ valid: boolean; label: string; distance: number | null } | null> {
    try {
      const validation = await firstValueFrom(this.attendanceService.validateLocation(lat, lng));
      if (!validation) {
        return null;
      }

      return {
        valid: Boolean(validation.valid),
        label: validation.valid ? 'Within Geofence' : 'Outside Geofence',
        distance:
          typeof validation.distance === 'number'
            ? Number(validation.distance.toFixed(2))
            : null,
      };
    } catch {
      return null;
    }
  }

  private async resolvePunchLocationAddress(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        return '';
      }

      const payload = await response.json();
      if (typeof payload?.display_name === 'string' && payload.display_name.trim()) {
        return payload.display_name.trim();
      }

      const address = payload?.address ?? {};
      return [
        address?.road,
        address?.suburb,
        address?.city ?? address?.town ?? address?.village,
        address?.state,
      ]
        .filter((part: unknown) => typeof part === 'string' && part.trim())
        .join(', ');
    } catch {
      return '';
    }
  }

  private async resolveAssignedGeofenceValidation(
    lat: number,
    lng: number,
  ): Promise<{ valid: boolean; label: string; distance: number | null } | null> {
    const user = this.currentUser ?? this.authService.getStoredUser();
    if (!user) {
      return null;
    }

    const assignedCircles = this.extractAssignedCircularGeofences(user);
    const assignedPolygons = this.extractAssignedPolygonGeofences(user);

    if (assignedCircles.length || assignedPolygons.length) {
      const circleValidation = this.validateCircularGeofences(lat, lng, assignedCircles);
      if (circleValidation?.valid) {
        return circleValidation;
      }

      const polygonValidation = this.validatePolygonGeofences(lat, lng, assignedPolygons);
      if (polygonValidation?.valid) {
        return polygonValidation;
      }

      return polygonValidation ?? circleValidation ?? null;
    }

    if (user.geofenceId) {
      try {
        const zones = await firstValueFrom(this.attendanceService.getGeoFenceZones());
        const matchedZone = zones.find((zone) => zone.id === user.geofenceId);
        if (matchedZone) {
          return this.validateCircularGeofences(lat, lng, [matchedZone]);
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  private extractAssignedCircularGeofences(user: User): Array<GeoFenceZone | {
    name?: string;
    center_lat: number;
    center_lng: number;
    radius_meters: number;
  }> {
    const rawUser = user as User & {
      area_ids?: unknown;
      userInfo?: { areaIds?: unknown; area_ids?: unknown };
    };
    const directAssignments = this.asArray(
      user.areaIds ??
        rawUser.area_ids ??
        rawUser.userInfo?.areaIds ??
        rawUser.userInfo?.area_ids,
    );

    return directAssignments
      .map((assignment) => ({
        name:
          this.readString(assignment, ['name', 'area_name', 'label']) ??
          user.geofenceZoneName ??
          'authorized geofence',
        center_lat: this.readNumber(assignment, ['lat', 'latitude', 'center_lat']),
        center_lng: this.readNumber(assignment, ['long', 'lng', 'longitude', 'center_lng']),
        radius_meters:
          this.readRadiusMeters(assignment),
      }))
      .filter(
        (assignment) =>
          Number.isFinite(assignment.center_lat) &&
          Number.isFinite(assignment.center_lng) &&
          Number.isFinite(assignment.radius_meters) &&
          assignment.radius_meters > 0,
      );
  }

  private extractAssignedPolygonGeofences(user: User): Array<{
    name: string;
    points: Array<{ lat: number; lng: number }>;
  }> {
    const rawUser = user as User & {
      poly_field?: unknown;
      userInfo?: { polyField?: unknown; poly_field?: unknown };
    };
    const rawPolygons =
      user.polyField ??
      rawUser.poly_field ??
      rawUser.userInfo?.polyField ??
      rawUser.userInfo?.poly_field;
    if (!Array.isArray(rawPolygons) || rawPolygons.length === 0) {
      return [];
    }

    const polygonGroups = Array.isArray(rawPolygons[0])
      ? (rawPolygons as Array<Array<{ lat: number | string; long: number | string }>>)
      : [rawPolygons as Array<{ lat: number | string; long: number | string }>];

    return polygonGroups
      .map((group) => ({
        name: user.geofenceZoneName ?? 'authorized geofence',
        points: group
          .map((point) => ({
            lat: this.readNumber(point, ['lat', 'latitude', 'x']),
            lng: this.readNumber(point, ['long', 'lng', 'longitude', 'y']),
          }))
          .filter(
            (point) =>
              Number.isFinite(point.lat) &&
              Number.isFinite(point.lng),
          ),
      }))
      .filter((polygon) => polygon.points.length >= 3);
  }

  private validateCircularGeofences(
    lat: number,
    lng: number,
    geofences: Array<GeoFenceZone | {
      name?: string;
      center_lat: number;
      center_lng: number;
      radius_meters: number;
    }>,
  ): { valid: boolean; label: string; distance: number | null } | null {
    if (!geofences.length) {
      return null;
    }

    let nearest: {
      zoneName: string;
      distanceKm: number;
      inside: boolean;
    } | null = null;

    for (const geofence of geofences) {
      const distanceKm = this.calculateGeoDistanceKm(
        Number(geofence.center_lat),
        Number(geofence.center_lng),
        lat,
        lng,
      );
      const allowedRadiusKm = Number(geofence.radius_meters) / 1000;
      const zoneName = geofence.name?.trim() || 'authorized geofence';
      const inside = distanceKm <= allowedRadiusKm;

      if (!nearest || distanceKm < nearest.distanceKm) {
        nearest = {
          zoneName,
          distanceKm,
          inside,
        };
      }

      if (inside) {
        return {
          valid: true,
          label: 'Within Geofence',
          distance: Number(distanceKm.toFixed(2)),
        };
      }
    }

    if (!nearest) {
      return null;
    }

    return {
      valid: false,
      label: 'Outside Geofence',
      distance: Number(nearest.distanceKm.toFixed(2)),
    };
  }

  private validatePolygonGeofences(
    lat: number,
    lng: number,
    polygons: Array<{ name: string; points: Array<{ lat: number; lng: number }> }>,
  ): { valid: boolean; label: string; distance: number | null } | null {
    if (!polygons.length) {
      return null;
    }

    const insidePolygon = polygons.find((polygon) =>
      this.isPointInsidePolygon(lat, lng, polygon.points),
    );

    if (insidePolygon) {
      return {
        valid: true,
        label: 'Within Geofence',
        distance: null,
      };
    }

    return {
      valid: false,
      label: 'Outside Geofence',
      distance: null,
    };
  }

  private isPointInsidePolygon(
    lat: number,
    lng: number,
    polygon: Array<{ lat: number; lng: number }>,
  ): boolean {
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat;
      const yi = polygon[i].lng;
      const xj = polygon[j].lat;
      const yj = polygon[j].lng;

      const intersects =
        yi > lng !== yj > lng &&
        lat < ((xj - xi) * (lng - yi)) / ((yj - yi) || Number.EPSILON) + xi;

      if (intersects) {
        inside = !inside;
      }
    }

    return inside;
  }

  private calculateGeoDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const p = 0.017453292519943295;
    const a =
      0.5 -
      Math.cos((lat2 - lat1) * p) / 2 +
      (Math.cos(lat1 * p) *
        Math.cos(lat2 * p) *
        (1 - Math.cos((lon2 - lon1) * p))) /
        2;

    return 12742 * Math.asin(Math.sqrt(a));
  }

  private asArray<T>(value: T[] | unknown): T[] {
    return Array.isArray(value) ? value : [];
  }

  private readNumber(source: unknown, keys: string[]): number {
    if (!source || typeof source !== 'object') {
      return 0;
    }

    for (const key of keys) {
      const value = (source as Record<string, unknown>)[key];
      const parsed = Number(value ?? 0);
      if (Number.isFinite(parsed) && parsed !== 0) {
        return parsed;
      }
    }

    const fallback = Number((source as Record<string, unknown>)[keys[0]] ?? 0);
    return Number.isFinite(fallback) ? fallback : 0;
  }

  private readString(source: unknown, keys: string[]): string | null {
    if (!source || typeof source !== 'object') {
      return null;
    }

    for (const key of keys) {
      const value = (source as Record<string, unknown>)[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  private readRadiusMeters(source: unknown): number {
    if (!source || typeof source !== 'object') {
      return 0;
    }

    const explicitMeters = this.readNumber(source, ['radius_meters', 'radiusMeters']);
    if (explicitMeters > 0) {
      return explicitMeters;
    }

    const radiusValue = this.readNumber(source, ['radius']);
    return radiusValue > 0 ? radiusValue * 1000 : 0;
  }

  retryPunchCamera(): void {
    if (this.processing() || this.checkInMode() === 'face') {
      return;
    }
    this.cameraAvailability.set('idle');
    void this.startCameraAfterModalRender('camera', true);
  }

  private resolveWorkspaceMode(): 'self' | 'admin' {
    const routeMode = this.route.snapshot.data['attendanceMode'];
    if (routeMode === 'admin' || routeMode === 'self') {
      return routeMode;
    }

    const currentPath = this.router.url.split('?')[0];
    return currentPath.startsWith('/admin/attendance') ? 'admin' : 'self';
  }

  private async detectBiometricSupport(): Promise<void> {
    const user = this.currentUser ?? this.authService.getStoredUser();
    const configuredByAccount = Boolean(
      user?.biometricMachinePermission || user?.addonDeviceVerification,
    );

    const credentialApi =
      typeof window !== 'undefined'
        ? (window as Window & {
            PublicKeyCredential?: {
              isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean>;
            };
          }).PublicKeyCredential
        : undefined;

    if (!credentialApi?.isUserVerifyingPlatformAuthenticatorAvailable) {
      this.biometricConfiguredForUser.set(configuredByAccount);
      this.biometricTestMode.set(false);
      this.biometricAvailability.set(configuredByAccount ? 'restricted' : 'unsupported');
      return;
    }

    try {
      const isAvailable =
        await credentialApi.isUserVerifyingPlatformAuthenticatorAvailable();
      const allowTestMode = !configuredByAccount && isAvailable;
      this.biometricTestMode.set(allowTestMode);
      this.biometricConfiguredForUser.set(configuredByAccount || allowTestMode);
      this.biometricAvailability.set(isAvailable ? 'available' : 'unsupported');
    } catch {
      this.biometricTestMode.set(false);
      this.biometricConfiguredForUser.set(configuredByAccount);
      this.biometricAvailability.set(configuredByAccount ? 'restricted' : 'unsupported');
    }

  }

  private async prepareBiometricRef(): Promise<string | null> {
    if (!this.biometricConfiguredForUser()) {
      this.toastService.error(
        'Biometric attendance is not enabled for your account yet.',
      );
      return null;
    }

    if (this.biometricAvailability() === 'unsupported') {
      this.toastService.error(
        'This browser cannot access a supported laptop biometric authenticator.',
      );
      return null;
    }

    if (this.biometricAvailability() === 'restricted') {
      this.toastService.info(
        this.biometricTestMode()
          ? 'Direct fingerprint validation is limited in browsers. Using laptop biometric test verification as the attendance reference.'
          : 'Direct fingerprint validation is limited in browsers. Using verified device availability as the biometric attendance reference.',
      );
    }

    if (
      this.biometricAvailability() === 'available' ||
      this.biometricTestMode()
    ) {
      const verified = await this.runLocalBiometricPrompt();
      if (!verified) {
        this.toastService.error(
          'Fingerprint or Windows Hello verification was not completed. Attendance was not marked.',
        );
        return null;
      }
    } else {
      await new Promise((r) => setTimeout(r, 700));
    }

    const userId = this.currentUser?.id ?? this.authService.getStoredUser()?.id ?? 'user';
    return `BIO-${userId}-${Date.now()}`;
  }

  private biometricCredentialStorageKey(): string {
    const user = this.currentUser ?? this.authService.getStoredUser();
    const orgId = user?.orgId ?? user?.organizationId ?? 'global';
    const employeeId = user?.employeeId ?? user?.id ?? 'user';
    return `hrms_biometric_test_credential_${orgId}_${employeeId}`;
  }

  private createRandomBuffer(length: number): Uint8Array {
    const buffer = new Uint8Array(length);
    crypto.getRandomValues(buffer);
    return buffer;
  }

  private bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  private base64UrlToUint8Array(value: string): Uint8Array {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const binary = atob(padded);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  }

  private async ensureLocalBiometricCredential(): Promise<string | null> {
    const storageKey = this.biometricCredentialStorageKey();
    const existingId = localStorage.getItem(storageKey);
    if (existingId) {
      return existingId;
    }

    const user = this.currentUser ?? this.authService.getStoredUser();
    const userId = Number(user?.employeeId ?? user?.id ?? 0) || Date.now();
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: this.createRandomBuffer(32),
        rp: {
          name: 'HRMS Biometric Test',
          id: window.location.hostname,
        },
        user: {
          id: this.createRandomBuffer(16),
          name: `employee-${userId}@hrms.local`,
          displayName: `${user?.firstName || 'Employee'} ${user?.lastName || ''}`.trim() || 'Employee',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null;

    const rawId = credential?.rawId;
    if (!rawId) {
      return null;
    }

    const credentialId = this.bufferToBase64Url(rawId);
    localStorage.setItem(storageKey, credentialId);
    return credentialId;
  }

  private async runLocalBiometricPrompt(): Promise<boolean> {
    if (
      typeof window === 'undefined' ||
      !window.isSecureContext ||
      typeof navigator === 'undefined' ||
      !navigator.credentials
    ) {
      this.toastService.error(
        'Biometric testing requires a secure browser context with credential support.',
      );
      return false;
    }

    try {
      const credentialId = await this.ensureLocalBiometricCredential();
      if (!credentialId) {
        return false;
      }

      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge: this.createRandomBuffer(32),
          allowCredentials: [
            {
              id: this.base64UrlToUint8Array(credentialId),
              type: 'public-key',
              transports: ['internal'],
            },
          ],
          userVerification: 'required',
          timeout: 60000,
          rpId: window.location.hostname,
        },
      })) as PublicKeyCredential | null;

      return Boolean(assertion);
    } catch (error) {
      console.error('Biometric prompt failed', error);
      return false;
    }
  }

  async handleBreak() {
    this.processing.set(true);

    try {
      if (this.isOnBreak()) {
        await this.attendanceService.endBreak().toPromise();
        this.toastService.success('Break ended');
      } else {
        await this.attendanceService.startBreak().toPromise();
        this.toastService.success('Break started');
      }
      this.refreshData();
    } catch (err) {
      this.toastService.error('Failed to process break');
    } finally {
      this.processing.set(false);
    }
  }

  onShiftChange(event: any) {
    const val = event.target.value;
    this.selectedShiftId.set(val ? parseInt(val) : null);
  }

  onShiftChangeValue(val: number | null) {
    this.selectedShiftId.set(val);
  }

  // ============ MANUAL REQUEST ============

  openManualRequest() {
    this.manualRequest = {
      date: new Date().toISOString().split('T')[0],
      check_in: '',
      check_out: '',
      reason: '',
    };
    this.showManualModal.set(true);
  }

  closeManualModal() {
    this.showManualModal.set(false);
  }

  submitManualRequest() {
    if (
      !this.manualRequest.date ||
      !this.manualRequest.check_in ||
      !this.manualRequest.reason
    ) {
      this.toastService.error('Please fill all required fields');
      return;
    }

    this.submitting.set(true);
    this.attendanceService
      .requestManualAttendance(this.manualRequest)
      .subscribe({
        next: () => {
          this.toastService.success('Request submitted for approval');
          this.submitting.set(false);
          this.closeManualModal();
        },
        error: () => {
          this.toastService.error('Failed to submit request');
          this.submitting.set(false);
        },
      });
  }

  exportAttendanceHistory() {
    const rows = this.filteredHistory();
    if (!rows.length) {
      this.toastService.error('No attendance records available to export');
      return;
    }

    const csv = [
      ['Date', 'Check In', 'Check Out', 'Status', 'Work Hours'].join(','),
      ...rows.map((record) =>
        [
          record.date ?? '',
          record.check_in ?? '',
          record.check_out ?? '',
          record.status ?? '',
          record.work_hours ?? '',
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${this.historyStatusFilter()}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    this.toastService.success('Attendance export downloaded');
  }

  // ============ CALENDAR ============

  generateCalendar() {
    const year = this.currentYear();
    const month = this.currentMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const days: any[] = [];

    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        dayNumber: prevMonthDays - i,
        isCurrentMonth: false,
        date: null,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = this.toLocalIsoDate(date);
      const attendance = this.history().find((h) => h.date === dateStr);

      days.push({
        dayNumber: i,
        isCurrentMonth: true,
        date: dateStr,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: this.selectedDate() === dateStr,
        attendance: attendance,
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        dayNumber: i,
        isCurrentMonth: false,
        date: null,
      });
    }

    this.calendarDays.set(days);
  }

  previousMonth() {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.set(this.currentYear() - 1);
    } else {
      this.currentMonth.set(this.currentMonth() - 1);
    }
    this.loadMonthData();
    this.generateCalendar();
  }

  nextMonth() {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.set(this.currentYear() + 1);
    } else {
      this.currentMonth.set(this.currentMonth() + 1);
    }
    this.loadMonthData();
    this.generateCalendar();
  }

  goToToday() {
    const today = new Date();
    this.currentMonth.set(today.getMonth());
    this.currentYear.set(today.getFullYear());
    this.loadMonthData();
    this.generateCalendar();
  }

  loadMonthData() {
    this.attendanceService
      .getMonthlyAttendance(this.currentYear(), this.currentMonth() + 1)
      .subscribe({
        next: (data) => {
          this.history.set(data);
          if (!this.selectedDate()) {
            const today = new Date();
            if (
              this.currentMonth() === today.getMonth() &&
              this.currentYear() === today.getFullYear()
            ) {
              this.selectedDate.set(this.toLocalIsoDate(today));
            }
          }
          this.generateCalendar();
        },
      });
  }

  selectDate(date: string) {
    this.selectedDate.set(date);
    this.generateCalendar();
  }

  getMonthYearString(): string {
    const date = new Date(this.currentYear(), this.currentMonth());
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // ============ HELPERS ============

  getStatusText(): string {
    const status = this.todayAttendance();
    if (!status) return 'Not Clocked In';
    if (status.is_clocked_out) return 'Completed';
    if (status.current_status === 'on_break') return 'On Break';
    if (status.is_clocked_in) return 'Working';
    return 'Not Clocked In';
  }

  todayStatusHeadline(): string {
    const status = this.todayAttendance();
    if (!status) return 'Pending';
    if (status.is_clocked_out) return 'Completed';
    if (status.current_status === 'on_break') return 'On Break';
    if (status.is_clocked_in) return 'Checked In';
    return 'Pending';
  }

  todayStatusSupportingText(): string {
    const status = this.todayAttendance();
    if (!status) return 'Ready for your next punch';
    if (status.is_clocked_out) return 'Today attendance is already closed';
    if (status.current_status === 'on_break') return 'Break is currently active';
    if (status.is_clocked_in) return 'Live attendance session active';
    return 'Ready for your next punch';
  }

  todayFocusHeadline(): string {
    const status = this.todayAttendance();
    if (!status) return 'Ready for your next check-in';
    if (status.is_clocked_out) return 'Your attendance is complete for today';
    if (status.current_status === 'on_break') return 'You are currently on break';
    if (status.is_clocked_in) return 'You are active for today';
    return 'Ready for your next check-in';
  }

  todayFocusDescription(): string {
    const status = this.todayAttendance();
    if (!status) {
      return 'Start from Mark Attendance, then use calendar and records to track the rest of your day.';
    }
    if (status.is_clocked_out) {
      return 'Review your records, statistics, or raise a correction request if anything needs adjustment.';
    }
    if (status.current_status === 'on_break') {
      return 'End your break when you return, then continue from the same self-service attendance workspace.';
    }
    if (status.is_clocked_in) {
      return 'Switch between punch, calendar, and statistics without losing your attendance state.';
    }
    return 'Start from Mark Attendance, then use calendar and records to track the rest of your day.';
  }

  formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  attendanceProgress(): number {
    const hours = this.todayAttendance()?.total_work_hours ?? 0;
    const targetHours = 8;
    return Math.max(0, Math.min(100, Math.round((hours / targetHours) * 100)));
  }

  attendanceHealthLabel(): string {
    const score = this.attendanceProgress();
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'On Track';
    if (score >= 40) return 'Needs Attention';
    return 'Starting Out';
  }

  attendanceHealthTone(): string {
    const score = this.attendanceProgress();
    if (score >= 90) return 'bg-emerald-50 text-emerald-700';
    if (score >= 70) return 'bg-teal-50 text-teal-700';
    if (score >= 40) return 'bg-amber-50 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  }

  selectedAttendanceRecord(): AttendanceRecord | null {
    const selected = this.selectedDate();
    if (!selected) return null;
    return this.history().find((record) => record.date === selected) ?? null;
  }

  selectedAttendanceDateLabel(): string {
    const selected = this.selectedDate();
    if (!selected) return 'Pick a date';
    return this.formatIsoDateLabel(selected);
  }

  selectedAttendanceStatusLabel(): string {
    const record = this.selectedAttendanceRecord();
    if (!record) return 'No record';
    return this.getRecordStatusLabel(record.status);
  }

  selectedAttendanceStatusClass(): string {
    const record = this.selectedAttendanceRecord();
    return record
      ? this.getStatusClass(record.status)
      : 'bg-slate-100 text-slate-700 border-slate-200';
  }

  selectedAttendanceCheckInImage(): string | null {
    const record = this.selectedAttendanceRecord();
    return record?.check_in_photo || record?.selfie_url || null;
  }

  selectedAttendanceCheckOutImage(): string | null {
    const record = this.selectedAttendanceRecord();
    return record?.check_out_photo || null;
  }

  selectedAttendanceAvatarFallback(): string | null {
    const record = this.selectedAttendanceRecord();
    return record?.employee?.avatar || this.currentUser?.avatar || null;
  }

  formatShortTime(value?: string | null): string {
    if (!value) return '--:--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private toLocalIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatIsoDateLabel(value: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return value;
      return parsed.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString(
      'en-US',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      },
    );
  }

  nextAttendanceActionLabel(): string {
    if (this.todayAttendance()?.is_clocked_out) {
      return 'Today attendance is complete';
    }

    if (this.todayAttendance()?.is_clocked_in) {
      return this.isOnBreak() ? 'Break is active right now' : 'Ready for check out';
    }

    return 'Ready for check in';
  }

  nextAttendanceActionDescription(): string {
    if (this.todayAttendance()?.is_clocked_out) {
      return 'Your check-in and check-out have been saved for today. You can review the record below or raise a correction request if any update is needed.';
    }

    if (this.todayAttendance()?.is_clocked_in) {
      return this.isOnBreak()
        ? 'Your break is currently active. End the break when you return, then continue your day normally.'
        : 'Your check-in is saved. Come back here later and use the same workspace for check out.';
    }

    return 'Select your preferred mode and complete the first punch of the day from the quick actions panel.';
  }

  biometricStatusLabel(): string {
    return this.canUseBiometricMode()
      ? 'Biometric attendance is ready. Use fingerprint, Windows Hello, or approved device verification.'
      : 'Biometric mode works only when your device and account support it.';
  }

  recentHistoryPreview(): AttendanceRecord[] {
    return [...this.filteredHistory()]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
      .slice(0, 5);
  }

  getRecordStatusLabel(status: AttendanceRecord['status']): string {
    const labels: Record<AttendanceRecord['status'], string> = {
      present: 'Present',
      absent: 'Absent',
      late: 'Late',
      half_day: 'Half Day',
      on_leave: 'Leave',
      holiday: 'Holiday',
      weekend: 'Weekly Off',
    };
    return labels[status] || status;
  }

  recordProgress(record: AttendanceRecord): number {
    const targetHours = 8;
    const hours = record.work_hours || 0;
    return Math.max(0, Math.min(100, Math.round((hours / targetHours) * 100)));
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      present: 'bg-green-50 text-success border-green-200',
      absent: 'bg-red-50 text-error border-red-200',
      late: 'bg-amber-50 text-warning border-amber-200',
      half_day: 'bg-orange-50 text-orange-600 border-orange-200',
      on_leave: 'bg-blue-50 text-blue-600 border-blue-200',
      holiday: 'bg-purple-50 text-purple-600 border-purple-200',
      weekend: 'bg-slate-50 text-slate-500 border-slate-200',
      weekly_off: 'bg-slate-50 text-slate-500 border-slate-200',
    };
    return classes[status] || 'bg-slate-50 text-slate-600';
  }

  getCalendarStatusColor(status: string): string {
    const colors: Record<string, string> = {
      present: 'bg-green-500',
      absent: 'bg-red-500',
      late: 'bg-amber-500',
      half_day: 'bg-orange-500',
      on_leave: 'bg-blue-500',
      holiday: 'bg-purple-500',
      weekend: 'bg-slate-400',
      weekly_off: 'bg-slate-400',
    };
    return colors[status] || 'bg-slate-300';
  }
}
