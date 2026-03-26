import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService, EmployeeInvitation } from '../../core/services/employee.service';
import { RoleService, Role } from '../../core/services/role.service';
import { ToastService } from '../../core/services/toast.service';
import { LiveRefreshService } from '../../core/services/live-refresh.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-invitations',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="space-y-6 p-1">
            <section class="app-module-hero">
                <div>
                    <p class="app-module-kicker">People Operations</p>
                    <h1 class="app-module-title">Employee invitations</h1>
                    <p class="app-module-text">Invite new team members, track onboarding progress, and keep pending access requests under control.</p>
                </div>

                <div class="app-module-highlight">
                    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pending invites</p>
                    <p class="mt-3 text-3xl font-black text-slate-900">{{ pendingInvitations.length }}</p>
                    <p class="mt-2 text-sm text-slate-600">Accepted: {{ acceptedInvitations.length }} | Revoked/expired: {{ revokedInvitations.length }}</p>
                </div>
            </section>

            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div class="app-chip-switch">
                    <button (click)="activeTab = 'pending'" [class.app-chip-button-active]="activeTab === 'pending'" class="app-chip-button">
                        Pending ({{ pendingInvitations.length }})
                    </button>
                    <button (click)="activeTab = 'accepted'" [class.app-chip-button-active]="activeTab === 'accepted'" class="app-chip-button">
                        Accepted ({{ acceptedInvitations.length }})
                    </button>
                    <button (click)="activeTab = 'revoked'" [class.app-chip-button-active]="activeTab === 'revoked'" class="app-chip-button">
                        Revoked / Expired ({{ revokedInvitations.length }})
                    </button>
                </div>

                <button (click)="openModal()"
                    class="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                    Invite Employee
                </button>
            </div>

            <div *ngIf="loading" class="flex items-center justify-center py-16">
                <div class="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
            </div>

            <div *ngIf="!loading" class="app-surface-card overflow-hidden p-0">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-slate-200">
                        <thead class="bg-slate-50/90">
                            <tr>
                                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email</th>
                                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Role</th>
                                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Invited By</th>
                                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Invited Date</th>
                                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Expires</th>
                                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-slate-100">
                            <tr *ngFor="let invite of getFilteredInvitations()" class="hover:bg-slate-50/70">
                                <td class="whitespace-nowrap px-6 py-4">
                                    <div class="flex items-center">
                                        <div class="mr-3 flex h-11 w-11 items-center justify-center rounded-md bg-slate-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-700" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                            </svg>
                                        </div>
                                        <span class="font-semibold text-slate-900">{{ invite.email }}</span>
                                    </div>
                                </td>
                                <td class="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                    {{ invite.roleName || getRoleName(invite.roleId) }}
                                </td>
                                <td class="whitespace-nowrap px-6 py-4">
                                    <span [class]="getStatusClass(invite.status)">
                                        {{ invite.status | titlecase }}
                                    </span>
                                </td>
                                <td class="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                    {{ invite.invitedByName || 'Admin' }}
                                </td>
                                <td class="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                    {{ invite.invitedAt | date:'medium' }}
                                </td>
                                <td class="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                    {{ invite.expiresAt | date:'medium' }}
                                </td>
                                <td class="whitespace-nowrap px-6 py-4 text-sm">
                                    <button *ngIf="invite.status === 'pending'"
                                        (click)="resendInvitation(invite)"
                                        class="mr-3 font-medium text-blue-600 hover:text-blue-900">
                                        Resend
                                    </button>
                                    <button *ngIf="invite.status === 'pending'"
                                        (click)="revokeInvitation(invite)"
                                        class="font-medium text-red-600 hover:text-red-900">
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

        <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
            <div class="w-full max-w-md overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
                <div class="border-b border-slate-200 px-6 py-5">
                    <h3 class="text-lg font-semibold text-slate-900">Invite New Employee</h3>
                    <p class="mt-1 text-sm text-slate-500">Send a secure access link with the right role assignment.</p>
                </div>
                <div class="p-6">
                    <div class="space-y-4">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-slate-700">Email Address *</label>
                            <input type="email" [(ngModel)]="inviteData.email" required
                                class="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200"
                                placeholder="employee@company.com">
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-slate-700">Role *</label>
                            <select [(ngModel)]="inviteData.roleId" required
                                class="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200">
                                <option [value]="undefined" disabled>Select a role</option>
                                <option *ngFor="let role of availableRoles" [value]="role.id">
                                    {{ role.name }}
                                </option>
                            </select>
                            <p *ngIf="availableRoles.length === 0" class="mt-2 text-xs text-red-500">
                                No roles available yet. Please create roles first.
                            </p>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-slate-700">Message (Optional)</label>
                            <textarea [(ngModel)]="inviteData.message" rows="3"
                                class="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200"
                                placeholder="Add a personal message to the invitation..."></textarea>
                        </div>
                    </div>
                </div>
                <div class="flex justify-end gap-3 bg-slate-50 px-6 py-4">
                    <button (click)="closeModal()"
                        class="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                        Cancel
                    </button>
                    <button (click)="sendInvitation()" [disabled]="sending || !inviteData.email || !inviteData.roleId || availableRoles.length === 0"
                        class="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
                        {{ sending ? 'Sending...' : 'Send Invitation' }}
                    </button>
                </div>
            </div>
        </div>
    `
})
export class InvitationsComponent implements OnInit {
    private employeeService = inject(EmployeeService);
    private roleService = inject(RoleService);
    private toastService = inject(ToastService);
    private liveRefreshService = inject(LiveRefreshService);
    private destroyRef = inject(DestroyRef);

    invitations: EmployeeInvitation[] = [];
    roles: Role[] = [];
    loading = false;
    sending = false;
    showModal = false;
    activeTab = 'pending';

    inviteData = {
        email: '',
        roleId: null as number | null,
        message: ''
    };

    get availableRoles(): Role[] {
        return this.roles.filter((role) => Number(role.id) > 0);
    }

    get pendingInvitations(): EmployeeInvitation[] {
        return this.invitations.filter(i => i.status === 'pending');
    }

    get acceptedInvitations(): EmployeeInvitation[] {
        return this.invitations.filter(i => i.status === 'accepted');
    }

    get revokedInvitations(): EmployeeInvitation[] {
        return this.invitations.filter(i => i.status === 'revoked' || i.status === 'expired');
    }

    ngOnInit() {
        this.loadInvitations();
        this.loadRoles();
        this.liveRefreshService.createStream(15000)
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
                    this.toastService.error(err?.error?.message || 'Failed to load invitations');
                    this.loading = false;
                }
            }
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
            }
        });
    }

    getFilteredInvitations(): EmployeeInvitation[] {
        switch (this.activeTab) {
            case 'pending': return this.pendingInvitations;
            case 'accepted': return this.acceptedInvitations;
            case 'revoked': return this.revokedInvitations;
            default: return this.invitations;
        }
    }

    getRoleName(roleId: number | undefined): string {
        if (!roleId) return 'N/A';
        const role = this.roles.find(r => r.id === roleId);
        return role?.name || 'Unknown';
    }

    getStatusClass(status: string): string {
        const classes: Record<string, string> = {
            pending: 'inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800',
            accepted: 'inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800',
            revoked: 'inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800',
            expired: 'inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700'
        };
        return classes[status] || '';
    }

    openModal() {
        this.inviteData = {
            email: '',
            roleId: null,
            message: ''
        };
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    sendInvitation() {
        const email = this.inviteData.email.trim().toLowerCase();

        if (!email || !this.inviteData.roleId) {
            this.toastService.error('Please fill in all required fields');
            return;
        }

        this.sending = true;
        this.employeeService.inviteEmployee({
            email,
            roleId: this.inviteData.roleId
        }).subscribe({
            next: () => {
                this.toastService.success('Invitation sent successfully');
                this.sending = false;
                this.closeModal();
                this.loadInvitations();
            },
            error: (err) => {
                this.toastService.error(err.error?.message || 'Failed to send invitation');
                this.sending = false;
            }
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
            }
        });
    }

    revokeInvitation(invite: EmployeeInvitation) {
        if (confirm(`Are you sure you want to revoke the invitation for ${invite.email}?`)) {
            this.employeeService.revokeInvitation(invite.id).subscribe({
                next: () => {
                    this.toastService.success('Invitation revoked successfully');
                    this.loadInvitations();
                },
                error: () => {
                    this.toastService.error('Failed to revoke invitation');
                }
            });
        }
    }
}
