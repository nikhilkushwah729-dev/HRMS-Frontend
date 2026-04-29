import { Component, OnInit, OnDestroy, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Widgets
import { EssGreetingComponent } from './ess-dashboard/widgets/ess-greeting.component';
import { EssStatsComponent, InsightCard } from './ess-dashboard/widgets/ess-stats.component';
import { EssNetworkHubComponent } from './ess-dashboard/widgets/ess-network-hub.component';
import { EssAttendanceCenterComponent } from './ess-dashboard/widgets/ess-attendance-center.component';
import { EssPulseComponent, DashboardHighlight } from './ess-dashboard/widgets/ess-pulse.component';
import { EssAnnouncementsComponent } from './ess-dashboard/widgets/ess-announcements.component';
import { EssCalendarComponent, CalendarDay } from './ess-dashboard/widgets/ess-calendar.component';
import { EssLeaveBalanceComponent } from './ess-dashboard/widgets/ess-leave-balance.component';
import { EssHolidaysComponent } from './ess-dashboard/widgets/ess-holidays.component';
import { EssRequestsLedgerComponent } from './ess-dashboard/widgets/ess-requests-ledger.component';

// Services
import { AuthService } from '../../core/services/auth.service';
import { AttendanceService, AttendanceRecord } from '../../core/services/attendance.service';
import { LeaveService, LeaveRequest } from '../../core/services/leave.service';
import { EmployeeService } from '../../core/services/employee.service';
import { ProjectService } from '../../core/services/project.service';
import { TimesheetService } from '../../core/services/timesheet.service';
import { OrganizationService } from '../../core/services/organization.service';
import { PermissionService } from '../../core/services/permission.service';
import { AnnouncementService } from '../../core/services/announcement.service';
import { NotificationService } from '../../core/services/notification.service';
import { LiveRefreshService, LiveRefreshTrigger } from '../../core/services/live-refresh.service';
import { ToastService } from '../../core/services/toast.service';
import { LanguageService } from '../../core/services/language.service';

// Models
import { User } from '../../core/models/auth.model';
import confetti from 'canvas-confetti';
import { TodayAttendance } from '../../core/services/attendance.service';
import { Timesheet } from '../../core/services/timesheet.service';
import { Organization, OrganizationHoliday } from '../../core/services/organization.service';
import { GeoFenceSettings, AttendanceShift } from '../../core/services/attendance.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export interface DashboardProjectCard {
  id: number;
  name: string;
  description: string;
  status: string;
  statusLabel: string;
  progress: number;
  deadline: string | null;
  teamSize: number;
  tone: string;
}

export interface DashboardTimesheetCard {
  id: number;
  projectName: string;
  workDate: string;
  hours: number;
  description: string;
  status: string;
  tone: string;
}

export interface AddonCard {
  id: number;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  route: string;
  accent: string;
  icon: string;
}

export interface ModuleCard {
  key: string;
  name: string;
  icon: string;
  route: string;
  description: string;
  color: string;
  locked: boolean;
}

interface HolidayCalendarItem {
  date: string;
  name: string;
}

