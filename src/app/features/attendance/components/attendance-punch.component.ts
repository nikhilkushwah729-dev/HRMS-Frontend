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
      <!-- Camera Card -->
      <div class="relative group">
        <div class="h-60 sm:h-64 w-full rounded-2xl bg-slate-900 overflow-hidden shadow-2xl border-4 border-white ring-1 ring-slate-200 relative">
          <!-- Video Feed -->
          <video
            #videoElement
            autoplay
            playsinline
            muted
            class="absolute inset-0 w-full h-full object-cover -scale-x-100"
            [class.opacity-0]="!isCameraReady()"
          ></video>

          <!-- Camera Placeholder / Loading -->
          <div *ngIf="!isCameraReady()" class="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-500">
             <div class="h-12 w-12 rounded-full border-4 border-slate-800 border-t-teal-500 animate-spin"></div>
             <p class="text-sm font-bold uppercase tracking-widest animate-pulse">{{ cameraFallbackMode() ? 'Camera unavailable. Preparing fallback...' : 'Initializing Camera...' }}</p>
          </div>

          <!-- Face Guide Overlay -->
          <div *ngIf="isCameraReady() && !capturedImage()" class="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div class="w-2/3 aspect-square border-2 border-dashed border-teal-500/40 rounded-full relative">
                <div class="absolute inset-0 bg-teal-500/5 rounded-full animate-pulse"></div>
                <!-- Corner Accents -->
                <div class="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-teal-500 rounded-tl-xl"></div>
                <div class="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-teal-500 rounded-tr-xl"></div>
                <div class="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-teal-500 rounded-bl-xl"></div>
                <div class="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-teal-500 rounded-br-xl"></div>
             </div>
          </div>

          <div *ngIf="isCameraReady() && !capturedImage()" class="absolute left-4 right-4 top-4 z-10">
            <div class="rounded-xl border border-white/15 bg-slate-950/65 px-4 py-3 text-white backdrop-blur-md">
              <p class="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">Face Scan</p>
              <p class="mt-1 text-sm font-bold">{{ faceStatusMessage() }}</p>
            </div>
          </div>

          <!-- Captured Image Preview -->
          <img *ngIf="capturedImage()" [src]="capturedImage()" class="absolute inset-0 w-full h-full object-cover" />

          <!-- Camera Badge -->
          <div class="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/20 flex items-center gap-2">
             <div class="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></div>
             <span class="text-[10px] font-black text-white uppercase tracking-widest">LIVE FEED</span>
          </div>

          <!-- Processing Overlay -->
          <div *ngIf="isProcessing()" class="absolute inset-0 bg-teal-900/40 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
             <div class="h-16 w-16 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>
             <p class="text-white font-black uppercase tracking-[0.2em] drop-shadow-md">Recording Punch...</p>
          </div>
        </div>

        <!-- Camera Controls -->
        <div class="mt-4 flex gap-3">
          <button
            *ngIf="!capturedImage()"
            (click)="captureAndPunch()"
            [disabled]="isPrimaryActionDisabled()"
            class="flex-1 py-3.5 bg-gradient-to-r from-teal-600 to-cyan-700 text-white rounded-xl font-black text-base shadow-lg shadow-teal-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
               <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
               <circle cx="12" cy="13" r="3" />
            </svg>
            {{ primaryActionLabel() }}
          </button>

          <button
            *ngIf="capturedImage()"
            (click)="retake()"
            [disabled]="isProcessing()"
            class="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-black text-base hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2"
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
          Today's check-in and check-out are already recorded.
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
    void this.initializeFaceFlow();
    this.initLocation();
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
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
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
      if (this.singleFaceStableFrames < 2) {
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
      this.locationStatus.set('error');
      this.geofenceMessage.set('Geolocation is not supported by your browser.');
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
              this.locationStatus.set('outside_geofence');
              this.geofenceMessage.set('Outside authorized geofence');
            }
          },
          error: () => {
            this.currentLocation.set({ lat, lng });
            this.locationStatus.set('success');
            this.geofenceMessage.set('Location acquired');
          }
        });
      },
      (error) => {
        this.locationStatus.set('error');
        this.geofenceMessage.set('Could not access location');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  primaryActionLabel(): string {
    if (this.hasCompletedPunch()) return 'SHIFT COMPLETED';
    if (this.cameraFallbackMode()) {
      return this.status() === 'out' ? 'CLOCK IN NOW' : 'CLOCK OUT NOW';
    }
    if (!this.faceRegistered()) return 'REGISTER FACE FIRST';
    return this.status() === 'out' ? 'AUTO FACE CLOCK IN' : 'AUTO FACE CLOCK OUT';
  }

  instructionMessage(): string {
    if (this.hasCompletedPunch()) {
      return 'Your attendance for today is already completed. No further punch is required.';
    }
    if (this.cameraFallbackMode()) {
      return 'Camera is unavailable. You can continue with standard attendance fallback.';
    }
    if (!this.faceRegistered()) {
      return 'Your face is not registered yet. Complete face registration first, then mark attendance.';
    }
    if (this.multiFaceDetected()) {
      return 'Multiple faces detected. Keep only one face inside the frame.';
    }
    return 'Ensure your face is visible within the guide. Auto capture will run when one face is detected.';
  }

  isPrimaryActionDisabled(): boolean {
    if (this.isProcessing() || this.locationStatus() === 'loading' || this.locationStatus() === 'outside_geofence' || this.locationStatus() === 'error' || this.hasCompletedPunch()) {
      return true;
    }

    if (this.cameraFallbackMode()) {
      return false;
    }

    if (!this.faceRegistered()) {
      return false;
    }

    return !this.isCameraReady();
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

    if (!this.cameraFallbackMode() && !this.faceRegistered()) {
      void this.router.navigate(['/face-registration'], {
        queryParams: { returnUrl: '/self-service/attendance?view=punch&openModal=1' },
      });
      return;
    }

    if (this.cameraFallbackMode()) {
      this.markAttendanceWithoutCamera();
      return;
    }

    if (!this.isCameraReady()) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Mirror the captured image so it matches the live feed
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Reset transform
    context.setTransform(1, 0, 0, 1, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    this.capturedImage.set(imageData);
    this.isProcessing.set(true);

    const employeeId = Number(this.currentUser?.employeeId ?? this.currentUser?.id ?? 0);
    const orgId = Number(this.currentUser?.orgId ?? this.currentUser?.organizationId ?? 0);
    const action = this.status() === 'out' ? 'check_in' : 'check_out';

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
          console.error('Punch failed', err);
          this.toastService.error(
            err?.friendlyMessage || err?.error?.message || 'Failed to record attendance. Please try again.',
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

  private markAttendanceWithoutCamera() {
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
    this.toastService.success(`Successfully clocked ${isClockingIn ? 'in' : 'out'}!`);
    this.status.set(isClockingIn ? 'in' : 'out');
    if (!isClockingIn) {
      this.hasCompletedPunch.set(true);
    }
    this.punchSuccess.emit();
    this.faceStatusMessage.set(
      isClockingIn
        ? 'Attendance marked. You are now clocked in.'
        : 'Attendance marked. You are now clocked out.',
    );
    setTimeout(() => this.retake(), 3000);
  }

  retake() {
    this.capturedImage.set(null);
    this.singleFaceStableFrames = 0;
    if (!this.cameraFallbackMode() && this.faceRegistered() && this.isCameraReady()) {
      this.autoPunchTriggered = false;
      this.faceStatusMessage.set('Looking for exactly one face...');
    }
  }
}
