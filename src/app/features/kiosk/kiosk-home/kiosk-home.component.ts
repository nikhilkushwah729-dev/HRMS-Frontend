import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  KioskDeviceConfig,
  KioskService,
} from '../../../core/services/kiosk.service';
import {
  KioskAttendanceResult,
  KioskAttendanceService,
} from '../../../core/services/kiosk-attendance.service';
import { OfflineSyncService } from '../../../core/services/offline-sync.service';
import { KioskFaceScanComponent } from '../kiosk-face-scan/kiosk-face-scan.component';
import { KioskPinEntryComponent } from '../kiosk-pin-entry/kiosk-pin-entry.component';
import { KioskQrScanComponent } from '../kiosk-qr-scan/kiosk-qr-scan.component';
import { KioskResultComponent } from '../kiosk-result/kiosk-result.component';
import { KioskOfflineSyncComponent } from '../kiosk-offline-sync/kiosk-offline-sync.component';

type KioskScreen = 'home' | 'setup' | 'face' | 'pin' | 'qr' | 'result';

@Component({
  selector: 'app-kiosk-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    KioskFaceScanComponent,
    KioskPinEntryComponent,
    KioskQrScanComponent,
    KioskResultComponent,
    KioskOfflineSyncComponent,
  ],
  template: `
    <div class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_40%),linear-gradient(160deg,#020617_0%,#0f172a_54%,#111827_100%)] text-white">
      <div class="mx-auto flex min-h-screen max-w-[1680px] flex-col px-5 py-6 sm:px-8 xl:px-10">
        <header class="flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-white/5 px-6 py-6 shadow-xl backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-start gap-4">
            <div class="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-xl font-bold tracking-[0.3em] text-sky-100">
              HR
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200/70">
                {{ companyName() }}
              </p>
              <h1 class="mt-3 text-3xl font-semibold tracking-tight">
                Mark Your Attendance
              </h1>
              <p class="mt-2 text-sm text-slate-300">
                Shared device attendance for reception, office gate, or tablet kiosk.
              </p>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
                Date
              </p>
              <p class="mt-2 text-lg font-semibold">
                {{ now() | date: 'dd MMM yyyy' }}
              </p>
            </div>
            <div class="rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
                Time
              </p>
              <p class="mt-2 text-lg font-semibold">
                {{ now() | date: 'hh:mm:ss a' }}
              </p>
            </div>
            <div class="rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
                Kiosk
              </p>
              <p class="mt-2 text-lg font-semibold">
                {{ activeKioskLabel() }}
              </p>
            </div>
          </div>
        </header>

        <main class="mt-6 grid flex-1 gap-6 xl:grid-cols-[1fr_320px]">
          <section class="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
            @if (screen() === 'setup') {
              <div class="mx-auto max-w-2xl">
                <div class="mb-8">
                  <p class="text-xs font-semibold uppercase tracking-[0.35em] text-white/45">
                    Device Binding
                  </p>
                  <h2 class="mt-3 text-3xl font-semibold">Register this kiosk device</h2>
                  <p class="mt-2 text-sm text-slate-300">
                    Every kiosk must be approved before employees can mark attendance from it.
                  </p>
                </div>

                <form [formGroup]="setupForm" (ngSubmit)="submitSetup()" class="grid gap-5 md:grid-cols-2">
                  <label class="block md:col-span-2">
                    <span class="mb-2 block text-sm font-medium text-white/70">Device ID</span>
                    <input
                      formControlName="deviceId"
                      readonly
                      class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-base outline-none"
                    />
                  </label>

                  <label class="block">
                    <span class="mb-2 block text-sm font-medium text-white/70">Organization ID</span>
                    <input
                      formControlName="orgId"
                      type="number"
                      class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-base outline-none"
                    />
                  </label>

                  <label class="block">
                    <span class="mb-2 block text-sm font-medium text-white/70">Location ID (optional)</span>
                    <input
                      formControlName="orgLocationId"
                      type="number"
                      class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-base outline-none"
                    />
                  </label>

                  <label class="block">
                    <span class="mb-2 block text-sm font-medium text-white/70">Kiosk Name</span>
                    <input
                      formControlName="name"
                      class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-base outline-none"
                      placeholder="Reception Kiosk"
                    />
                  </label>

                  <label class="block">
                    <span class="mb-2 block text-sm font-medium text-white/70">Office / Branch</span>
                    <input
                      formControlName="location"
                      class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-base outline-none"
                      placeholder="Head Office - Lobby"
                    />
                  </label>

                  <label class="block md:col-span-2">
                    <span class="mb-2 block text-sm font-medium text-white/70">
                      Device Token (enter after admin approval)
                    </span>
                    <input
                      formControlName="deviceToken"
                      class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-base outline-none"
                      placeholder="Paste approved kiosk token"
                    />
                  </label>

                  <div class="md:col-span-2 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      [disabled]="setupBusy() || setupForm.invalid"
                      class="rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-6 py-4 text-base font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {{ setupBusy() ? 'Saving...' : 'Register / Activate Device' }}
                    </button>
                    <button
                      type="button"
                      (click)="tryStoredConfig()"
                      class="rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                    >
                      Retry Stored Device
                    </button>
                  </div>
                </form>
              </div>
            } @else if (screen() === 'face') {
              <app-kiosk-face-scan
                (cancel)="screen.set('home')"
                (failure)="handleFaceFailure($event)"
                (scanned)="submitFaceAttendance($event)"
              />
            } @else if (screen() === 'pin') {
              <app-kiosk-pin-entry
                (cancel)="screen.set('home')"
                (submitted)="submitPinAttendance($event)"
              />
            } @else if (screen() === 'qr') {
              <app-kiosk-qr-scan
                (cancel)="screen.set('home')"
                (submitted)="submitQrAttendance($event)"
              />
            } @else if (screen() === 'result') {
              <app-kiosk-result
                [tone]="resultTone()"
                [title]="resultTitle()"
                [message]="resultMessage()"
                [details]="resultDetails()"
              />
            } @else {
              <div class="flex h-full flex-col justify-between gap-8">
                <div>
                  <div class="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-[0.3em] text-white/45">
                        Attendance Methods
                      </p>
                      <h2 class="mt-3 text-4xl font-semibold">Choose how to mark attendance</h2>
                    </div>

                    <button
                      type="button"
                      (click)="screen.set('setup')"
                      class="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
                    >
                      Device Settings
                    </button>
                  </div>

                  <div class="mt-8 grid gap-5 lg:grid-cols-3">
                    <button
                      type="button"
                      (click)="openMode('face')"
                      [disabled]="!isReady()"
                      class="rounded-[2rem] border border-emerald-300/20 bg-gradient-to-br from-emerald-400/15 to-slate-950/20 p-7 text-left transition hover:-translate-y-1 hover:border-emerald-200/45 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/75">Face Scan</p>
                      <h3 class="mt-4 text-3xl font-semibold">Touch-free face attendance</h3>
                      <p class="mt-3 text-sm leading-7 text-slate-300">
                        Camera scan with liveness confirmation and secure face matching.
                      </p>
                    </button>

                    <button
                      type="button"
                      (click)="openMode('pin')"
                      [disabled]="!isReady()"
                      class="rounded-[2rem] border border-sky-300/20 bg-gradient-to-br from-sky-400/15 to-slate-950/20 p-7 text-left transition hover:-translate-y-1 hover:border-sky-200/45 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/75">Employee ID / PIN</p>
                      <h3 class="mt-4 text-3xl font-semibold">Secure manual attendance</h3>
                      <p class="mt-3 text-sm leading-7 text-slate-300">
                        Fast for reception desks and backup check-ins when camera flow is unavailable.
                      </p>
                    </button>

                    <button
                      type="button"
                      (click)="openMode('qr')"
                      [disabled]="!isReady()"
                      class="rounded-[2rem] border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-400/15 to-slate-950/20 p-7 text-left transition hover:-translate-y-1 hover:border-fuchsia-200/45 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-fuchsia-200/75">QR Scan</p>
                      <h3 class="mt-4 text-3xl font-semibold">Time-limited QR attendance</h3>
                      <p class="mt-3 text-sm leading-7 text-slate-300">
                        Ideal for temporary staff, event desks, or managed visitor-style access.
                      </p>
                    </button>
                  </div>
                </div>

                <div class="grid gap-4 lg:grid-cols-3">
                  <div class="rounded-3xl border border-white/10 bg-slate-950/35 p-5">
                    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Office / Location</p>
                    <p class="mt-2 text-xl font-semibold">{{ kioskLocation() }}</p>
                  </div>
                  <div class="rounded-3xl border border-white/10 bg-slate-950/35 p-5">
                    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Device State</p>
                    <p class="mt-2 text-xl font-semibold">{{ isReady() ? 'Approved & Active' : 'Pending Approval' }}</p>
                  </div>
                  <div class="rounded-3xl border border-white/10 bg-slate-950/35 p-5">
                    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Status Message</p>
                    <p class="mt-2 text-base font-medium text-slate-200">{{ kioskNotice() }}</p>
                  </div>
                </div>
              </div>
            }
          </section>

          <aside class="space-y-5">
            <app-kiosk-offline-sync
              [online]="offlineSync.online()"
              [syncing]="offlineSync.syncing()"
              [pendingCount]="offlineSync.pendingCount()"
              (sync)="syncOfflineQueue()"
            />

            <div class="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                Device Health
              </p>
              <dl class="mt-4 space-y-3 text-sm text-white/80">
                <div class="flex items-center justify-between gap-3">
                  <dt>Device ID</dt>
                  <dd class="max-w-[160px] truncate text-right">{{ setupForm.controls.deviceId.value }}</dd>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <dt>Internet</dt>
                  <dd>{{ offlineSync.online() ? 'Connected' : 'Offline mode' }}</dd>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <dt>Pending Sync</dt>
                  <dd>{{ offlineSync.pendingCount() }}</dd>
                </div>
              </dl>
            </div>

            <div class="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                Fraud Prevention
              </p>
              <ul class="mt-4 space-y-3 text-sm leading-6 text-white/80">
                <li>Only approved kiosk tokens can mark attendance.</li>
                <li>Face flow requires liveness before matching.</li>
                <li>Repeated wrong PIN attempts are temporarily blocked.</li>
                <li>Offline attempts are deduplicated with sync references.</li>
              </ul>
            </div>
          </aside>
        </main>
      </div>
    </div>
  `,
})
export class KioskHomeComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private kioskService = inject(KioskService);
  private kioskAttendanceService = inject(KioskAttendanceService);

  readonly offlineSync = inject(OfflineSyncService);

  now = signal(new Date());
  screen = signal<KioskScreen>('setup');
  companyName = signal('HRMS Kiosk');
  kioskNotice = signal(
    'Register and approve this device before using kiosk attendance.',
  );
  setupBusy = signal(false);
  submitting = signal(false);

  resultTone = signal<'success' | 'warning' | 'error' | 'info'>('info');
  resultTitle = signal('');
  resultMessage = signal('');
  resultDetails = signal<Array<{ label: string; value: string }>>([]);

  kioskConfig = signal<KioskDeviceConfig | null>(null);

  isReady = computed(
    () => Boolean(this.kioskConfig()?.deviceToken) && this.screen() !== 'setup',
  );
  activeKioskLabel = computed(
    () => this.kioskConfig()?.name || 'Unregistered Device',
  );
  kioskLocation = computed(
    () => this.kioskConfig()?.location || 'Awaiting approval',
  );

  setupForm = this.fb.nonNullable.group({
    orgId: [0, [Validators.required, Validators.min(1)]],
    orgLocationId: [0],
    name: ['Reception Kiosk', [Validators.required]],
    location: ['Main Office', [Validators.required]],
    deviceId: [this.kioskService.createFallbackDeviceId(), [Validators.required]],
    deviceToken: [''],
  });

  private clockTimer?: number;
  private resultTimer?: number;

  ngOnInit() {
    this.clockTimer = window.setInterval(() => {
      this.now.set(new Date());
    }, 1000);

    this.kioskService.getCompanyNameFromUser().subscribe((name) => {
      this.companyName.set(name);
    });

    this.tryStoredConfig();
  }

  ngOnDestroy() {
    if (this.clockTimer) {
      window.clearInterval(this.clockTimer);
    }
    if (this.resultTimer) {
      window.clearTimeout(this.resultTimer);
    }
  }

  tryStoredConfig() {
    const stored = this.kioskService.getStoredConfig();
    if (!stored) {
      this.screen.set('setup');
      return;
    }

    this.kioskConfig.set(stored);
    this.setupForm.patchValue({
      orgId: stored.orgId,
      orgLocationId: stored.orgLocationId ? Number(stored.orgLocationId) : 0,
      name: stored.name,
      location: stored.location,
      deviceId: stored.deviceId,
      deviceToken: stored.deviceToken ?? '',
    });

    if (stored.deviceToken) {
      void this.validateAndActivate(stored.deviceId, stored.deviceToken);
      return;
    }

    this.kioskNotice.set(
      'Device is registered. Paste the approved token to activate this kiosk.',
    );
    this.screen.set('setup');
  }

  async submitSetup() {
    if (this.setupForm.invalid) {
      this.setupForm.markAllAsTouched();
      return;
    }

    this.setupBusy.set(true);
    const value = this.setupForm.getRawValue();
    const config: KioskDeviceConfig = {
      orgId: Number(value.orgId),
      orgLocationId: value.orgLocationId ? Number(value.orgLocationId) : null,
      name: value.name,
      location: value.location,
      deviceId: value.deviceId,
      deviceToken: value.deviceToken?.trim() || null,
    };

    try {
      const registered = await firstValueFrom(this.kioskService.registerKiosk(config));
      const resolvedConfig: KioskDeviceConfig = {
        orgId: Number(registered.orgId ?? config.orgId),
        orgLocationId: registered.orgLocationId ?? config.orgLocationId ?? null,
        name: registered.name || config.name,
        location: registered.location || config.location,
        deviceId: registered.deviceId || config.deviceId,
        // Always prefer the backend-issued token to avoid stale local tokens.
        deviceToken: registered.deviceToken?.trim() || config.deviceToken || null,
      };

      this.kioskService.saveStoredConfig(resolvedConfig);
      this.kioskConfig.set(resolvedConfig);
      this.setupForm.patchValue({
        orgId: resolvedConfig.orgId,
        orgLocationId: resolvedConfig.orgLocationId
          ? Number(resolvedConfig.orgLocationId)
          : 0,
        name: resolvedConfig.name,
        location: resolvedConfig.location,
        deviceId: resolvedConfig.deviceId,
        deviceToken: resolvedConfig.deviceToken ?? '',
      });

      if (resolvedConfig.deviceToken && registered.status === 'active') {
        await this.validateAndActivate(
          resolvedConfig.deviceId,
          resolvedConfig.deviceToken,
        );
        return;
      }

      this.showResult(
        'warning',
        'Kiosk Registration Pending',
        'This device is registered. Ask an HR/Admin user to approve it and provide the generated kiosk token.',
        [
          { label: 'Kiosk', value: resolvedConfig.name },
          { label: 'Device ID', value: resolvedConfig.deviceId },
        ],
      );
      this.kioskNotice.set(
        registered.status === 'active'
          ? 'Kiosk is active. Use the issued token to activate this device.'
          : 'Registration saved. Waiting for admin approval and token activation.',
      );
    } catch (error: any) {
      this.showError(
        'Device registration failed',
        error?.error?.message || error?.message || 'Kiosk could not be registered.',
      );
    } finally {
      this.setupBusy.set(false);
    }
  }

  openMode(screen: 'face' | 'pin' | 'qr') {
    if (!this.kioskConfig()?.deviceToken) {
      this.screen.set('setup');
      return;
    }

    this.screen.set(screen);
  }

  async submitFaceAttendance(payload: {
    embedding: number[];
    imageUrl?: string;
    liveness: {
      confirmed: boolean;
      blinkDetected: boolean;
      headMovementDetected: boolean;
    };
  }) {
    await this.processAttendance('face', payload);
  }

  async submitPinAttendance(payload: { employeeCode: string; pin: string }) {
    await this.processAttendance('pin', payload);
  }

  async submitQrAttendance(payload: { qrToken: string }) {
    await this.processAttendance('qr', payload);
  }

  handleFaceFailure(message: string) {
    this.showError('Face scan failed', message);
  }

  async syncOfflineQueue() {
    const config = this.kioskConfig();
    if (!config?.deviceToken) {
      return;
    }

    try {
      const results = await this.offlineSync.flushQueuedAttempts(
        config,
        this.kioskAttendanceService,
      );
      const synced = (results ?? []).filter((item: any) => item?.success).length;
      this.kioskNotice.set(
        synced
          ? `${synced} offline attendance attempts synced successfully.`
          : 'No offline records were synced.',
      );
    } catch (error: any) {
      this.kioskNotice.set(
        error?.message || 'Offline sync could not be completed right now.',
      );
    }
  }

  private async processAttendance(
    method: 'face' | 'pin' | 'qr',
    payload: Record<string, any>,
  ) {
    const config = this.kioskConfig();
    if (!config?.deviceToken) {
      this.screen.set('setup');
      return;
    }

    const clientReference = `${method}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const finalPayload: Record<string, any> = { ...payload, clientReference };

    if (!this.offlineSync.online()) {
      await this.offlineSync.queueAttempt(method, finalPayload);
      this.showResult(
        'warning',
        'Saved For Offline Sync',
        'Internet is unavailable. This attendance attempt has been stored and will sync automatically when the device reconnects.',
        [{ label: 'Reference', value: clientReference }],
      );
      return;
    }

    this.submitting.set(true);
    try {
      let result: KioskAttendanceResult;
      if (method === 'face') {
        result = await firstValueFrom(
          this.kioskAttendanceService.submitFaceAttendance(config, {
            embedding: finalPayload['embedding'] as number[],
            imageUrl: finalPayload['imageUrl'] as string | undefined,
            type: finalPayload['type'] as 'check_in' | 'check_out' | undefined,
            clientReference,
            liveness: finalPayload['liveness'] as
              | {
                  confirmed?: boolean;
                  blinkDetected?: boolean;
                  headMovementDetected?: boolean;
                }
              | undefined,
          }),
        );
      } else if (method === 'pin') {
        result = await firstValueFrom(
          this.kioskAttendanceService.submitPinAttendance(config, {
            employeeCode: String(finalPayload['employeeCode'] ?? ''),
            pin: String(finalPayload['pin'] ?? ''),
            type: finalPayload['type'] as 'check_in' | 'check_out' | undefined,
            clientReference,
          }),
        );
      } else {
        result = await firstValueFrom(
          this.kioskAttendanceService.submitQrAttendance(config, {
            qrToken: String(finalPayload['qrToken'] ?? ''),
            type: finalPayload['type'] as 'check_in' | 'check_out' | undefined,
            clientReference,
          }),
        );
      }

      this.presentAttendanceResult(result);
      void this.syncOfflineQueue();
    } catch (error: any) {
      const friendlyMessage = this.extractErrorMessage(error);
      this.showError(
        friendlyMessage.includes('Attendance')
          ? friendlyMessage
          : 'Attendance could not be marked',
        friendlyMessage,
      );
    } finally {
      this.submitting.set(false);
    }
  }

  private async validateAndActivate(deviceId: string, deviceToken: string) {
    try {
      const validated = await firstValueFrom(
        this.kioskService.validateKiosk(deviceId, deviceToken),
      );
      const config: KioskDeviceConfig = {
        orgId: Number(validated.orgId),
        orgLocationId: validated.orgLocationId,
        name: validated.name,
        location: validated.location,
        deviceId,
        deviceToken,
      };
      this.kioskConfig.set(config);
      this.kioskService.saveStoredConfig(config);
      this.kioskNotice.set('Kiosk is approved and ready for attendance.');
      this.screen.set('home');
      void this.syncOfflineQueue();
    } catch (error: any) {
      this.kioskNotice.set(
        error?.error?.message ||
          'Device token is invalid or this kiosk is not approved yet.',
      );
      this.screen.set('setup');
    }
  }

  private presentAttendanceResult(result: KioskAttendanceResult) {
    const details = [
      { label: 'Employee', value: result.employee.name },
      { label: 'Attendance Type', value: this.labelize(result.attendance.type) },
      { label: 'Method', value: this.labelize(result.attendance.method) },
      { label: 'Kiosk', value: result.kiosk.name },
    ];

    if (result.attendance.lateMinutes > 0) {
      details.push({
        label: 'Late Minutes',
        value: String(result.attendance.lateMinutes),
      });
    }

    if (result.attendance.earlyExitMinutes > 0) {
      details.push({
        label: 'Early Exit',
        value: String(result.attendance.earlyExitMinutes),
      });
    }

    if (result.attendance.overtimeMinutes > 0) {
      details.push({
        label: 'Overtime',
        value: String(result.attendance.overtimeMinutes),
      });
    }

    this.showResult(
      'success',
      result.attendance.type === 'check_in'
        ? 'Attendance Marked Successfully'
        : 'Check-out Completed Successfully',
      result.message,
      details,
    );
  }

  private showError(title: string, message: string) {
    this.showResult('error', title, message, []);
  }

  private showResult(
    tone: 'success' | 'warning' | 'error' | 'info',
    title: string,
    message: string,
    details: Array<{ label: string; value: string }>,
  ) {
    this.resultTone.set(tone);
    this.resultTitle.set(title);
    this.resultMessage.set(message);
    this.resultDetails.set(details);
    this.screen.set('result');

    if (this.resultTimer) {
      window.clearTimeout(this.resultTimer);
    }

    this.resultTimer = window.setTimeout(() => {
      this.screen.set(this.kioskConfig()?.deviceToken ? 'home' : 'setup');
    }, tone === 'error' ? 7000 : 4500);
  }

  private labelize(value: string) {
    return value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private extractErrorMessage(error: any) {
    const candidates = [
      error?.error?.message,
      error?.error?.friendlyMessage,
      error?.friendlyMessage,
      error?.message,
      error?.statusText,
    ]
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter(Boolean);

    return candidates[0] || 'Unexpected kiosk error.';
  }
}
