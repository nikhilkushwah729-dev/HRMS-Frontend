import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, interval, of, Subscription } from 'rxjs';
import {
  AttendanceService,
  AttendanceDashboardResponse,
  AttendanceShift,
  AttendanceRecord,
  GeoFenceZone,
  ManualAttendanceRequest,
} from '../../core/services/attendance.service';

interface IntegrationCard {
  title: string;
  description: string;
  route: string;
  badge: string;
  tone: string;
  metric?: string;
}

@Component({
  selector: 'app-attendance-integrations',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mx-auto max-w-7xl space-y-6 px-1 py-2">
      <section
        class="overflow-hidden rounded-md border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_35%),linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#eef2ff_100%)] shadow-sm"
      >
        <div
          class="grid gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:py-8"
        >
          <div class="space-y-4">
            <div
              class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
            >
              <span class="h-2 w-2 rounded-full bg-indigo-500"></span>
              Attendance Integrations
            </div>
            <div>
              <h1 class="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Attendance command center
              </h1>
              <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Manage device setup, biometric enrollment, geofence controls, shift planning,
                and manager review from a single operational hub.
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div class="rounded-md border border-white/80 bg-white/90 px-4 py-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Shifts
                </p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ shifts().length }}</p>
                <p class="mt-1 text-xs text-slate-500">Templates ready to assign</p>
              </div>
              <div class="rounded-md border border-white/80 bg-white/90 px-4 py-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Zones
                </p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ zones().length }}</p>
                <p class="mt-1 text-xs text-slate-500">Active geofence locations</p>
              </div>
              <div class="rounded-md border border-white/80 bg-white/90 px-4 py-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Pending reviews
                </p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ pendingRequests().length }}</p>
                <p class="mt-1 text-xs text-slate-500">Manual corrections waiting</p>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div class="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Total records
                </p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ statusStats().total }}</p>
                <p class="mt-1 text-xs text-slate-500">Loaded from attendance history</p>
              </div>
              <div class="rounded-2xl border border-slate-100 bg-emerald-50/70 p-4">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700/70">
                  Present
                </p>
                <p class="mt-2 text-2xl font-black text-emerald-700">{{ statusStats().present }}</p>
                <p class="mt-1 text-xs text-emerald-700/80">Current period count</p>
              </div>
              <div class="rounded-2xl border border-slate-100 bg-amber-50/70 p-4">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700/70">
                  Late
                </p>
                <p class="mt-2 text-2xl font-black text-amber-700">{{ statusStats().late }}</p>
                <p class="mt-1 text-xs text-amber-700/80">Needs attention</p>
              </div>
              <div class="rounded-2xl border border-slate-100 bg-cyan-50/70 p-4">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700/70">
                  Avg hours
                </p>
                <p class="mt-2 text-2xl font-black text-cyan-700">{{ formatHours(statusStats().averageHours) }}</p>
                <p class="mt-1 text-xs text-cyan-700/80">Per attendance record</p>
              </div>
            </div>
          </div>

          <div class="rounded-md border border-slate-200 bg-white/90 p-5 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Integration health
            </p>
            <h2 class="mt-1 text-lg font-black text-slate-900">Ready-to-use modules</h2>
            <div class="mt-4 space-y-3">
              <div class="rounded-2xl bg-slate-50 px-4 py-3">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm font-semibold text-slate-700">Biometric enrollment</span>
                  <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Ready</span>
                </div>
                <p class="mt-1 text-xs text-slate-500">Face registration and directory sync are available.</p>
              </div>
              <div class="rounded-2xl bg-slate-50 px-4 py-3">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm font-semibold text-slate-700">Location enforcement</span>
                  <span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">Configurable</span>
                </div>
                <p class="mt-1 text-xs text-slate-500">Geofence zones and employee rules are centrally managed.</p>
              </div>
              <div class="rounded-2xl bg-slate-50 px-4 py-3">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm font-semibold text-slate-700">Review workflow</span>
                  <span class="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-700">Live</span>
                </div>
                <p class="mt-1 text-xs text-slate-500">Team attendance and regularization stay accessible for managers.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Live filters
            </p>
            <h3 class="mt-2 text-xl font-bold text-slate-900">Refine attendance analytics</h3>
            <p class="mt-2 text-sm text-slate-500">
              Change the date or status and the hub refreshes from backend data automatically.
            </p>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <div class="flex flex-col gap-1">
              <label class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Date</label>
              <input
                type="date"
                [value]="selectedDate()"
                (change)="onDateChange($event)"
                class="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Status</label>
              <select
                [value]="selectedStatus()"
                (change)="onStatusChange($event)"
                class="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                <option value="all">All statuses</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
              <div class="flex flex-col gap-1">
              <label class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Department</label>
              <select
                [value]="selectedDepartment()"
                (change)="onDepartmentChange($event)"
                class="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                <option value="all">All departments</option>
                @for (dept of departmentOptions(); track dept.value) {
                  <option [value]="dept.value">{{ dept.label }}</option>
                }
              </select>
            </div>
            <button
              type="button"
              (click)="clearFilters()"
              class="rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white"
            >
              Clear
            </button>
          </div>
        </div>

        <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Filtered records
            </p>
            <p class="mt-2 text-2xl font-black text-slate-900">{{ statusStats().total }}</p>
            <p class="mt-1 text-xs text-slate-500">Matching the selected filter</p>
          </div>
          <div class="rounded-2xl border border-slate-100 bg-emerald-50/70 p-4">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700/70">
              Present ratio
            </p>
            <p class="mt-2 text-2xl font-black text-emerald-700">{{ presentRatio() }}%</p>
            <p class="mt-1 text-xs text-emerald-700/80">Share of filtered records</p>
          </div>
          <div class="rounded-2xl border border-slate-100 bg-amber-50/70 p-4">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700/70">
              Late ratio
            </p>
            <p class="mt-2 text-2xl font-black text-amber-700">{{ lateRatio() }}%</p>
            <p class="mt-1 text-xs text-amber-700/80">Filter-sensitive signal</p>
          </div>
          <div class="rounded-2xl border border-slate-100 bg-cyan-50/70 p-4">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700/70">
              Total hours
            </p>
            <p class="mt-2 text-2xl font-black text-cyan-700">{{ formatHours(statusStats().totalHours) }}</p>
            <p class="mt-1 text-xs text-cyan-700/80">Across filtered records</p>
          </div>
        </div>

        <div class="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div class="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Status mix
                </p>
                <h4 class="mt-1 text-sm font-bold text-slate-900">Filtered attendance distribution</h4>
              </div>
              <span class="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200">
                {{ filteredHistory().length }} rows
              </span>
            </div>

            <div class="mt-4 space-y-3">
              @for (item of statusDistribution(); track item.status) {
                <div>
                  <div class="flex items-center justify-between gap-3 text-xs">
                    <span class="font-semibold text-slate-600">{{ item.label }}</span>
                    <span class="font-bold text-slate-700">{{ item.count }} <span class="text-slate-400">({{ item.percent }}%)</span></span>
                  </div>
                  <div class="mt-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div class="h-full rounded-full" [ngClass]="item.color" [style.width.%]="item.percent"></div>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Department mix
                </p>
                <h4 class="mt-1 text-sm font-bold text-slate-900">Top departments in filtered data</h4>
              </div>
              <span class="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200">
                {{ departmentDistribution().length }} depts
              </span>
            </div>

            <div class="mt-4 space-y-3">
              @for (item of departmentDistribution(); track item.label) {
                <div class="rounded-xl bg-white border border-slate-100 p-3">
                  <div class="flex items-center justify-between gap-3 text-xs">
                    <span class="font-semibold text-slate-700">{{ item.label }}</span>
                    <span class="font-bold text-slate-900">{{ item.count }}</span>
                  </div>
                  <div class="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div class="h-full rounded-full bg-gradient-to-r from-slate-700 to-cyan-500" [style.width.%]="item.percent"></div>
                  </div>
                </div>
              } @empty {
                <div class="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-center text-sm text-slate-500">
                  Department data will appear once records include employee department values.
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        @for (card of integrationCards(); track card.title) {
          <a
            [routerLink]="card.route"
            class="group rounded-md border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  {{ card.badge }}
                </p>
                <h3 class="mt-2 text-lg font-bold text-slate-900">{{ card.title }}</h3>
                <p class="mt-2 text-sm text-slate-500">{{ card.description }}</p>
              </div>
              <span class="rounded-full px-3 py-1 text-xs font-bold" [ngClass]="card.tone">
                {{ card.metric || 'Open' }}
              </span>
            </div>
          </a>
        }
      </section>

      <section class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4">
        <div class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Attendance leaderboard
              </p>
              <h3 class="mt-2 text-xl font-bold text-slate-900">
                Top work-hour records
              </h3>
            </div>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {{ leaderboard().length }} records
            </span>
          </div>

          <div class="mt-5 space-y-3">
            @for (record of leaderboard(); track record.id) {
              <div class="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="text-sm font-bold text-slate-900">
                      {{ record.employee?.firstName || 'Employee' }}
                      {{ record.employee?.lastName || record.employee_id }}
                    </p>
                    <p class="mt-1 text-xs text-slate-500">
                      {{ record.date | date:'mediumDate' }}
                      <span class="px-1.5">•</span>
                      In {{ record.check_in ? (record.check_in | date:'shortTime') : '--:--' }}
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
                <div class="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                    [style.width.%]="recordProgress(record)"
                  ></div>
                </div>
              </div>
            } @empty {
              <div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                No attendance history is available yet.
              </div>
            }
          </div>
        </div>

        <div class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Device and setup cards
          </p>
          <div class="mt-4 space-y-3">
            @for (card of setupCards(); track card.title) {
              <a
                [routerLink]="card.route"
                class="block rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-slate-300 hover:bg-white"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-bold text-slate-900">{{ card.title }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ card.description }}</p>
                  </div>
                  <span class="rounded-full px-3 py-1 text-[10px] font-bold" [ngClass]="card.tone">
                    {{ card.tag }}
                  </span>
                </div>
              </a>
            }
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
        <div class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Device-style workflow
              </p>
              <h3 class="mt-2 text-xl font-bold text-slate-900">Attendance setup path</h3>
            </div>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              Guided
            </span>
          </div>

          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <div class="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p class="text-sm font-bold text-slate-900">1. Register biometric users</p>
              <p class="mt-2 text-sm text-slate-500">
                Start with face registration so touchless attendance stays ready from day one.
              </p>
            </div>
            <div class="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p class="text-sm font-bold text-slate-900">2. Define zones and shifts</p>
              <p class="mt-2 text-sm text-slate-500">
                Map allowed locations, shift windows, and grace times before rollout.
              </p>
            </div>
            <div class="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p class="text-sm font-bold text-slate-900">3. Review live attendance</p>
              <p class="mt-2 text-sm text-slate-500">
                Use tracking and team views to catch late arrivals and missing punches.
              </p>
            </div>
            <div class="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p class="text-sm font-bold text-slate-900">4. Close the correction loop</p>
              <p class="mt-2 text-sm text-slate-500">
                Handle regularization requests without leaving the attendance workspace.
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Current snapshot
          </p>
          <div class="mt-4 space-y-3">
            <div class="rounded-2xl bg-slate-50 px-4 py-3">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-semibold text-slate-700">Last synced shifts</span>
                <span class="text-sm font-bold text-slate-900">{{ shifts().length }}</span>
              </div>
            </div>
            <div class="rounded-2xl bg-slate-50 px-4 py-3">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-semibold text-slate-700">Available geofence zones</span>
                <span class="text-sm font-bold text-slate-900">{{ zones().length }}</span>
              </div>
            </div>
            <div class="rounded-2xl bg-slate-50 px-4 py-3">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-semibold text-slate-700">Manual requests</span>
                <span class="text-sm font-bold text-slate-900">{{ pendingRequests().length }}</span>
              </div>
            </div>
            <div class="rounded-2xl bg-slate-50 px-4 py-3">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-semibold text-slate-700">Last update</span>
                <span class="text-sm font-bold text-slate-900">{{ lastUpdated() || 'Just now' }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class AttendanceIntegrationsComponent implements OnInit, OnDestroy {
  private attendanceService = inject(AttendanceService);
  private refreshSub?: Subscription;

  dashboard = signal<AttendanceDashboardResponse | null>(null);
  history = signal<AttendanceRecord[]>([]);
  shifts = signal<AttendanceShift[]>([]);
  zones = signal<GeoFenceZone[]>([]);
  pendingRequests = signal<ManualAttendanceRequest[]>([]);
  lastUpdated = signal<string>('');
  selectedDate = signal<string>(new Date().toISOString().slice(0, 10));
  selectedStatus = signal<'all' | AttendanceRecord['status']>('all');
  selectedDepartment = signal<string>('all');

  integrationCards = computed<IntegrationCard[]>(() => [
    {
      title: 'Face Registration',
      description: 'Enroll users for touchless attendance and manage biometric readiness.',
      route: '/face-registration',
      badge: 'Biometric',
      tone: 'bg-indigo-50 text-indigo-700',
      metric: 'Enroll',
    },
    {
      title: 'Shift Settings',
      description: 'Define shifts, grace windows, and the timing rules used by attendance.',
      route: '/settings/attendance/shift',
      badge: 'Scheduling',
      tone: 'bg-emerald-50 text-emerald-700',
      metric: `${this.shifts().length} shifts`,
    },
    {
      title: 'Geofence Rules',
      description: 'Manage office zones and attendance boundaries for location-aware punches.',
      route: '/settings/attendance/geo-fence',
      badge: 'Location',
      tone: 'bg-purple-50 text-purple-700',
      metric: `${this.zones().length} zones`,
    },
    {
      title: 'Employee Tracking',
      description: 'Watch active clock-ins and field movement from the live tracking view.',
      route: '/attendance',
      badge: 'Tracking',
      tone: 'bg-cyan-50 text-cyan-700',
      metric: 'Live',
    },
    {
      title: 'Team Attendance',
      description: 'Review late arrivals, status trends, and team-wide attendance health.',
      route: '/admin/team-attendance',
      badge: 'Manager',
      tone: 'bg-amber-50 text-amber-700',
      metric: 'Review',
    },
    {
      title: 'Regularization',
      description: 'Clear punch corrections and attendance disputes without context switching.',
      route: '/admin/regularization',
      badge: 'Workflow',
      tone: 'bg-rose-50 text-rose-700',
      metric: `${this.pendingRequests().length} pending`,
    },
  ]);

  setupCards = computed(() => [
    {
      title: 'Face Recognition',
      description: 'Open biometric enrollment and verify face registration coverage.',
      route: '/settings/attendance/face-recognition',
      tag: 'Biometric',
      tone: 'bg-indigo-100 text-indigo-700',
    },
    {
      title: 'Shift Planner',
      description: 'Create and tune shift rules before assigning employees.',
      route: '/settings/attendance/shift',
      tag: 'Shift',
      tone: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Geofence Control',
      description: 'Edit allowed attendance zones and validation boundaries.',
      route: '/settings/attendance/geo-fence',
      tag: 'Zones',
      tone: 'bg-purple-100 text-purple-700',
    },
    {
      title: 'Attendance Hub',
      description: 'Return to punch, tracking, and compliance views.',
      route: '/attendance',
      tag: 'Hub',
      tone: 'bg-slate-100 text-slate-700',
    },
  ]);

  filteredHistory = computed(() => this.history());

  leaderboard = computed(() =>
    [...this.filteredHistory()]
      .sort((a, b) => (b.work_hours || 0) - (a.work_hours || 0))
      .slice(0, 5),
  );

  statusStats = computed(() => {
    const summary = this.dashboard()?.summary;
    if (summary) {
      return {
        total: summary.totalRecords,
        present: summary.present,
        late: summary.late,
        absent: summary.absent,
        leave: summary.onLeave,
        totalHours: summary.totalWorkHours,
        averageHours: summary.averageWorkHours,
      };
    }

    const history = this.filteredHistory();
    const total = history.length;
    const present = history.filter((item) => item.status === 'present').length;
    const late = history.filter((item) => item.status === 'late').length;
    const absent = history.filter((item) => item.status === 'absent').length;
    const leave = history.filter((item) => item.status === 'on_leave').length;
    const totalHours = history.reduce(
      (sum, item) => sum + (item.work_hours || 0),
      0,
    );
    const averageHours = total ? totalHours / total : 0;

    return {
      total,
      present,
      late,
      absent,
      leave,
      totalHours,
      averageHours,
    };
  });

  statusDistribution = computed(() => {
    const breakdown = this.dashboard()?.statusBreakdown;
    if (breakdown?.length) {
      return breakdown.map((item) => ({
        ...item,
        color: this.getStatusBarClass(item.status),
      }));
    }

    const history = this.filteredHistory();
    const total = history.length || 1;
    const rows = [
      { status: 'present' as const, label: 'Present', color: 'bg-emerald-500' },
      { status: 'late' as const, label: 'Late', color: 'bg-amber-500' },
      { status: 'absent' as const, label: 'Absent', color: 'bg-rose-500' },
      { status: 'on_leave' as const, label: 'On Leave', color: 'bg-cyan-500' },
    ];

    return rows.map((row) => {
      const count = history.filter((item) => item.status === row.status).length;
      return {
        ...row,
        count,
        percent: Math.max(0, Math.min(100, Math.round((count / total) * 100))),
      };
    });
  });

  departmentDistribution = computed(() => {
    const breakdown = this.dashboard()?.departmentBreakdown;
    if (breakdown?.length) {
      return breakdown.map((item) => ({
        label: item.departmentName,
        count: item.count,
        percent: item.percent,
      }));
    }

    const history = this.filteredHistory();
    const map = new Map<string, number>();
    history.forEach((record) => {
      const department = record.employee?.department?.trim();
      if (!department) return;
      map.set(department, (map.get(department) || 0) + 1);
    });

    const total = Array.from(map.values()).reduce((sum, count) => sum + count, 0) || 1;
    return Array.from(map.entries())
      .map(([label, count]) => ({
        label,
        count,
        percent: Math.max(0, Math.min(100, Math.round((count / total) * 100))),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  });

  departmentOptions = computed(() => {
    const breakdown = this.dashboard()?.departmentBreakdown;
    if (breakdown?.length) {
      return breakdown
        .filter((dept) => dept.departmentId !== null)
        .map((dept) => ({
          value: String(dept.departmentId),
          label: dept.departmentName,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    const departments = new Set<string>();
    this.history().forEach((record) => {
      const department = record.employee?.department?.trim();
      if (department) departments.add(department);
    });
    return Array.from(departments)
      .sort((a, b) => a.localeCompare(b))
      .map((department) => ({ value: department, label: department }));
  });

  ngOnInit(): void {
    this.loadData();
    this.refreshSub = interval(30000).subscribe(() => this.loadData());
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  loadData(): void {
    const selectedDepartment = this.selectedDepartment();
    const parsedDepartmentId = Number(selectedDepartment);
    const filters = {
      startDate: this.selectedDate() || undefined,
      endDate: this.selectedDate() || undefined,
      status:
        this.selectedStatus() === 'all'
          ? undefined
          : this.selectedStatus(),
      departmentId:
        selectedDepartment === 'all' || Number.isNaN(parsedDepartmentId)
          ? undefined
          : parsedDepartmentId,
    };

    forkJoin({
      dashboard: this.attendanceService
        .getAttendanceDashboard(filters)
        .pipe(catchError(() => of(null as AttendanceDashboardResponse | null))),
      shifts: this.attendanceService.getShifts().pipe(catchError(() => of([] as AttendanceShift[]))),
      zones: this.attendanceService.getGeoFenceZones().pipe(catchError(() => of([] as GeoFenceZone[]))),
      manualRequests: this.attendanceService.getManualAttendanceRequests().pipe(
        catchError(() => of([] as ManualAttendanceRequest[])),
      ),
    }).subscribe({
      next: ({ dashboard, shifts, zones, manualRequests }) => {
        this.dashboard.set(dashboard);
        this.history.set(dashboard?.records ?? []);
        this.shifts.set(shifts);
        this.zones.set(zones);
        this.pendingRequests.set(manualRequests);
        this.lastUpdated.set(new Date().toLocaleString());
      },
      error: () => {
        this.lastUpdated.set(new Date().toLocaleString());
      },
    });
  }

  onDateChange(event: Event): void {
    this.selectedDate.set((event.target as HTMLInputElement).value);
    this.loadData();
  }

  onStatusChange(event: Event): void {
    this.selectedStatus.set((event.target as HTMLSelectElement).value as 'all' | AttendanceRecord['status']);
    this.loadData();
  }

  onDepartmentChange(event: Event): void {
    this.selectedDepartment.set((event.target as HTMLSelectElement).value);
    this.loadData();
  }

  clearFilters(): void {
    this.selectedDate.set(new Date().toISOString().slice(0, 10));
    this.selectedStatus.set('all');
    this.selectedDepartment.set('all');
    this.loadData();
  }

  liveMetricTone(kind: 'good' | 'warn' | 'info' | 'neutral'): string {
    const map: Record<typeof kind, string> = {
      good: 'bg-emerald-50 text-emerald-700',
      warn: 'bg-amber-50 text-amber-700',
      info: 'bg-cyan-50 text-cyan-700',
      neutral: 'bg-slate-100 text-slate-700',
    };
    return map[kind];
  }

  presentRatio(): number {
    const stats = this.statusStats();
    return stats.total ? Math.round((stats.present / stats.total) * 100) : 0;
  }

  lateRatio(): number {
    const stats = this.statusStats();
    return stats.total ? Math.round((stats.late / stats.total) * 100) : 0;
  }

  formatHours(hours: number): string {
    const safeHours = Number.isFinite(hours) ? hours : 0;
    const whole = Math.floor(safeHours);
    const minutes = Math.round((safeHours - whole) * 60);
    return `${whole}h ${minutes}m`;
  }

  recordProgress(record: AttendanceRecord): number {
    const targetHours = 8;
    const hours = record.work_hours || 0;
    return Math.max(0, Math.min(100, Math.round((hours / targetHours) * 100)));
  }

  getStatusBarClass(status: AttendanceRecord['status']): string {
    const classes: Record<AttendanceRecord['status'], string> = {
      present: 'bg-emerald-500',
      absent: 'bg-rose-500',
      late: 'bg-amber-500',
      half_day: 'bg-orange-500',
      on_leave: 'bg-cyan-500',
      holiday: 'bg-slate-500',
      weekend: 'bg-slate-400',
    };
    return classes[status] || 'bg-slate-500';
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
}
