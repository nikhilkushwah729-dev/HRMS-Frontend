import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(20,184,166,0.2),_transparent_25%),radial-gradient(circle_at_bottom_left,_rgba(245,158,11,0.18),_transparent_28%),linear-gradient(160deg,_#0f172a,_#111827_55%,_#083344)] px-4 py-10 text-white">
  <div class="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
    <div class="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 shadow-[0_28px_90px_rgba(15,23,42,0.34)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
      <section class="border-b border-white/10 p-8 lg:border-b-0 lg:border-r lg:p-12">
        <p class="text-xs font-bold uppercase tracking-[0.28em] text-teal-100/80">Email Security</p>
        <h1 class="mt-4 text-4xl font-black tracking-tight">
          @if (loading()) {
            Verifying your email
          } @else if (verificationSuccess()) {
            Your workspace access is confirmed
          } @else {
            We could not verify this link
          }
        </h1>
        <p class="mt-4 max-w-xl text-sm leading-7 text-slate-200/90">
          @if (loading()) {
            We are validating your email token and preparing the right sign-in flow for your HRMS account.
          } @else if (verificationSuccess()) {
            Your email is now trusted and ready for login, approvals, attendance, and self-service access.
          } @else {
            {{ errorMessage() }}
          }
        </p>

        <div class="mt-8 grid gap-4 sm:grid-cols-2">
          <div class="rounded-md border border-white/10 bg-white/10 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Security Check</p>
            <p class="mt-2 text-sm font-semibold text-white">
              {{ loading() ? 'In progress' : (verificationSuccess() ? 'Completed' : 'Needs attention') }}
            </p>
          </div>
          <div class="rounded-md border border-white/10 bg-white/10 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Next Step</p>
            <p class="mt-2 text-sm font-semibold text-white">
              {{ verificationSuccess() ? 'Sign in and continue' : 'Request a fresh link' }}
            </p>
          </div>
        </div>
      </section>

      <section class="p-8 lg:p-12">
        <div class="flex h-full flex-col justify-center">
          <div class="verify-icon" [class.success]="verificationSuccess()" [class.error]="!loading() && !verificationSuccess()">
            @if (loading()) {
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            } @else if (verificationSuccess()) {
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            }
          </div>

          <div class="rounded-md border border-white/10 bg-slate-950/25 p-6 text-center">
            <p class="text-sm font-semibold text-amber-100">Verification Status</p>
            <p class="mt-3 text-2xl font-black text-white">
              @if (loading()) {
                Checking token
              } @else if (verificationSuccess()) {
                Email verified
              } @else {
                Verification failed
              }
            </p>
            <p class="mt-3 text-sm leading-7 text-slate-300">
              @if (loading()) {
                Please wait while we complete the final security check.
              } @else if (verificationSuccess()) {
                You can now log in with a trusted email address and continue into your HRMS workspace.
              } @else {
                {{ errorMessage() }}
              }
            </p>
          </div>

          @if (!loading()) {
            <div class="mt-6 flex flex-col gap-3">
              @if (verificationSuccess()) {
                <a routerLink="/auth/login" class="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-amber-300 via-amber-200 to-teal-200 px-5 py-3 text-sm font-bold text-slate-900 transition hover:brightness-105">
                  Sign In to Your Account
                </a>
              } @else {
                <a routerLink="/auth/login" class="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-amber-300 via-amber-200 to-teal-200 px-5 py-3 text-sm font-bold text-slate-900 transition hover:brightness-105">
                  Back to Login
                </a>
                <a routerLink="/auth/forgot-password" class="inline-flex items-center justify-center rounded-md border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
                  Request Reset Link
                </a>
              }
            </div>
          }

          <div class="mt-8 text-center text-sm text-slate-300">
            Need help? <a routerLink="/auth/login" class="font-semibold text-white hover:text-amber-200">Contact Support</a>
          </div>
        </div>
      </section>
    </div>
  </div>
</div>
  `,
  styles: [`
    .verify-icon {
      width: 92px;
      height: 92px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      transition: all 0.3s ease;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.16);
      color: #f8fafc;
    }

    .verify-icon.success {
      background: rgba(20, 184, 166, 0.16);
      color: #99f6e4;
      border: 2px solid rgba(94, 234, 212, 0.75);
    }

    .verify-icon.error {
      background: rgba(248, 113, 113, 0.14);
      color: #fecaca;
      border: 2px solid rgba(248, 113, 113, 0.62);
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class VerifyEmailComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  verificationSuccess = signal(false);
  errorMessage = signal('');

  ngOnInit() {
    const queryToken = this.route.snapshot.queryParams['token'];
    const pathToken = this.route.snapshot.paramMap.get('token');
    const fragmentToken = (this.route.snapshot.fragment || '').replace(/^token=/, '');
    const token = queryToken || pathToken || fragmentToken;

    if (!token) {
      this.loading.set(false);
      this.verificationSuccess.set(false);
      this.errorMessage.set('Invalid verification link. No token provided.');
      return;
    }

    this.verifyEmail(token);
  }

  verifyEmail(token: string) {
    this.authService.verifyEmail(token).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res?.verified || res?.success) {
          this.verificationSuccess.set(true);
        } else {
          this.verificationSuccess.set(false);
          this.errorMessage.set(res?.message || 'Email verification failed. The link may have expired.');
        }
      },
      error: (err: any) => {
        this.loading.set(false);
        this.verificationSuccess.set(false);
        this.errorMessage.set(err?.error?.message || 'Email verification failed. The link may have expired or is invalid.');
      }
    });
  }
}
