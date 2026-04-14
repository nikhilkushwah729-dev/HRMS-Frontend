import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

// Widgets
import { EssGreetingComponent } from './ess-dashboard/widgets/ess-greeting.component';
import { EssStatsComponent, InsightCard } from './ess-dashboard/widgets/ess-stats.component';
import { EssNetworkHubComponent } from './ess-dashboard/widgets/ess-network-hub.component';
import { EssAttendanceCenterComponent } from './ess-dashboard/widgets/ess-attendance-center.component';
import { EssPulseComponent, DashboardHighlight } from './ess-dashboard/widgets/ess-pulse.component';
import { EssAnnouncementsComponent } from './ess-dashboard/widgets/ess-announcements.component';
import { EssWorkflowCenterComponent, WorkflowCenterCard } from './ess-dashboard/widgets/ess-workflow-center.component';
import { EssQuickActionsComponent, QuickAction } from './ess-dashboard/widgets/ess-quick-actions.component';
import { EssCalendarComponent, CalendarDay } from './ess-dashboard/widgets/ess-calendar.component';
import { EssLeaveBalanceComponent } from './ess-dashboard/widgets/ess-leave-balance.component';
import { EssHolidaysComponent } from './ess-dashboard/widgets/ess-holidays.component';
import { EssRequestsLedgerComponent } from './ess-dashboard/widgets/ess-requests-ledger.component';
import { EssWorkbenchComponent, WorkbenchProject, WorkbenchTimesheet } from './ess-dashboard/widgets/ess-workbench.component';
import { EssTeamEngagementComponent } from './ess-dashboard/widgets/ess-team-engagement.component';

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
import { LiveRefreshService } from '../../core/services/live-refresh.service';
import { ReportService, DailyReport } from '../../core/services/report.service';
import { ToastService } from '../../core/services/toast.service';

