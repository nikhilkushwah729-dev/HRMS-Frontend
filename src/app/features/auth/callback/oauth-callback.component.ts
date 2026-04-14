import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthService } from '../../../core/services/auth.service';
import * as AuthActions from '../../../core/state/auth/auth.actions';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="min-h-[100dvh] w-full overflow-x-hidden flex items-center justify-center bg-[radial-gradient(circle_at_top_right,_rgba(20,184,166,0.18),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(245,158,11,0.16),_transparent_26%),linear-gradient(145deg,_#0f172a,_#111827_50%,_#082f49)] px-4"
    >
      <div
        class="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/10 p-8 text-center text-white shadow-[0_28px_90px_rgba(15,23,42,0.34)] backdrop-blur-xl"
      >
        <p
          class="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-teal-100/80"
        >
          OAuth Sign In
        </p>
        @if (loading()) {
          <div
            class="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-amber-200"
          ></div>
          <h2 class="mb-2 text-3xl font-black text-white">
            Completing authentication
          </h2>
          <p class="text-sm leading-7 text-slate-200">
            We are validating your provider response, restoring your account
            session, and preparing the right workspace access.
          </p>
        } @else if (error()) {
          <div
            class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-red-300/25 bg-red-400/10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fecaca"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 class="mb-2 text-3xl font-black text-white">
            Authentication failed
          </h2>
          <p class="mb-6 text-sm leading-7 text-slate-200">{{ error() }}</p>
          <a
            href="/auth/login"
            class="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-amber-300 via-amber-200 to-teal-200 px-6 py-3 text-sm font-bold text-slate-900 transition hover:brightness-105"
          >
            Back to Login
          </a>
        } @else {
          <div
            class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-teal-200/25 bg-teal-300/10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#99f6e4"
              stroke-width="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 class="mb-2 text-3xl font-black text-white">Welcome back</h2>
          <p class="text-sm leading-7 text-slate-200">{{ message() }}</p>
        }
      </div>
    </div>
  `,
})
export class OAuthCallbackComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private store = inject(Store);

  loading = signal(true);
  error = signal('');
  message = signal('');

  ngOnInit() {
    console.log(
      '[OAUTH DEBUG] Callback loaded, queryParams:',
      window.location.search,
    );
    console.log('[OAUTH DEBUG] Full URL:', window.location.href);
    console.log('[OAUTH DEBUG] Raw params:', this.route.snapshot.queryParams);

    this.route.queryParams.subscribe((params) => {
      console.log('[OAUTH DEBUG] Processing params:', params);
      const success = params['success'];
      const message = params['message'] || params['msg'];

      if (success === 'true') {
        const employeeData = params['employee'];
        const isNewAccount = params['isNewAccount'] === 'true';
        const token = params['token'];

        if (token && employeeData) {
          this.handleSuccess(employeeData, token, isNewAccount);
        } else {
          this.handleOAuthCallback();
        }
      } else {
        this.loading.set(false);
        this.error.set(message || 'Authentication failed. Please try again.');
      }
    });
  }

  private handleSuccess(employeeData: string, token: string, isNew: boolean) {
    try {
      const employee =
        typeof employeeData === 'string'
          ? JSON.parse(decodeURIComponent(employeeData))
          : employeeData;

      const user = {
        id: employee.id,
        orgId: employee.orgId || 0,
        roleId: employee.roleId || 0,
        employeeCode: employee.employeeCode || '',
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone || '',
        avatar: employee.avatar,
        status: 'active' as const,
        loginType: 'google' as const,
      };

      localStorage.setItem('hrms_auth_token', token);
      localStorage.setItem('hrms_user_data', JSON.stringify(user));

      this.store.dispatch(AuthActions.loginSuccess({ user, token }));

      this.fetchFreshUser();

      this.message.set(
        isNew
          ? 'Your account has been created successfully!'
          : 'You have been logged in successfully!',
      );

      this.loading.set(false);

      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 1500);
    } catch (e) {
      console.error(
        '[OAUTH DEBUG ERROR] Parse fail:',
        e,
        'employeeData:',
        employeeData,
      );
      this.error.set(
        `Failed to process authentication data: \${(e as Error).message}`,
      );
      this.loading.set(false);
    }
  }

  private handleOAuthCallback() {
    const oauthData = sessionStorage.getItem('oauth_callback_data');

    if (oauthData) {
      try {
        const data = JSON.parse(oauthData);
        sessionStorage.removeItem('oauth_callback_data');

        if (data.token && data.employee) {
          this.handleSuccess(data.employee, data.token, data.isNewAccount);
          return;
        }
      } catch (e) {
        console.error(
          '[OAUTH DEBUG ERROR] Session parse fail:',
          e,
          'oauthData:',
          oauthData,
        );
      }
    }

    this.authService.getMe().subscribe({
      next: (user) => {
        const token = localStorage.getItem('hrms_auth_token');
        if (token && user) {
          this.store.dispatch(AuthActions.loginSuccess({ user, token }));
          this.message.set('You have been logged in successfully!');
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        } else {
          this.error.set('Authentication data not found. Please login again.');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to complete authentication. Please try again.');
        this.loading.set(false);
      },
    });
  }

  private fetchFreshUser() {
    const token = this.authService.getStoredToken();
    if (!token) return;
    this.authService.getMe().subscribe({
      next: (freshUser) => {
        this.authService.setStoredUser(freshUser);
        this.store.dispatch(AuthActions.updateUser({ user: freshUser }));
      },
      error: () => {},
    });
  }
}
