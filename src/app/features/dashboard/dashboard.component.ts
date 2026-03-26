import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import type { User } from '../../core/models/auth.model';
import { AttendanceService, TodayAttendance } from '../../core/services/attendance.service';

interface UpcomingHoliday {
  date: string;
  name: string;
}

interface Birthday {
  name: string;
  date: string;
  department: string;
}

interface WorkAnniversary {
  name: string;
  years: number;
}

interface QuickLink {
  title: string;
  description: string;
  route: string;
  tone: string;
}

interface ModuleCard {
  title: string;
  description: string;
  route: string;
  badge: string;
  accent: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-page">
      <section class="hero">
        <div class="hero-copy">
          <p class="hero-eyebrow">{{ greeting() }}</p>
          <h1>{{ getFullName() }}</h1>
          <p class="hero-description">
            Your HRMS overview is now organized around what matters today: attendance, requests, celebrations, and the next action.
          </p>

          <div class="hero-actions">
            <a routerLink="/attendance" class="hero-btn hero-btn-primary">Open Attendance</a>
            <a routerLink="/leaves" class="hero-btn hero-btn-secondary">Manage Leaves</a>
            <a routerLink="/profile" class="hero-btn hero-btn-ghost">View Profile</a>
          </div>
        </div>

        <aside class="hero-panel">
          <div class="hero-panel-top">
            <span class="live-dot" [class.live-dot-on]="todayAttendance()?.is_clocked_in"></span>
            <span>{{ todayAttendance()?.is_clocked_in ? 'Workday live' : 'Waiting for check-in' }}</span>
          </div>

          <div class="hero-panel-value">{{ attendanceHeadline() }}</div>
          <p class="hero-panel-copy">{{ attendanceSubline() }}</p>

          <div class="hero-meta-grid">
            <div class="hero-meta-card">
              <span>Current time</span>
              <strong>{{ currentTime() }}</strong>
            </div>
            <div class="hero-meta-card">
              <span>Today</span>
              <strong>{{ currentDay() }}</strong>
            </div>
            <div class="hero-meta-card">
              <span>Hours</span>
              <strong>{{ totalHours() }}</strong>
            </div>
            <div class="hero-meta-card">
              <span>Shift</span>
              <strong>{{ shiftName() }}</strong>
            </div>
          </div>

          @if (todayAttendance()?.is_clocked_in) {
            <button class="hero-wide-action hero-wide-action-muted" type="button" disabled>
              Attendance already recorded
            </button>
          } @else {
            <button class="hero-wide-action" type="button" (click)="markAttendance()">
              Mark attendance now
            </button>
          }
        </aside>
      </section>

      <section class="stats-grid">
        <article class="stat-card">
          <p>Pending requests</p>
          <h2>{{ pendingRequests() }}</h2>
          <span>Leaves and approvals waiting today</span>
        </article>
        <article class="stat-card stat-card-accent">
          <p>Upcoming holidays</p>
          <h2>{{ upcomingHolidays().length }}</h2>
          <span>Planned in the next few weeks</span>
        </article>
        <article class="stat-card">
          <p>Birthdays</p>
          <h2>{{ birthdays().length }}</h2>
          <span>People to celebrate today</span>
        </article>
        <article class="stat-card">
          <p>Anniversaries</p>
          <h2>{{ workAnniversaries().length }}</h2>
          <span>Milestones worth recognizing</span>
        </article>
      </section>

      <section class="module-hub">
        <div class="panel-head">
          <div>
            <p class="panel-eyebrow">Module hub</p>
            <h3>Core HRMS workspaces</h3>
          </div>
          <span class="module-summary">{{ moduleCards().length }} active work areas</span>
        </div>

        <div class="module-grid">
          @for (module of moduleCards(); track module.route) {
            <a [routerLink]="module.route" class="module-card" [ngClass]="module.accent">
              <div class="module-card-top">
                <span class="module-badge">{{ module.badge }}</span>
                <span class="module-link">Open</span>
              </div>
              <strong>{{ module.title }}</strong>
              <p>{{ module.description }}</p>
            </a>
          }
        </div>
      </section>

      <section class="content-grid">
        <article class="panel">
          <div class="panel-head">
            <div>
              <p class="panel-eyebrow">Quick actions</p>
              <h3>Move faster from the dashboard</h3>
            </div>
          </div>

          <div class="quick-links">
            @for (link of quickLinks(); track link.route) {
              <a [routerLink]="link.route" class="quick-link" [ngClass]="link.tone">
                <strong>{{ link.title }}</strong>
                <span>{{ link.description }}</span>
              </a>
            }
          </div>
        </article>

