import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="flex h-[100dvh] flex-col overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(20,184,166,0.16),_transparent_22%),radial-gradient(circle_at_bottom_left,_rgba(245,158,11,0.16),_transparent_24%),linear-gradient(135deg,#0f172a_0%,#111827_55%,#0f172a_100%)] lg:flex-row">
  <!-- Left Banner -->
  <div class="hidden lg:flex w-[45%] xl:w-[42%] bg-gradient-to-br from-slate-900 via-primary-900/60 to-slate-900 p-10 xl:p-14 flex-col justify-center relative overflow-hidden text-white flex-shrink-0">
    <div class="relative z-10 max-w-[440px]">
      <div class="flex items-center gap-3 mb-10">
        <div class="bg-gradient-to-br from-primary-500 to-primary-600 w-12 h-12 rounded-md flex items-center justify-center shadow-lg shadow-primary-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
        </div>
        <div>
          <h1 class="text-2xl xl:text-3xl font-black tracking-tight">HRNexus</h1>
          <span class="text-[10px] font-bold text-primary-300 uppercase tracking-[0.2em]">Technology</span>
        </div>
      </div>
      <h2 class="text-3xl xl:text-4xl leading-tight mb-4 font-bold">
        Set Your <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-teal-300">New Password</span>
      </h2>
      <p class="text-sm xl:text-base text-slate-300 leading-relaxed mb-8">Create a strong new password to secure your account.</p>
      <div class="space-y-3">
        <div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><span class="text-sm text-slate-200">Minimum 8 characters</span></div>
        <div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><span class="text-sm text-slate-200">Instant account re-activation</span></div>
        <div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg></div><span class="text-sm text-slate-200">Encrypted at rest and in transit</span></div>
      </div>
    </div>
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute w-[400px] h-[400px] rounded-full bg-primary-600 blur-[120px] opacity-20 -top-20 -right-20"></div>
      <div class="absolute w-[300px] h-[300px] rounded-full bg-amber-500 blur-[100px] opacity-20 -bottom-20 -left-20"></div>
    </div>
  </div>

  <!-- Right Form Side -->
  <div class="flex-1 overflow-y-auto bg-transparent">
    <div class="mx-auto flex min-h-[100dvh] w-full max-w-[860px] flex-col items-center justify-center p-4 sm:p-6 lg:min-h-full lg:p-10">

      <div class="lg:hidden mb-5 w-full max-w-[480px] rounded-[28px] border border-white/10 bg-white/5 p-4 text-white shadow-[0_24px_60px_rgba(15,23,42,0.28)] backdrop-blur-xl">
        <div class="flex items-center gap-3">
          <div class="bg-gradient-to-br from-primary-500 to-primary-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.24em] text-teal-100/70">Password Update</p>
            <p class="mt-1 text-sm font-black tracking-tight text-white">HRNexus Security</p>
          </div>
        </div>
        <h2 class="mt-2 text-2xl font-black tracking-tight">Set a strong new password with the same premium experience on every screen size</h2>
      </div>

      <div class="w-full max-w-[480px]">
        <div class="rounded-[30px] border border-white/10 bg-slate-800/80 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-7">
          <div class="text-center mb-5">
            <div class="w-12 h-12 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h2 class="text-xl font-bold text-white mb-0.5">Reset Password</h2>
            <p class="text-xs text-slate-400">Set a new strong password for your account</p>
          </div>

          @if (error) {
            <div class="p-2.5 rounded-lg mb-4 text-xs bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {{ error }}
            </div>
          }
          @if (success) {
            <div class="p-3 rounded-lg mb-4 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <p class="font-semibold mb-1">Password Reset Successful!</p>
              <p>{{ success }}</p>
            </div>
          }

          @if (!success) {
            <form (ngSubmit)="onSubmit()" #resetForm="ngForm" class="space-y-4">
              <div class="flex flex-col gap-1">
                <label for="newPassword" class="text-xs font-semibold text-slate-300">New Password</label>
                <div class="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input [type]="showNewPassword ? 'text' : 'password'" id="newPassword" name="newPassword" autocomplete="new-password"
                    class="w-full pl-8 pr-9 py-2.5 rounded-md border border-slate-700 bg-slate-900/50 text-slate-200 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all placeholder-slate-600"
                    placeholder="Enter your new password"
                    [(ngModel)]="newPassword" required minlength="8" [disabled]="loading">
                  <button type="button" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" (click)="showNewPassword = !showNewPassword">
                    @if (showNewPassword) {
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 0 1-4.24-4.24"/><line x1="1" x2="23" y1="1" y2="23"/></svg>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                @if (newPassword && newPassword.length > 0 && newPassword.length < 8) {
                  <p class="text-[10px] text-red-400 mt-0.5">Min. 8 characters required.</p>
                }
              </div>

              <div class="flex flex-col gap-1">
                <label for="confirmPassword" class="text-xs font-semibold text-slate-300">Confirm Password</label>
                <div class="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <input [type]="showConfirmPassword ? 'text' : 'password'" id="confirmPassword" name="confirmPassword" autocomplete="new-password"
                    class="w-full pl-8 pr-9 py-2.5 rounded-md border border-slate-700 bg-slate-900/50 text-slate-200 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all placeholder-slate-600"
                    placeholder="Confirm your new password"
                    [(ngModel)]="confirmPassword" required [disabled]="loading">
                  <button type="button" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" (click)="showConfirmPassword = !showConfirmPassword">
                    @if (showConfirmPassword) {
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 0 1-4.24-4.24"/><line x1="1" x2="23" y1="1" y2="23"/></svg>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                @if (confirmPassword && newPassword && confirmPassword !== newPassword) {
                  <p class="text-[10px] text-red-400 mt-0.5">Passwords do not match.</p>
                }
              </div>

              <button type="submit"
                class="w-full h-10 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-md hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                [disabled]="loading">
                @if (loading) {
                  <svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                } @else {
                  Reset Password
                }
              </button>
            </form>
          }

          <div class="mt-5 pt-4 border-t border-slate-700 text-center">
            <p class="text-xs text-slate-500"><a routerLink="/auth/login" class="text-primary-400 font-semibold hover:underline">Back to Sign In</a></p>
          </div>
        </div>
        <div class="mt-3 text-center">
          <p class="text-[10px] text-slate-600">&copy; 2026 HRNexus Technology. All rights reserved.</p>
        </div>
      </div>
    </div>
  </div>
</div>
  `
})
export class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  error: string | null = null;
  success: string | null = null;
  showNewPassword = false;
  showConfirmPassword = false;

  ngOnInit() {
    const qp = this.route.snapshot.queryParams;
    this.token = qp['token'] || qp['resetToken'] || qp['reset_token'] || '';
    if (!this.token) {
      this.error = 'Invalid or missing reset token.';
    }
  }

  onSubmit() {
    const newPassword = (this.newPassword || '').trim();
    const confirmPassword = (this.confirmPassword || '').trim();

    if (!newPassword || !this.token) {
      if (!this.token) this.error = 'No token provided.';
      else this.error = 'Please enter a new password.';
      return;
    }
    if (newPassword.length < 8) {
      this.error = 'Password must be at least 8 characters.';
      return;
    }
    if (!confirmPassword) {
      this.error = 'Please confirm your new password.';
      return;
    }
    if (newPassword !== confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    this.authService.resetPassword({ token: this.token, new_password: newPassword }).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Password successfully reset. Redirecting to login...';
        setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to reset password. Token may have expired.';
      }
    });
  }
}

