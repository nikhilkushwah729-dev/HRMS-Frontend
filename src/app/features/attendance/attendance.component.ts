import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  inject,
  ViewChild,
  ElementRef,
  computed,
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
import { CustomModalComponent } from '../../core/components/modal/custom-modal.component';
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
    CustomModalComponent,
    UiSelectAdvancedComponent,
    AttendanceDataTableComponent,
    AttendancePunchComponent,
  ],
  template: `
    <div class="attendance-clean-panel mx-auto flex max-w-7xl flex-col gap-4 pb-8 sm:gap-5 lg:gap-6 lg:pb-10">
      <!-- Header -->
      <header
        class="sticky top-3 z-30 rounded-lg border border-slate-100 bg-white/95 p-4 shadow-lg shadow-slate-200/60 backdrop-blur sm:p-5"
      >
        <div class="grid grid-cols-12 items-center gap-4">
          <div class="col-span-12 xl:col-span-5">
            <p class="text-[10px] font-bold uppercase tracking-wide text-teal-600">
              {{ isSelfServiceWorkspace() ? 'My Attendance' : 'Attendance Management' }}
            </p>
            <h1 class="mt-1 text-2xl font-semibold text-slate-900 max-sm:text-lg">
              {{
                isSelfServiceWorkspace()
                  ? 'Check-in, history, working hours, and today status'
                  : 'Register, tracking, shift, and compliance workspaces'
              }}
            </h1>
            <p class="mt-1 max-w-3xl text-sm font-medium text-slate-500">
              {{
                isSelfServiceWorkspace()
                  ? 'This attendance workspace is focused on your own punches, shift timing, history, overtime, and regularization requests.'
                  : 'This admin workspace is focused on attendance operations, employee tracking, shift planning, and compliance controls.'
              }}
            </p>
          </div>
          <div class="col-span-12 grid grid-cols-1 gap-2 sm:grid-cols-3 xl:col-span-4">
            <div class="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <p class="text-[10px] font-bold uppercase tracking-wide text-slate-400">Today's status</p>
              <p class="mt-1 text-sm font-black text-slate-900">
                {{ todayAttendance()?.is_clocked_in ? 'Checked in' : 'Pending' }}
              </p>
            </div>
            <div class="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
              <p class="text-[10px] font-bold uppercase tracking-wide text-emerald-500">Mode</p>
              <p class="mt-1 text-sm font-black text-emerald-700">{{ currentViewLabel() }}</p>
            </div>
            <div class="rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2">
              <p class="text-[10px] font-bold uppercase tracking-wide text-cyan-500">Hours</p>
              <p class="mt-1 text-sm font-black text-cyan-700">{{ formatHours(todayAttendance()?.total_work_hours || 0) }}</p>
            </div>
          </div>
          <div class="col-span-12 flex flex-col gap-3 xl:col-span-3 xl:items-end">
            <div *ngIf="isAdminAttendanceWorkspace()" class="flex flex-wrap justify-end gap-2">
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
            class="app-chip-switch max-w-full overflow-x-auto no-scrollbar whitespace-nowrap"
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

      <section
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
          <div class="mt-2 flex items-center justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-slate-700">
                {{
                  isSelfServiceWorkspace()
                    ? (todayAttendance()?.is_clocked_in ? 'You are active for today' : 'Ready for your next check-in')
                    : (todayAttendance()?.is_clocked_in ? 'Attendance operations are live right now' : 'Management workspace is ready for review')
                }}
              </p>
              <p class="text-xs text-slate-500 mt-1">
                {{
                  isSelfServiceWorkspace()
                    ? 'Switch between punch, calendar, and statistics without losing your attendance state.'
                    : 'Switch between management views without mixing employee self-service workflows.'
                }}
              </p>
            </div>
            <span
              class="rounded-full px-3 py-1 text-xs font-bold"
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
              routerLink="/admin/attendance/register"
              class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-teal-200 hover:bg-white"
            >
              Team Register
            </a>
            <a
              routerLink="/admin/attendance/regularizations"
              class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:bg-white"
            >
              Regularizations
            </a>
            <a
              routerLink="/admin/attendance/reports"
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

      <!-- Attendance Suite Shortcuts -->
      <section *ngIf="isSelfServiceWorkspace()" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          (click)="setView('punch')"
          class="group text-left rounded-md border p-4 shadow-sm transition-all hover:shadow-md sm:p-5"
          [ngClass]="currentView() === 'punch' ? 'border-teal-300 bg-teal-50/70' : 'border-slate-200 bg-white hover:border-teal-200'"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Main action
              </p>
              <h3 class="mt-2 text-lg font-bold text-slate-900">Mark Attendance</h3>
              <p class="mt-2 text-sm text-slate-500">
                Open your check-in or check-out flow with web, selfie, face, or biometric mode.
              </p>
            </div>
            <span class="rounded-full px-3 py-1 text-xs font-bold" [ngClass]="currentView() === 'punch' ? 'bg-teal-700 text-white' : 'bg-teal-50 text-teal-700'">
              {{ todayAttendance()?.is_clocked_in ? 'Checked In' : 'Ready' }}
            </span>
          </div>
        </button>

        <button
          type="button"
          (click)="setView('calendar')"
          class="group text-left rounded-md border p-4 shadow-sm transition-all hover:shadow-md sm:p-5"
          [ngClass]="currentView() === 'calendar' ? 'border-sky-300 bg-sky-50/70' : 'border-slate-200 bg-white hover:border-sky-200'"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Calendar
              </p>
              <h3 class="mt-2 text-lg font-bold text-slate-900">Monthly View</h3>
              <p class="mt-2 text-sm text-slate-500">
                Review day-by-day status, late marks, leave, and attendance activity.
              </p>
            </div>
            <span class="rounded-full px-3 py-1 text-xs font-bold" [ngClass]="currentView() === 'calendar' ? 'bg-sky-700 text-white' : 'bg-sky-50 text-sky-700'">
              View
            </span>
          </div>
        </button>

        <button
          type="button"
          (click)="setView('stats')"
          class="group text-left rounded-md border p-4 shadow-sm transition-all hover:shadow-md sm:p-5"
          [ngClass]="currentView() === 'stats' ? 'border-indigo-300 bg-indigo-50/70' : 'border-slate-200 bg-white hover:border-indigo-200'"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Insights
              </p>
              <h3 class="mt-2 text-lg font-bold text-slate-900">Statistics</h3>
              <p class="mt-2 text-sm text-slate-500">
                Track punctuality, work hours, overtime, and present or absent trends.
              </p>
            </div>
            <span class="rounded-full px-3 py-1 text-xs font-bold" [ngClass]="currentView() === 'stats' ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-700'">
              Trends
            </span>
          </div>
        </button>

        <button
          type="button"
          (click)="setView('records')"
          class="group text-left rounded-md border p-4 shadow-sm transition-all hover:shadow-md sm:p-5"
          [ngClass]="currentView() === 'records' ? 'border-slate-400 bg-slate-100/80' : 'border-slate-200 bg-white hover:border-slate-300'"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Archive
              </p>
              <h3 class="mt-2 text-lg font-bold text-slate-900">Records</h3>
              <p class="mt-2 text-sm text-slate-500">
                Search your attendance history and review check-in, check-out, and selfie data.
              </p>
            </div>
            <span class="rounded-full px-3 py-1 text-xs font-bold" [ngClass]="currentView() === 'records' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'">
              {{ history().length }}
            </span>
          </div>
        </button>
      </section>

      <section *ngIf="isSelfServiceWorkspace()" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <a
          routerLink="/timesheets"
          class="group rounded-md border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Logs
              </p>
              <h3 class="mt-2 text-lg font-bold text-slate-900">Timesheets</h3>
              <p class="mt-2 text-sm text-slate-500">
                Track work hours, break time, and daily logs in one timeline.
              </p>
            </div>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              Hours
            </span>
          </div>
        </a>
      </section>

      <!-- Attendance Pulse -->
      <section *ngIf="isSelfServiceWorkspace()" class="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] gap-4">
        <div class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Attendance Pulse
              </p>
              <h3 class="mt-2 text-xl font-bold text-slate-900">
                Quick view of today and the selected period
              </h3>
              <p class="mt-2 text-sm text-slate-500 max-w-2xl">
                A compact operational summary based on your current attendance state, recent history, and approval queue.
              </p>
            </div>
            <span
              class="rounded-full px-3 py-1 text-xs font-bold self-start sm:self-auto"
              [ngClass]="attendanceHealthTone()"
            >
              {{ attendanceHealthLabel() }}
            </span>
          </div>

          <div class="mt-5 grid grid-cols-2 xl:grid-cols-4 gap-3">
            <div class="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Work hours</p>
              <p class="mt-2 text-2xl font-black text-slate-900">{{ formatHours(stats()?.total_work_hours || todayAttendance()?.total_work_hours || 0) }}</p>
              <p class="mt-1 text-xs text-slate-500">Logged for the current period</p>
            </div>
            <div class="rounded-2xl border border-slate-100 bg-emerald-50/70 p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700/70">Punctuality</p>
              <p class="mt-2 text-2xl font-black text-emerald-700">{{ stats()?.punctuality_percentage || 0 }}%</p>
              <p class="mt-1 text-xs text-emerald-700/80">Selected period performance</p>
            </div>
            <div class="rounded-2xl border border-slate-100 bg-amber-50/70 p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700/70">Break time</p>
              <p class="mt-2 text-2xl font-black text-amber-700">{{ todayAttendance()?.break_time_minutes || 0 }}m</p>
              <p class="mt-1 text-xs text-amber-700/80">Consumed today</p>
            </div>
            <div class="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Pending</p>
              <p class="mt-2 text-2xl font-black text-slate-900">{{ pendingManualRequestCount() }}</p>
              <p class="mt-1 text-xs text-slate-500">Manual requests waiting for review</p>
            </div>
          </div>

          <div class="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Today progress</p>
                <p class="mt-1 text-sm font-semibold text-slate-700">
                  {{ todayAttendance()?.is_clocked_in ? 'You are active for today' : 'Ready to start your day' }}
                </p>
              </div>
              <span class="text-sm font-bold text-slate-700">{{ attendanceProgress() }}%</span>
            </div>
            <div class="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500"
                [style.width.%]="attendanceProgress()"
              ></div>
            </div>
            <div class="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
              <span class="rounded-full bg-white px-3 py-1 border border-slate-200">Clock in {{ todayAttendance()?.check_in ? (todayAttendance()?.check_in | date:'shortTime') : '--:--' }}</span>
              <span class="rounded-full bg-white px-3 py-1 border border-slate-200">Clock out {{ todayAttendance()?.check_out ? (todayAttendance()?.check_out | date:'shortTime') : '--:--' }}</span>
              <span class="rounded-full bg-white px-3 py-1 border border-slate-200">Break {{ todayAttendance()?.break_time_minutes || 0 }}m</span>
            </div>
          </div>
        </div>

        <div class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Recent trail</p>
              <h3 class="mt-2 text-xl font-bold text-slate-900">Latest attendance entries</h3>
            </div>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {{ recentHistoryPreview().length }} records
            </span>
          </div>

          <div class="mt-4 space-y-3">
            <div
              *ngFor="let record of recentHistoryPreview()"
              class="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-bold text-slate-900">{{ record.date | date:'mediumDate' }}</p>
                  <p class="mt-1 text-xs text-slate-500">
                    In {{ record.check_in ? (record.check_in | date:'shortTime') : '--:--' }}
                    <span class="px-1.5">•</span>
                    Out {{ record.check_out ? (record.check_out | date:'shortTime') : '--:--' }}
                  </p>
                </div>
                <span
                  class="rounded-full px-3 py-1 text-xs font-bold"
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

      <!-- Real-time Clock Banner -->
      <div
        *ngIf="isSelfServiceWorkspace()"
        class="bg-gradient-to-r from-slate-900 to-slate-800 rounded-md p-4 sm:p-6 text-white shadow-lg"
      >
        <div
          class="flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-md bg-white/10 flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <p
                class="text-slate-400 text-xs font-bold uppercase tracking-widest"
              >
                Current Time
              </p>
              <p class="text-2xl font-black">{{ currentTime() }}</p>
            </div>
          </div>

          <div class="flex items-center gap-6">
            <div class="text-center">
              <div class="flex items-center gap-2">
                <div
                  class="w-2.5 h-2.5 rounded-full animate-pulse"
                  [ngClass]="
                    todayAttendance()?.is_clocked_in
                      ? 'bg-success'
                      : 'bg-slate-500'
                  "
                ></div>
                <span class="font-bold">{{
                  todayAttendance()?.is_clocked_in
                    ? 'Clocked In'
                    : 'Not Clocked In'
                }}</span>
              </div>
              <p
                *ngIf="
                  todayAttendance()?.is_clocked_in &&
                  todayAttendance()?.check_in
                "
                class="text-sm text-slate-400 mt-1"
              >
                Since {{ todayAttendance()?.check_in | date: 'shortTime' }}
              </p>
            </div>

            <div class="text-center">
              <p
                class="text-slate-400 text-xs font-bold uppercase tracking-widest"
              >
                Work Hours
              </p>
              <p class="text-xl font-bold">
                {{ formatHours(todayAttendance()?.total_work_hours || 0) }}
              </p>
            </div>

            <div class="text-center">
              <p
                class="text-slate-400 text-xs font-bold uppercase tracking-widest"
              >
                Break
              </p>
              <p class="text-xl font-bold">
                {{ todayAttendance()?.break_time_minutes || 0 }}m
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Punch Workspace -->
      <section *ngIf="isSelfServiceWorkspace() && currentView() === 'punch'" class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Punch workspace</p>
              <h3 class="mt-2 text-xl font-bold text-slate-900">Mark attendance</h3>
              <p class="mt-2 max-w-2xl text-sm text-slate-500">
                Choose a capture mode, review your current status, then mark attendance from one clean modal flow.
              </p>
            </div>
            <span class="rounded-full px-3 py-1 text-xs font-bold self-start" [ngClass]="todayAttendance()?.is_clocked_in ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'">
              {{ todayAttendance()?.is_clocked_in ? 'Ready For Check Out' : 'Ready For Check In' }}
            </span>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <button
              *ngFor="let mode of modes"
              type="button"
              (click)="setMode(mode.id)"
              class="rounded-2xl border px-4 py-4 text-left transition-all"
              [ngClass]="checkInMode() === mode.id ? 'border-teal-300 bg-teal-50 shadow-sm' : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-white'"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex h-11 w-11 items-center justify-center rounded-2xl" [ngClass]="checkInMode() === mode.id ? 'bg-teal-600 text-white' : 'bg-white text-slate-700 border border-slate-200'" [innerHTML]="mode.icon"></div>
                <span *ngIf="checkInMode() === mode.id" class="rounded-full bg-teal-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">Selected</span>
              </div>
              <h4 class="mt-4 text-sm font-black text-slate-900">{{ mode.label }}</h4>
              <p class="mt-1 text-xs leading-5 text-slate-500">
                {{
                  mode.id === 'web'
                    ? 'Simple browser-based attendance without camera.'
                    : mode.id === 'camera'
                      ? 'Capture selfie evidence before submitting your punch.'
                      : mode.id === 'face'
                        ? 'Use live face verification for touchless attendance.'
                        : biometricStatusLabel()
                }}
              </p>
            </button>
          </div>

          <div class="mt-5 grid gap-4 lg:grid-cols-2">
            <div class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Quick actions</p>
              <div class="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  (click)="openPrimaryAttendanceModal()"
                  [disabled]="processing() || todayAttendance()?.is_clocked_out"
                  class="rounded-xl bg-teal-600 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:col-span-2"
                >
                  {{ primaryAttendanceButtonLabel() }}
                </button>
                <button
                  type="button"
                  (click)="handleBreak()"
                  [disabled]="processing() || !todayAttendance()?.is_clocked_in || todayAttendance()?.is_clocked_out"
                  class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {{ isOnBreak() ? 'End Break' : 'Start Break' }}
                </button>
                <button
                  type="button"
                  (click)="openManualRequest()"
                  class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  Manual Request
                </button>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Today snapshot</p>
              <div class="mt-4 space-y-3">
                <div class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
                  <span class="text-sm font-semibold text-slate-500">Check in</span>
                  <span class="text-sm font-black text-slate-900">{{ todayAttendance()?.check_in ? (todayAttendance()?.check_in | date:'shortTime') : '--:--' }}</span>
                </div>
                <div class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
                  <span class="text-sm font-semibold text-slate-500">Check out</span>
                  <span class="text-sm font-black text-slate-900">{{ todayAttendance()?.check_out ? (todayAttendance()?.check_out | date:'shortTime') : '--:--' }}</span>
                </div>
                <div class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
                  <span class="text-sm font-semibold text-slate-500">Break time</span>
                  <span class="text-sm font-black text-slate-900">{{ todayAttendance()?.break_time_minutes || 0 }}m</span>
                </div>
                <div class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
                  <span class="text-sm font-semibold text-slate-500">Working hours</span>
                  <span class="text-sm font-black text-slate-900">{{ formatHours(todayAttendance()?.total_work_hours || 0) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Current status</p>
            <h3 class="mt-2 text-lg font-bold text-slate-900">{{ nextAttendanceActionLabel() }}</h3>
            <p class="mt-2 text-sm text-slate-500">
              {{ nextAttendanceActionDescription() }}
            </p>
            <div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
              <div class="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all" [style.width.%]="attendanceProgress()"></div>
            </div>
            <div class="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
              <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Mode {{ checkInMode() | titlecase }}</span>
              <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{{ currentTime() }}</span>
              <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Pending requests {{ pendingManualRequestCount() }}</span>
            </div>
          </div>

          <div class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Recent requests</p>
                <h3 class="mt-2 text-lg font-bold text-slate-900">Manual request queue</h3>
              </div>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{{ manualRequests().length }}</span>
            </div>

            <div class="mt-4 space-y-3" *ngIf="manualRequests().length; else noManualRequests">
              <div *ngFor="let request of manualRequests().slice(0, 4)" class="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-bold text-slate-900">{{ request.date | date:'mediumDate' }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ request.reason || 'No reason added' }}</p>
                  </div>
                  <span class="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]" [ngClass]="request.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : request.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'">
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

      <!-- Calendar View -->
      <div
        *ngIf="currentView() === 'calendar'"
        class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_380px]"
      >
        <div class="card rounded-md border border-slate-200 p-6">
          <div class="mb-6 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <button
                (click)="previousMonth()"
                class="p-2 hover:bg-slate-100 rounded-lg"
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
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Attendance calendar</p>
                <h3 class="text-lg font-bold text-slate-900">
                  {{ getMonthYearString() }}
                </h3>
              </div>
              <button
                (click)="nextMonth()"
                class="p-2 hover:bg-slate-100 rounded-lg"
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
              class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Today
            </button>
          </div>

          <div class="grid grid-cols-7 gap-1">
            <div
              *ngFor="let day of weekDays"
              class="text-center text-xs font-bold text-slate-400 uppercase py-2"
            >
              {{ day }}
            </div>
            <div
              *ngFor="let day of calendarDays(); let i = index"
              class="aspect-square p-1 relative"
              [ngClass]="{
                'bg-slate-50': !day.isCurrentMonth,
                'hover:bg-slate-50': day.isCurrentMonth && day.date,
                'cursor-pointer': day.date,
              }"
              (click)="day.date && selectDate(day.date)"
            >
              <div
                *ngIf="day.date"
                class="w-full h-full flex flex-col items-center justify-center rounded-lg border transition-all"
                [ngClass]="{
                  'bg-primary-600 text-white border-primary-600': day.isToday,
                  'bg-slate-100 border-slate-300': day.isSelected && !day.isToday,
                  'border-transparent': !day.isSelected && !day.isToday
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

          <div class="flex flex-wrap gap-4 mt-6 pt-4 border-t border-slate-100">
            <div
              *ngFor="let item of statusLegend"
              class="flex items-center gap-2"
            >
              <div class="w-2 h-2 rounded-full" [ngClass]="item.color"></div>
              <span class="text-xs font-medium text-slate-500">{{
                item.label
              }}</span>
            </div>
          </div>
        </div>

        <div class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Attendance details</p>
              <h3 class="mt-2 text-xl font-bold text-slate-900">
                {{ selectedAttendanceDateLabel() }}
              </h3>
            </div>
            <span class="rounded-full px-3 py-1 text-xs font-bold" [ngClass]="selectedAttendanceStatusClass()">
              {{ selectedAttendanceStatusLabel() }}
            </span>
          </div>

          <div *ngIf="selectedAttendanceRecord(); else noAttendanceSelected" class="mt-5 space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Time In</p>
                <p class="mt-2 text-base font-black text-slate-900">{{ selectedAttendanceRecord()?.check_in ? formatShortTime(selectedAttendanceRecord()?.check_in) : '--:--' }}</p>
              </div>
              <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Time Out</p>
                <p class="mt-2 text-base font-black text-slate-900">{{ selectedAttendanceRecord()?.check_out ? formatShortTime(selectedAttendanceRecord()?.check_out) : '--:--' }}</p>
              </div>
              <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Work Hours</p>
                <p class="mt-2 text-base font-black text-slate-900">{{ formatHours(selectedAttendanceRecord()?.work_hours || 0) }}</p>
              </div>
              <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Late Mark</p>
                <p class="mt-2 text-base font-black text-slate-900">{{ selectedAttendanceRecord()?.is_late ? 'Yes' : 'No' }}</p>
              </div>
            </div>

            <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Location Details</p>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                {{ selectedAttendanceRecord()?.location_address || 'Location details were not captured for this record.' }}
              </p>
            </div>

            <div *ngIf="selectedAttendanceRecord()?.selfie_url" class="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Selfie Proof</p>
              <img [src]="selectedAttendanceRecord()?.selfie_url" alt="Attendance selfie" class="mt-3 h-32 w-32 rounded-2xl object-cover border border-slate-200" />
            </div>

            <div class="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                (click)="setView('records')"
                class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                Open Records
              </button>
              <button
                type="button"
                (click)="openManualRequest()"
                class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
              >
                Request Correction
              </button>
            </div>
          </div>

          <ng-template #noAttendanceSelected>
            <div class="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-center">
              <p class="text-sm font-bold text-slate-700">Select a workday</p>
              <p class="mt-2 text-sm text-slate-500">Choose any date from the calendar to review attendance timing, status, and captured details.</p>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Statistics View -->
      <div *ngIf="currentView() === 'stats'" class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="text-lg font-bold text-slate-900">
              Statistics Overview
            </h3>
            <p class="text-sm text-slate-500">
              Switch between weekly, monthly, and yearly performance snapshots.
            </p>
          </div>
          <div
            class="flex gap-2 rounded-md border border-slate-200 bg-white p-1 shadow-sm"
          >
            <button
              (click)="setStatsPeriod('week')"
              [ngClass]="
                statsPeriod() === 'week'
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              "
              class="px-4 py-2 rounded-lg text-sm font-bold transition-all"
            >
              Week
            </button>
            <button
              (click)="setStatsPeriod('month')"
              [ngClass]="
                statsPeriod() === 'month'
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              "
              class="px-4 py-2 rounded-lg text-sm font-bold transition-all"
            >
              Month
            </button>
            <button
              (click)="setStatsPeriod('year')"
              [ngClass]="
                statsPeriod() === 'year'
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              "
              class="px-4 py-2 rounded-lg text-sm font-bold transition-all"
            >
              Year
            </button>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="card p-5 rounded-md border border-slate-200">
            <div class="flex items-center gap-3 mb-3">
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

          <div class="card p-5 rounded-md border border-slate-200">
            <div class="flex items-center gap-3 mb-3">
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

          <div class="card p-5 rounded-md border border-slate-200">
            <div class="flex items-center gap-3 mb-3">
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

          <div class="card p-5 rounded-md border border-slate-200">
            <div class="flex items-center gap-3 mb-3">
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
            class="card p-5 rounded-md border border-slate-200 md:col-span-2"
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
            class="card p-5 rounded-md border border-slate-200 md:col-span-2"
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
      <section *ngIf="isSelfServiceWorkspace() && currentView() === 'records'" class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Attendance records</p>
            <h3 class="mt-2 text-xl font-bold text-slate-900">Search and review your attendance history</h3>
            <p class="mt-2 text-sm text-slate-500">
              Check every recorded day with status, in and out time, work hours, and available selfie proof.
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

        <div class="mt-5">
          <app-attendance-table [adminMode]="false"></app-attendance-table>
        </div>
      </section>

      <!-- Mark Attendance Modal -->
      <div
        *ngIf="showCameraModal()"
        class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-3 backdrop-blur-sm sm:p-4"
      >
        <div class="mx-auto flex min-h-full w-full max-w-3xl items-center justify-center">
        <div class="my-4 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <header class="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-teal-600">Mark Attendance</p>
              <h2 class="mt-2 text-xl font-black text-slate-900">{{ punchModalTitle() }}</h2>
              <p class="mt-2 text-sm text-slate-500">{{ punchModalDescription() }}</p>
            </div>
            <button
              type="button"
              (click)="closeCameraModal()"
              class="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </header>

          <div class="grid max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1.1fr)_360px]">
            <div class="border-b border-slate-100 p-4 lg:border-b-0 lg:border-r sm:p-5">
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Date</p>
                  <p class="mt-2 text-sm font-black text-slate-900">{{ punchModalDate() | date:'d MMMM, y' }}</p>
                </div>
                <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Time</p>
                  <p class="mt-2 text-sm font-black text-slate-900">{{ punchModalTime() }}</p>
                </div>
              </div>

              <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Location</p>
                    <p class="mt-2 text-sm font-semibold text-slate-700">{{ punchLocationLabel() }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ punchLocationCoords() || 'Location preview will appear here.' }}</p>
                  </div>
                  <span class="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
                    [ngClass]="
                      punchLocationAvailability() === 'ready'
                        ? 'bg-emerald-100 text-emerald-700'
                        : punchLocationAvailability() === 'checking'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-600'
                    "
                  >
                    {{
                      punchLocationAvailability() === 'ready'
                        ? 'Detected'
                        : punchLocationAvailability() === 'checking'
                          ? 'Checking'
                          : 'Optional'
                    }}
                  </span>
                </div>
              </div>

              <div class="mt-4 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Capture</p>
                    <p class="mt-2 text-sm font-semibold text-slate-700">{{ punchModalStatusText() }}</p>
                  </div>
                  <span class="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">
                    {{ punchModalBadge() }}
                  </span>
                </div>

                <div *ngIf="attendanceSuccess()" class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p class="text-sm font-black text-emerald-700">Attendance marked successfully</p>
                  <p class="mt-1 text-xs text-emerald-600">Your record has been saved. Closing this window...</p>
                </div>

                <div *ngIf="!attendanceSuccess()" class="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                  <div class="relative aspect-[4/3]">
                    <video
                      #videoElement
                      *ngIf="checkInMode() !== 'face'"
                      autoplay
                      muted
                      playsinline
                      class="absolute inset-0 h-full w-full object-cover"
                    ></video>
                    <video
                      #faceVideo
                      *ngIf="checkInMode() === 'face'"
                      autoplay
                      muted
                      playsinline
                      class="absolute inset-0 h-full w-full object-cover"
                    ></video>

                    <div *ngIf="!isCameraReady()" class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/90 text-white">
                      <div class="h-12 w-12 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>
                      <p class="text-sm font-bold">{{ cameraAvailability() === 'checking' ? 'Opening camera...' : 'Camera preview unavailable' }}</p>
                    </div>

                    <div *ngIf="capturedPhotoData() && checkInMode() !== 'face'" class="absolute inset-0">
                      <img [src]="capturedPhotoData()!" alt="Captured attendance" class="h-full w-full object-cover" />
                    </div>

                    <div *ngIf="checkInMode() === 'face' && isCameraReady()" class="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div class="h-44 w-44 sm:h-56 sm:w-56 lg:h-64 lg:w-64 rounded-full border-4 border-dashed border-sky-300/70 shadow-[0_0_0_999px_rgba(15,23,42,0.34)]"></div>
                    </div>
                  </div>
                </div>

                <div *ngIf="checkInMode() !== 'face' && !attendanceSuccess()" class="mt-3 flex gap-3">
                  <button
                    type="button"
                    (click)="retryPunchCamera()"
                    class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                  >
                    Retry Camera
                  </button>
                </div>
              </div>
            </div>

            <div class="p-4 sm:p-5">
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Mode</p>
                <div class="mt-3 grid gap-2">
                  <button
                    *ngFor="let mode of modes"
                    type="button"
                    (click)="setMode(mode.id)"
                    class="rounded-xl border px-3 py-3 text-left text-sm font-bold transition"
                    [ngClass]="checkInMode() === mode.id ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'"
                  >
                    {{ mode.label }}
                  </button>
                </div>
              </div>

              <div class="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Today Status</p>
                <div class="mt-3 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-slate-500">Action</span>
                    <span class="text-sm font-black text-slate-900">{{ pendingPunchAction() === 'out' ? 'Check Out' : 'Check In' }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-slate-500">Current state</span>
                    <span class="text-sm font-black text-slate-900">{{ todayAttendance()?.is_clocked_in ? 'Checked In' : 'Not Checked In' }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-slate-500">Work hours</span>
                    <span class="text-sm font-black text-slate-900">{{ formatHours(todayAttendance()?.total_work_hours || 0) }}</span>
                  </div>
                </div>
              </div>

              <div class="mt-5 flex flex-col gap-3">
                <button
                  *ngIf="checkInMode() === 'face'"
                  type="button"
                  (click)="restartFaceModalScan()"
                  [disabled]="processing() || attendanceSuccess()"
                  class="rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {{ punchModalPrimaryLabel() }}
                </button>

                <button
                  *ngIf="checkInMode() !== 'face'"
                  type="button"
                  (click)="submitCameraModalPunch()"
                  [disabled]="processing() || attendanceSuccess()"
                  class="rounded-xl bg-teal-600 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {{ processing() ? 'Submitting Attendance...' : punchModalPrimaryLabel() }}
                </button>

                <button
                  type="button"
                  (click)="closeCameraModal()"
                  [disabled]="processing()"
                  class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <!-- Manual Request Modal -->
      <div
        *ngIf="showManualModal()"
        class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <div
          class="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden"
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

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('faceVideoElement')
  faceVideoElement!: ElementRef<HTMLVideoElement>;
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
  checkInMode = signal<'web' | 'camera' | 'biometric' | 'face'>('web');
  processing = signal<boolean>(false);
  isCameraReady = signal<boolean>(false);
  cameraAvailability = signal<'idle' | 'checking' | 'ready' | 'unavailable'>('idle');
  punchLocationAvailability = signal<'idle' | 'checking' | 'ready' | 'unavailable'>('idle');
  punchLocationLabel = signal<string>('Location not checked yet');
  punchLocationCoords = signal<string>('');
  punchModalDate = signal<Date>(new Date());
  punchModalTime = signal<string>('');
  capturedPhotoData = signal<string | null>(null);
  faceScanStatus = signal<string>('');
  faceScanAttempts = signal<number>(0);
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

  private cameraStream: MediaStream | null = null;
  private currentUser: User | null = null;
  workspaceMode = signal<'self' | 'admin'>('self');
  isSelfServiceWorkspace = computed(() => this.workspaceMode() === 'self');
  isAdminAttendanceWorkspace = computed(() => this.workspaceMode() === 'admin');
  biometricAvailability = signal<'checking' | 'available' | 'unsupported' | 'restricted'>('checking');
  biometricConfiguredForUser = signal(false);

  modes: {
    id: 'web' | 'camera' | 'face' | 'biometric';
    label: string;
    icon: string;
  }[] = [
    {
      id: 'web',
      label: 'Web',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>',
    },
    {
      id: 'camera',
      label: 'Selfie',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
    },
    {
      id: 'face',
      label: 'Face',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3H5a2 2 0 0 0-2 2v2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M3 17v2a2 2 0 0 0 2 2h2"/><path d="M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0"/></svg>',
    },
    {
      id: 'biometric',
      label: 'Bio',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    },
  ];

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  statusLegend = [
    { status: 'present', label: 'Present', color: 'bg-green-500' },
    { status: 'absent', label: 'Absent', color: 'bg-red-500' },
    { status: 'late', label: 'Late', color: 'bg-amber-500' },
    { status: 'half_day', label: 'Half Day', color: 'bg-orange-500' },
    { status: 'on_leave', label: 'On Leave', color: 'bg-blue-500' },
    { status: 'holiday', label: 'Holiday', color: 'bg-purple-500' },
    { status: 'weekend', label: 'Weekend', color: 'bg-slate-400' },
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
      route: '/admin/attendance/workspace?view=tracking',
      active: this.canAccessTrackingWorkspace(),
      description: 'Track employee location from phone or desktop and monitor live field movement.',
    },
    {
      name: 'Geo-Fence',
      slug: 'geofence',
      short: 'GF',
      tone: 'bg-violet-100 text-violet-700',
      route: '/admin/attendance/geofence',
      active: this.canAccessGeofenceWorkspace(),
      description: 'Enable location boundaries and attendance compliance for allowed zones.',
    },
    {
      name: 'Shift Planner',
      slug: 'shift-planner',
      short: 'SP',
      tone: 'bg-emerald-100 text-emerald-700',
      route: '/admin/attendance/workspace?view=shift-planner',
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
          'Use this view for real-time attendance actions including web, selfie, face, or biometric-based check-ins.',
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
    return this.permissionService.canAccessRoute(this.currentUser, '/admin/attendance/register');
  }

  canAccessRegularizationRoute(): boolean {
    return this.permissionService.canAccessRoute(this.currentUser, '/admin/attendance/regularizations');
  }

  canAccessFaceRegistrationRoute(): boolean {
    return this.hasRawPermission('module507_view') && this.hasRawPermission('module507_UserView');
  }

  canAccessIntegrationsRoute(): boolean {
    return this.permissionService.canAccessRoute(this.currentUser, '/admin/attendance/integrations');
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

  loadStatsForPeriod(period: 'week' | 'month' | 'year') {
    this.attendanceService.getAttendanceStats(period).subscribe({
      next: (data) => this.stats.set(data),
      error: () =>
        this.toastService.error('Failed to load attendance statistics'),
    });
  }

  setMode(mode: 'web' | 'camera' | 'biometric' | 'face') {
    if (this.processing()) return;

    if (mode === 'biometric' && !this.canUseBiometricMode()) {
      this.toastService.error(this.biometricSupportMessage());
      this.checkInMode.set('web');
      return;
    }

    this.checkInMode.set(mode);
    this.capturedPhotoData.set(null);
    this.faceScanStatus.set('');
    this.faceScanAttempts.set(0);
    this.facePresenceStreak.set(0);
    this.attendanceSuccess.set(false);
    this.faceAutoTriggered = false;

    if ((mode === 'camera' || mode === 'face') && this.showCameraModal()) {
      this.startCamera(mode);
    } else {
      this.showCameraModal.set(false);
      this.pendingPunchAction.set(null);
      this.stopCamera();
      this.stopFaceAutoScan();
    }
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
    if (this.checkInMode() === 'biometric') {
      void this.handlePunch(action);
      return;
    }

    this.openCameraModal(action);
  }

  openPrimaryAttendanceModal() {
    if (this.todayAttendance()?.is_clocked_out) {
      return;
    }

    this.onPunchAction(this.primaryAttendanceAction());
  }

  openCameraModal(action: 'in' | 'out') {
    if (this.processing()) {
      return;
    }

    this.preparePunchModal();
    this.pendingPunchAction.set(action);
    this.showCameraModal.set(true);
    this.cameraAvailability.set('idle');
    this.capturedPhotoData.set(null);
    this.faceScanStatus.set('');
    this.faceScanAttempts.set(0);
    this.facePresenceStreak.set(0);
    this.attendanceSuccess.set(false);
    this.faceAutoTriggered = false;
    const mode = this.checkInMode();
    if (mode === 'face') {
      this.startCamera('face');
      return;
    }

    if (mode === 'camera' || mode === 'web') {
      this.startCamera('camera', true);
    }
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
    this.facePresenceStreak.set(0);
    this.attendanceSuccess.set(false);
    this.faceAutoTriggered = false;
    this.stopFaceAutoScan();
    this.stopCamera();
  }

  submitCameraModalPunch() {
    const action = this.pendingPunchAction();
    if (!action || this.checkInMode() === 'face') {
      return;
    }

    void this.handlePunch(action);
  }

  restartFaceModalScan() {
    if (this.checkInMode() !== 'face' || !this.showCameraModal()) {
      return;
    }

    this.capturedPhotoData.set(null);
    this.faceScanAttempts.set(0);
    this.facePresenceStreak.set(0);
    this.faceScanStatus.set('');
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

      setTimeout(() => {
        const video =
          mode === 'face'
            ? this.faceVideoElement?.nativeElement
            : this.videoElement?.nativeElement;
        if (video) {
          video.setAttribute('playsinline', 'true');
          video.muted = true;
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
        }
      }, 100);
    } catch (err) {
      console.error('Camera error:', err);
      this.stopCamera();
      this.cameraAvailability.set('unavailable');
      const errorMessage =
        err instanceof Error ? err.message : 'Camera access failed on this device.';
      if (allowFallback) {
        this.toastService.error('Camera not available. You can continue without selfie.');
        this.faceScanStatus.set(`${errorMessage} You can still continue without selfie.`);
        return;
      }
      this.toastService.error('Could not access camera');
      this.faceScanStatus.set(`${errorMessage} Please allow permission and try again.`);
      this.showCameraModal.set(false);
      this.pendingPunchAction.set(null);
      this.setMode('web');
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
    this.faceTurnAway = false;
    this.faceScanStatus.set(
      'Scanning for a registered face. Turn your head slightly left or right to confirm.',
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

    const video =
      this.faceVideoElement?.nativeElement || this.videoElement?.nativeElement;
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
            ? 'No face detected. Please face the camera clearly.'
            : `No face detected yet. Retrying ${attempts}/3...`,
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
          ? 'Face detected. Step 1: turn your head slightly left or right.'
          : 'Face detected. Hold still for confirmation...',
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
        this.stopFaceAutoScan();
        await this.handlePunch(
          this.isClockedIn() && !this.isClockedOut() ? 'out' : 'in',
        );
      } else {
        this.faceScanStatus.set(
          'Step 2: return your head to center to confirm liveness.',
        );
      }
    } finally {
      this.faceScanBusy = false;
    }
  }

  captureFrame(): string | null {
    const videoEl =
      this.checkInMode() === 'face'
        ? this.faceVideoElement?.nativeElement
        : this.videoElement?.nativeElement;
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
    this.processing.set(true);

    let payload: any = { source: this.checkInMode() };
    const user = this.currentUser || this.authService.getStoredUser();
    const orgId = Number(user?.orgId ?? user?.organizationId ?? 0) || 0;

    if (!user) {
      this.toastService.error('Please sign in again to mark attendance.');
      this.processing.set(false);
      return;
    }

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
        const video =
          this.faceVideoElement?.nativeElement ||
          this.videoElement?.nativeElement;

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
          return;
        }

        const frame = this.captureFrame();
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
      this.biometricAvailability() === 'available'
    );
  }

  biometricPromptText(): string {
    return this.canUseBiometricMode()
      ? 'Use your laptop fingerprint or Windows Hello sensor'
      : 'Biometric attendance is not ready on this device';
  }

  biometricSupportMessage(): string {
    if (!this.biometricConfiguredForUser()) {
      return 'Biometric attendance is not enabled for your account or organization yet.';
    }

    switch (this.biometricAvailability()) {
      case 'available':
        return 'Platform biometric support detected. We can use Windows Hello or the built-in fingerprint flow when your browser supports it.';
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
      return 'Center your face in the frame, turn slightly, and return to center. Attendance submits automatically after a successful liveness match.';
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
    if (this.checkInMode() === 'face') return 'Liveness Scan';
    if (this.cameraAvailability() === 'ready') return 'Selfie Ready';
    if (this.cameraAvailability() === 'checking') return 'Checking Camera';
    return 'No Camera Required';
  }

  punchModalStatusText(): string {
    if (this.checkInMode() === 'face') {
      return this.faceScanStatus() || 'Waiting for a clear face in the frame.';
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
      return 'Restart Face Scan';
    }
    return this.cameraAvailability() === 'ready'
      ? `Capture Selfie & ${verb}`
      : `Continue ${verb}`;
  }

  primaryAttendanceAction(): 'in' | 'out' {
    return this.todayAttendance()?.is_clocked_in ? 'out' : 'in';
  }

  primaryAttendanceButtonLabel(): string {
    if (this.todayAttendance()?.is_clocked_out) {
      return 'Attendance Already Marked';
    }

    return this.primaryAttendanceAction() === 'out'
      ? 'Mark Attendance For Check Out'
      : 'Mark Attendance For Check In';
  }

  async requestPunchLocationPreview(): Promise<void> {
    this.punchLocationAvailability.set('checking');
    this.punchLocationLabel.set('Checking your current location...');
    this.punchLocationCoords.set('');

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
      this.punchLocationLabel.set('Current device location detected');
      this.punchLocationCoords.set(`${lat}, ${lng}`);
    } catch {
      this.punchLocationAvailability.set('unavailable');
      this.punchLocationLabel.set('Location permission unavailable');
      this.punchLocationCoords.set('You can still continue if location access is blocked.');
    }
  }

  retryPunchCamera(): void {
    if (this.processing() || this.checkInMode() === 'face') {
      return;
    }
    this.cameraAvailability.set('idle');
    void this.startCamera('camera', true);
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
    const configured = Boolean(
      user?.biometricMachinePermission || user?.addonDeviceVerification,
    );
    this.biometricConfiguredForUser.set(configured);

    if (!configured) {
      this.biometricAvailability.set('restricted');
      return;
    }

    const credentialApi =
      typeof window !== 'undefined'
        ? (window as Window & {
            PublicKeyCredential?: {
              isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean>;
            };
          }).PublicKeyCredential
        : undefined;

    if (!credentialApi?.isUserVerifyingPlatformAuthenticatorAvailable) {
      this.biometricAvailability.set('unsupported');
      return;
    }

    try {
      const isAvailable =
        await credentialApi.isUserVerifyingPlatformAuthenticatorAvailable();
      this.biometricAvailability.set(isAvailable ? 'available' : 'unsupported');
    } catch {
      this.biometricAvailability.set('restricted');
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
        'Direct fingerprint validation is limited in browsers. Using verified device availability as the biometric attendance reference.',
      );
    }

    await new Promise((r) => setTimeout(r, 700));
    const userId = this.currentUser?.id ?? this.authService.getStoredUser()?.id ?? 'user';
    return `BIO-${userId}-${Date.now()}`;
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
      const dateStr = date.toISOString().split('T')[0];
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
              this.selectedDate.set(today.toISOString().split('T')[0]);
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
    return new Date(selected).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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

  formatShortTime(value?: string | null): string {
    if (!value) return '--:--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  nextAttendanceActionLabel(): string {
    if (this.todayAttendance()?.is_clocked_out) {
      return 'Attendance cycle complete for today';
    }

    if (this.todayAttendance()?.is_clocked_in) {
      return this.isOnBreak() ? 'Break is active right now' : 'Ready for check out';
    }

    return 'Ready for check in';
  }

  nextAttendanceActionDescription(): string {
    if (this.todayAttendance()?.is_clocked_out) {
      return 'Your check-in and check-out are already recorded. Review the records or raise a correction if anything needs adjustment.';
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
      ? 'Use your laptop fingerprint or Windows Hello authenticator.'
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
      on_leave: 'On Leave',
      holiday: 'Holiday',
      weekend: 'Weekend',
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
    };
    return colors[status] || 'bg-slate-300';
  }
}