        <article class="panel panel-dark">
          <div class="panel-head">
            <div>
              <p class="panel-eyebrow panel-eyebrow-dark">Attendance focus</p>
              <h3>Today's work snapshot</h3>
            </div>
          </div>

          <div class="focus-list">
            <div class="focus-row">
              <span>Status</span>
              <strong>{{ todayAttendance()?.current_status || 'offline' }}</strong>
            </div>
            <div class="focus-row">
              <span>Check in</span>
              <strong>{{ attendanceTime(todayAttendance()?.check_in) }}</strong>
            </div>
            <div class="focus-row">
              <span>Break time</span>
              <strong>{{ breakTime() }}</strong>
            </div>
            <div class="focus-row">
              <span>Overtime</span>
              <strong>{{ overtime() }}</strong>
            </div>
          </div>
        </article>
      </section>

      <section class="content-grid">
        <article class="panel">
          <div class="panel-head">
            <div>
              <p class="panel-eyebrow">Upcoming holidays</p>
              <h3>Plan ahead with confidence</h3>
            </div>
          </div>

          <div class="list-stack">
            @for (holiday of upcomingHolidays(); track holiday.date) {
              <div class="list-row">
                <div>
                  <strong>{{ holiday.name }}</strong>
                  <span>{{ holiday.date | date:'EEEE, MMM d' }}</span>
                </div>
                <span class="badge badge-calm">{{ daysUntilLabel(holiday.date) }}</span>
              </div>
            } @empty {
              <div class="empty-state">
                <strong>No upcoming holidays</strong>
                <span>Your next holiday will show here automatically.</span>
              </div>
            }
          </div>
        </article>

        <article class="panel">
          <div class="panel-head">
            <div>
              <p class="panel-eyebrow">Celebrations</p>
              <h3>People moments for today</h3>
            </div>
          </div>

          <div class="list-stack">
            @for (birthday of birthdays(); track birthday.name) {
              <div class="list-row">
                <div>
                  <strong>{{ birthday.name }}</strong>
                  <span>{{ birthday.department }} | Birthday</span>
                </div>
                <span class="badge badge-warm">{{ birthday.date }}</span>
              </div>
            }

            @for (anniversary of workAnniversaries(); track anniversary.name) {
              <div class="list-row">
                <div>
                  <strong>{{ anniversary.name }}</strong>
                  <span>Work anniversary</span>
                </div>
                <span class="badge badge-calm">{{ anniversary.years }} years</span>
              </div>
            }

