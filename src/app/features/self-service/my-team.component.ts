import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EmployeeService, MyTeamResponse } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models/auth.model';

type TeamTab = 'all' | 'reportees' | 'peers';

@Component({
  selector: 'app-my-team',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="mx-auto flex max-w-7xl flex-col gap-5 pb-10">
      <section class="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <div class="grid gap-6 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.13),_transparent_35%),linear-gradient(135deg,#ffffff_0%,#f8fafc_60%,#eefcf6_100%)] px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8 lg:py-8">
          <div class="min-w-0">
            <p class="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/90 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              Self Service
            </p>
            <h1 class="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              My Team
            </h1>
            <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              View your reporting manager, peers, and direct reportees in one clean workspace.
              This stays scoped to your own team, so employees see only relevant people while managers get their direct team view.
            </p>

            <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div class="rounded-md border border-white/80 bg-white/90 p-4 shadow-sm">
                <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Team Members</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ stats().total }}</p>
              </div>
              <div class="rounded-md border border-white/80 bg-white/90 p-4 shadow-sm">
                <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Direct Reports</p>
                <p class="mt-2 text-2xl font-black text-emerald-600">{{ stats().reportees }}</p>
              </div>
              <div class="rounded-md border border-white/80 bg-white/90 p-4 shadow-sm">
                <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Peers</p>
                <p class="mt-2 text-2xl font-black text-sky-600">{{ stats().peers }}</p>
              </div>
              <div class="rounded-md border border-white/80 bg-white/90 p-4 shadow-sm">
                <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Active</p>
                <p class="mt-2 text-2xl font-black text-indigo-600">{{ stats().active }}</p>
              </div>
            </div>
          </div>

          <aside class="rounded-md border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-5">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Reporting Manager</p>
            @if (loading()) {
              <div class="mt-4 h-28 animate-pulse rounded-md bg-slate-100"></div>
            } @else if (manager()) {
              <div class="mt-4 flex items-start gap-3">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-sky-50 text-base font-black text-sky-700">
                  {{ initials(manager()) }}
                </div>
                <div class="min-w-0">
                  <p class="font-black text-slate-900">{{ fullName(manager()) }}</p>
                  <p class="mt-1 text-sm text-slate-500">{{ roleLabel(manager()) }}</p>
                  <p class="mt-1 break-all text-xs text-slate-400">{{ manager()?.email || 'No email available' }}</p>
                </div>
              </div>
            } @else {
              <div class="mt-4 rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                No reporting manager assigned yet.
              </div>
            }

            <div class="mt-5 grid grid-cols-2 gap-2">
              <a routerLink="/attendance?view=calendar" class="rounded-md border border-slate-200 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.14em] text-slate-600 hover:bg-slate-50">
                Attendance
              </a>
              <a routerLink="/leaves?view=request" class="rounded-md border border-slate-200 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.14em] text-slate-600 hover:bg-slate-50">
                Leave
              </a>
            </div>
          </aside>
        </div>
      </section>

      <section class="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside class="space-y-4">
          <div class="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">View</p>
            <div class="mt-3 grid gap-2">
              @for (item of tabItems; track item.id) {
                <button
                  type="button"
                  (click)="activeTab.set(item.id)"
                  [ngClass]="activeTab() === item.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'"
                  class="flex items-center justify-between rounded-md border px-3 py-3 text-left text-sm font-bold transition"
                >
                  <span>{{ item.label }}</span>
                  <span class="rounded bg-white/15 px-2 py-0.5 text-xs">{{ tabCount(item.id) }}</span>
                </button>
              }
            </div>
          </div>

          <div class="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <label class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Search</label>
            <input
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Name, email, code"
              class="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/10"
            />
            <button type="button" (click)="refresh()" class="mt-3 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-white">
              Refresh Team
            </button>
          </div>
        </aside>

        <div class="rounded-md border border-slate-200 bg-white shadow-sm">
          <div class="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-lg font-black text-slate-900">{{ activeTitle() }}</h2>
              <p class="mt-1 text-sm text-slate-500">{{ filteredMembers().length }} people visible</p>
            </div>
            <span class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              {{ hierarchySummary() }}
            </span>
          </div>

          @if (loading()) {
            <div class="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
              @for (i of [1,2,3,4,5,6]; track i) {
                <div class="h-40 animate-pulse rounded-md bg-slate-100"></div>
              }
            </div>
          } @else if (!filteredMembers().length) {
            <div class="flex min-h-[280px] flex-col items-center justify-center px-5 py-12 text-center">
              <div class="flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <p class="mt-4 font-black text-slate-800">No team members found</p>
              <p class="mt-2 max-w-md text-sm text-slate-500">Assign reporting managers in employee profiles to populate peers and direct reportees.</p>
            </div>
          } @else {
            <div class="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
              @for (person of filteredMembers(); track person.id) {
                <article class="rounded-md border border-slate-200 bg-white p-4 transition hover:border-sky-200 hover:shadow-sm">
                  <div class="flex items-start gap-3">
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-900 text-sm font-black text-white">
                      {{ initials(person) }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0">
                          <p class="truncate font-black text-slate-900">{{ fullName(person) }}</p>
                          <p class="mt-1 truncate text-xs font-semibold text-slate-500">{{ roleLabel(person) }}</p>
                        </div>
                        <span [ngClass]="statusClass(person.status)" class="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase">
                          {{ statusLabel(person.status) }}
                        </span>
                      </div>
                      <p class="mt-3 break-all text-xs text-slate-500">{{ person.email || 'No email available' }}</p>
                    </div>
                  </div>

                  <div class="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div class="rounded-md bg-slate-50 px-3 py-2">
                      <p class="font-black uppercase tracking-[0.14em] text-slate-400">Employee ID</p>
                      <p class="mt-1 font-bold text-slate-700">{{ person.employeeCode || 'NA' }}</p>
                    </div>
                    <div class="rounded-md bg-slate-50 px-3 py-2">
                      <p class="font-black uppercase tracking-[0.14em] text-slate-400">Relation</p>
                      <p class="mt-1 font-bold text-slate-700">{{ relationLabel(person) }}</p>
                    </div>
                  </div>

                  <div class="mt-4 flex gap-2">
                    <a [routerLink]="['/employees/view', person.id]" class="flex-1 rounded-md border border-slate-200 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.14em] text-slate-600 hover:bg-slate-50">
                      View
                    </a>
                    <a routerLink="/admin/team-attendance" class="flex-1 rounded-md bg-slate-900 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-slate-800">
                      Attendance
                    </a>
                  </div>
                </article>
              }
            </div>
          }
        </div>
      </section>
    </div>
  `,
})
export class MyTeamComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  loading = signal(true);
  activeTab = signal<TeamTab>('all');
  searchQuery = signal('');
  team = signal<MyTeamResponse>({ peers: [], reportees: [], members: [] });
  currentUser = signal<User | null>(null);

  tabItems: Array<{ id: TeamTab; label: string }> = [
    { id: 'all', label: 'All Team' },
    { id: 'reportees', label: 'Direct Reports' },
    { id: 'peers', label: 'Peers' },
  ];

  manager = computed(() => this.team().manager ?? null);

  stats = computed(() => {
    const members = this.uniqueMembers(this.team().members);
    return {
      total: members.length,
      reportees: this.team().reportees.length,
      peers: this.team().peers.length,
      active: members.filter((person) => this.normalizedStatus(person.status) === 'active').length,
    };
  });

  filteredMembers = computed(() => {
    const source = this.membersForTab(this.activeTab());
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return source;
    return source.filter((person) =>
      [
        person.firstName,
        person.lastName,
        person.email,
        person.employeeCode,
        person.phone,
        this.roleLabel(person),
        person.department?.name,
        person.designation?.name,
      ].some((value) => String(value ?? '').toLowerCase().includes(q))
    );
  });

  ngOnInit() {
    this.currentUser.set(this.authService.getStoredUser());
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.employeeService.getMyTeam().subscribe({
      next: (team) => {
        this.team.set({
          ...team,
          members: this.uniqueMembers(team.members),
        });
        if (team.currentUser) this.currentUser.set(team.currentUser);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Unable to load your team right now.');
      },
    });
  }

  private membersForTab(tab: TeamTab): User[] {
    if (tab === 'reportees') return this.team().reportees;
    if (tab === 'peers') return this.team().peers;
    return this.uniqueMembers(this.team().members);
  }

  private uniqueMembers(members: Array<User | null | undefined>): User[] {
    const seen = new Set<number>();
    return members.filter((person): person is User => {
      if (!person?.id || seen.has(person.id)) return false;
      seen.add(person.id);
      return true;
    });
  }

  tabCount(tab: TeamTab): number {
    return this.membersForTab(tab).length;
  }

  activeTitle(): string {
    if (this.activeTab() === 'reportees') return 'Direct Reportees';
    if (this.activeTab() === 'peers') return 'Team Peers';
    return 'My Team Directory';
  }

  hierarchySummary(): string {
    const manager = this.manager();
    if (this.team().reportees.length) return 'Manager View';
    if (manager) return `Reports to ${this.fullName(manager)}`;
    return 'Self Service View';
  }

  relationLabel(person: User | null | undefined): string {
    const user = this.currentUser();
    if (!person || !user) return 'Team';
    if (person.id === user.id) return 'You';
    if (person.id === user.managerId) return 'Manager';
    if (person.managerId === user.id) return 'Reportee';
    if (person.managerId && person.managerId === user.managerId) return 'Peer';
    return 'Team';
  }

  fullName(person: User | null | undefined): string {
    const name = [person?.firstName, person?.lastName].filter(Boolean).join(' ').trim();
    return name || 'Employee';
  }

  initials(person: User | null | undefined): string {
    const first = person?.firstName?.charAt(0) ?? 'E';
    const last = person?.lastName?.charAt(0) ?? '';
    return `${first}${last}`.toUpperCase();
  }

  roleLabel(person: User | null | undefined): string {
    return person?.designation?.name || person?.department?.name || (typeof person?.role === 'string' ? person.role : person?.role?.name) || 'Employee';
  }

  private normalizedStatus(status: any): string {
    return String(status ?? 'active').trim().toLowerCase().replace(/[\s-]+/g, '_') || 'active';
  }

  statusLabel(status: any): string {
    return this.normalizedStatus(status).replace(/_/g, ' ');
  }

  statusClass(status: any): string {
    const value = this.normalizedStatus(status);
    if (value === 'active' || value === 'on_job') return 'bg-emerald-50 text-emerald-700';
    if (value === 'on_leave') return 'bg-amber-50 text-amber-700';
    if (value === 'terminated' || value === 'offboarded') return 'bg-rose-50 text-rose-700';
    return 'bg-slate-100 text-slate-600';
  }
}
