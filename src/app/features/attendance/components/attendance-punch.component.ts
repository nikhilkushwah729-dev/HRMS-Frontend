import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  inject,
  ViewChild,
  ElementRef,
  computed,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService, TodayAttendance } from '../../../core/services/attendance.service';
import { ToastService } from '../../../core/services/toast.service';
import { finalize, firstValueFrom, interval, Subscription } from 'rxjs';
import { FaceRecognitionService } from '../../../core/services/face-recognition.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-attendance-punch',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-4">
      <div class="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-[0.24em] text-teal-600">Smart Face Attendance</p>
            <h3 class="mt-1 text-xl font-black text-slate-900">Auto detect and capture</h3>
            <p class="mt-1 text-sm text-slate-500">
              Keep one registered face centered in the frame. The system verifies the face and captures attendance automatically.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <span class="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]" [class]="cameraStateTone()">
              {{ cameraStateLabel() }}
            </span>
            <span class="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
              {{ statusBadgeLabel() }}
            </span>
          </div>
        </div>
      </div>

      <!-- Camera Card -->
      <div class="relative group">
        <div class="h-64 sm:h-72 w-full rounded-md bg-slate-900 overflow-hidden shadow-2xl border border-slate-200 relative">
          <!-- Video Feed -->
          <video
            #videoElement
            autoplay
            playsinline
            webkit-playsinline
            muted
            class="absolute inset-0 w-full h-full object-cover -scale-x-100"
            [class.opacity-0]="!isCameraReady()"
          ></video>

          <!-- Camera Placeholder / Loading -->
          <div *ngIf="!isCameraReady()" class="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center text-slate-500">
             <div class="h-12 w-12 rounded-full border-4 border-slate-800 border-t-teal-500 animate-spin"></div>
             <p class="text-sm font-bold uppercase tracking-widest animate-pulse">{{ cameraFallbackMode() ? 'Camera unavailable. Preparing fallback...' : 'Initializing Camera...' }}</p>
             <div *ngIf="cameraFallbackMode()" class="max-w-sm rounded-md border border-amber-200 bg-amber-50/90 px-4 py-3 text-left shadow-lg">
               <p class="text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">Fallback Attendance</p>
               <p class="mt-1 text-sm font-bold text-amber-900">Camera is not available on this device or browser.</p>
               <p class="mt-1 text-xs leading-5 text-amber-800">You can still continue attendance with location-based web punch without selfie capture.</p>
             </div>
          </div>

          <!-- Face Guide Overlay -->
          <div *ngIf="isCameraReady() && !capturedImage()" class="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div class="relative w-2/3 max-w-[240px] aspect-square rounded-full border-2 border-dashed border-teal-500/40">
                <div class="absolute inset-0 rounded-full bg-teal-500/5 animate-pulse"></div>
                <div class="absolute -inset-4 rounded-full border border-teal-400/20" [style.transform]="'scale(' + scanRingScale() + ')'" [style.opacity]="scanRingOpacity()"></div>
                <div class="absolute -inset-8 rounded-full border border-cyan-400/10" [style.transform]="'scale(' + secondaryScanRingScale() + ')'" [style.opacity]="secondaryScanRingOpacity()"></div>
                <!-- Corner Accents -->
                <div class="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-teal-500 rounded-tl-xl"></div>
                <div class="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-teal-500 rounded-tr-xl"></div>
                <div class="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-teal-500 rounded-bl-xl"></div>
                <div class="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-teal-500 rounded-br-xl"></div>
             </div>
          </div>

          <div *ngIf="isCameraReady() && !capturedImage() && faceRegistered()" class="absolute left-4 right-4 top-4 z-10">
            <div class="rounded-md border border-white/15 bg-slate-950/65 px-4 py-3 text-white backdrop-blur-md">
              <p class="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">Face Scan</p>
              <p class="mt-1 text-sm font-bold">{{ faceStatusMessage() }}</p>
              <div class="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div class="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-300" [style.width.%]="scanProgress()"></div>
              </div>
            </div>
          </div>

          <!-- Captured Image Preview -->
          <img *ngIf="capturedImage()" [src]="capturedImage()" class="absolute inset-0 w-full h-full object-cover" />

          <!-- Camera Badge -->
          <div class="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/20 flex items-center gap-2">
             <div class="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></div>
             <span class="text-[10px] font-black text-white uppercase tracking-widest">LIVE FEED</span>
          </div>

          <div *ngIf="isCameraReady() && !capturedImage()" class="absolute bottom-4 left-4 right-4">
            <div class="grid gap-3 rounded-md border border-white/10 bg-slate-950/70 px-4 py-3 text-white backdrop-blur-md sm:grid-cols-3">
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">Registration</p>
                <p class="mt-1 text-sm font-bold">{{ faceRegistrationStatus() }}</p>
              </div>
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">Progress</p>
                <p class="mt-1 text-sm font-bold">{{ scanProgress() }}% ready</p>
              </div>
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">Guide</p>
                <p class="mt-1 text-sm font-bold">{{ overlayGuideMessage() }}</p>
              </div>
            </div>
          </div>

          <!-- Face Not Registered Subtle Notice (Non-blocking) -->
          <div *ngIf="isCameraReady() && !faceRegistered() && !cameraFallbackMode()" class="absolute top-14 left-4 right-4 z-10">
            <div class="rounded-md border border-amber-300/40 bg-amber-950/70 px-3.5 py-2.5 text-white backdrop-blur-md flex items-center justify-between gap-2 shadow-lg">
              <div class="flex items-center gap-2 min-w-0">
                <span class="inline-block h-2 w-2 rounded-full bg-amber-400 shrink-0"></span>
                <p class="text-xs font-semibold text-amber-200 truncate">Face ID not enrolled. Manual selfie punch is active.</p>
              </div>
              <button
                type="button"
                (click)="openFaceRegistration()"
                class="px-2.5 py-1 text-[11px] font-bold uppercase bg-amber-500 hover:bg-amber-400 text-slate-900 rounded shrink-0 transition-colors"
              >
                Enroll Face
              </button>
            </div>
          </div>

          <!-- Processing Overlay -->
          <div *ngIf="isProcessing()" class="absolute inset-0 bg-teal-900/40 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
             <div class="h-16 w-16 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>
             <p class="text-white font-black uppercase tracking-[0.2em] drop-shadow-md">Recording Punch...</p>
          </div>

          <div *ngIf="successFlash()" class="absolute inset-0 z-20 flex items-center justify-center bg-emerald-500/18 backdrop-blur-[1px]">
            <div class="rounded-full bg-emerald-500/95 p-5 shadow-2xl shadow-emerald-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Camera Controls -->
        <div class="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            *ngIf="!capturedImage()"
            (click)="captureAndPunch()"
            [disabled]="isPrimaryActionDisabled()"
            class="flex-1 py-3.5 bg-gradient-to-r from-teal-600 to-cyan-700 text-white rounded-md font-black text-base shadow-lg shadow-teal-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
               <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
               <circle cx="12" cy="13" r="3" />
            </svg>
            {{ primaryActionLabel() }}
          </button>

          <button
            *ngIf="!faceRegistered() && !cameraFallbackMode()"
            type="button"
            (click)="openFaceRegistration()"
            class="py-3.5 px-4 bg-white text-slate-700 rounded-md font-black text-sm border border-slate-200 hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Setup Face ID
          </button>

          <button
            *ngIf="capturedImage()"
            (click)="retake()"
            [disabled]="isProcessing()"
            class="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-md font-black text-base hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
               <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
               <path d="M3 3v5h5" />
            </svg>
            RETAKE PHOTO
          </button>
        </div>
      </div>

      <!-- Quick Info -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">CURRENT TIME</p>
          <p class="text-xl font-black text-slate-900 mt-1">{{ currentTime }}</p>
        </div>
        <div class="p-4 rounded-xl border border-teal-100 bg-teal-50/50">
           <p class="text-[10px] font-black text-teal-600 uppercase tracking-widest">STATUS</p>
          <p class="text-xl font-black text-teal-700 mt-1 uppercase">{{ statusBadgeLabel() }}</p>
          <p class="mt-1 text-[11px] font-semibold text-teal-700/80">{{ faceRegistrationStatus() }}</p>
        </div>
        <div class="p-4 rounded-xl border" 
          [ngClass]="{
            'border-slate-100 bg-slate-50/50': locationStatus() === 'loading',
            'border-emerald-100 bg-emerald-50': locationStatus() === 'success',
            'border-rose-100 bg-rose-50': locationStatus() === 'error' || locationStatus() === 'outside_geofence'
          }">
          <p class="text-[10px] font-black uppercase tracking-widest"
             [ngClass]="{
               'text-slate-400': locationStatus() === 'loading',
               'text-emerald-600': locationStatus() === 'success',
               'text-rose-600': locationStatus() === 'error' || locationStatus() === 'outside_geofence'
             }">LOCATION</p>
          <div class="flex items-center gap-2 mt-1">
             <div *ngIf="locationStatus() === 'loading'" class="h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
             <p class="text-sm font-bold leading-tight"
               [ngClass]="{
                 'text-slate-600': locationStatus() === 'loading',
                 'text-emerald-700': locationStatus() === 'success',
                 'text-rose-700': locationStatus() === 'error' || locationStatus() === 'outside_geofence'
               }">{{ geofenceMessage() }}</p>
          </div>
          <p *ngIf="currentLocation()" class="text-[10px] font-bold text-slate-500 mt-1 opacity-70">
             {{ currentLocation()?.lat | number:'1.4-4' }}, {{ currentLocation()?.lng | number:'1.4-4' }}
          </p>
        </div>
      </div>

      <div
        *ngIf="hasCompletedPunch()"
        class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
      >
        <p class="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Attendance Completed</p>
        <p class="mt-1 text-sm font-bold text-emerald-900">
          Today's Time In and Time Out are already recorded.
        </p>
        <p class="mt-1 text-xs text-emerald-700">
          You cannot mark attendance again for the same day from this screen.
        </p>
      </div>

      <!-- Instruction -->
      <div class="p-3 rounded-xl bg-amber-50 border border-amber-100 flex gap-3 items-start">
        <div class="h-8 w-8 shrink-0 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
           </svg>
        </div>
        <div class="space-y-0.5">
           <p class="text-sm font-bold text-amber-900 leading-tight">Proper Positioning Required</p>
           <p class="text-[11px] text-amber-700 leading-tight">{{ instructionMessage() }}</p>
        </div>
      </div>

      <!-- Hidden Canvas -->
      <canvas #canvasElement class="hidden"></canvas>
    </div>
  `,
  styles: [],
})
export class AttendancePunchComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  @Output() punchSuccess = new EventEmitter<void>();

  private attendanceService = inject(AttendanceService);
  private toastService = inject(ToastService);
  private faceRecognitionService = inject(FaceRecognitionService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isCameraReady = signal<boolean>(false);
  isProcessing = signal<boolean>(false);
  capturedImage = signal<string | null>(null);
  status = signal<'in' | 'out'>('out');
  hasCompletedPunch = signal<boolean>(false);
  locationStatus = signal<'loading' | 'success' | 'error' | 'outside_geofence'>('loading');
  currentLocation = signal<{lat: number, lng: number, address?: string, zoneName?: string} | null>(null);
  geofenceMessage = signal<string>('Detecting location...');
  faceStatusMessage = signal<string>('Preparing face scan...');
  faceRegistrationStatus = signal<string>('Checking face registration...');
  cameraFallbackMode = signal<boolean>(false);
  multiFaceDetected = signal<boolean>(false);
  faceRegistered = signal<boolean>(false);
  successFlash = signal<boolean>(false);
  geofenceEnabled = signal<boolean>(false);
  geofenceRequired = signal<boolean>(false);
  isGeofenceEnforced = computed(() => this.geofenceEnabled() && this.geofenceRequired());
  currentTime = '';
  
  private mediaStream: MediaStream | null = null;
  private timerInterval: any;
  private autoScanSub?: Subscription;
  private autoScanBusy = false;
  private autoPunchTriggered = false;
  private singleFaceStableFrames = 0;
  private currentUser = this.authService.getStoredUser();

  ngOnInit() {
    this.startClock();
    this.checkStatus();
    this.loadGeofenceSettings();
    void this.initializeFaceFlow();
    this.initLocation();
  }

  private loadGeofenceSettings() {
    this.attendanceService.getGeoFenceSettings().subscribe({
      next: (settings) => {
        if (settings) {
          this.geofenceEnabled.set(Boolean(settings.geofence_enabled));
          const user = this.currentUser || this.authService.getStoredUser();
          const required = Boolean(
            settings.require_geofence_for_all ||
              (user as any)?.attendance_settings?.geofence_required,
          );
          this.geofenceRequired.set(required);
        }
      },
      error: () => {
        this.geofenceEnabled.set(false);
        this.geofenceRequired.set(false);
      }
    });
  }

  ngOnDestroy() {
    this.stopAutoScan();
    this.faceRecognitionService.stopCamera();
    this.stopCamera();
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  private startClock() {
    const updateTime = () => {
      const now = new Date();
      this.currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    updateTime();
    this.timerInterval = setInterval(updateTime, 1000);
  }

  private checkStatus() {
    this.attendanceService.getTodayAttendance().subscribe(data => {
      const isWorking = data?.is_clocked_in && !data?.is_clocked_out;
      this.status.set(isWorking ? 'in' : 'out');
      if (data?.is_clocked_out) {
        this.hasCompletedPunch.set(true);
      }
    });
  }

  private async initializeFaceFlow() {
    await this.checkFaceRegistration();
    if (!this.faceRegistered()) {
      this.toastService.info('Please register your face first to mark attendance.');
      this.openFaceRegistration();
      return;
    }
    await this.initCamera();
  }

  private async checkFaceRegistration() {
    const employeeId = Number(this.currentUser?.employeeId ?? this.currentUser?.id ?? 0);
    if (!employeeId) {
      this.faceRegistered.set(false);
      this.faceRegistrationStatus.set('Employee context missing');
      return;
    }

    const registered = await firstValueFrom(
      this.faceRecognitionService.hasRegisteredFace(employeeId),
    ).catch(() => false);

    this.faceRegistered.set(Boolean(registered));
    this.faceRegistrationStatus.set(
      registered
        ? 'Face registered and ready for auto attendance'
        : 'Face not registered. Register first to use face attendance',
    );
  }

  private async initCamera() {
    try {
      const video = this.videoElement.nativeElement;
      await this.faceRecognitionService.primeFaceEngine();
      const ready = await this.faceRecognitionService.startBestAvailableCamera(video);
      this.isCameraReady.set(ready);
      this.cameraFallbackMode.set(!ready);

      if (!ready) {
        this.faceStatusMessage.set('Camera unavailable. Attendance will continue in fallback mode.');
        this.toastService.info('Camera unavailable. You can still mark attendance without face scan.');
        return;
      }

      if (!this.faceRegistered()) {
        this.faceStatusMessage.set('Face not registered. Please complete face registration first.');
        return;
      }

      this.startAutoScan();
    } catch (error) {
      console.error('Camera init error:', error);
      this.cameraFallbackMode.set(true);
      this.faceStatusMessage.set('Camera unavailable. Attendance will continue in fallback mode.');
      this.toastService.error(
        error instanceof Error ? error.message : 'Could not access camera. Please check permissions.',
      );
    }
  }

  private stopCamera() {
    this.faceRecognitionService.stopCamera();
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
  }

  private startAutoScan() {
    this.stopAutoScan();
    this.autoPunchTriggered = false;
    this.singleFaceStableFrames = 0;
    this.multiFaceDetected.set(false);
    this.faceStatusMessage.set('Camera ready. Looking for exactly one face...');
    void this.runAutoScanTick();
    this.autoScanSub = interval(700).subscribe(() => {
      void this.runAutoScanTick();
    });
  }

  private stopAutoScan() {
    this.autoScanSub?.unsubscribe();
    this.autoScanSub = undefined;
    this.autoScanBusy = false;
    this.autoPunchTriggered = false;
    this.singleFaceStableFrames = 0;
  }

  private async runAutoScanTick() {
    if (
      !this.isCameraReady() ||
      this.isProcessing() ||
      this.autoScanBusy ||
      this.autoPunchTriggered ||
      this.cameraFallbackMode() ||
      !this.faceRegistered()
    ) {
      return;
    }

    const video = this.videoElement?.nativeElement;
    if (!video || !video.videoWidth) {
      return;
    }

    this.autoScanBusy = true;
    try {
      const frameSummary = await firstValueFrom(
        this.faceRecognitionService.getLiveFaceFrameSummary(video),
      );

      if (frameSummary.status === 'multiple_faces') {
        this.singleFaceStableFrames = 0;
        this.multiFaceDetected.set(true);
        this.faceStatusMessage.set('Multiple faces detected. Keep only one face in frame.');
        return;
      }

      this.multiFaceDetected.set(false);

      if (frameSummary.status === 'no_face') {
        this.singleFaceStableFrames = 0;
        this.faceStatusMessage.set('No face detected. Please align your face inside the guide.');
        return;
      }

      this.singleFaceStableFrames += 1;
      if (this.singleFaceStableFrames < 3) {
        this.faceStatusMessage.set('One face detected. Hold still for confirmation...');
        return;
      }

      this.faceStatusMessage.set('Face confirmed. Verifying and marking attendance...');
      this.autoPunchTriggered = true;
      this.captureAndPunch(true);
    } finally {
      this.autoScanBusy = false;
    }
  }

  private initLocation() {
    if (!navigator.geolocation) {
      this.locationStatus.set(this.isGeofenceEnforced() ? 'error' : 'success');
      this.geofenceMessage.set(this.isGeofenceEnforced() ? 'Geolocation is not supported by your browser.' : 'Location optional');
      return;
    }

    this.locationStatus.set('loading');
    this.geofenceMessage.set('Detecting location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        this.attendanceService.validateLocation(lat, lng).subscribe({
          next: (res) => {
            this.currentLocation.set({ lat, lng, address: '', zoneName: res.zone?.name });
            if (res.valid) {
              this.locationStatus.set('success');
              this.geofenceMessage.set(res.zone?.name ? `Inside Zone: ${res.zone.name}` : 'Location Authorized');
            } else {
              this.locationStatus.set(this.isGeofenceEnforced() ? 'outside_geofence' : 'success');
              this.geofenceMessage.set(this.isGeofenceEnforced() ? 'Outside authorized geofence' : 'Location recorded (Geofence optional)');
            }
          },
          error: () => {
            this.currentLocation.set({ lat, lng });
            this.locationStatus.set(this.isGeofenceEnforced() ? 'error' : 'success');
            this.geofenceMessage.set(this.isGeofenceEnforced() ? 'Geofence could not be verified' : 'Location recorded');
          }
        });
      },
      () => {
        this.locationStatus.set(this.isGeofenceEnforced() ? 'error' : 'success');
        this.geofenceMessage.set(this.isGeofenceEnforced() ? 'Could not access location' : 'Location optional');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  primaryActionLabel(): string {
    if (this.hasCompletedPunch()) return 'SHIFT COMPLETED';
    if (this.cameraFallbackMode()) {
      return this.status() === 'out' ? 'TIME IN NOW' : 'TIME OUT NOW';
    }
    if (!this.faceRegistered()) {
      return this.status() === 'out' ? 'PUNCH TIME IN (SELFIE)' : 'PUNCH TIME OUT (SELFIE)';
    }
    return this.status() === 'out' ? 'AUTO FACE TIME IN' : 'AUTO FACE TIME OUT';
  }

  instructionMessage(): string {
    if (this.hasCompletedPunch()) {
      return 'Your attendance for today is already completed. No further punch is required.';
    }
    if (this.isGeofenceEnforced() && this.locationStatus() === 'outside_geofence') {
      return 'You are outside the assigned geofence. Attendance cannot be marked from this location.';
    }
    if (this.isGeofenceEnforced() && this.locationStatus() === 'error') {
      return 'Location could not be verified. Allow location access and move within your geofence.';
    }
    if (this.cameraFallbackMode()) {
      return 'Camera is unavailable. Using location-based web punch.';
    }
    if (!this.faceRegistered()) {
      return 'Face profile not enrolled for auto-scan. You can record punch with selfie photo.';
    }
    if (this.multiFaceDetected()) {
      return 'Multiple faces detected. Keep only one face inside the frame.';
    }
    return 'Ensure your face is visible within the guide. Auto capture will run when one face is detected.';
  }

  isPrimaryActionDisabled(): boolean {
    if (this.isProcessing() || this.hasCompletedPunch()) {
      return true;
    }

    if (this.isGeofenceEnforced() && (this.locationStatus() === 'loading' || this.locationStatus() === 'outside_geofence' || this.locationStatus() === 'error')) {
      return true;
    }

    if (this.cameraFallbackMode()) {
      return false;
    }

    if (!this.faceRegistered()) {
      return !this.isCameraReady();
    }

    return !this.isCameraReady();
  }

  cameraStateLabel(): string {
    if (this.cameraFallbackMode()) return 'Fallback Mode';
    if (this.isProcessing()) return 'Processing';
    if (this.isCameraReady()) return 'Camera Ready';
    return 'Preparing Camera';
  }

  cameraStateTone(): string {
    if (this.cameraFallbackMode()) return 'bg-amber-50 text-amber-700';
    if (this.isProcessing()) return 'bg-cyan-50 text-cyan-700';
    if (this.isCameraReady()) return 'bg-emerald-50 text-emerald-700';
    return 'bg-slate-100 text-slate-600';
  }

  scanProgress(): number {
    if (this.cameraFallbackMode() || !this.faceRegistered()) return 0;
    return Math.min(100, Math.round((this.singleFaceStableFrames / 3) * 100));
  }

  scanRingScale(): number {
    return 1 + this.scanProgress() / 200;
  }

  scanRingOpacity(): number {
    return Math.max(0.2, 0.65 - this.scanProgress() / 180);
  }

  secondaryScanRingScale(): number {
    return 1.08 + this.scanProgress() / 160;
  }

  secondaryScanRingOpacity(): number {
    return Math.max(0.08, 0.38 - this.scanProgress() / 220);
  }

  overlayGuideMessage(): string {
    if (this.multiFaceDetected()) return 'Keep only one face visible';
    if (!this.faceRegistered()) return 'Manual selfie punch active';
    if (this.cameraFallbackMode()) return 'Camera fallback active';
    if (this.scanProgress() >= 100) return 'Capture in progress';
    return 'Center face and hold still';
  }

  openFaceRegistration() {
    void this.router.navigate(['/face-registration'], {
      queryParams: { returnUrl: '/self-service?openPunch=1' },
    });
  }

  statusBadgeLabel(): string {
    if (this.hasCompletedPunch()) return 'Completed';
    return this.status() === 'in' ? 'Working' : 'Offline';
  }

  captureAndPunch(autoTriggered = false) {
    if (this.isProcessing()) return;
    if (this.hasCompletedPunch()) {
      this.toastService.info('Attendance for today is already completed.');
      return;
    }
    if (!this.faceRegistered()) {
      this.toastService.info('Please register your face first to mark attendance.');
      this.openFaceRegistration();
      return;
    }
    if (this.isGeofenceEnforced() && this.locationStatus() === 'outside_geofence') {
      this.toastService.error('Outside Geofence. Attendance cannot be marked.');
      return;
    }
    if (this.isGeofenceEnforced() && (this.locationStatus() === 'error' || this.locationStatus() === 'loading')) {
      this.toastService.error('Location could not be verified. Please allow location and move within your geofence.');
      return;
    }

    if (this.cameraFallbackMode() || !this.isCameraReady()) {
      this.markAttendanceWithoutCamera();
      return;
    }

    const video = this.videoElement?.nativeElement;
    const canvas = this.canvasElement?.nativeElement;
    if (!video || !canvas) {
      this.markAttendanceWithoutCamera();
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      this.markAttendanceWithoutCamera();
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    // Mirror the captured image so it matches the live feed
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    context.setTransform(1, 0, 0, 1, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    this.capturedImage.set(imageData);
    this.isProcessing.set(true);
    this.stopCamera();

    const employeeId = Number(this.currentUser?.employeeId ?? this.currentUser?.id ?? 0);
    const orgId = Number(this.currentUser?.orgId ?? this.currentUser?.organizationId ?? 0);
    const isClockingIn = this.status() === 'out';
    const action = isClockingIn ? 'check_in' : 'check_out';
    const location = this.currentLocation();

    // If face is not registered, mark attendance as selfie punch directly
    if (!this.faceRegistered()) {
      const actionObs = isClockingIn
        ? this.attendanceService.checkIn({ source: 'camera', latitude: location?.lat, longitude: location?.lng, selfieUrl: imageData })
        : this.attendanceService.checkOut({ source: 'camera', latitude: location?.lat, longitude: location?.lng, selfieUrl: imageData });

      actionObs.pipe(finalize(() => this.isProcessing.set(false))).subscribe({
        next: () => this.handleSuccessfulPunch(isClockingIn),
        error: (err) => {
          console.error('Selfie punch failed', err);
          this.toastService.error(
            err?.friendlyMessage || err?.error?.message || 'Failed to record attendance. Please try again.',
          );
          this.retake();
        }
      });
      return;
    }

    // Registered face: verify through biometric AI
    this.faceRecognitionService
      .verifyAndMarkAttendance(employeeId, orgId, imageData, action)
      .pipe(finalize(() => this.isProcessing.set(false)))
      .subscribe({
        next: (res) => {
          if (!res.success) {
            this.toastService.error(res.message || 'Face attendance could not be marked.');
            this.retake();
            return;
          }

          this.handleSuccessfulPunch(action === 'check_in');
        },
        error: (err) => {
          console.error('Punch failed, attempting selfie fallback', err);
          // Gracefully fallback to recording as camera selfie punch
          const fallbackObs = isClockingIn
            ? this.attendanceService.checkIn({ source: 'camera', latitude: location?.lat, longitude: location?.lng, selfieUrl: imageData })
            : this.attendanceService.checkOut({ source: 'camera', latitude: location?.lat, longitude: location?.lng, selfieUrl: imageData });

          fallbackObs.pipe(finalize(() => this.isProcessing.set(false))).subscribe({
            next: () => {
              this.toastService.info('Face match was inconclusive; recorded as selfie attendance.');
              this.handleSuccessfulPunch(isClockingIn);
            },
            error: (fallbackErr) => {
              this.toastService.error(
                fallbackErr?.friendlyMessage || fallbackErr?.error?.message || err?.friendlyMessage || err?.error?.message || 'Failed to record attendance.',
              );
              if (!autoTriggered) {
                this.retake();
              } else {
                this.autoPunchTriggered = false;
                this.singleFaceStableFrames = 0;
                this.capturedImage.set(null);
                this.faceStatusMessage.set('Auto scan retrying after failed face verification.');
              }
            }
          });
        }
      });
  }

  private markAttendanceWithoutCamera() {
    if (this.isGeofenceEnforced() && this.locationStatus() !== 'success') {
      this.toastService.error(
        this.locationStatus() === 'outside_geofence'
          ? 'Outside Geofence. Attendance cannot be marked.'
          : 'Location could not be verified. Please allow location and move within your geofence.',
      );
      return;
    }

    this.isProcessing.set(true);
    const isClockingIn = this.status() === 'out';
    const location = this.currentLocation();

    const actionObs = isClockingIn
      ? this.attendanceService.checkIn({ source: 'web', latitude: location?.lat, longitude: location?.lng })
      : this.attendanceService.checkOut({ source: 'web', latitude: location?.lat, longitude: location?.lng });

    actionObs.pipe(finalize(() => this.isProcessing.set(false))).subscribe({
      next: () => this.handleSuccessfulPunch(isClockingIn),
      error: (err) => {
        console.error('Fallback punch failed', err);
        this.toastService.error('Failed to record attendance. Please try again.');
      },
    });
  }

  private handleSuccessfulPunch(isClockingIn: boolean) {
    this.toastService.success(`Successfully recorded ${isClockingIn ? 'Time In' : 'Time Out'}!`);
    this.successFlash.set(true);
    this.status.set(isClockingIn ? 'in' : 'out');
    if (!isClockingIn) {
      this.hasCompletedPunch.set(true);
    }
    this.punchSuccess.emit();
    this.faceStatusMessage.set(
      isClockingIn
        ? 'Attendance marked. Your Time In has been recorded.'
        : 'Attendance marked. Your Time Out has been recorded.',
    );
    setTimeout(() => this.successFlash.set(false), 1400);
    setTimeout(() => this.retake(), 3000);
  }

  retake() {
    this.capturedImage.set(null);
    this.successFlash.set(false);
    this.singleFaceStableFrames = 0;
    if (!this.hasCompletedPunch()) {
      void this.initCamera();
    }
    if (!this.cameraFallbackMode() && this.faceRegistered()) {
      this.autoPunchTriggered = false;
      this.faceStatusMessage.set('Looking for exactly one face...');
    }
  }
}
