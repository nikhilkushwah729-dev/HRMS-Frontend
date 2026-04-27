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
import { finalize } from 'rxjs';

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
             <p class="text-sm font-bold uppercase tracking-widest animate-pulse">Initializing Camera...</p>
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
            [disabled]="!isCameraReady() || isProcessing() || locationStatus() === 'loading' || locationStatus() === 'outside_geofence' || locationStatus() === 'error' || hasCompletedPunch()"
            class="flex-1 py-3.5 bg-gradient-to-r from-teal-600 to-cyan-700 text-white rounded-xl font-black text-base shadow-lg shadow-teal-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
               <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
               <circle cx="12" cy="13" r="3" />
            </svg>
            {{ hasCompletedPunch() ? 'SHIFT COMPLETED' : (status() === 'out' ? 'CLOCK IN NOW' : 'CLOCK OUT NOW') }}
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
          <p class="text-xl font-black text-teal-700 mt-1 uppercase">{{ status() === 'in' ? 'Working' : 'Offline' }}</p>
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
           <p class="text-[11px] text-amber-700 leading-tight">Ensure your face is visible within the guide.</p>
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

  isCameraReady = signal<boolean>(false);
  isProcessing = signal<boolean>(false);
  capturedImage = signal<string | null>(null);
  status = signal<'in' | 'out'>('out');
  hasCompletedPunch = signal<boolean>(false);
  locationStatus = signal<'loading' | 'success' | 'error' | 'outside_geofence'>('loading');
  currentLocation = signal<{lat: number, lng: number, address?: string, zoneName?: string} | null>(null);
  geofenceMessage = signal<string>('Detecting location...');
  currentTime = '';
  
  private mediaStream: MediaStream | null = null;
  private timerInterval: any;

  ngOnInit() {
    this.startClock();
    this.checkStatus();
    this.initCamera();
    this.initLocation();
  }

  ngOnDestroy() {
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

  private async initCamera() {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera API is not available in this browser.');
      }

      const constraintsToTry: MediaStreamConstraints[] = [
        {
          video: { facingMode: { ideal: 'user' }, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        },
        {
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        }
      ];

      let stream: MediaStream | null = null;
      let lastError: unknown = null;
      for (const constraints of constraintsToTry) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!stream) {
        throw lastError instanceof Error ? lastError : new Error('Unable to access camera.');
      }

      this.mediaStream = stream;
      const video = this.videoElement.nativeElement;
      video.setAttribute('playsinline', 'true');
      video.muted = true;
      video.srcObject = this.mediaStream;
      video.onloadedmetadata = () => {
        video.play();
        this.isCameraReady.set(true);
      };
    } catch (error) {
      console.error('Camera init error:', error);
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

  captureAndPunch() {
    if (!this.isCameraReady() || this.isProcessing()) return;

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

    const isClockingIn = this.status() === 'out';
    const location = this.currentLocation();
    
    const actionObs = isClockingIn 
      ? this.attendanceService.checkIn({ selfieUrl: imageData, source: 'web', latitude: location?.lat, longitude: location?.lng })
      : this.attendanceService.checkOut({ selfieUrl: imageData, source: 'web', latitude: location?.lat, longitude: location?.lng });

    actionObs.pipe(finalize(() => this.isProcessing.set(false)))
      .subscribe({
        next: () => {
          this.toastService.success(`Successfully clocked ${isClockingIn ? 'in' : 'out'}!`);
          this.status.set(isClockingIn ? 'in' : 'out');
          if (!isClockingIn) {
            this.hasCompletedPunch.set(true);
          }
          this.punchSuccess.emit();
          // Clear captured image after success to show live feed again if they want
          setTimeout(() => this.retake(), 3000);
        },
        error: (err) => {
          console.error('Punch failed', err);
          this.toastService.error('Failed to record attendance. Please try again.');
          this.retake();
        }
      });
  }

  retake() {
    this.capturedImage.set(null);
  }
}
