import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  EmployeeKioskQrToken,
  KioskService,
} from '../../core/services/kiosk.service';

@Component({
  selector: 'app-attendance-qr',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  template: `
    <div class="min-h-full bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-4 sm:p-6 lg:p-8">
      <div class="mx-auto max-w-4xl space-y-6">
        <section class="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] sm:p-8">
          <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p class="text-[11px] font-black uppercase tracking-[0.3em] text-sky-600">
                Kiosk Attendance
              </p>
              <h1 class="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                My Attendance QR
              </h1>
              <p class="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Generate a short-lived attendance token for reception, gate, or office kiosk use. You can copy this token and paste it into the kiosk QR attendance screen.
              </p>
            </div>

            <div class="rounded-3xl border border-sky-100 bg-sky-50 px-5 py-4 text-sm text-sky-900">
              <p class="text-[10px] font-black uppercase tracking-[0.28em] text-sky-600">
                Expiry
              </p>
              <p class="mt-2 text-2xl font-black">
                {{ countdownLabel() }}
              </p>
              <p class="mt-1 text-xs text-sky-700">
                Refresh before it expires.
              </p>
            </div>
          </div>
        </section>

        <section class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] sm:p-8">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                  Live Token
                </p>
                <h2 class="mt-2 text-2xl font-black text-slate-950">
                  {{ qrToken()?.employeeCode || 'Employee QR Token' }}
                </h2>
              </div>

              <div class="flex flex-wrap gap-3">
                <button
                  type="button"
                  (click)="copyToken()"
                  [disabled]="!qrToken()"
                  class="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {{ copied() ? 'Copied' : 'Copy Token' }}
                </button>
                <button
                  type="button"
                  (click)="loadQrToken()"
                  [disabled]="loading()"
                  class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {{ loading() ? 'Refreshing...' : 'Refresh Token' }}
                </button>
              </div>
            </div>

            @if (errorMessage()) {
              <div class="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                {{ errorMessage() }}
              </div>
            }

            <div class="mt-6 rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-slate-50">
              <p class="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                Token Payload
              </p>
              <div class="mt-4 break-all rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7">
                {{ qrToken()?.token || 'No token available yet.' }}
              </div>
            </div>

            <div class="mt-6 grid gap-4 sm:grid-cols-2">
              <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Expires At
                </p>
                <p class="mt-2 text-sm font-bold text-slate-900">
                  {{ qrToken()?.expiresAt ? (qrToken()!.expiresAt | date: 'dd MMM yyyy, hh:mm:ss a') : '--' }}
                </p>
              </div>
              <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Best Use
                </p>
                <p class="mt-2 text-sm font-bold text-slate-900">
                  Copy into kiosk QR attendance or let reception scan from your screen later.
                </p>
              </div>
            </div>
          </div>

          <aside class="space-y-6">
            <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)]">
              <p class="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                How To Use
              </p>
              <ol class="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <li>1. Generate or refresh the token before going to the kiosk.</li>
                <li>2. Open the shared device kiosk and select QR Attendance.</li>
                <li>3. Paste this token into the Scan or Paste QR Token field.</li>
                <li>4. Submit once for check-in, and again later for check-out.</li>
              </ol>
            </div>

            <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)]">
              <p class="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                Quick Links
              </p>
              <div class="mt-4 flex flex-col gap-3">
                <a
                  routerLink="/self-service/attendance"
                  class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Back To My Attendance
                </a>
                <a
                  routerLink="/dashboard"
                  class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Back To Dashboard
                </a>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  `,
})
export class AttendanceQrComponent implements OnInit, OnDestroy {
  private readonly kioskService = inject(KioskService);

  readonly qrToken = signal<EmployeeKioskQrToken | null>(null);
  readonly loading = signal(false);
  readonly copied = signal(false);
  readonly errorMessage = signal('');
  readonly now = signal(Date.now());

  readonly countdownLabel = computed(() => {
    const expiresAt = this.qrToken()?.expiresAt;
    if (!expiresAt) {
      return '--:--';
    }

    const remainingMs = new Date(expiresAt).getTime() - this.now();
    if (remainingMs <= 0) {
      return 'Expired';
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  });

  private clockTimer?: number;
  private autoRefreshTimer?: number;
  private copiedTimer?: number;

  ngOnInit() {
    void this.loadQrToken();

    this.clockTimer = window.setInterval(() => {
      this.now.set(Date.now());
    }, 1000);
  }

  ngOnDestroy() {
    if (this.clockTimer) {
      window.clearInterval(this.clockTimer);
    }
    if (this.autoRefreshTimer) {
      window.clearTimeout(this.autoRefreshTimer);
    }
    if (this.copiedTimer) {
      window.clearTimeout(this.copiedTimer);
    }
  }

  async loadQrToken() {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const data = await firstValueFrom(this.kioskService.getMyKioskQrToken());
      this.qrToken.set(data);
      this.scheduleAutoRefresh(data?.expiresAt ?? null);
    } catch (error: any) {
      this.errorMessage.set(
        error?.error?.message ||
          error?.message ||
          'QR token could not be generated right now.',
      );
      this.qrToken.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async copyToken() {
    const token = this.qrToken()?.token;
    if (!token) {
      return;
    }

    try {
      await navigator.clipboard.writeText(token);
      this.copied.set(true);
      if (this.copiedTimer) {
        window.clearTimeout(this.copiedTimer);
      }
      this.copiedTimer = window.setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.errorMessage.set('Clipboard access failed. Copy the token manually.');
    }
  }

  private scheduleAutoRefresh(expiresAt: string | null) {
    if (this.autoRefreshTimer) {
      window.clearTimeout(this.autoRefreshTimer);
    }

    if (!expiresAt) {
      return;
    }

    const refreshAt = new Date(expiresAt).getTime() - 20_000;
    const delay = Math.max(5_000, refreshAt - Date.now());
    this.autoRefreshTimer = window.setTimeout(() => {
      void this.loadQrToken();
    }, delay);
  }
}
