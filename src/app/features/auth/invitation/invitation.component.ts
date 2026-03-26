import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PublicInvitationService, type PublicInvitation } from '../../../core/services/public-invitation.service';

@Component({
  selector: 'app-invitation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.22),_transparent_30%),linear-gradient(135deg,_#082f49,_#111827_55%,_#1f2937)] px-4 py-10 text-white">
      <div class="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div class="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 shadow-[0_32px_90px_rgba(15,23,42,0.35)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
          <section class="border-b border-white/10 p-8 lg:border-b-0 lg:border-r lg:p-12">
            <p class="text-xs font-bold uppercase tracking-[0.28em] text-teal-100/80">Team Invitation</p>
            <h1 class="mt-4 text-4xl font-black tracking-tight">
              {{ headline() }}
            </h1>
            <p class="mt-4 max-w-xl text-sm leading-7 text-slate-200/90">
              {{ description() }}
            </p>

            <div class="mt-8 rounded-md border border-white/10 bg-slate-950/20 p-5">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/85">Workspace Access</p>
                  <p class="mt-3 max-w-md text-sm leading-7 text-slate-200/85">
                    This invite lets you enter the HRMS workspace with the right organization context, role access, and onboarding flow already prepared.
                  </p>
                </div>
                <div class="rounded-md border border-white/10 bg-white/10 px-4 py-3 text-right">
                  <p class="text-[11px] uppercase tracking-[0.18em] text-slate-300">Status</p>
                  <p class="mt-2 text-sm font-bold text-white">{{ statusLabel() }}</p>
                </div>
              </div>
            </div>

            <div class="mt-6 grid gap-4 sm:grid-cols-2">
              <div class="rounded-md border border-white/10 bg-white/10 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Email</p>
                <p class="mt-2 break-all text-sm font-semibold text-white">{{ invitation()?.email || '--' }}</p>
              </div>
              <div class="rounded-md border border-white/10 bg-white/10 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Organization</p>
                <p class="mt-2 text-sm font-semibold text-white">{{ invitation()?.organizationName || 'HRMS Organization' }}</p>
              </div>
              <div class="rounded-md border border-white/10 bg-white/10 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Suggested Role</p>
                <p class="mt-2 text-sm font-semibold text-white">{{ invitation()?.roleName || 'Employee' }}</p>
              </div>
              <div class="rounded-md border border-white/10 bg-white/10 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Expires</p>
                <p class="mt-2 text-sm font-semibold text-white">
                  {{ invitation()?.expiresAt ? (invitation()!.expiresAt | date:'medium') : '--' }}
                </p>
              </div>
            </div>
          </section>

          <section class="p-8 lg:p-12">
            @if (loading()) {
              <div class="flex h-full min-h-[320px] items-center justify-center">
                <div class="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
              </div>
            } @else {
              <div class="flex h-full flex-col justify-center">
                <div class="rounded-md border border-white/10 bg-slate-950/30 p-6">
                  <p class="text-sm font-semibold text-teal-100">Invitation Status</p>
                  <p class="mt-3 text-2xl font-black text-white">{{ statusLabel() }}</p>
                  <p class="mt-3 text-sm leading-7 text-slate-300">{{ responseMessage() }}</p>
                </div>

                @if (error()) {
                  <div class="mt-5 rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {{ error() }}
                  </div>
                }

                @if (isActionable()) {
                  <div class="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      (click)="acceptInvitation()"
                      [disabled]="submitting()"
                      class="inline-flex flex-1 items-center justify-center rounded-md bg-gradient-to-r from-amber-300 via-amber-200 to-teal-200 px-5 py-3 text-sm font-bold text-slate-900 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60">
                      {{ submitting() ? 'Processing...' : 'Accept Invitation' }}
                    </button>
                    <button
                      type="button"
                      (click)="declineInvitation()"
                      [disabled]="submitting()"
                      class="inline-flex flex-1 items-center justify-center rounded-md border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60">
                      Decline
                    </button>
                  </div>
                }

                <div class="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  <a routerLink="/auth/login" class="font-semibold text-white hover:text-amber-200">Back to login</a>
                </div>
              </div>
            }
          </section>
        </div>
      </div>
    </div>
  `
})
export class InvitationComponent {
  private route = inject(ActivatedRoute);
  private publicInvitationService = inject(PublicInvitationService);

  loading = signal(true);
  submitting = signal(false);
  error = signal('');
  responseMessage = signal('We are checking your invitation details.');
  invitation = signal<PublicInvitation | null>(null);

  constructor() {
    const token = this.route.snapshot.paramMap.get('token');

    if (!token) {
      this.loading.set(false);
      this.error.set('Invitation token is missing.');
      return;
    }

    this.publicInvitationService.getInvitationByToken(token).subscribe({
      next: (invitation) => {
        this.invitation.set(invitation);
        this.responseMessage.set('Review the invitation details below and choose whether to join this organization.');
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'This invitation link is invalid or has expired.');
        this.responseMessage.set('Please contact your HR or admin team for a fresh invitation link.');
        this.loading.set(false);
      }
    });
  }

  headline = computed(() => {
    const organizationName = this.invitation()?.organizationName;
    return organizationName ? `You've been invited to join ${organizationName}` : 'You have received an employee invitation';
  });

  description = computed(() => {
    const roleName = this.invitation()?.roleName;
    return roleName
      ? `This invitation gives you access to your employee workspace as ${roleName}.`
      : 'This invitation gives you access to your employee workspace.';
  });

  statusLabel = computed(() => {
    const status = this.invitation()?.status;
    if (status === 'accepted') return 'Invitation accepted';
    if (status === 'revoked') return 'Invitation revoked';
    if (status === 'expired') return 'Invitation expired';
    if (this.error()) return 'Invitation unavailable';
    return 'Pending your response';
  });

  isActionable = computed(() => {
    return Boolean(this.invitation() && this.invitation()?.status === 'pending' && !this.error());
  });

  acceptInvitation() {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token || !this.isActionable()) return;

    this.submitting.set(true);
    this.publicInvitationService.respondToInvitation(token, 'accept').subscribe({
      next: (res) => {
        this.responseMessage.set(res.message || 'Invitation accepted successfully.');
        this.invitation.update((current) => current ? { ...current, status: 'accepted' } : current);
        this.submitting.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to accept invitation.');
        this.submitting.set(false);
      }
    });
  }

  declineInvitation() {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token || !this.isActionable()) return;

    this.submitting.set(true);
    this.publicInvitationService.declineInvitation(token).subscribe({
      next: (res) => {
        this.responseMessage.set(res.message || 'Invitation declined.');
        this.invitation.update((current) => current ? { ...current, status: 'revoked' } : current);
        this.submitting.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to decline invitation.');
        this.submitting.set(false);
      }
    });
  }
}