// Models
import { User } from '../../core/models/auth.model';
import confetti from 'canvas-confetti';
import { TodayAttendance } from '../../core/services/attendance.service';
import { Timesheet } from '../../core/services/timesheet.service';
import { Organization } from '../../core/services/organization.service';
import { GeoFenceSettings, AttendanceShift } from '../../core/services/attendance.service';

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
    EssWorkflowCenterComponent,
    EssQuickActionsComponent,
    EssCalendarComponent,
    EssLeaveBalanceComponent,
    EssHolidaysComponent,
    EssRequestsLedgerComponent,
    EssWorkbenchComponent,
    EssTeamEngagementComponent
  ],
  template: `
    <div class="min-h-full p-2">
      <div class="mx-auto max-w-[1600px] space-y-5">
        <section class="app-module-hero">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div class="max-w-3xl">
              <p class="app-module-kicker">Self Service Workspace</p>
              <h1 class="app-module-title mt-3">Manage attendance, leave, requests, and team visibility from one place</h1>
              <p class="app-module-text mt-3">
                This self-service space follows the same UbiTech-style experience as the rest of your HRMS modules, with clear actions, live summaries, and employee-first workflows.
              </p>
            </div>
            <div class="app-module-highlight min-w-[260px]">
              <span class="app-module-highlight-label">Today focus</span>
              <div class="app-module-highlight-value mt-3">
                {{ todayStatus()?.is_clocked_in ? 'Attendance Active' : 'Ready To Start' }}
              </div>
              <p class="mt-2 text-sm text-white/80">
                Pending requests: {{ pendingRequests() }} | Leave balance: {{ totalLeaveBalance() }} days
              </p>
            </div>
          </div>
        </section>

        <app-ess-greeting 
          [user]="currentUser()" 
          [specialMessage]="specialMessage()" 
          [currentTime]="currentTime()"
          (navigate)="navigateTo($event)"
          (closeBanner)="specialMessage.set([])">
        </app-ess-greeting>

        <div class="space-y-6">
          <!-- Quick Glance Stats -->
          <app-ess-stats [stats]="workspaceStats()"></app-ess-stats>

          <!-- Main Dashboard Grid: Modern Keka-style 2-Column Split -->
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            <!-- Left Column: Main Feed/Activity (8/12) -->
            <div class="xl:col-span-8 space-y-6">
              
              <!-- Network Hub: "Who's In" Feel -->
              <app-ess-network-hub 
                [teammates]="teammates()" 
                [reportees]="reportees()"
                (navigate)="navigateTo($event)"
                class="min-h-[500px]">
              </app-ess-network-hub>

              <!-- Workspace Highlights -->
              <app-ess-pulse 
                [highlights]="workspaceHighlights()" 
                [unreadCount]="notificationService.unreadCount()"
                class="min-h-[430px]">
              </app-ess-pulse>

              <!-- Request History & Tracking -->
              <app-ess-requests-ledger 
                [requests]="myLeaveRequests()"
                (viewAll)="navigateTo('/leaves')"
                class="min-h-[460px]">
              </app-ess-requests-ledger>

              <!-- Full Attendance Calendar -->
              <app-ess-calendar 
                [monthLabel]="calendarCursor() | date:'MMMM yyyy'"
                [summary]="calendarSummary()"
                [legends]="calendarLegends"
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
                class="min-h-[700px]">
              </app-ess-calendar>

              <!-- Organizational Announcements -->
              <app-ess-announcements [announcement]="announcements()[0]"></app-ess-announcements>

              <div class="grid grid-cols-1 2xl:grid-cols-2 gap-6">
                <app-ess-quick-actions
                  [actions]="quickActions"
                  (navigate)="navigateTo($event)"
                  class="min-h-[340px]">
                </app-ess-quick-actions>

                <app-ess-workflow-center
                  [workflows]="workflowCenter()"
                  (navigate)="navigateTo($event)"
                  class="min-h-[340px]">
                </app-ess-workflow-center>
              </div>

              <app-ess-workbench
                [projects]="projectWorkbench()"
                [timesheets]="timesheetWorkbench()"
                (navigate)="navigateTo($event)"
                class="min-h-[420px]">
              </app-ess-workbench>
            </div>

            <!-- Right Column: Personal & Team Context (4/12) - STICKY -->
            <div class="xl:col-span-4 space-y-6 xl:sticky xl:top-6">
              
              <!-- Real-time Web Clock -->
              <app-ess-attendance-center [todayStatus]="todayStatus()" class="min-h-[480px]"></app-ess-attendance-center>

              <!-- Rapid Leave Balances -->
              <app-ess-leave-balance 
                [balances]="leaveBalances()"
                (requestLeave)="navigateTo('/leaves')"
                class="min-h-[480px]">
              </app-ess-leave-balance>

              <!-- Holiday Countdown -->
              <app-ess-holidays [holidays]="upcomingHolidays()" class="min-h-[400px]"></app-ess-holidays>

              <!-- Team Engagement (Birthdays/Anniversary) -->
              <app-ess-team-engagement [occasions]="teamOccasions()" class="min-h-[400px]"></app-ess-team-engagement>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,

})
export class SelfServiceComponent implements OnInit {
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
  private reportService = inject(ReportService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  currentUser = signal<User | null>(null);
  currentTime = signal<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
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

  calendarGrid = computed(() => this.buildCalendarDays());

  workspaceStats = computed<InsightCard[]>(() => [
    {
      label: 'Workforce Strength',
      value: this.employees().length.toString(),
      description: 'Active personnel in your network.',
      tone: 'border-indigo-100 bg-indigo-50/30',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
    },
    {
      label: 'Leave Portfolio',
      value: `${this.totalLeaveBalance()} Days`,
      description: 'Available time-off across all buckets.',
      tone: 'border-emerald-100 bg-emerald-50/30',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>'
    },
    {
      label: 'Request Activity',
      value: `${this.pendingRequests()} Pending`,
      description: 'Active requests awaiting approval.',
      tone: 'border-amber-100 bg-amber-50/30',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'
    },
    {
      label: 'Active Projects',
      value: this.projects().length.toString(),
      description: 'Concurrent projects under tracking.',
      tone: 'border-sky-100 bg-sky-50/30',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2s-7 7-9.38 11z"/><path d="M9 12H4s.5-1 1-2c2-3.7 6.4-5.3 10.1-3.6z"/><path d="M15 9v5s1-.5 2-1c3.7-2 5.3-6.4 3.6-10.1z"/></svg>'
    },
  ]);

  workspaceHighlights = computed<DashboardHighlight[]>(() => {
    const list: DashboardHighlight[] = [];
    const status = this.todayStatus();
    if (status?.is_clocked_in && status.check_in) {
      list.push({ id: 'att', name: 'Attendance Active', message: `You clocked in at ${new Date(status.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Keep up the great work!`, tone: 'border-emerald-100 bg-emerald-50/50' });
    }
    if (this.pendingRequests() > 0) {
      list.push({ id: 'leave', name: 'Pending Approvals', message: `You have ${this.pendingRequests()} leave request(s) awaiting review.`, tone: 'border-amber-100 bg-amber-50/50' });
    }
    const latestTimesheet = this.timesheets()[0];
    if (latestTimesheet) {
      list.push({
        id: 'time',
        name: 'Latest Timesheet',
        message: `${latestTimesheet.projectName} logged for ${latestTimesheet.hours}h on ${new Date(latestTimesheet.workDate).toLocaleDateString()}.`,
        tone: 'border-sky-100 bg-sky-50/50'
      });
    }
    const latestAnnouncement = this.announcements()[0];
    if (latestAnnouncement?.title) {
      list.push({
        id: 'announce',
        name: 'Org Update',
        message: latestAnnouncement.title,
        tone: 'border-violet-100 bg-violet-50/50'
      });
    }
    const projects = this.projects().filter(p => p.progress < 50);
    if (projects.length > 0) {
      list.push({ id: 'proj', name: 'Project Focus', message: `${projects[0].name} requires attention (Progress: ${projects[0].progress}%).`, tone: 'border-indigo-100 bg-indigo-50/50' });
    }
    if (this.isManager() && this.activeShiftCount() === 0) {
      list.push({
        id: 'setup',
        name: 'Settings Attention',
        message: 'No active shift policy found. Configure attendance settings to keep self-service accurate.',
        tone: 'border-rose-100 bg-rose-50/50'
      });
    }
    if (list.length < 3) {
      list.push({ id: 'well', name: 'Organization Pulse', message: 'All systems operational. Have a productive day ahead!', tone: 'border-slate-100 bg-slate-50/50' });
    }
    return list.slice(0, 3);
  });

  settingsHealthItems = computed(() => [
    { label: 'Organization', value: this.organizationProfile()?.name || this.currentUser()?.organizationName || 'Not configured' },
    { label: 'Active Shifts', value: `${this.activeShiftCount()}` },
    { label: 'Geo-Fence', value: this.geoFenceSettings()?.geofence_enabled ? 'Enabled' : 'Disabled' },
    { label: 'Weekly Off', value: this.weeklyOffPolicyCount() === 1 ? '1 policy' : `${this.weeklyOffPolicyCount()} policies` }
  ]);

  calendarSummary = computed(() => [
    { label: 'Present', value: this.calendarAttendance().filter(r => r.status === 'present').length, description: 'Standard workdays' },
    { label: 'Absent', value: this.calendarAttendance().filter(r => r.status === 'absent').length, description: 'Unmarked activity' },
    { label: 'Leaves', value: this.calendarAttendance().filter(r => r.status === 'on_leave').length, description: 'Approved time-off' },
    {
      label: 'Holidays',
      value: this.upcomingHolidays().filter((holiday) => {
        const holidayDate = new Date(holiday.date);
        const cursor = this.calendarCursor();
        return holidayDate.getFullYear() === cursor.getFullYear() && holidayDate.getMonth() === cursor.getMonth();
      }).length,
      description: 'Organization breaks'
    }
  ]);

  calendarLegends = [
    { key: 'present', label: 'Present', dotClass: 'bg-emerald-500', chipClass: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    { key: 'late', label: 'Late', dotClass: 'bg-amber-500', chipClass: 'border-amber-200 bg-amber-50 text-amber-700' },
    { key: 'absent', label: 'Absent', dotClass: 'bg-rose-500', chipClass: 'border-rose-200 bg-rose-50 text-rose-700' },
    { key: 'leave', label: 'Leave', dotClass: 'bg-violet-500', chipClass: 'border-violet-200 bg-violet-50 text-violet-700' },
    { key: 'holiday', label: 'Holiday', dotClass: 'bg-sky-500', chipClass: 'border-sky-200 bg-sky-50 text-sky-700' },
    { key: 'weekend', label: 'Off', dotClass: 'bg-slate-400', chipClass: 'border-slate-200 bg-slate-50 text-slate-500' }
  ];

  selectedCalendarViewMetrics = computed(() => {
    const day = this.selectedCalendarDay();
    if (!day) return [];

    const iso = day.iso;
    const record = this.calendarAttendance().find(r => this.toIsoDate(new Date(r.date)) === iso);

    return [
      { label: 'Check-in', value: record?.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A' },
      { label: 'Duration', value: record?.work_hours ? `${record.work_hours}H` : '0H' },
      { label: 'Overtime', value: '0H' },
      { label: 'Location', value: 'HQ' }
    ];
  });

  selectedCalendarViewNotes = computed(() => {
    const day = this.selectedCalendarDay();
    if (!day) return [];
    if (day.statusKey === 'weekend') return ['Scheduled weekly off day.'];
    if (day.statusKey === 'holiday') return [`Organization Holiday: ${day.sublabel}`];
    if (day.statusKey === 'leave') return [`Approved Leave: ${day.label}`];
    if (day.statusKey === 'present') return ['Standard workday recorded.', 'No anomalies detected.'];
    return ['No specific activity logs for this day.'];
  });

  quickActions: QuickAction[] = [
    { title: 'Clock In Now', description: 'Start your shift', route: '/attendance', icon: 'clock-3', tone: 'primary' },
    { title: 'Apply Leave', description: 'Request time off', route: '/leaves', icon: 'calendar-plus', tone: 'success' },
    { title: 'My Requests', description: 'Track approvals', route: '/leaves', icon: 'layout-grid', tone: 'warning' },
    { title: 'Timesheets', description: 'Log project hours', route: '/timesheets', icon: 'clock-3', tone: 'slate' },
    { title: 'My Profile', description: 'Update personal details', route: '/profile', icon: 'spark', tone: 'warning' },
    { title: 'Open Reports', description: 'Insights & history', route: '/reports-center', icon: 'chart-column', tone: 'slate' },
    { title: 'More Add-ons', description: 'Explore extensions', route: '/add-ons', icon: 'blocks', tone: 'primary' }
  ];

  workflowCenter = computed<WorkflowCenterCard[]>(() => {
    const isAdmin = this.isManager();
    const list: WorkflowCenterCard[] = [];

    if (isAdmin) {
      list.push({ key: 'rev', title: 'Review Employees', description: 'Manage profiles and access governance.', route: '/employees', tone: 'border-indigo-100 bg-indigo-50/50', badge: 'ADMIN' });
      list.push({ key: 'att', title: 'Team Attendance', description: 'Real-time monitoring of department shifts.', route: '/admin/team-attendance', tone: 'border-emerald-100 bg-emerald-50/50', badge: 'LEAD' });
    }

    list.push({ key: 'his', title: 'Activity History', description: 'Comprehensive insight view of attendance and HR trends.', route: '/reports-center', tone: 'border-slate-100 bg-slate-50/50', badge: 'SELF' });
    list.push({ key: 'req', title: 'Request Center', description: 'Open leave actions, and status tracking.', route: '/leaves', tone: 'border-violet-100 bg-violet-50/50', badge: 'ESS' });
    return list;
  });

  projectWorkbench = computed<WorkbenchProject[]>(() =>
    this.projects().slice(0, 4).map((project) => ({
      id: Number(project.id),
      name: project.name,
      progress: project.progress,
      statusLabel: project.statusLabel,
      deadline: project.deadline,
      teamSize: project.teamSize
    }))
  );

  timesheetWorkbench = computed<WorkbenchTimesheet[]>(() =>
    this.timesheets().slice(0, 4).map((entry) => ({
      id: Number(entry.id),
      projectName: entry.projectName,
      workDate: entry.workDate,
      hours: entry.hours,
      description: entry.description,
      status: entry.status
    }))
  );

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

    this.liveRefreshService.createStream(30000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadData();
        this.loadEmployees();
        this.loadAddons();
        this.loadAnnouncements();
        this.loadCalendarMonth();
        this.permissionService.syncForUser(this.currentUser());
        this.notificationService.loadNotifications();
        this.loadSystemSettings();
        this.currentTime.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      });
  }

  loadOccasions() {
    this.employeeService.getOccasions().subscribe({
      next: (occasions: any[]) => {
        const normalized = (occasions || []).map(o => ({
          ...o,
          designation: o.designation?.name || 'Employee'
        }));
        this.teamOccasions.set(normalized);

        if (normalized.length > 0) {
          const first = normalized[0];
          const type = first.isBirthday ? 'Birthday' : 'Anniversary';
          this.specialMessage.set([
            `Happy ${type}, ${first.firstName}!`,
            `Wishing you a fantastic day and continued success with us.`
          ]);
          this.playConfetti();
        }
      },
      error: () => {
        const mock = [
          { id: 101, firstName: 'Aarav', lastName: 'Sharma', designation: 'Senior Designer', isBirthday: true, avatar: null },
          { id: 102, firstName: 'Ishani', lastName: 'Mehta', designation: 'HR lead', isBirthday: false, avatar: null }
        ];
        this.teamOccasions.set(mock);

        const today = new Date();
        if (today.getDate() === 1) {
          this.specialMessage.set(['Happy New Year!', 'Wishing you a year filled with joy and success!']);
          this.playConfetti();
        }
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
        const today = new Date();
        const checkInTime = new Date(today);
        checkInTime.setHours(9, 0, 0, 0);
        this.todayStatus.set({
          is_clocked_in: true,
          is_clocked_out: false,
          check_in: checkInTime.toISOString(),
          check_out: null,
          current_status: 'working',
          break_time_minutes: 0,
          total_work_hours: 6.5,
          overtime_hours: 0
        });
      }
    });

    this.leaveService.getLeaveBalances().subscribe({
      next: (balances: any[]) => {
        this.leaveBalances.set(balances);
        this.totalLeaveBalance.set(balances.reduce((sum: number, b: any) => sum + (b.remaining || 0), 0));
      },
      error: () => this.leaveBalances.set([])
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
      description: String(raw?.description ?? 'N/A'),
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
      description: String(raw?.description ?? 'No notes added'),
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
      name: String(raw?.name ?? 'Add-on'),
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

    const requests: Array<ReturnType<ReportService['getDailyReport']>> = [];
    for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      requests.push(this.reportService.getDailyReport(this.toIsoDate(cursor)));
    }

    forkJoin(requests).subscribe({
      next: (days: DailyReport[]) => {
        const holidays = days
          .filter((day) => day.holidays > 0)
          .map((day) => ({
            date: day.date,
            name: this.inferHolidayName(day.date)
          }));

        this.upcomingHolidays.set(holidays);
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

    return knownNames[suffix] ?? 'Organization Holiday';
  }

  loadCalendarMonth(): void {
    const month = this.calendarCursor();
    const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    this.attendanceService.getAttendanceHistory({
      startDate: this.toIsoDate(startDate),
      endDate: this.toIsoDate(endDate),
    }).subscribe({
      next: (records: AttendanceRecord[]) => this.calendarAttendance.set(records || []),
      error: () => this.calendarAttendance.set([])
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

    const attendanceByDate = new Map(this.calendarAttendance().map(r => [this.toIsoDate(new Date(r.date)), r]));
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
    if (holiday) return { statusKey: 'holiday', label: 'Holiday', sublabel: holiday, dotClass: 'bg-sky-500', chipClass: 'border-sky-200 bg-sky-50 text-sky-700', cardClass: 'border-sky-100 bg-sky-50/50' };
    if (att) {
      const isLate = att.is_late || (att.status === 'late');
      return {
        statusKey: isLate ? 'late' : 'present',
        label: isLate ? 'Late' : 'Present',
        sublabel: att.check_in ? `Entry: ${new Date(att.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Marked',
        dotClass: isLate ? 'bg-amber-500' : 'bg-emerald-500',
        chipClass: isLate ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700',
        cardClass: isLate ? 'border-amber-100 bg-amber-50/40' : 'border-emerald-100 bg-emerald-50/40'
      };
    }
    if (isWeekend) return { statusKey: 'weekend', label: 'Weekend', sublabel: 'Weekly Off', dotClass: 'bg-slate-400', chipClass: 'border-slate-200 bg-slate-50 text-slate-500', cardClass: 'border-slate-100 bg-slate-50/30' };
    return { statusKey: 'upcoming', label: 'Upcoming', sublabel: 'Standard Day', dotClass: 'bg-slate-200', chipClass: 'border-slate-100 bg-white text-slate-400', cardClass: 'border-slate-100 bg-white' };
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  teammates = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    return this.employees().filter(m => m.managerId === user.managerId && m.id !== user.id);
  });

  reportees = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    return this.employees().filter(m => m.managerId === user.id);
  });

  isManager(): boolean {
    const roleId = this.currentUser()?.roleId ?? 5;
    return roleId === 1 || roleId === 2 || roleId === 3 || roleId === 4 || this.reportees().length > 0;
  }

  navigateTo(path: string) {
    this.router.navigateByUrl(path);
  }

  openSupport() {
    this.router.navigateByUrl('/reports-center');
  }
}
