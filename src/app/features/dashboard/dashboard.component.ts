import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import type { User } from '../../core/models/auth.model';
import { EmployeeService } from '../../core/services/employee.service';
import { LanguageService } from '../../core/services/language.service';
import { PermissionService } from '../../core/services/permission.service';
import {
  AttendanceService,
  TodayAttendance,
} from '../../core/services/attendance.service';
import {
  AnnouncementService,
  type Announcement,
} from '../../core/services/announcement.service';
import { TrialBannerComponent } from './trial-banner/trial-banner.component';
import { SubscriptionService } from '../../core/services/subscription.service';

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
  imports: [CommonModule, RouterModule, TrialBannerComponent],
  template: `
    <div class="dashboard-page">
      <app-trial-banner></app-trial-banner>
      <section class="hero">
        <div class="hero-copy">
          <p class="hero-eyebrow">{{ greeting() }}</p>
          <h1>{{ getFullName() }}</h1>
          <p class="hero-role">{{ dashboardSummary() }}</p>
          <p class="hero-description">
            {{ dashboardDescription() }}
          </p>

          <div class="hero-actions">
            <a routerLink="/attendance" class="hero-btn hero-btn-primary"
              >{{ t('dashboard.openAttendance') }}</a
            >
            <a routerLink="/leaves" class="hero-btn hero-btn-secondary"
              >{{ t('dashboard.manageLeaves') }}</a
            >
            <a routerLink="/profile" class="hero-btn hero-btn-ghost"
              >{{ t('dashboard.viewProfile') }}</a
            >
          </div>
        </div>

        <aside class="hero-panel">
          <div class="hero-panel-top">
            <span
              class="live-dot"
              [class.live-dot-on]="todayAttendance()?.is_clocked_in"
            ></span>
            <span>{{
              todayAttendance()?.is_clocked_in
                ? t('dashboard.workdayLive')
                : t('dashboard.waitingForCheckIn')
            }}</span>
          </div>

          <div class="hero-panel-value">{{ attendanceHeadline() }}</div>
          <p class="hero-panel-copy">{{ attendanceSubline() }}</p>

          <p class="hero-panel-copy">
            Reporting line: {{ reportsToName() }} · Teammates: {{ teammates().length }} · Reportees: {{ reportees().length }}
          </p>

          <div class="hero-meta-grid">
            <div class="hero-meta-card">
              <span>{{ t('dashboard.currentTime') }}</span>
              <strong>{{ currentTime() }}</strong>
            </div>
            <div class="hero-meta-card">
              <span>{{ t('dashboard.today') }}</span>
              <strong>{{ currentDay() }}</strong>
            </div>
            <div class="hero-meta-card">
              <span>{{ t('dashboard.hours') }}</span>
              <strong>{{ totalHours() }}</strong>
            </div>
            <div class="hero-meta-card">
              <span>{{ t('dashboard.shift') }}</span>
              <strong>{{ shiftName() }}</strong>
            </div>
            <div class="hero-meta-card" style="grid-column: 1 / -1;">
              <span>{{ t('dashboard.hierarchy') }}</span>
              <strong>{{ hierarchyRoleLabel() }}</strong>
            </div>
          </div>

          @if (todayAttendance()?.is_clocked_in) {
            <button
              class="hero-wide-action hero-wide-action-muted"
              type="button"
              disabled
            >
              {{ t('dashboard.attendanceAlreadyRecorded') }}
            </button>
          } @else {
            <button
              class="hero-wide-action"
              type="button"
              (click)="markAttendance()"
            >
              {{ t('dashboard.markAttendanceNow') }}
            </button>
          }
        </aside>
      </section>

      <section class="announcement-section">
        <div class="announcement-section-head">
          <p class="panel-eyebrow" style="color: #7c3aed;">{{ t('dashboard.announcements') }}</p>
          <h3>{{ t('dashboard.organizationUpdates') }}</h3>
        </div>

        @if (hasAnnouncements()) {
          <div class="announcement-banner">
            <div class="announcement-bar">
              <div class="announcement-icon-wrap">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" x2="12" y1="2" y2="15" />
                </svg>
              </div>

              <div class="announcement-body">
                <div class="announcement-tag">{{ announcementLabel() }}</div>
                <strong class="announcement-title">{{
                  currentAnnouncement()?.title
                }}</strong>
                <p class="announcement-text">
                  {{ currentAnnouncement()?.content }}
                </p>
                @if (currentAnnouncement()?.published_at) {
                  <span class="announcement-date">{{
                    currentAnnouncement()?.published_at | date: 'MMM d, y'
                  }}</span>
                }
              </div>

              <div class="announcement-actions">
                @if (activeAnnouncements().length > 1) {
                  <button
                    class="announcement-nav"
                    type="button"
                    (click)="prevAnnouncement()"
                    aria-label="Previous announcement"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    class="announcement-nav"
                    type="button"
                    (click)="nextAnnouncement()"
                    aria-label="Next announcement"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                }
                <button
                  class="announcement-close"
                  type="button"
                  (click)="dismissAnnouncement(currentAnnouncement()!.id)"
                  aria-label="Dismiss"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        } @else {
          <div class="announcement-empty">
            <div class="announcement-empty-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" x2="12" y1="2" y2="15" />
              </svg>
            </div>
            <div>
              <strong>No announcements right now</strong>
              <p>Organization announcements and updates will appear here.</p>
            </div>
          </div>
        }
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

      <section class="stats-grid">
        <article class="stat-card">
          <p>Reports to</p>
          <h2>{{ reportsToName() }}</h2>
          <span>{{ reportsToTitle() }}</span>
        </article>
        <article class="stat-card">
          <p>Teammates</p>
          <h2>{{ teammates().length }}</h2>
          <span>{{ teammatesPreview() }}</span>
        </article>
        <article class="stat-card stat-card-accent">
          <p>Reportees</p>
          <h2>{{ reportees().length }}</h2>
          <span>{{ reporteesPreview() }}</span>
        </article>
        <article class="stat-card">
          <p>Hierarchy</p>
          <h2>{{ hierarchyRoleLabel() }}</h2>
          <span>{{ hierarchySubtitle() }}</span>
        </article>
      </section>

      <section class="panel org-tree-panel">
        <div class="panel-head">
          <div>
            <p class="panel-eyebrow">Reporting tree</p>
            <h3>Who reports to whom</h3>
          </div>
          <span class="module-summary">Live org line</span>
        </div>

        <div class="org-tree">
          <div class="org-node org-node-top">
            <span>Reports to</span>
            <strong>{{ reportsToName() }}</strong>
            <div class="org-node-badge">{{ reportsToBadge() }}</div>
            <p>{{ reportsToTitle() }}</p>
          </div>

          <div class="org-tree-connector">↓</div>

          <div class="org-node org-node-center">
            <span>You</span>
            <strong>{{ getFullName() }}</strong>
            <div class="org-node-badge">{{ currentUserBadge() }}</div>
            <p>{{ hierarchyRoleLabel() }}</p>
          </div>

          <div class="org-tree-connector">↓</div>

          <div class="org-tree-row">
            <div class="org-node">
              <span>Teammates</span>
              <strong>{{ teammates().length }}</strong>
              @if (teammates().length > 0) {
                <div class="org-node-chips">
                  @for (person of previewTeammates(); track person.id) {
                    <div class="org-chip">
                      <strong>{{ person.firstName }} {{ person.lastName }}</strong>
                      <span>{{ personBadge(person) }}</span>
                    </div>
                  }
                </div>
              }
              <p>{{ teammatesPreview() }}</p>
            </div>
            <div class="org-node org-node-wide">
              <span>Reportees</span>
              <strong>{{ reportees().length }}</strong>
              @if (reportees().length > 0) {
                <div class="org-node-chips">
                  @for (person of previewReportees(); track person.id) {
                    <div class="org-chip">
                      <strong>{{ person.firstName }} {{ person.lastName }}</strong>
                      <span>{{ personBadge(person) }}</span>
                    </div>
                  }
                </div>
              }
              <p>{{ reporteesPreview() }}</p>
            </div>
          </div>
        </div>
      </section>

      @if (isManager()) {
        <section class="module-hub">
          <div class="panel-head">
            <div>
              <p class="panel-eyebrow">Leadership</p>
              <h3>Hierarchy, team, and reports</h3>
            </div>
            <span class="module-summary">HR and admin access</span>
          </div>

          <div class="module-grid">
            @for (card of leadershipCards(); track card.route) {
              <a
                [routerLink]="card.route"
                class="module-card"
                [ngClass]="card.accent"
              >
                <div class="module-card-top">
                  <span class="module-badge">{{ card.badge }}</span>
                  <span class="module-link">Open</span>
                </div>
                <strong>{{ card.title }}</strong>
                <p>{{ card.description }}</p>
              </a>
            }
          </div>
        </section>
      }

      <section class="module-hub">
        <div class="panel-head">
          <div>
              <p class="panel-eyebrow">Module hub</p>
            <h3>Core workspaces</h3>
          </div>
          <span class="module-summary"
            >{{ moduleCards().length }} active work areas</span
          >
        </div>

        <div class="module-grid">
          @for (module of moduleCards(); track module.route) {
            <a
              [routerLink]="module.route"
              class="module-card"
              [ngClass]="module.accent"
            >
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
              <h3>Fast actions</h3>
            </div>
          </div>

          <div class="quick-links">
            @for (link of quickLinks(); track link.route) {
              <a
                [routerLink]="link.route"
                class="quick-link"
                [ngClass]="link.tone"
              >
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
              <h3>Today's snapshot</h3>
            </div>
          </div>

          <div class="focus-list">
            <div class="focus-row">
              <span>Status</span>
              <strong>{{
                todayAttendance()?.current_status || 'offline'
              }}</strong>
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
              <h3>Plan ahead</h3>
            </div>
          </div>

          <div class="list-stack">
            @for (holiday of upcomingHolidays(); track holiday.date) {
              <div class="list-row">
                <div>
                  <strong>{{ holiday.name }}</strong>
                  <span>{{ holiday.date | date: 'EEEE, MMM d' }}</span>
                </div>
                <span class="badge badge-calm">{{
                  daysUntilLabel(holiday.date)
                }}</span>
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
              <h3>People moments</h3>
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
                <span class="badge badge-calm"
                  >{{ anniversary.years }} years</span
                >
              </div>
            }

            @if (birthdays().length === 0 && workAnniversaries().length === 0) {
              <div class="empty-state">
                <strong>No celebrations today</strong>
                <span
                  >This section will fill in when there are birthdays or
                  milestones.</span
                >
              </div>
            }
          </div>
        </article>
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        background: #f8fafc;
      }

      .dashboard-page {
        display: grid;
        gap: 1.5rem;
        color: #0f172a;
        min-width: 0;
      }

      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.9fr);
        gap: 1.25rem;
        padding: 1.5rem;
        border-radius: 32px;
        border: 1px solid rgba(148, 163, 184, 0.18);
        background: linear-gradient(135deg, #fff8ed 0%, #f8fafc 52%, #ecfeff 100%);
        box-shadow: 0 28px 60px -40px rgba(15, 23, 42, 0.34);
        align-items: stretch;
      }

      .hero-copy,
      .hero-panel,
      .panel,
      .stat-card {
        border-radius: 28px;
        min-width: 0;
      }

      .hero-copy {
        padding: 0.25rem;
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
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
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
        background: linear-gradient(
          180deg,
          rgba(248, 250, 252, 0.96),
          rgba(241, 245, 249, 0.96)
        );
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
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }

      .org-tree-panel {
        padding: 1.35rem;
      }

      .org-tree {
        display: grid;
        gap: 0.85rem;
        margin-top: 1rem;
      }

      .org-node {
        padding: 1rem 1.05rem;
        border-radius: 22px;
        border: 1px solid rgba(148, 163, 184, 0.16);
        background: linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(255, 255, 255, 0.92));
      }

      .org-node-top {
        border-color: rgba(245, 158, 11, 0.2);
        background: linear-gradient(180deg, rgba(255, 251, 235, 0.96), rgba(255, 247, 237, 0.94));
      }

      .org-node-center {
        border-color: rgba(20, 184, 166, 0.2);
        background: linear-gradient(180deg, rgba(236, 253, 245, 0.96), rgba(240, 253, 250, 0.94));
      }

      .org-node strong {
        display: block;
        margin-top: 0.35rem;
        font-family: 'Sora', 'Inter', sans-serif;
        font-size: 1.08rem;
        line-height: 1.12;
        letter-spacing: -0.03em;
        color: #0f172a;
      }

      .org-node span {
        display: inline-flex;
        align-items: center;
        min-height: 1.8rem;
        padding: 0.15rem 0.65rem;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.06);
        color: #475569;
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .org-node p {
        margin: 0.5rem 0 0;
        color: #475569;
        line-height: 1.55;
      }

      .org-node-chips {
        display: grid;
        gap: 0.55rem;
        margin-top: 0.75rem;
      }

      .org-chip {
        padding: 0.65rem 0.75rem;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.72);
        border: 1px solid rgba(148, 163, 184, 0.14);
      }

      .org-chip strong {
        margin: 0;
        font-size: 0.92rem;
      }

      .org-chip span {
        min-height: 1.4rem;
        margin-top: 0.35rem;
        font-size: 0.65rem;
      }

      .org-tree-connector {
        width: 2px;
        height: 1.2rem;
        margin: 0 auto;
        border-radius: 999px;
        background: #cbd5e1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        font-size: 0.9rem;
        line-height: 1;
      }

      .org-tree-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.85rem;
      }

      .org-node-wide {
        border-color: rgba(99, 102, 241, 0.16);
        background: linear-gradient(180deg, rgba(238, 242, 255, 0.96), rgba(241, 245, 249, 0.94));
      }

      .module-hub {
        padding: 1.35rem;
        border-radius: 28px;
        border: 1px solid rgba(148, 163, 184, 0.16);
        background: rgba(255, 255, 255, 0.9);
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
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
        position: relative;
        overflow: hidden;
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
        background: linear-gradient(
          180deg,
          rgba(255, 251, 235, 0.96),
          rgba(255, 247, 237, 0.92)
        );
      }

      .module-card-teal {
        background: linear-gradient(
          180deg,
          rgba(240, 253, 250, 0.96),
          rgba(236, 254, 255, 0.92)
        );
      }

      .module-card-slate {
        background: linear-gradient(
          180deg,
          rgba(248, 250, 252, 0.98),
          rgba(241, 245, 249, 0.92)
        );
      }

      .module-card-rose {
        background: linear-gradient(
          180deg,
          rgba(255, 241, 242, 0.96),
          rgba(255, 247, 237, 0.92)
        );
      }

      .module-card-indigo {
        background: linear-gradient(
          180deg,
          rgba(238, 242, 255, 0.96),
          rgba(241, 245, 249, 0.92)
        );
      }

      .module-card-emerald {
        background: linear-gradient(
          180deg,
          rgba(236, 253, 245, 0.96),
          rgba(240, 253, 250, 0.92)
        );
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
          radial-gradient(
            circle at top right,
            rgba(20, 184, 166, 0.14),
            transparent 12rem
          ),
          rgba(255, 255, 255, 0.9);
      }

      .content-grid {
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }

      .panel-dark {
        background:
          radial-gradient(
            circle at top right,
            rgba(20, 184, 166, 0.16),
            transparent 14rem
          ),
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
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        margin-top: 1.2rem;
      }

      .quick-link {
        display: block;
        padding: 1rem;
        border-radius: 22px;
        border: 1px solid rgba(148, 163, 184, 0.16);
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }

      .quick-link strong,
      .list-row strong,
      .empty-state strong {
        display: block;
        color: #0f172a;
      }

      .tone-teal {
        background: linear-gradient(
          180deg,
          rgba(15, 118, 110, 0.08),
          rgba(240, 253, 250, 0.92)
        );
      }

      .tone-amber {
        background: linear-gradient(
          180deg,
          rgba(245, 158, 11, 0.08),
          rgba(255, 251, 235, 0.94)
        );
      }

      .tone-slate {
        background: linear-gradient(
          180deg,
          rgba(15, 23, 42, 0.04),
          rgba(248, 250, 252, 0.94)
        );
      }

      .tone-indigo {
        background: linear-gradient(
          180deg,
          rgba(79, 70, 229, 0.08),
          rgba(238, 242, 255, 0.94)
        );
      }

      .tone-rose {
        background: linear-gradient(
          180deg,
          rgba(244, 63, 94, 0.06),
          rgba(255, 241, 242, 0.94)
        );
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

      .announcement-section {
        padding: 1.35rem;
        border-radius: 28px;
        border: 1px solid rgba(148, 163, 184, 0.16);
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 22px 46px -34px rgba(15, 23, 42, 0.28);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }

      .panel-head,
      .announcement-section-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .announcement-section-head {
        margin-bottom: 1rem;
      }

      .announcement-section-head h3 {
        margin: 0.35rem 0 0;
        font-family: 'Sora', 'Inter', sans-serif;
        font-size: 1.5rem;
        line-height: 1.05;
        letter-spacing: -0.04em;
        font-weight: 800;
        color: #0f172a;
      }

      .announcement-empty {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        border-radius: 22px;
        background: rgba(248, 250, 252, 0.8);
        border: 1px dashed rgba(148, 163, 184, 0.28);
      }

      .announcement-empty-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 3.2rem;
        height: 3.2rem;
        min-width: 3.2rem;
        border-radius: 16px;
        background: rgba(124, 58, 237, 0.08);
        color: #7c3aed;
      }

      .announcement-empty strong {
        display: block;
        font-size: 0.95rem;
        color: #0f172a;
      }

      .announcement-empty p {
        margin: 0.25rem 0 0;
        font-size: 0.84rem;
        color: #64748b;
      }

      .announcement-banner {
        position: relative;
        overflow: hidden;
        border-radius: 24px;
        background: linear-gradient(
          135deg,
          #7c3aed 0%,
          #6d28d9 40%,
          #4c1d95 100%
        );
        box-shadow:
          0 20px 50px -28px rgba(124, 58, 237, 0.45),
          0 0 0 1px rgba(124, 58, 237, 0.12);
      }

      .announcement-bar {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1.25rem 1.5rem;
      }

      .announcement-icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        min-width: 2.5rem;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.15);
        color: #fde68a;
        box-shadow: 0 4px 14px -6px rgba(0, 0, 0, 0.3);
        margin-top: 0.15rem;
      }

      .announcement-body {
        flex: 1;
        min-width: 0;
      }

      .announcement-tag {
        display: inline-block;
        margin-bottom: 0.3rem;
        padding: 0.1rem 0.55rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.14);
        color: rgba(255, 255, 255, 0.88);
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .announcement-title {
        display: block;
        font-family: 'Sora', 'Inter', sans-serif;
        font-size: 1.05rem;
        line-height: 1.3;
        letter-spacing: -0.02em;
        color: #fff;
      }

      .announcement-text {
        margin: 0.4rem 0 0;
        font-size: 0.88rem;
        line-height: 1.6;
        color: rgba(255, 255, 255, 0.78);
      }

      .announcement-date {
        display: inline-block;
        margin-top: 0.45rem;
        font-size: 0.72rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.5);
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .announcement-actions {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        margin-top: 0.15rem;
      }

      .announcement-nav,
      .announcement-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        transition:
          background 0.18s ease,
          color 0.18s ease;
      }

      .announcement-nav:hover,
      .announcement-close:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
      }

      .announcement-close {
        margin-left: 0.3rem;
      }

      @media (max-width: 767px) {
        .announcement-bar {
          flex-direction: column;
          align-items: stretch;
        }

        .announcement-actions {
          justify-content: flex-end;
          margin-top: 0.5rem;
        }

        .announcement-icon-wrap {
          margin-top: 0;
        }
      }

      @media (max-width: 1279px) {
        .hero,
        .content-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 1023px) {
        .hero {
          grid-template-columns: 1fr;
        }

        .hero-panel {
          order: -1;
        }

        .stats-grid,
        .module-grid,
        .quick-links {
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
          border-radius: 24px;
        }

        .hero-panel,
        .panel,
        .stat-card,
        .module-hub,
        .announcement-section {
          padding: 1rem;
          border-radius: 22px;
        }

        .hero h1 {
          font-size: clamp(2rem, 10vw, 3rem);
        }

        .panel-head h3,
        .announcement-section-head h3 {
          font-size: 1.25rem;
        }

        .hero-actions {
          flex-direction: column;
        }

        .hero-btn {
          width: 100%;
        }

        .focus-row,
        .list-row,
        .empty-state,
        .announcement-empty {
          align-items: flex-start;
          flex-direction: column;
        }

        .announcement-actions {
          width: 100%;
        }

        .module-summary {
          width: 100%;
          justify-content: center;
        }

        .org-tree-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly permissionService = inject(PermissionService);
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private attendanceService = inject(AttendanceService);
  private announcementService = inject(AnnouncementService);
  private languageService = inject(LanguageService);
  private readonly subscriptionService = inject(SubscriptionService);

  currentUser = signal<User | null>(null);
  employees = signal<User[]>([]);
  todayAttendance = signal<TodayAttendance | null>(null);
  announcements = signal<Announcement[]>([]);
  dismissedAnnouncementIds = signal<Set<number>>(new Set());
  currentAnnouncementIndex = signal(0);
  pendingRequests = signal(3);
  upcomingHolidays = signal<UpcomingHoliday[]>([]);
  birthdays = signal<Birthday[]>([
    { name: 'Aarav Mehta', date: 'Today', department: 'Engineering' },
  ]);
  workAnniversaries = signal<WorkAnniversary[]>([
    { name: 'Neha Sharma', years: 5 },
  ]);
  currentTime = signal('');
  currentDay = signal('');

  activeAnnouncements = computed(() => {
    const dismissed = this.dismissedAnnouncementIds();
    return this.announcements().filter((a) => !dismissed.has(a.id));
  });

  currentAnnouncement = computed(() => {
    const items = this.activeAnnouncements();
    if (!items.length) return null;
    const index = this.currentAnnouncementIndex();
    return items[Math.min(index, items.length - 1)];
  });

  hasAnnouncements = computed(() => this.activeAnnouncements().length > 0);

  announcementLabel = computed(() => {
    const items = this.activeAnnouncements();
    if (!items.length) return '';
    if (items.length === 1) return 'Announcement';
    return `${this.currentAnnouncementIndex() + 1} of ${items.length}`;
  });

  quickLinks = computed<QuickLink[]>(() => {
    const manager = this.isManager();

    return [
      {
        title: 'Attendance center',
        description:
          'Track live status, check-in details, and attendance history.',
        route: '/attendance',
        tone: 'tone-teal',
      },
      {
        title: 'Leave workspace',
        description:
          'Review requests, balances, and approval flow in one place.',
        route: '/leaves',
        tone: 'tone-amber',
      },
      {
        title: 'My Documents',
        description:
          'Access pay slips, offer letters, and important documents.',
        route: '/admin/documents',
        tone: 'tone-slate',
      },
      {
        title: 'Expense Claims',
        description: 'Submit and track expense reimbursements and claims.',
        route: '/expenses',
        tone: 'tone-teal',
      },
      {
        title: manager ? 'Team attendance' : 'My Profile',
        description: manager
          ? 'Review team attendance and pending corrections.'
          : 'Update your personal details, bank info, and emergency contacts.',
        route: manager ? '/admin/team-attendance' : '/profile',
        tone: 'tone-slate',
      },
      {
        title: 'Projects',
        description:
          'Jump back into active work without leaving the dashboard.',
        route: '/projects',
        tone: 'tone-slate',
      },
    ];
  });

  leadershipCards = computed<ModuleCard[]>(() => {
    if (!this.isManager()) return [];

    return [
      {
        title: 'Hierarchy',
        description: 'Reporting lines, roles, and access tiers.',
        route: '/settings/organisation/designation',
        badge: 'Structure',
        accent: 'module-card-slate',
      },
      {
        title: 'Team mates',
        description: 'Team status, attendance, and member visibility.',
        route: '/admin/team-attendance',
        badge: 'Team',
        accent: 'module-card-teal',
      },
      {
        title: 'Reports',
        description: 'Operational insights and leadership reporting.',
        route: '/reports-center',
        badge: 'Reports',
        accent: 'module-card-emerald',
      },
    ];
  });

      moduleCards = computed<ModuleCard[]>(() => {
    const manager = this.isManager();

    return [
      {
        title: 'Self-Service',
        description: 'Profile, documents, requests, and personal HR tasks.',
        route: '/profile',
        badge: 'Self Service',
        accent: 'module-card-amber',
      },
      {
        title: 'Attendance',
        description: 'Check-ins, team review, regularization, and live status.',
        route: manager ? '/admin/team-attendance' : '/attendance',
        badge: 'Attendance',
        accent: 'module-card-teal',
      },
      {
        title: 'Leaves',
        description: 'Apply, review balance, and plan time off.',
        route: '/leaves',
        badge: 'Leave',
        accent: 'module-card-slate',
      },
      {
        title: 'Employees',
        description: 'Profiles, invites, onboarding, and records.',
        route: '/employees',
        badge: 'Employees',
        accent: 'module-card-rose',
      },
      {
        title: 'Expenses',
        description: 'Claims, reimbursements, and spend tracking.',
        route: '/expenses',
        badge: 'Expenses',
        accent: 'module-card-indigo',
      },
      {
        title: 'Reports',
        description: 'Insights, audit trails, documents, and settings.',
        route: '/reports',
        badge: 'Insights',
        accent: 'module-card-emerald',
      },
    ];
  });

  private clockInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.subscriptionService.getStatus().subscribe();
    this.currentUser.set(this.authService.getStoredUser());
    this.loadDashboardData();
    this.loadEmployees();
    this.loadAnnouncements();
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
      error: () => this.todayAttendance.set(null),
    });
  }

  private loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (data) => this.employees.set(data ?? []),
      error: () => this.employees.set([]),
    });
  }

  private loadAnnouncements(): void {
    this.announcementService.getAnnouncements().subscribe({
      next: (data) => {
        const items = Array.isArray(data) ? data : [];
        this.announcements.set(items);
        this.currentAnnouncementIndex.set(0);
      },
      error: () => this.announcements.set([]),
    });
  }

  dismissAnnouncement(id: number): void {
    const current = new Set(this.dismissedAnnouncementIds());
    current.add(id);
    this.dismissedAnnouncementIds.set(current);
    this.currentAnnouncementIndex.set(0);
  }

  nextAnnouncement(): void {
    const items = this.activeAnnouncements();
    if (!items.length) return;
    const next = (this.currentAnnouncementIndex() + 1) % items.length;
    this.currentAnnouncementIndex.set(next);
  }

  prevAnnouncement(): void {
    const items = this.activeAnnouncements();
    if (!items.length) return;
    const prev =
      (this.currentAnnouncementIndex() - 1 + items.length) % items.length;
    this.currentAnnouncementIndex.set(prev);
  }

  private seedCalendarData(): void {
    const year = new Date().getFullYear();
    this.upcomingHolidays.set([
      { date: `${year}-08-15`, name: 'Independence Day' },
      { date: `${year}-10-02`, name: 'Gandhi Jayanti' },
      { date: `${year}-12-25`, name: 'Christmas Day' },
    ]);
  }

  private startClock(): void {
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTime.set(
      now.toLocaleTimeString('en-US', {
        hour12: true,
        hour: 'numeric',
        minute: '2-digit',
      }),
    );
    this.currentDay.set(
      now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    );
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

  dashboardSummary(): string {
    if (this.isManager()) return this.t('dashboard.teamOperationsAtGlance');
    return this.t('dashboard.selfServiceWorkspace');
  }

  dashboardDescription(): string {
    if (this.isManager()) {
      return this.t('dashboard.managerDescription');
    }
    return this.t('dashboard.employeeDescription');
  }

  reportsToName(): string {
    const user = this.currentUser();
    if (!user) return '--';

    const managerId = user.managerId;
    if (!managerId) {
      return this.isManager() ? 'Executive lead' : 'No manager set';
    }

    const manager = this.employees().find((item) => item.id === managerId);
    return manager ? `${manager.firstName} ${manager.lastName}` : `Manager #${managerId}`;
  }

  reportsToTitle(): string {
    const user = this.currentUser();
    if (!user) return 'Reporting line not loaded';

    if (!user.managerId) {
      return this.isManager()
        ? 'Top-level workspace owner for your org'
        : 'Ask HR to assign your reporting manager';
    }

    const manager = this.employees().find((item) => item.id === user.managerId);
    const title =
      manager?.designation?.name ??
      (typeof manager?.role === 'string' ? manager.role : manager?.role?.name) ??
      'Manager';
    return `${title} assigned above you`;
  }

  reportsToBadge(): string {
    const user = this.currentUser();
    if (!user?.managerId) return 'No manager assigned';
    const manager = this.employees().find((item) => item.id === user.managerId);
    return this.personBadge(manager ?? null);
  }

  currentUserBadge(): string {
    return this.personBadge(this.currentUser());
  }

  personBadge(person: User | null): string {
    if (!person) return 'Employee';
    const designation = person.designation?.name?.trim();
    if (designation) return designation;
    if (typeof person.role === 'string' && person.role.trim()) return person.role;
    if (person.role && typeof person.role !== 'string' && person.role.name) {
      return person.role.name;
    }
    return 'Employee';
  }

  previewTeammates(): User[] {
    return this.teammates().slice(0, 3);
  }

  previewReportees(): User[] {
    return this.reportees().slice(0, 3);
  }

  teammates(): User[] {
    const user = this.currentUser();
    if (!user || !user.managerId) return [];
    return this.employees().filter(
      (item) => item.id !== user.id && item.managerId === user.managerId,
    );
  }

  reportees(): User[] {
    const user = this.currentUser();
    if (!user?.id) return [];
    return this.employees().filter((item) => item.managerId === user.id);
  }

  teammatesPreview(): string {
    const people = this.teammates().slice(0, 3);
    if (!people.length) return this.t('dashboard.noPeersAssignedYet');
    return people.map((person) => `${person.firstName} ${person.lastName}`).join(', ');
  }

  reporteesPreview(): string {
    const people = this.reportees().slice(0, 3);
    if (!people.length) {
      return this.t('dashboard.noDirectReporteesYet');
    }
    return people.map((person) => `${person.firstName} ${person.lastName}`).join(', ');
  }

  hierarchyRoleLabel(): string {
    const user = this.currentUser();
    if (!user) return this.t('dashboard.employee');
    if (this.reportees().length > 0) return this.t('dashboard.lead');
    if (user.managerId) return this.t('dashboard.individualContributor');
    return this.isManager() ? this.t('dashboard.topLevel') : this.t('dashboard.selfServiceWorkspace');
  }

  hierarchySubtitle(): string {
    const user = this.currentUser();
    if (!user) return 'Loading reporting structure';
    if (this.reportees().length > 0) {
      return 'You can review the people who report into your line.';
    }
    if (user.managerId) {
      return 'Your peers sit under the same reporting manager.';
    }
    return this.isManager()
      ? 'You are the top level contact in this workspace.'
      : 'Your profile currently has no reporting manager assigned.';
  }

  attendanceHeadline(): string {
    if (!this.todayAttendance()) return this.t('dashboard.syncingWorkday');
    return this.todayAttendance()?.is_clocked_in
      ? this.t('dashboard.checkedIn')
      : this.t('dashboard.readyForCheckIn');
  }

  attendanceSubline(): string {
    const status = this.todayAttendance();
    if (!status) return this.t('dashboard.loadingAttendanceToday');
    if (status.is_clocked_in && status.check_in) {
      return `Checked in at ${this.attendanceTime(status.check_in)} with ${this.totalHours()} logged so far.`;
    }
    return this.t('dashboard.startYourDay');
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    this.languageService.currentLanguage();
    return this.languageService.t(key, params);
  }

  attendanceTime(date: any): string {
    if (!date) return '--:--';
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
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
    return this.permissionService.isManagerialUser(this.currentUser());
  }

  markAttendance(): void {
    this.attendanceService.checkIn({ source: 'dashboard' }).subscribe({
      next: (response) => this.todayAttendance.set(response),
      error: () => this.todayAttendance.set(this.todayAttendance()),
    });
  }
}