@Component({
  selector: 'app-self-service',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    EssGreetingComponent,
    EssStatsComponent,
    EssNetworkHubComponent,
    EssAttendanceCenterComponent,
    EssPulseComponent,
    EssAnnouncementsComponent,
    EssCalendarComponent,
    EssLeaveBalanceComponent,
    EssHolidaysComponent,
    EssRequestsLedgerComponent
  ],
  template: `
    <div class="ess-clean-panel min-h-full bg-[#f8fafc]">
      <div class="mx-auto w-full max-w-[1440px] space-y-4 p-4 sm:p-5 lg:p-6">
        <app-ess-announcements [announcements]="announcements()" [announcement]="announcements()[0]"></app-ess-announcements>

        <app-ess-greeting
          [user]="currentUser()"
          [specialMessage]="specialMessage()"
          [currentTime]="currentTime()"
          (navigate)="navigateTo($event)"
          (punchAction)="openAttendanceModal()"
          (closeBanner)="specialMessage.set([])">
        </app-ess-greeting>

        <app-ess-stats [stats]="workspaceStats()"></app-ess-stats>

        <div class="grid grid-cols-1 gap-4 xl:auto-rows-[165px] xl:grid-cols-12">
          <div class="min-w-0 xl:col-span-7 xl:row-span-4">
              <app-ess-network-hub
                [teammates]="teammates()"
                [reportees]="reportees()"
                [currentUserName]="currentUserFullName()"
                [managerName]="currentManagerName()"
                [canViewEmployeeProfiles]="canAccess('/employees')"
                (navigate)="navigateTo($event)"
                class="block h-full min-h-[420px]">
              </app-ess-network-hub>
          </div>

          <div class="min-w-0 xl:col-span-5 xl:row-span-4">
              <app-ess-calendar
                [monthDate]="calendarCursor()"
                [summary]="calendarSummary()"
                [legends]="calendarLegends()"
                [days]="calendarGrid()"
                [selectedDay]="selectedCalendarDay()"
                [selectedMetrics]="selectedCalendarViewMetrics()"
                [selectedNotes]="selectedCalendarViewNotes()"
                (previousMonth)="previousCalendarMonth()"
                (nextMonth)="nextCalendarMonth()"
                (jumpToToday)="jumpToCurrentMonth()"
                (selectDay)="openCalendarDay($event)"
                (closeDetail)="closeCalendarDay()"
                (navigate)="navigateTo($event)"
                class="block h-full min-h-[420px]">
              </app-ess-calendar>
          </div>

          <div class="min-w-0 xl:col-span-7 xl:row-span-3">
              <app-ess-pulse
                [highlights]="workspaceHighlights()"
                [unreadCount]="notificationService.unreadCount()"
                class="block h-full min-h-[390px]">
              </app-ess-pulse>
          </div>

          <div class="min-w-0 xl:col-span-5 xl:row-span-3">
              <div class="grid h-full grid-cols-1 gap-4 xl:grid-rows-[1.9fr_1.1fr]">
                <app-ess-attendance-center
                  [todayStatus]="todayStatus()"
                  class="block h-full min-h-[260px]">
                </app-ess-attendance-center>

                <app-ess-leave-balance
                  [balances]="leaveBalances()"
                  (requestLeave)="navigateTo('/leaves')"
                  class="block h-full min-h-[190px]">
                </app-ess-leave-balance>
              </div>
          </div>

          <div class="min-w-0 xl:col-span-4 xl:row-span-3">
              <app-ess-holidays
                [holidays]="upcomingHolidays()"
                class="block h-full min-h-[390px]">
              </app-ess-holidays>
          </div>

          <div class="min-w-0 xl:col-span-8 xl:row-span-3">
              <app-ess-requests-ledger
                [requests]="myLeaveRequests()"
                (viewAll)="navigateTo('/leaves')"
                class="block h-full min-h-[390px]">
              </app-ess-requests-ledger>
          </div>
        </div>
      </div>
    </div>

  `,
  styles: [`
    :host { display: block; }

    :host ::ng-deep .ess-clean-panel .app-surface-card,
    :host ::ng-deep .ess-clean-panel .app-glass-card {
      background: #ffffff !important;
      border: 0 !important;
      border-radius: 0.75rem !important;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04) !important;
      --tw-ring-color: transparent !important;
    }

    :host ::ng-deep .ess-clean-panel .app-surface-card:hover,
    :host ::ng-deep .ess-clean-panel .app-glass-card:hover {
      transform: none !important;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1) !important;
    }

    :host ::ng-deep .ess-clean-panel .hover\\:-translate-y-1:hover {
      transform: none !important;
    }

    :host ::ng-deep .ess-clean-panel app-ess-network-hub,
    :host ::ng-deep .ess-clean-panel app-ess-calendar,
    :host ::ng-deep .ess-clean-panel app-ess-pulse,
    :host ::ng-deep .ess-clean-panel app-ess-attendance-center,
    :host ::ng-deep .ess-clean-panel app-ess-leave-balance,
    :host ::ng-deep .ess-clean-panel app-ess-holidays,
    :host ::ng-deep .ess-clean-panel app-ess-requests-ledger {
      display: block;
      width: 100%;
    }

    :host ::ng-deep #selfServiceAttendanceChart,
    :host ::ng-deep #selfServiceLeaveChart {
      width: 100% !important;
      height: 100% !important;
    }
  `],
})
export class SelfServiceComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private attendanceService = inject(AttendanceService);
  private leaveService = inject(LeaveService);
  private employeeService = inject(EmployeeService);
  private projectService = inject(ProjectService);
  private timesheetService = inject(TimesheetService);
  private organizationService = inject(OrganizationService);
  private permissionService = inject(PermissionService);
  private announcementService = inject(AnnouncementService);
  public notificationService = inject(NotificationService);
  private liveRefreshService = inject(LiveRefreshService);
  private toastService = inject(ToastService);
  private languageService = inject(LanguageService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  currentUser = signal<User | null>(null);
  currentTime = signal<string>(new Date().toLocaleTimeString(this.languageService.currentLanguage().locale, { hour: '2-digit', minute: '2-digit' }));
  todayStatus = signal<TodayAttendance | null>(null);
  leaveBalances = signal<any[]>([]);
  totalLeaveBalance = signal<number>(0);
  recentAttendance = signal<AttendanceRecord[]>([]);
  leaveHistory = signal<LeaveRequest[]>([]);
  myLeaveRequests = signal<LeaveRequest[]>([]);
  pendingRequests = signal<number>(0);
  projects = signal<DashboardProjectCard[]>([]);
  timesheets = signal<DashboardTimesheetCard[]>([]);
  addons = signal<AddonCard[]>([]);
  employees = signal<User[]>([]);
  announcements = signal<any[]>([]);
  accessibleModules = signal<ModuleCard[]>([]);
  specialMessage = signal<string[]>([]);
  teamOccasions = signal<any[]>([]);
  calendarCursor = signal<Date>(new Date());
  calendarAttendance = signal<AttendanceRecord[]>([]);
  upcomingHolidays = signal<HolidayCalendarItem[]>([]);
  selectedCalendarDay = signal<CalendarDay | null>(null);
  holidayWindowStart = signal<string | null>(null);
  holidayWindowEnd = signal<string | null>(null);
  organizationProfile = signal<Organization | null>(null);
  activeShiftCount = signal<number>(0);
  geoFenceSettings = signal<GeoFenceSettings | null>(null);
  weeklyOffPolicyCount = signal<number>(0);
  private attendanceInsightChart: Chart | null = null;
  private leaveInsightChart: Chart | null = null;
  private chartRenderFrame: number | null = null;

  calendarGrid = computed(() => this.buildCalendarDays());
  readonly t = (key: string, params?: Record<string, string | number | null | undefined>) =>
    this.languageService.t(key, params);

  workspaceStats = computed<InsightCard[]>(() => [
    {
      label: this.t('selfService.stats.workforceStrength'),
      value: this.employees().length.toString(),
      description: this.t('selfService.stats.workforceStrengthHelp'),
      tone: 'border-indigo-100 bg-indigo-50/30',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
    },
    {
      label: this.t('selfService.stats.leavePortfolio'),
      value: this.t('selfService.dayCount', { count: this.totalLeaveBalance() }),
      description: this.t('selfService.stats.leavePortfolioHelp'),
      tone: 'border-emerald-100 bg-emerald-50/30',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>'
    },
    {
      label: this.t('selfService.stats.requestActivity'),
      value: this.t('selfService.pendingCount', { count: this.pendingRequests() }),
      description: this.t('selfService.stats.requestActivityHelp'),
      tone: 'border-amber-100 bg-amber-50/30',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'
    },
    {
      label: this.t('selfService.stats.activeProjects'),
      value: this.projects().length.toString(),
      description: this.t('selfService.stats.activeProjectsHelp'),
      tone: 'border-sky-100 bg-sky-50/30',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2s-7 7-9.38 11z"/><path d="M9 12H4s.5-1 1-2c2-3.7 6.4-5.3 10.1-3.6z"/><path d="M15 9v5s1-.5 2-1c3.7-2 5.3-6.4 3.6-10.1z"/></svg>'
    },
  ]);

  workspaceHighlights = computed<DashboardHighlight[]>(() => {
    const list: DashboardHighlight[] = [];
    const status = this.todayStatus();
    if (status?.is_clocked_in && status.check_in) {
      list.push({
        id: 'att',
        name: this.t('selfService.attendanceActive'),
        message: this.t('selfService.highlightAttendanceMessage', {
          time: new Date(status.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }),
        tone: 'border-emerald-100 bg-emerald-50/50'
      });
    }
    if (this.pendingRequests() > 0) {
      list.push({
        id: 'leave',
        name: this.t('selfService.pendingApprovals'),
        message: this.t('selfService.highlightPendingMessage', { count: this.pendingRequests() }),
        tone: 'border-amber-100 bg-amber-50/50'
      });
    }
    const latestTimesheet = this.timesheets()[0];
    if (latestTimesheet) {
      list.push({
        id: 'time',
        name: this.t('selfService.latestTimesheet'),
        message: this.t('selfService.highlightTimesheetMessage', {
          project: latestTimesheet.projectName,
          hours: latestTimesheet.hours,
          date: new Date(latestTimesheet.workDate).toLocaleDateString()
        }),
        tone: 'border-sky-100 bg-sky-50/50'
      });
    }
    const latestAnnouncement = this.announcements()[0];
    if (latestAnnouncement?.title) {
      list.push({
        id: 'announce',
        name: this.t('selfService.orgUpdate'),
        message: latestAnnouncement.title,
        tone: 'border-violet-100 bg-violet-50/50'
      });
    }
    const projects = this.projects().filter(p => p.progress < 50);
    if (projects.length > 0) {
      list.push({
        id: 'proj',
        name: this.t('selfService.projectFocus'),
        message: this.t('selfService.highlightProjectMessage', {
          project: projects[0].name,
          progress: projects[0].progress
        }),
        tone: 'border-indigo-100 bg-indigo-50/50'
      });
    }
    if (this.isManager() && this.activeShiftCount() === 0) {
      list.push({
        id: 'setup',
        name: this.t('selfService.settingsAttention'),
        message: this.t('selfService.highlightSettingsMessage'),
        tone: 'border-rose-100 bg-rose-50/50'
      });
    }
    if (list.length < 3) {
      list.push({
        id: 'well',
        name: this.t('selfService.organizationPulse'),
        message: this.t('selfService.highlightAllGood'),
        tone: 'border-slate-100 bg-slate-50/50'
      });
    }
    return list.slice(0, 3);
  });

  settingsHealthItems = computed(() => [
    { label: this.t('common.enterprise'), value: this.organizationProfile()?.name || this.currentUser()?.organizationName || this.t('common.pending') },
    { label: 'Active Shifts', value: `${this.activeShiftCount()}` },
    { label: 'Geo-Fence', value: this.geoFenceSettings()?.geofence_enabled ? 'Enabled' : 'Disabled' },
    { label: 'Weekly Off', value: this.weeklyOffPolicyCount() === 1 ? '1 policy' : `${this.weeklyOffPolicyCount()} policies` }
  ]);

  calendarSummary = computed(() => [
    { label: this.t('selfService.present'), value: this.calendarAttendance().filter(r => r.status === 'present').length, description: this.t('selfService.calendar.standardWorkdays'), tone: 'border-emerald-100 bg-emerald-50/40' },
    { label: this.t('selfService.absent'), value: this.calendarAttendance().filter(r => r.status === 'absent').length, description: this.t('selfService.calendar.unmarkedActivity'), tone: 'border-rose-100 bg-rose-50/40' },
    { label: this.t('selfService.leaves'), value: this.calendarAttendance().filter(r => r.status === 'on_leave').length, description: this.t('selfService.calendar.approvedTimeOff'), tone: 'border-violet-100 bg-violet-50/40' },
    {
      label: this.t('selfService.holidays'),
      value: this.upcomingHolidays().filter((holiday) => {
        const holidayDate = new Date(holiday.date);
        const cursor = this.calendarCursor();
        return holidayDate.getFullYear() === cursor.getFullYear() && holidayDate.getMonth() === cursor.getMonth();
      }).length,
      description: this.t('selfService.calendar.organizationBreaks'),
      tone: 'border-sky-100 bg-sky-50/40'
    }
  ]);

  calendarLegends = computed(() => [
    { key: 'present', label: this.t('selfService.present'), dotClass: 'bg-emerald-500', chipClass: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    { key: 'late', label: this.t('selfService.late'), dotClass: 'bg-amber-500', chipClass: 'border-amber-200 bg-amber-50 text-amber-700' },
    { key: 'absent', label: this.t('selfService.absent'), dotClass: 'bg-rose-500', chipClass: 'border-rose-200 bg-rose-50 text-rose-700' },
    { key: 'leave', label: this.t('selfService.leave'), dotClass: 'bg-violet-500', chipClass: 'border-violet-200 bg-violet-50 text-violet-700' },
    { key: 'holiday', label: this.t('selfService.holiday'), dotClass: 'bg-sky-500', chipClass: 'border-sky-200 bg-sky-50 text-sky-700' },
    { key: 'weekend', label: this.t('selfService.off'), dotClass: 'bg-slate-400', chipClass: 'border-slate-200 bg-slate-50 text-slate-500' }
  ]);

  selectedCalendarViewMetrics = computed(() => {
    const day = this.selectedCalendarDay();
    if (!day) return [];

    const iso = day.iso;
    const record = this.calendarAttendance().find((r) => this.tryIsoDate(r.date) === iso);

    return [
      { label: this.t('selfService.calendar.status'), value: day.label || this.t('selfService.notAvailable') },
      { label: this.t('selfService.calendar.checkIn'), value: record?.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : this.t('selfService.notAvailable') },
      { label: this.t('selfService.calendar.duration'), value: record?.work_hours ? `${record.work_hours}H` : '0H' },
      { label: this.t('selfService.calendar.overtime'), value: '0H' },
      { label: this.t('selfService.calendar.location'), value: record?.location_address || 'HQ' }
    ];
  });

  selectedCalendarViewNotes = computed(() => {
    const day = this.selectedCalendarDay();
    if (!day) return [];
    if (day.statusKey === 'weekend') return [this.t('selfService.calendar.scheduledWeeklyOff')];
    if (day.statusKey === 'holiday') return [this.t('selfService.calendar.organizationHoliday', { name: day.sublabel || day.label })];
    if (day.statusKey === 'leave') return [this.t('selfService.calendar.approvedLeave', { name: day.sublabel || day.label })];
    if (day.statusKey === 'absent') return ['No check-in was recorded for this day.', 'You can review attendance or raise a correction if needed.'];
    if (day.statusKey === 'late') return [day.sublabel || 'Late arrival was recorded for this day.', this.t('selfService.calendar.standardWorkdayRecorded')];
    if (day.statusKey === 'present') return [this.t('selfService.calendar.standardWorkdayRecorded'), this.t('selfService.calendar.noAnomalies')];
    if (day.statusKey === 'upcoming') return ['No attendance data is recorded for this date yet.', 'Select another date to review logged details.'];
    return [this.t('selfService.calendar.noSpecificLogs')];
  });

  ngOnInit() {
    this.currentUser.set(this.authService.getStoredUser() as User | null);
    this.permissionService.syncForUser(this.currentUser());
    this.loadEmployees();
    this.loadAddons();
    this.loadAnnouncements();
    this.loadUpcomingHolidays(this.calendarCursor());
    this.loadCalendarMonth();
    this.loadData();
    this.loadAccessibleModules();
    this.loadSystemSettings();
    this.loadOccasions();
    this.notificationService.loadNotifications();

    this.liveRefreshService.createStream(120000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((trigger) => {
        this.refreshDashboardData(trigger);
      });
  }

  ngOnDestroy(): void {
    if (this.chartRenderFrame !== null) {
      cancelAnimationFrame(this.chartRenderFrame);
      this.chartRenderFrame = null;
    }
    this.attendanceInsightChart?.destroy();
    this.leaveInsightChart?.destroy();
  }

  openAttendanceModal() {
    void this.router.navigate(['/self-service/attendance'], {
      queryParams: { view: 'punch', openModal: 1 },
    });
  }

  loadOccasions() {
    this.employeeService.getOccasions().subscribe({
      next: (occasions: any[]) => {
        const normalized = (occasions || []).map(o => ({
          ...o,
          designation: o.designation?.name || this.t('sidebar.employee')
        }));
        this.teamOccasions.set(normalized);

        if (normalized.length > 0) {
          const first = normalized[0];
          const type = first.isBirthday ? 'Birthday' : 'Anniversary';
          this.specialMessage.set([
            this.t('selfService.specialMessageTitle', { type, name: first.firstName }),
            this.t('selfService.specialMessageBody')
          ]);
          this.playConfetti();
        }
      },
      error: () => {
        this.teamOccasions.set([]);
        this.specialMessage.set([]);
      }
    });
  }

  playConfetti() {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 9999,
      colors: ['#6366f1', '#10b981', '#f59e0b']
    });
  }

  loadData() {
    this.attendanceService.getTodayAttendance().subscribe({
      next: (data) => this.todayStatus.set(data),
      error: () => {
        this.todayStatus.set(null);
        this.scheduleInsightCharts();
      }
    });

    this.attendanceService.getAttendanceHistory().subscribe({
      next: (records: AttendanceRecord[]) => {
        this.recentAttendance.set((records || []).slice(0, 7));
        this.scheduleInsightCharts();
      },
      error: () => {
        this.recentAttendance.set([]);
        this.scheduleInsightCharts();
      }
    });

    this.leaveService.getLeaveBalances().subscribe({
      next: (balances: any[]) => {
        this.leaveBalances.set(balances);
        this.totalLeaveBalance.set(balances.reduce((sum: number, b: any) => sum + (b.remaining || 0), 0));
        this.scheduleInsightCharts();
      },
      error: () => {
        this.leaveBalances.set([]);
        this.scheduleInsightCharts();
      }
    });

    this.leaveService.getLeaveHistory().subscribe({
      next: (requests: any[]) => {
        const normalized = (requests as LeaveRequest[]) || [];
        const sorted = [...normalized].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.leaveHistory.set(sorted);
        const pending = sorted.filter((r: LeaveRequest) => r.status === 'pending');
        this.myLeaveRequests.set(sorted.slice(0, 6));
        this.pendingRequests.set(pending.length);
      },
      error: () => this.myLeaveRequests.set([])
    });

    this.loadProjects();
    this.loadTimesheets();
  }

  private refreshDashboardData(trigger: LiveRefreshTrigger): void {
    this.loadData();
    this.loadCalendarMonth();
    this.notificationService.loadNotifications(trigger !== 'interval');
    this.currentTime.set(new Date().toLocaleTimeString(this.languageService.currentLanguage().locale, { hour: '2-digit', minute: '2-digit' }));

    if (trigger !== 'interval') {
      this.loadAnnouncements();
      this.permissionService.syncForUser(this.currentUser());
    }
  }

  private loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projects: any[]) => {
        this.projects.set((projects || []).map((project) => this.normalizeProjectCard(project)));
      },
      error: () => this.projects.set([])
    });
  }

  private normalizeProjectCard(raw: any): DashboardProjectCard {
    const status = String(raw?.status ?? 'in_progress').toLowerCase();
    const members = Array.isArray(raw?.members) ? raw.members.length : 0;
    return {
      id: Number(raw?.id ?? 0),
      name: String(raw?.name ?? 'Project'),
      description: String(raw?.description ?? this.t('selfService.notAvailable')),
      status,
      statusLabel: status.replace(/_/g, ' '),
      progress: Number(raw?.progress ?? 0),
      deadline: raw?.deadline ?? raw?.endDate ? new Date(raw?.deadline ?? raw?.endDate).toLocaleDateString() : null,
      teamSize: Number(raw?.teamSize ?? raw?.team_size ?? members ?? 0),
      tone: 'bg-sky-50 text-sky-700'
    };
  }

  private loadTimesheets(): void {
    this.timesheetService.getTimesheets().subscribe({
      next: (items: Timesheet[]) => {
        const cards = (items || [])
          .map((item) => this.normalizeTimesheetCard(item))
          .sort((a, b) => new Date(b.workDate).getTime() - new Date(a.workDate).getTime());
        this.timesheets.set(cards.slice(0, 6));
      },
      error: () => this.timesheets.set([])
    });
  }

  private normalizeTimesheetCard(raw: Timesheet): DashboardTimesheetCard {
    return {
      id: Number(raw?.id ?? 0),
      projectName: raw?.project?.name ?? 'General Worklog',
      workDate: String(raw?.date ?? raw?.workDate ?? raw?.log_date ?? new Date().toISOString()),
      hours: Number(raw?.hours ?? raw?.hoursWorked ?? raw?.hours_logged ?? 0),
      description: String(raw?.description ?? this.t('selfService.calendar.noSpecificLogs')),
      status: String(raw?.status ?? 'pending'),
      tone: 'bg-emerald-50 text-emerald-700'
    };
  }

  loadAccessibleModules() {
    const modules = this.permissionService.getAccessibleModules(this.currentUser());
    this.accessibleModules.set(modules.map(m => {
      return {
        key: m.key,
        name: m.name,
        icon: m.key,
        route: m.route,
        description: `Manage your ${m.name} workspace and organizational records.`,
        color: '#6366f1',
        locked: false
      };
    }));
  }

  loadAddons() {
    this.organizationService.getAddons().subscribe({
      next: (addons: any[]) => {
        this.addons.set((addons || []).map(a => this.normalizeAddonCard(a)));
      },
      error: () => this.addons.set([]),
    });
  }

  private normalizeAddonCard(raw: any): AddonCard {
    const slug = String(raw?.slug ?? '').trim().toLowerCase();
    return {
      id: Number(raw?.id ?? 0),
      name: String(raw?.name ?? this.t('common.addons')),
      slug,
      description: String(raw?.description ?? ''),
      isActive: Boolean(raw?.isActive),
      route: this.routeForAddon(slug),
      accent: 'border-slate-200 bg-slate-50/80',
      icon: 'spark',
    };
  }

  private routeForAddon(slug: string): string {
    const routes: Record<string, string> = {
      attendance: '/attendance',
      leave: '/leaves',
      leaves: '/leaves',
      payroll: '/payroll',
      analytics: '/reports',
      reports: '/reports',
      projects: '/projects',
      expenses: '/expenses',
      timesheets: '/timesheets',
      geofence: '/admin/geofence',
      'face-recognition': '/face-registration',
      face_recognition: '/face-registration',
      'visitor-management': '/visit-management',
      visitor_management: '/visit-management',
      visitormanagement: '/visit-management',
    };

    return routes[slug] ?? '/add-ons';
  }

  loadEmployees() {
    this.employeeService.getEmployees().subscribe({
      next: (employees) => this.employees.set((employees as User[]) || []),
      error: () => this.employees.set([]),
    });
  }

  loadAnnouncements(): void {
    this.announcementService.getAnnouncements().subscribe({
      next: (items) => this.announcements.set((items || []).filter((item) => !item.deleted_at)),
      error: () => this.announcements.set([]),
    });
  }

  private loadSystemSettings(): void {
    this.organizationService.getOrganization().subscribe({
      next: (organization) => this.organizationProfile.set(organization),
      error: () => this.organizationProfile.set(null)
    });

    this.attendanceService.getShifts().subscribe({
      next: (shifts: AttendanceShift[]) => {
        this.activeShiftCount.set((shifts || []).filter((shift) => shift.is_active).length);
      },
      error: () => this.activeShiftCount.set(0)
    });

    this.attendanceService.getGeoFenceSettings().subscribe({
      next: (settings) => this.geoFenceSettings.set(settings),
      error: () => this.geoFenceSettings.set(null)
    });

    this.weeklyOffPolicyCount.set(this.readWeeklyOffPolicies().length);
  }

  private readWeeklyOffPolicies(): Array<{ id: string }> {
    try {
      const stored = localStorage.getItem('hrms_weekly_off_policies');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private loadUpcomingHolidays(anchorDate: Date): void {
    const start = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 120);

    const startIso = this.toIsoDate(start);
    const endIso = this.toIsoDate(end);

    if (this.holidayWindowStart() === startIso && this.holidayWindowEnd() === endIso) {
      return;
    }

    this.organizationService.getHolidays().subscribe({
      next: (holidays: OrganizationHoliday[]) => {
        const filtered = (holidays || [])
          .filter((holiday) => holiday.holidayDate >= startIso && holiday.holidayDate <= endIso)
          .sort((a, b) => a.holidayDate.localeCompare(b.holidayDate))
          .map((holiday) => ({
            date: holiday.holidayDate,
            name: holiday.name || this.inferHolidayName(holiday.holidayDate)
          }));

        this.upcomingHolidays.set(filtered);
        this.holidayWindowStart.set(startIso);
        this.holidayWindowEnd.set(endIso);
      },
      error: () => {
        this.upcomingHolidays.set([]);
        this.holidayWindowStart.set(startIso);
        this.holidayWindowEnd.set(endIso);
      }
    });
  }

  private inferHolidayName(date: string): string {
    const suffix = date.slice(5);
    const knownNames: Record<string, string> = {
      '01-26': 'Republic Day',
      '08-15': 'Independence Day',
      '10-02': 'Gandhi Jayanti',
      '12-25': 'Christmas Day',
    };

    return knownNames[suffix] ?? this.t('selfService.holiday');
  }

  loadCalendarMonth(): void {
    const month = this.calendarCursor();
    const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    this.attendanceService.getAttendanceHistory({
      startDate: this.toIsoDate(startDate),
      endDate: this.toIsoDate(endDate),
    }).subscribe({
      next: (records: AttendanceRecord[]) => {
        this.calendarAttendance.set(records || []);
        this.scheduleInsightCharts();
      },
      error: () => {
        this.calendarAttendance.set([]);
        this.scheduleInsightCharts();
      }
    });
  }

  previousCalendarMonth(): void {
    const month = this.calendarCursor();
    this.calendarCursor.set(new Date(month.getFullYear(), month.getMonth() - 1, 1));
    this.loadUpcomingHolidays(this.calendarCursor());
    this.loadCalendarMonth();
  }

  nextCalendarMonth(): void {
    const month = this.calendarCursor();
    this.calendarCursor.set(new Date(month.getFullYear(), month.getMonth() + 1, 1));
    this.loadUpcomingHolidays(this.calendarCursor());
    this.loadCalendarMonth();
  }

  jumpToCurrentMonth(): void {
    const now = new Date();
    this.calendarCursor.set(new Date(now.getFullYear(), now.getMonth(), 1));
    this.loadUpcomingHolidays(this.calendarCursor());
    this.loadCalendarMonth();
  }

  openCalendarDay(day: CalendarDay): void {
    if (day.inCurrentMonth) this.selectedCalendarDay.set(day);
  }

  closeCalendarDay(): void {
    this.selectedCalendarDay.set(null);
  }

  private buildCalendarDays(): CalendarDay[] {
    const month = this.calendarCursor();
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - firstDay.getDay());
    const gridEnd = new Date(lastDay);
    gridEnd.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    const attendanceByDate = new Map(
      this.calendarAttendance()
        .map((r) => {
          const iso = this.tryIsoDate(r.date);
          return iso ? [iso, r] as const : null;
        })
        .filter((entry): entry is readonly [string, AttendanceRecord] => entry !== null)
    );
    const holidaysByDate = new Map(this.upcomingHolidays().map(h => [h.date, h.name]));
    const todayKey = this.toIsoDate(new Date());
    const items: CalendarDay[] = [];

    for (let cursor = new Date(gridStart); cursor <= gridEnd; cursor.setDate(cursor.getDate() + 1)) {
      const date = new Date(cursor);
      const iso = this.toIsoDate(date);
      const inCurrentMonth = date.getMonth() === month.getMonth();
      const meta = this.resolveCalendarMeta(date, attendanceByDate.get(iso), holidaysByDate.get(iso));

      items.push({
        date, iso, dayNumber: date.getDate(), inCurrentMonth, isToday: iso === todayKey,
        ...meta,
        cardClass: `${meta.cardClass} ${iso === todayKey ? 'ring-2 ring-indigo-200 ring-offset-2' : ''}`.trim(),
      });
    }
    return items;
  }

  private resolveCalendarMeta(date: Date, att: AttendanceRecord | undefined, holiday: string | undefined): any {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (holiday) return { statusKey: 'holiday', label: this.t('selfService.holiday'), sublabel: holiday, dotClass: 'bg-sky-500', chipClass: 'border-sky-200 bg-sky-50 text-sky-700', cardClass: 'border-sky-100 bg-sky-50/50' };
    if (att) {
      const normalizedStatus = String(att.status || '').toLowerCase();
      if (normalizedStatus === 'absent') {
        return {
          statusKey: 'absent',
          label: this.t('selfService.absent'),
          sublabel: 'Attendance not marked',
          dotClass: 'bg-rose-500',
          chipClass: 'border-rose-200 bg-rose-50/90 text-rose-700',
          cardClass: 'border-rose-100 bg-gradient-to-br from-rose-50/95 to-white'
        };
      }
      if (normalizedStatus === 'on_leave') {
        return {
          statusKey: 'leave',
          label: this.t('selfService.leave'),
          sublabel: att.notes || this.t('selfService.calendar.approvedTimeOff'),
          dotClass: 'bg-violet-500',
          chipClass: 'border-violet-200 bg-violet-50/90 text-violet-700',
          cardClass: 'border-violet-100 bg-gradient-to-br from-violet-50/95 to-white'
        };
      }
      if (normalizedStatus === 'holiday') {
        return {
          statusKey: 'holiday',
          label: this.t('selfService.holiday'),
          sublabel: att.notes || this.t('selfService.calendar.organizationBreaks'),
          dotClass: 'bg-sky-500',
          chipClass: 'border-sky-200 bg-sky-50/90 text-sky-700',
          cardClass: 'border-sky-100 bg-gradient-to-br from-sky-50/95 to-white'
        };
      }
      const isLate = att.is_late || normalizedStatus === 'late';
      return {
        statusKey: isLate ? 'late' : 'present',
        label: isLate ? this.t('selfService.late') : this.t('selfService.present'),
        sublabel: att.check_in
          ? this.t('selfService.calendar.entryAt', { time: new Date(att.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })
          : this.t('selfService.calendar.marked'),
        dotClass: isLate ? 'bg-amber-500' : 'bg-emerald-500',
        chipClass: isLate ? 'border-amber-200 bg-amber-50/90 text-amber-700' : 'border-emerald-200 bg-emerald-50/90 text-emerald-700',
        cardClass: isLate ? 'border-amber-100 bg-gradient-to-br from-amber-50/95 to-white' : 'border-emerald-100 bg-gradient-to-br from-emerald-50/95 to-white'
      };
    }
    if (isWeekend) return { statusKey: 'weekend', label: this.t('selfService.off'), sublabel: this.t('selfService.calendar.weeklyOffLabel'), dotClass: 'bg-slate-400', chipClass: 'border-slate-200 bg-slate-50/95 text-slate-600', cardClass: 'border-slate-200 bg-gradient-to-br from-slate-50 to-white' };
    return { statusKey: 'upcoming', label: this.t('selfService.calendar.upcoming'), sublabel: this.t('selfService.calendar.standardDay'), dotClass: 'bg-slate-300', chipClass: 'border-slate-200 bg-white/95 text-slate-500', cardClass: 'border-slate-100 bg-white' };
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private tryIsoDate(value: Date | string | null | undefined): string | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return this.toIsoDate(date);
  }

  private scheduleInsightCharts(): void {
    if (typeof window === 'undefined') return;
    if (this.chartRenderFrame !== null) {
      cancelAnimationFrame(this.chartRenderFrame);
    }
    this.chartRenderFrame = requestAnimationFrame(() => {
      this.chartRenderFrame = null;
      this.renderAttendanceInsightChart();
      this.renderLeaveInsightChart();
    });
  }

  private renderAttendanceInsightChart(): void {
    const canvas = document.getElementById('selfServiceAttendanceChart') as HTMLCanvasElement | null;
    if (!canvas) return;

    this.attendanceInsightChart?.destroy();

    const fallbackRecords = this.calendarAttendance()
      .filter((record) => !!record?.date)
      .slice(-7);
    const records = (this.recentAttendance().length ? this.recentAttendance() : fallbackRecords).slice(-7);

    if (!records.length) return;

    const labels = records.map((record) =>
      new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    );

    const hours = records.map((record) =>
      Number(
        record.work_hours ??
        0,
      ),
    );

    this.attendanceInsightChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Work Hours',
            data: hours,
            backgroundColor: records.map((record) => {
              const status = String(record.status ?? '').toLowerCase();
              if (status === 'late') return '#f59e0b';
              if (status === 'absent') return '#f43f5e';
              if (status === 'on_leave') return '#8b5cf6';
              return '#0f766e';
            }),
            borderRadius: 8,
            maxBarThickness: 42,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: '#e2e8f0' } },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  private renderLeaveInsightChart(): void {
    const canvas = document.getElementById('selfServiceLeaveChart') as HTMLCanvasElement | null;
    if (!canvas) return;

    this.leaveInsightChart?.destroy();

    const balances = this.leaveBalances().filter((item) => Number(item?.remaining ?? item?.balance ?? 0) > 0);
    if (!balances.length) return;

    this.leaveInsightChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: balances.map((item) => String(item?.type ?? item?.name ?? 'Leave')),
        datasets: [
          {
            data: balances.map((item) => Number(item?.remaining ?? item?.balance ?? 0)),
            backgroundColor: ['#0f766e', '#14b8a6', '#6366f1', '#f59e0b', '#ec4899', '#38bdf8'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, font: { weight: 'bold', size: 10 } },
          },
        },
      },
    });
  }

  teammates = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    return this.employees().filter(m => m.managerId === user.managerId && m.id !== user.id);
  });

  currentUserFullName = computed(() => {
    const user = this.currentUser();
    return [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  });

  currentManagerName = computed(() => {
    const user = this.currentUser();
    if (!user?.managerId) {
      return '';
    }

    const manager = this.employees().find((employee) => employee.id === user.managerId);
    return [manager?.firstName, manager?.lastName].filter(Boolean).join(' ').trim();
  });

  reportees = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    return this.employees().filter(m => m.managerId === user.id);
  });

  isManager(): boolean {
    return (
      this.permissionService.isManagerialUser(this.currentUser()) ||
      this.reportees().length > 0
    );
  }

  canAccess(path: string): boolean {
    return this.permissionService.canAccessRoute(this.currentUser(), path);
  }

  navigateTo(path: string) {
    if (!path) return;
    if (!this.canAccess(path)) {
      this.toastService.info('This workspace is not available in your current access scope.');
      this.router.navigateByUrl('/dashboard');
      return;
    }
    this.router.navigateByUrl(path);
  }

  openSupport() {
    this.navigateTo('/reports-center');
  }
}
