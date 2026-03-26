import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="flex flex-col lg:flex-row min-h-[100dvh] lg:h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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
        Secure <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-teal-300">Account Recovery</span>
      </h2>
      <p class="text-sm xl:text-base text-slate-300 leading-relaxed mb-8">Reset your password securely and regain access to your workspace in seconds.</p>
      <div class="space-y-3">
        <div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg></div><span class="text-sm text-slate-200">Secure Token-Based Reset</span></div>
        <div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><span class="text-sm text-slate-200">Instant Password Update</span></div>
        <div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><span class="text-sm text-slate-200">Bank-Level Security</span></div>
      </div>
    </div>
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute w-[400px] h-[400px] rounded-full bg-primary-600 blur-[120px] opacity-20 -top-20 -right-20"></div>
      <div class="absolute w-[300px] h-[300px] rounded-full bg-amber-500 blur-[100px] opacity-20 -bottom-20 -left-20"></div>
    </div>
  </div>

  <!-- Right Form Side -->
  <div class="flex-1 overflow-y-auto bg-slate-900">
    <div class="flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 min-h-full">

      <!-- Mobile Logo -->
      <div class="lg:hidden flex items-center justify-center gap-2 mb-5">
        <div class="bg-gradient-to-br from-primary-500 to-primary-600 w-9 h-9 rounded-md flex items-center justify-center shadow-lg shadow-primary-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
        </div>
        <div class="leading-tight">
          <div class="text-lg font-black text-white">HRNexus</div>
          <div class="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Technology</div>
        </div>
      </div>

      <div class="w-full max-w-[400px]">
        <div class="bg-slate-800/80 backdrop-blur-xl rounded-md shadow-2xl shadow-black/50 border border-slate-700 p-6 sm:p-7">
          <div class="text-center mb-5">
            <div class="w-12 h-12 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h2 class="text-xl font-bold text-white mb-0.5">Forgot Password</h2>
            <p class="text-xs text-slate-400">Enter your email to receive a reset link</p>
          </div>

          @if (error) {
            <div class="p-2.5 rounded-lg mb-4 text-xs bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {{ error }}
            </div>
          }
          @if (success) {
            <div class="p-3 rounded-lg mb-4 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <p class="font-semibold">{{ success }}</p>
            </div>
          }

          <form (ngSubmit)="onSubmit()" #forgotForm="ngForm" class="space-y-4">
            <div class="flex flex-col gap-1">
              <label for="email" class="text-xs font-semibold text-slate-300">Work Email</label>
              <div class="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                <input type="email" id="email" name="email"
                  class="w-full pl-8 pr-3 py-2.5 rounded-md border border-slate-700 bg-slate-900/50 text-slate-200 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all placeholder-slate-600"
                  placeholder="name@company.com"
                  [(ngModel)]="email" required>
              </div>
            </div>
            <button type="submit"
              class="w-full h-10 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-md hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              [disabled]="loading || !!success">
              @if (loading) {
                <svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              } @else {
                Send Reset Link
              }
            </button>
          </form>

          <div class="mt-5 pt-4 border-t border-slate-700 text-center">
            <p class="text-xs text-slate-500">Remembered your password? <a routerLink="/auth/login" class="text-primary-400 font-semibold hover:underline">Sign In</a></p>
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
export class ForgotPasswordComponent {
  private authService = inject(AuthService);

  email = '';
  loading = false;
  error: string | null = null;
  success: string | null = null;

  onSubmit() {
    const email = (this.email || '').trim().toLowerCase();
    const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!this.email) {
      this.error = 'Please enter your email.';
      return;
    }
    if (!emailLooksValid) {
      this.error = 'Please enter a valid email address.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'If an account exists with this email, a reset link has been sent.';
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to send reset email. Please try again.';
      }
    });
  }
}

