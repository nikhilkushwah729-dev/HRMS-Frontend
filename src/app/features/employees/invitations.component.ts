import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  EmployeeService,
  EmployeeInvitation,
} from '../../core/services/employee.service';
import { RoleService, Role } from '../../core/services/role.service';
import { ToastService } from '../../core/services/toast.service';
import { LiveRefreshService } from '../../core/services/live-refresh.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UiSelectAdvancedComponent } from '../../core/components/ui';
import { SelectOption } from '../../core/components/ui/ui-select-advanced.component';

@Component({
  selector: 'app-invitations',
  standalone: true,
  imports: [CommonModule, FormsModule, UiSelectAdvancedComponent],
  template: `
    <div class="mx-auto max-w-6xl space-y-5 px-1 py-2 sm:space-y-6">
      <section
        class="overflow-hidden rounded-md border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_38%),linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#eefbf5_100%)] shadow-sm"
      >
        <div
          class="grid gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8 lg:py-8"
        >
          <div class="min-w-0 space-y-5">
            <div
              class="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
            >
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              People Operations
            </div>
            <div>
              <h1
                class="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl"
              >
                Invite new employee
              </h1>
              <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Send secure onboarding invites, assign the right role, and
                track pending access requests from the same people onboarding
                family as add employee.
              </p>
            </div>
          </div>

          <div
            class="rounded-md border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p
                  class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  Invitation summary
                </p>
                <p class="mt-2 text-2xl font-black text-slate-900">
                  {{ pendingInvitations.length }}
                </p>
                <p class="mt-2 text-sm leading-6 text-slate-500">
                  Accepted: {{ acceptedInvitations.length }} | Revoked/expired:
                  {{ revokedInvitations.length }}
                </p>
              </div>

              <div class="relative shrink-0">
                <button
                  type="button"
                  (click)="toggleOnboardingMenu()"
                  class="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50"
                >
                  <span>Onboarding</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                @if (showOnboardingMenu()) {
                  <div class="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl">
                    <button
                      type="button"
                      (click)="openAddEmployee()"
                      class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <span>Add Employee</span>
                      <span class="text-slate-400">&rarr;</span>
                    </button>
                    <button
                      type="button"
                      class="flex w-full items-center justify-between bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-white"
                    >
                      <span>Invitations</span>
                      <span class="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em]">Current</span>
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6">
        <div class="app-surface-card p-5 sm:p-6">
          <div class="mb-6">
            <p
              class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
            >
              Invite Pipeline
            </p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">
              Track pending and accepted access
            </h2>
          </div>

          <div class="app-chip-switch max-w-full overflow-x-auto no-scrollbar whitespace-nowrap">
          <button
            (click)="activeTab = 'pending'"
            [class.app-chip-button-active]="activeTab === 'pending'"
            class="app-chip-button"
          >
            Pending ({{ pendingInvitations.length }})
          </button>
          <button
            (click)="activeTab = 'accepted'"
            [class.app-chip-button-active]="activeTab === 'accepted'"
            class="app-chip-button"
          >
            Accepted ({{ acceptedInvitations.length }})
          </button>
          <button
            (click)="activeTab = 'revoked'"
            [class.app-chip-button-active]="activeTab === 'revoked'"
            class="app-chip-button"
          >
            Revoked / Expired ({{ revokedInvitations.length }})
          </button>
          </div>
        </div>

        <div class="app-surface-card p-5 sm:p-6">
          <div class="mb-6">
            <p
              class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
            >
              Quick Action
            </p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">
              Send secure access
            </h2>
          </div>

          <div class="rounded-md border border-slate-200 bg-slate-50 p-5">
            <p
              class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
            >
              Invitation note
            </p>
            <p class="mt-3 text-sm leading-7 text-slate-600">
              Use invitations when you want the employee to complete account
              onboarding by email instead of creating the full profile
              immediately.
            </p>
          </div>

          <button
            (click)="openModal()"
            class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"
              />
            </svg>
            Invite Employee
          </button>
        </div>
      </section>

      <div *ngIf="loading" class="flex items-center justify-center py-16">
        <div
          class="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"
        ></div>
      </div>

      <div *ngIf="!loading" class="space-y-4">
        <div class="grid gap-4 md:hidden">
          <div
            *ngFor="let invite of getFilteredInvitations()"
            class="app-surface-card space-y-4 p-5"
          >
            <div class="flex min-w-0 items-start gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-slate-700"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
                  />
                  <path
                    d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"
                  />
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <p class="break-words text-base font-semibold text-slate-900">
                  {{ invite.email }}
                </p>
                <p class="mt-1 text-sm text-slate-500">
                  {{ invite.roleName || getRoleName(invite.roleId) }}
                </p>
              </div>
              <span [class]="getStatusClass(invite.status)">
                {{ invite.status | titlecase }}
              </span>
            </div>

            <div
              class="grid gap-3 rounded-md bg-slate-50 p-4 text-sm text-slate-600"
            >
              <div class="flex items-start justify-between gap-3">
                <span class="text-slate-500">Invited By</span>
                <span class="text-right font-medium text-slate-900">{{
                  invite.invitedByName || 'Admin'
                }}</span>
              </div>
              <div class="flex items-start justify-between gap-3">
                <span class="text-slate-500">Invited Date</span>
                <span class="text-right font-medium text-slate-900">{{
                  invite.invitedAt | date: 'mediumDate'
                }}</span>
              </div>
              <div class="flex items-start justify-between gap-3">
                <span class="text-slate-500">Expires</span>
                <span class="text-right font-medium text-slate-900">{{
                  invite.expiresAt | date: 'mediumDate'
                }}</span>
              </div>
            </div>

            <div
              *ngIf="invite.status === 'pending'"
              class="flex flex-col gap-2 sm:flex-row"
            >
              <button
                (click)="resendInvitation(invite)"
                class="rounded-md border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Resend
              </button>
              <button
                (click)="revokeInvitation(invite)"
                class="rounded-md border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Revoke
              </button>
            </div>
          </div>

          <div
            *ngIf="getFilteredInvitations().length === 0"
            class="app-surface-card px-5 py-14 text-center text-slate-500 sm:px-6"
          >
            No invitations found for this status yet.
          </div>
        </div>

        <div class="app-surface-card hidden overflow-hidden p-0 md:block">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200">
              <thead class="bg-slate-50/90">
                <tr>
                  <th
                    class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                  >
                    Email
                  </th>
                  <th
                    class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                  >
                    Role
                  </th>
                  <th
                    class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                  >
                    Status
                  </th>
                  <th
                    class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                  >
                    Invited By
                  </th>
                  <th
                    class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                  >
                    Invited Date
                  </th>
                  <th
                    class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                  >
                    Expires
                  </th>
                  <th
                    class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-slate-100">
                <tr
                  *ngFor="let invite of getFilteredInvitations()"
                  class="hover:bg-slate-50/70"
                >
                  <td class="whitespace-nowrap px-6 py-4">
                    <div class="flex items-center">
                      <div
                        class="mr-3 flex h-11 w-11 items-center justify-center rounded-md bg-slate-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5 text-slate-700"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
                          />
                          <path
                            d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"
                          />
                        </svg>
                      </div>
                      <span class="font-semibold text-slate-900">{{
                        invite.email
                      }}</span>
                    </div>
                  </td>
                  <td
                    class="whitespace-nowrap px-6 py-4 text-sm text-slate-600"
                  >
                    {{ invite.roleName || getRoleName(invite.roleId) }}
                  </td>
                  <td class="whitespace-nowrap px-6 py-4">
                    <span [class]="getStatusClass(invite.status)">
                      {{ invite.status | titlecase }}
                    </span>
                  </td>
                  <td
                    class="whitespace-nowrap px-6 py-4 text-sm text-slate-600"
                  >
                    {{ invite.invitedByName || 'Admin' }}
                  </td>
                  <td
                    class="whitespace-nowrap px-6 py-4 text-sm text-slate-600"
                  >
                    {{ invite.invitedAt | date: 'medium' }}
                  </td>
                  <td
                    class="whitespace-nowrap px-6 py-4 text-sm text-slate-600"
                  >
                    {{ invite.expiresAt | date: 'medium' }}
                  </td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm">
                    <button
                      *ngIf="invite.status === 'pending'"
                      (click)="resendInvitation(invite)"
                      class="mr-3 font-medium text-blue-600 hover:text-blue-900"
                    >
                      Resend
                    </button>
                    <button
                      *ngIf="invite.status === 'pending'"
                      (click)="revokeInvitation(invite)"
                      class="font-medium text-red-600 hover:text-red-900"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
                <tr *ngIf="getFilteredInvitations().length === 0">
                  <td colspan="7" class="px-6 py-14 text-center text-slate-500">
                    No invitations found for this status yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div
      *ngIf="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-md overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl"
      >
        <div class="border-b border-slate-200 px-6 py-5">
          <h3 class="text-lg font-semibold text-slate-900">
            Invite New Employee
          </h3>
          <p class="mt-1 text-sm text-slate-500">
            Send a secure access link with the right role assignment.
          </p>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >Email Address *</label
              >
              <input
                type="email"
                [(ngModel)]="inviteData.email"
                required
                class="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200"
                placeholder="employee@company.com"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >Role *</label
              >
              <app-ui-select-advanced
                [(ngModel)]="inviteData.roleId"
                [options]="roleSelectOptions"
                placeholder="Select a role"
                [required]="true"
              ></app-ui-select-advanced>
              <p
                *ngIf="availableRoles.length === 0"
                class="mt-2 text-xs text-red-500"
              >
                No roles available yet. Please create roles first.
              </p>
            </div>
            <div>
              <label class="mb-1 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >Message (Optional)</label
              >
              <textarea
                [(ngModel)]="inviteData.message"
                rows="3"
                class="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200"
                placeholder="Add a personal message to the invitation..."
              ></textarea>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3 bg-slate-50 px-6 py-4">
          <button
            (click)="closeModal()"
            class="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            (click)="sendInvitation()"
            [disabled]="
              sending ||
              !inviteData.email ||
              !inviteData.roleId ||
              availableRoles.length === 0
            "
            class="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {{ sending ? 'Sending...' : 'Send Invitation' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class InvitationsComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private roleService = inject(RoleService);
  private toastService = inject(ToastService);
  private liveRefreshService = inject(LiveRefreshService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  invitations: EmployeeInvitation[] = [];
  roles: Role[] = [];
  showOnboardingMenu = signal(false);
  loading = false;
  sending = false;
  showModal = false;
  activeTab = 'pending';

  inviteData = {
    email: '',
    roleId: null as number | null,
    message: '',
  };

  get availableRoles(): Role[] {
    return this.roles.filter((role) => Number(role.id) > 0);
  }

  get roleSelectOptions(): SelectOption[] {
    return this.availableRoles.map((r) => ({ label: r.name, value: r.id }));
  }

  get pendingInvitations(): EmployeeInvitation[] {
    return this.invitations.filter((i) => i.status === 'pending');
  }

  get acceptedInvitations(): EmployeeInvitation[] {
    return this.invitations.filter((i) => i.status === 'accepted');
  }

  get revokedInvitations(): EmployeeInvitation[] {
    return this.invitations.filter(
      (i) => i.status === 'revoked' || i.status === 'expired',
    );
  }

  ngOnInit() {
    this.loadInvitations();
    this.loadRoles();
    this.liveRefreshService
      .createStream(15000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadInvitations(false));
  }

  loadInvitations(showLoader = true) {
    if (showLoader) {
      this.loading = true;
    }

    this.employeeService.getInvitations().subscribe({
      next: (data) => {
        this.invitations = Array.isArray(data) ? data : [];
        this.loading = false;
      },
      error: (err) => {
        if (showLoader) {
          this.toastService.error(
            err?.error?.message || 'Failed to load invitations',
          );
          this.loading = false;
        }
      },
    });
  }

  loadRoles() {
    this.roleService.getRoles().subscribe({
      next: (data) => {
        this.roles = Array.isArray(data) ? data : [];
      },
      error: () => {
        this.roles = [];
        this.toastService.error('Failed to load roles');
      },
    });
  }

  getFilteredInvitations(): EmployeeInvitation[] {
    switch (this.activeTab) {
      case 'pending':
        return this.pendingInvitations;
      case 'accepted':
        return this.acceptedInvitations;
      case 'revoked':
        return this.revokedInvitations;
      default:
        return this.invitations;
    }
  }

  getRoleName(roleId: number | undefined): string {
    if (!roleId) return 'N/A';
    const role = this.roles.find((r) => r.id === roleId);
    return role?.name || 'Unknown';
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      pending:
        'inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800',
      accepted:
        'inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800',
      revoked:
        'inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800',
      expired:
        'inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700',
    };
    return classes[status] || '';
  }

  openModal() {
    this.inviteData = {
      email: '',
      roleId: null,
      message: '',
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  toggleOnboardingMenu() {
    this.showOnboardingMenu.update((value) => !value);
  }

  openAddEmployee() {
    this.showOnboardingMenu.set(false);
    this.router.navigate(['/employees/add']);
  }

  sendInvitation() {
    const email = this.inviteData.email.trim().toLowerCase();

    if (!email || !this.inviteData.roleId) {
      this.toastService.error('Please fill in all required fields');
      return;
    }

    this.sending = true;
    this.employeeService
      .inviteEmployee({
        email,
        roleId: this.inviteData.roleId,
      })
      .subscribe({
        next: () => {
          this.toastService.success('Invitation sent successfully');
          this.sending = false;
          this.closeModal();
          this.loadInvitations();
        },
        error: (err) => {
          this.toastService.error(
            err.error?.message || 'Failed to send invitation',
          );
          this.sending = false;
        },
      });
  }

  resendInvitation(invite: EmployeeInvitation) {
    this.employeeService.resendInvitation(invite.id).subscribe({
      next: () => {
        this.toastService.success('Invitation resent successfully');
        this.loadInvitations();
      },
      error: () => {
        this.toastService.error('Failed to resend invitation');
      },
    });
  }

  revokeInvitation(invite: EmployeeInvitation) {
    if (
      confirm(
        `Are you sure you want to revoke the invitation for ${invite.email}?`,
      )
    ) {
      this.employeeService.revokeInvitation(invite.id).subscribe({
        next: () => {
          this.toastService.success('Invitation revoked successfully');
          this.loadInvitations();
        },
        error: () => {
          this.toastService.error('Failed to revoke invitation');
        },
      });
    }
  }
}