            @if (birthdays().length === 0 && workAnniversaries().length === 0) {
              <div class="empty-state">
                <strong>No celebrations today</strong>
                <span>This section will fill in when there are birthdays or milestones.</span>
              </div>
            }
          </div>
        </article>
      </section>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .dashboard-page {
      display: grid;
      gap: 1.5rem;
      color: #0f172a;
    }

    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.9fr);
      gap: 1.25rem;
      padding: 1.5rem;
      border-radius: 32px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      background:
        radial-gradient(circle at top left, rgba(245, 158, 11, 0.2), transparent 24rem),
        radial-gradient(circle at bottom right, rgba(20, 184, 166, 0.18), transparent 20rem),
        linear-gradient(135deg, #fff8ed 0%, #f8fafc 45%, #ecfeff 100%);
      box-shadow: 0 28px 60px -40px rgba(15, 23, 42, 0.34);
    }

    .hero-copy,
    .hero-panel,
    .panel,
    .stat-card {
      border-radius: 28px;
    }

    .hero-copy {
      padding: 0.5rem;
    }

    .hero-eyebrow,
    .panel-eyebrow {
      margin: 0;
      font-size: 0.74rem;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #b45309;
    }

    .panel-eyebrow-dark {
      color: rgba(251, 191, 36, 0.84);
    }

    .hero h1 {
      margin: 0.85rem 0 0;
      font-family: 'Sora', 'Inter', sans-serif;
      font-size: clamp(2.4rem, 5vw, 4.5rem);
      line-height: 0.94;
      letter-spacing: -0.05em;
      font-weight: 800;
    }

    .hero-description,
    .hero-panel-copy,
    .quick-link span,
    .list-row span,
    .empty-state span {
      color: #475569;
      line-height: 1.65;
    }

    .hero-description {
      margin: 1rem 0 0;
      max-width: 42rem;
      font-size: 1rem;
    }

    .hero-actions {
      display: flex;
      gap: 0.8rem;
      flex-wrap: wrap;
      margin-top: 1.5rem;
    }

    .hero-btn,
    .hero-wide-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 3rem;
      padding: 0.9rem 1.15rem;
      border-radius: 18px;
      font-weight: 700;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .hero-btn:hover,
    .hero-wide-action:hover,
    .quick-link:hover {
      transform: translateY(-1px);
    }

    .hero-btn-primary,
    .hero-wide-action {
      background: linear-gradient(135deg, #0f766e, #115e59);
      color: #fff;
      box-shadow: 0 18px 34px -24px rgba(15, 118, 110, 0.55);
    }

    .hero-btn-secondary {
      background: #fff;
      color: #0f172a;
      border: 1px solid rgba(148, 163, 184, 0.22);
    }

    .hero-btn-ghost,
    .hero-wide-action-muted {
      background: rgba(15, 23, 42, 0.06);
      color: #334155;
      border: 1px solid rgba(148, 163, 184, 0.18);
    }

    .hero-panel,
    .panel,
    .stat-card {
      padding: 1.35rem;
      border: 1px solid rgba(148, 163, 184, 0.16);
      background: rgba(255, 255, 255, 0.86);
      box-shadow: 0 22px 46px -34px rgba(15, 23, 42, 0.28);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .hero-panel-top {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 0.84rem;
      font-weight: 700;
      color: #475569;
    }

    .live-dot {
      width: 0.7rem;
      height: 0.7rem;
      border-radius: 999px;
      background: #94a3b8;
      box-shadow: 0 0 0 6px rgba(148, 163, 184, 0.16);
    }

    .live-dot-on {
      background: #14b8a6;
      box-shadow: 0 0 0 6px rgba(20, 184, 166, 0.18);
    }

    .hero-panel-value {
      margin-top: 1rem;
      font-family: 'Sora', 'Inter', sans-serif;
      font-size: clamp(1.9rem, 3vw, 2.7rem);
      line-height: 1;
      letter-spacing: -0.05em;
      font-weight: 800;
    }

    .hero-meta-grid,
    .stats-grid,
    .content-grid,
    .quick-links,
    .module-grid {
      display: grid;
      gap: 1rem;
    }

    .hero-meta-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin-top: 1.15rem;
    }

    .hero-meta-card {
      padding: 0.9rem;
      border-radius: 20px;
      background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.96));
      border: 1px solid rgba(148, 163, 184, 0.14);
    }

    .hero-meta-card span,
    .stat-card p {
      display: block;
      margin: 0;
      font-size: 0.74rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #64748b;
    }

    .hero-meta-card strong {
      display: block;
      margin-top: 0.35rem;
      font-size: 1rem;
    }

    .hero-wide-action {
      width: 100%;
      margin-top: 1.15rem;
      border: 0;
    }

    .stats-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .module-hub {
      padding: 1.35rem;
      border-radius: 28px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      background:
        radial-gradient(circle at top right, rgba(20, 184, 166, 0.08), transparent 14rem),
        radial-gradient(circle at bottom left, rgba(245, 158, 11, 0.08), transparent 16rem),
        rgba(255, 255, 255, 0.9);
      box-shadow: 0 22px 46px -34px rgba(15, 23, 42, 0.28);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .module-summary {
      display: inline-flex;
      align-items: center;
      min-height: 2rem;
      padding: 0.2rem 0.8rem;
      border-radius: 999px;
      background: rgba(15, 118, 110, 0.08);
      color: #0f766e;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .module-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin-top: 1.2rem;
    }

    .module-card {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      min-height: 12rem;
      padding: 1.1rem;
      border-radius: 24px;
      border: 1px solid rgba(148, 163, 184, 0.12);
      box-shadow: 0 18px 40px -34px rgba(15, 23, 42, 0.26);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .module-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 24px 46px -34px rgba(15, 23, 42, 0.34);
    }

    .module-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .module-badge,
    .module-link {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .module-badge {
      display: inline-flex;
      align-items: center;
      min-height: 1.9rem;
      padding: 0.2rem 0.7rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.75);
      color: #0f172a;
    }

    .module-link {
      color: #475569;
    }

    .module-card strong {
      display: block;
      font-family: 'Sora', 'Inter', sans-serif;
      font-size: 1.2rem;
      line-height: 1.12;
      letter-spacing: -0.04em;
      color: #0f172a;
    }

    .module-card p {
      margin: 0;
      color: #475569;
      line-height: 1.65;
    }

    .module-card-amber {
      background: linear-gradient(180deg, rgba(255, 251, 235, 0.96), rgba(255, 247, 237, 0.92));
    }

    .module-card-teal {
      background: linear-gradient(180deg, rgba(240, 253, 250, 0.96), rgba(236, 254, 255, 0.92));
    }

    .module-card-slate {
      background: linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.92));
    }

    .module-card-rose {
      background: linear-gradient(180deg, rgba(255, 241, 242, 0.96), rgba(255, 247, 237, 0.92));
    }

    .module-card-indigo {
      background: linear-gradient(180deg, rgba(238, 242, 255, 0.96), rgba(241, 245, 249, 0.92));
    }

    .module-card-emerald {
      background: linear-gradient(180deg, rgba(236, 253, 245, 0.96), rgba(240, 253, 250, 0.92));
    }

    .stat-card h2 {
      margin: 0.9rem 0 0;
      font-family: 'Sora', 'Inter', sans-serif;
      font-size: 2rem;
      line-height: 1;
      letter-spacing: -0.04em;
      font-weight: 800;
    }

    .stat-card span {
      display: block;
      margin-top: 0.7rem;
      color: #475569;
      line-height: 1.55;
    }

    .stat-card-accent {
      background:
        radial-gradient(circle at top right, rgba(20, 184, 166, 0.14), transparent 12rem),
        rgba(255, 255, 255, 0.9);
    }

    .content-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .panel-dark {
      background:
        radial-gradient(circle at top right, rgba(20, 184, 166, 0.16), transparent 14rem),
        linear-gradient(180deg, #0f172a 0%, #111827 100%);
      color: #fff;
      border-color: rgba(148, 163, 184, 0.08);
    }

    .panel-head h3 {
      margin: 0.35rem 0 0;
      font-family: 'Sora', 'Inter', sans-serif;
      font-size: 1.5rem;
      line-height: 1.05;
      letter-spacing: -0.04em;
      font-weight: 800;
      color: inherit;
    }

    .quick-links {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin-top: 1.2rem;
    }

    .quick-link {
      display: block;
      padding: 1rem;
      border-radius: 22px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .quick-link strong,
    .list-row strong,
    .empty-state strong {
      display: block;
      color: #0f172a;
    }

    .tone-teal {
      background: linear-gradient(180deg, rgba(15, 118, 110, 0.08), rgba(240, 253, 250, 0.92));
    }

    .tone-amber {
      background: linear-gradient(180deg, rgba(245, 158, 11, 0.08), rgba(255, 251, 235, 0.94));
    }

    .tone-slate {
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.04), rgba(248, 250, 252, 0.94));
    }

    .focus-list,
    .list-stack {
      display: grid;
      gap: 0.85rem;
      margin-top: 1.2rem;
    }

    .focus-row,
    .list-row,
    .empty-state {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.9rem;
      padding: 0.95rem 1rem;
      border-radius: 20px;
    }

    .focus-row {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.86);
    }

    .focus-row strong {
      color: #fff;
      text-transform: capitalize;
    }

    .list-row,
    .empty-state {
      border: 1px solid rgba(148, 163, 184, 0.12);
      background: rgba(248, 250, 252, 0.78);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 2rem;
      padding: 0.2rem 0.75rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .badge-calm {
      background: rgba(15, 118, 110, 0.1);
      color: #0f766e;
    }

    .badge-warm {
      background: rgba(245, 158, 11, 0.14);
      color: #b45309;
    }

    @media (max-width: 1279px) {
      .hero,
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 1023px) {
      .stats-grid,
      .module-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 767px) {
      .hero,
      .hero-meta-grid,
      .quick-links,
      .stats-grid,
      .module-grid {
        grid-template-columns: 1fr;
      }

      .hero {
        padding: 1rem;
      }

      .hero-actions {
        flex-direction: column;
      }

      .hero-btn {
        width: 100%;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private attendanceService = inject(AttendanceService);

  currentUser = signal<User | null>(null);
  todayAttendance = signal<TodayAttendance | null>(null);
  pendingRequests = signal(3);
  upcomingHolidays = signal<UpcomingHoliday[]>([]);
  birthdays = signal<Birthday[]>([
    { name: 'Aarav Mehta', date: 'Today', department: 'Engineering' }
  ]);
  workAnniversaries = signal<WorkAnniversary[]>([
    { name: 'Neha Sharma', years: 5 }
  ]);
  currentTime = signal('');
  currentDay = signal('');

  quickLinks = computed<QuickLink[]>(() => {
    const manager = this.isManager();

    return [
      {
        title: 'Attendance center',
        description: 'Track live status, check-in details, and attendance history.',
        route: '/attendance',
        tone: 'tone-teal'
      },
      {
        title: 'Leave workspace',
        description: 'Review requests, balances, and approval flow in one place.',
        route: '/leaves',
        tone: 'tone-amber'
      },
      {
        title: manager ? 'Team attendance' : 'Reports',
        description: manager ? 'Review team attendance and pending corrections.' : 'Open reporting views and HR insights.',
        route: manager ? '/admin/team-attendance' : '/reports',
        tone: 'tone-slate'
      },
      {
        title: 'Projects',
        description: 'Jump back into active work without leaving the dashboard.',
        route: '/projects',
        tone: 'tone-slate'
      }
    ];
  });

  moduleCards = computed<ModuleCard[]>(() => {
    const manager = this.isManager();

    return [
      {
        title: 'Employee administration',
        description: 'Profiles, invitations, onboarding flow, and employee records in one workspace.',
        route: '/employees',
        badge: 'Employees',
        accent: 'module-card-amber'
      },
      {
        title: 'Attendance operations',
        description: 'Daily attendance, team review, regularization, and live check-in visibility.',
        route: manager ? '/admin/team-attendance' : '/attendance',
        badge: 'Attendance',
        accent: 'module-card-teal'
      },
      {
        title: 'Leave and time-off',
        description: 'Leave applications, balances, holiday planning, and approval movement.',
        route: '/leaves',
        badge: 'Leave',
        accent: 'module-card-slate'
      },
      {
        title: 'Payroll and expenses',
        description: 'Salary operations, claims, reimbursements, and finance-facing workflows.',
        route: '/payroll',
        badge: 'Payroll',
        accent: 'module-card-rose'
      },
      {
        title: 'Projects and timesheets',
        description: 'Track ongoing work, assign effort, and review time logging across teams.',
        route: '/projects',
        badge: 'Productivity',
        accent: 'module-card-indigo'
      },
      {
        title: 'Reports and control center',
        description: 'Analytics, audit visibility, documents, and admin configuration surfaces.',
        route: '/reports',
        badge: 'Insights',
        accent: 'module-card-emerald'
      }
    ];
  });

  private clockInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.currentUser.set(this.authService.getStoredUser());
    this.loadDashboardData();
    this.seedCalendarData();
    this.startClock();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  private loadDashboardData(): void {
    this.attendanceService.getTodayAttendance().subscribe({
      next: (data) => this.todayAttendance.set(data),
      error: () => this.todayAttendance.set(null)
    });
  }

  private seedCalendarData(): void {
    const year = new Date().getFullYear();
    this.upcomingHolidays.set([
      { date: `${year}-08-15`, name: 'Independence Day' },
      { date: `${year}-10-02`, name: 'Gandhi Jayanti' },
      { date: `${year}-12-25`, name: 'Christmas Day' }
    ]);
  }

  private startClock(): void {
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit'
    }));
    this.currentDay.set(now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    }));
  }

  greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  getFullName(): string {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : 'Team Member';
  }

  attendanceHeadline(): string {
    if (!this.todayAttendance()) return 'Syncing your workday';
    return this.todayAttendance()?.is_clocked_in ? 'You are checked in' : 'Ready for check-in';
  }

  attendanceSubline(): string {
    const status = this.todayAttendance();
    if (!status) return 'We are loading your attendance details for today.';
    if (status.is_clocked_in && status.check_in) {
      return `Checked in at ${this.attendanceTime(status.check_in)} with ${this.totalHours()} logged so far.`;
    }
    return 'Start your day from here and your live attendance data will appear instantly.';
  }

  attendanceTime(value?: string | null): string {
    if (!value) return '--';
    return new Date(value).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  totalHours(): string {
    return `${(this.todayAttendance()?.total_work_hours ?? 0).toFixed(1)}h`;
  }

  shiftName(): string {
    return this.todayAttendance()?.shift?.name || 'General';
  }

  breakTime(): string {
    const minutes = this.todayAttendance()?.break_time_minutes ?? 0;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
  }

  overtime(): string {
    return `${(this.todayAttendance()?.overtime_hours ?? 0).toFixed(1)}h`;
  }

  daysUntilLabel(dateString: string): string {
    const target = new Date(dateString);
    const today = new Date();
    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
    if (diff <= 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days`;
  }

  isManager(): boolean {
    const roleId = this.currentUser()?.roleId;
    return roleId === 1 || roleId === 2 || roleId === 3 || roleId === 4;
  }

  markAttendance(): void {
    this.attendanceService.checkIn({ source: 'dashboard' }).subscribe({
      next: (response) => this.todayAttendance.set(response),
      error: () => this.todayAttendance.set(this.todayAttendance())
    });
  }
}
