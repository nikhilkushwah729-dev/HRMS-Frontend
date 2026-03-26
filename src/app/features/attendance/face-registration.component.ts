import { Component, OnInit, OnDestroy, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  FaceRecognitionService, 
  FaceEmployee 
} from '../../core/services/face-recognition.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models/auth.model';

@Component({
  selector: 'app-face-registration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col gap-6 pb-10 max-w-4xl mx-auto">
      <!-- Header -->
      <header class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tight">Face Registration</h1>
          <p class="text-slate-500 font-medium mt-1">Register your face for touchless attendance marking.</p>
        </div>
        <button (click)="goBack()" class="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
          </svg>
          Back
        </button>
      </header>

      <!-- Instructions Card -->
      <div class="bg-blue-50 border border-blue-200 rounded-md p-5">
        <h3 class="font-bold text-blue-900 flex items-center gap-2 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
          </svg>
          How to Register Your Face
        </h3>
        <ul class="space-y-2 text-sm text-blue-800">
          <li class="flex items-start gap-2">
            <span class="font-bold">1.</span> Position your face within the camera frame
          </li>
          <li class="flex items-start gap-2">
            <span class="font-bold">2.</span> Ensure good lighting on your face
          </li>
          <li class="flex items-start gap-2">
            <span class="font-bold">3.</span> Remove glasses, hats, or anything covering your face
          </li>
          <li class="flex items-start gap-2">
            <span class="font-bold">4.</span> Look directly at the camera
          </li>
          <li class="flex items-start gap-2">
            <span class="font-bold">5.</span> Click "Capture and Register" to complete registration
          </li>
        </ul>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Camera Section -->
        <div class="card p-0 overflow-hidden border border-slate-200/60 shadow-xl bg-white rounded-md">
          <div class="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 class="font-bold text-slate-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
              Camera Preview
            </h3>
          </div>
          
          <div class="p-4">
            <div class="relative aspect-square rounded-md overflow-hidden bg-slate-900 shadow-lg">
              <!-- Loading State -->
              <div *ngIf="!isCameraReady()" class="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3">
                <svg class="animate-spin h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span class="text-sm font-medium">Initializing camera...</span>
              </div>
              
              <!-- Video Element -->
              <video #videoElement autoplay playsinline muted 
                     class="absolute inset-0 w-full h-full object-cover"
                     [class.opacity-0]="!isCameraReady()"></video>
              
              <!-- Captured Image -->
              <img *ngIf="capturedImage()" [src]="capturedImage()" 
                   class="absolute inset-0 w-full h-full object-cover" />
              
              <!-- Face Guide Overlay -->
              <div *ngIf="isCameraReady() && !capturedImage()" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="w-4/5 h-4/5 border-2 border-primary-500/60 rounded-full relative">
                  <div class="absolute inset-0 bg-primary-500/5 rounded-full animate-pulse"></div>
                  <div class="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-primary-500 rounded-tl-lg"></div>
                  <div class="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-primary-500 rounded-tr-lg"></div>
                  <div class="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-primary-500 rounded-bl-lg"></div>
                  <div class="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-primary-500 rounded-br-lg"></div>
                </div>
              </div>
              
              <!-- Processing Overlay -->
              <div *ngIf="isProcessing()" class="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <svg class="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span class="text-white font-medium">Processing your face...</span>
              </div>
            </div>
            
            <!-- Camera Controls -->
            <div class="flex gap-3 mt-4">
              <button *ngIf="!capturedImage()" (click)="startCamera()" 
                      [disabled]="isProcessing()"
                      class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-md font-bold hover:bg-slate-200 transition-all disabled:opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                </svg>
                Start Camera
              </button>
              
              <button *ngIf="!capturedImage()" (click)="captureImage()" 
                      [disabled]="!isCameraReady() || isProcessing()"
                      class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-md font-bold hover:bg-primary-700 transition-all disabled:opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                </svg>
                Capture
              </button>
              
              <button *ngIf="capturedImage()" (click)="retakeImage()" 
                      class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-md font-bold hover:bg-slate-200 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                </svg>
                Retake
              </button>
            </div>
          </div>
        </div>

        <!-- Registration Form -->
        <div class="flex flex-col gap-4">
          <!-- Status Card -->
          <div class="card p-5 rounded-md border" 
               [ngClass]="isFaceRegistered() ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-md flex items-center justify-center"
                   [ngClass]="isFaceRegistered() ? 'bg-green-100' : 'bg-amber-100'">
                <svg *ngIf="isFaceRegistered()" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-green-600">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <svg *ngIf="!isFaceRegistered()" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-600">
                  <path d="M7 3H5a2 2 0 0 0-2 2v2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M3 17v2a2 2 0 0 0 2 2h2"/><path d="M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0"/>
                </svg>
              </div>
              <div>
                <h4 class="font-bold" [ngClass]="isFaceRegistered() ? 'text-green-900' : 'text-amber-900'">
                  {{ isFaceRegistered() ? 'Face Registered' : 'Face Not Registered' }}
                </h4>
                <p class="text-sm" [ngClass]="isFaceRegistered() ? 'text-green-700' : 'text-amber-700'">
                  {{ isFaceRegistered() ? 'You can mark attendance using face recognition' : 'Register your face for touchless attendance' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Employee Info -->
          <div class="card p-5 rounded-md border border-slate-200">
            <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Your Information
            </h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-sm font-medium text-slate-500">Name</span>
                <span class="text-sm font-bold text-slate-900">{{ getFullName() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm font-medium text-slate-500">Email</span>
                <span class="text-sm font-bold text-slate-900">{{ currentUser?.email }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm font-medium text-slate-500">Employee ID</span>
                <span class="text-sm font-bold text-slate-900">#{{ currentUser?.id }}</span>
              </div>
            </div>
          </div>

          <!-- Register Button -->
          <button (click)="registerFace()" 
                  [disabled]="!capturedImage() || isProcessing()"
                  class="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-md font-black text-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-3">
            <svg *ngIf="!isProcessing()" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M7 3H5a2 2 0 0 0-2 2v2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M3 17v2a2 2 0 0 0 2 2h2"/><path d="M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0"/>
            </svg>
            <svg *ngIf="isProcessing()" class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ isProcessing() ? 'Registering...' : 'Capture and Register Face' }}
          </button>

          <!-- Test Attendance Button -->
          <button *ngIf="isFaceRegistered()" (click)="testAttendance()" 
                  [disabled]="isProcessing() || !isCameraReady()"
                  class="w-full py-3 bg-slate-900 text-white rounded-md font-bold hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Test Face Attendance
          </button>

          <!-- Tips -->
          <div class="bg-slate-50 rounded-md p-4">
            <h4 class="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
              </svg>
              Tips for Best Results
            </h4>
            <ul class="text-xs text-slate-600 space-y-1">
              <li>* Use natural or indoor lighting</li>
              <li>* Keep your face centered in the frame</li>
              <li>* Maintain a neutral expression</li>
              <li>* Avoid blurry or dark photos</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Registered Employees List -->
      <div class="card overflow-hidden rounded-md border border-slate-200">
        <div class="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 class="font-bold text-slate-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Registered Employees ({{ registeredEmployees().length }})
          </h3>
          <button (click)="loadRegisteredEmployees()" class="text-sm font-medium text-primary-600 hover:text-primary-700">
            Refresh
          </button>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Employee</th>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Email</th>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Registered Date</th>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngIf="registeredEmployees().length === 0">
                <td colspan="5" class="px-4 py-8 text-center text-slate-400 text-sm">
                  No employees have registered their face yet
                </td>
              </tr>
              <tr *ngFor="let emp of registeredEmployees()" class="hover:bg-slate-50/50">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                      {{ emp.name.charAt(0).toUpperCase() }}
                    </div>
                    <span class="font-semibold text-slate-800 text-sm">{{ emp.name }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ emp.email }}</td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ emp.registered_at | date:'MMM dd, yyyy' }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md">
                    Active
                  </span>
                </td>
                <td class="px-4 py-3">
                  <button *ngIf="emp.employee_id === currentUser?.id" 
                          (click)="deleteRegistration(emp.employee_id)"
                          class="text-xs font-medium text-error hover:text-red-700">
                    Remove
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Hidden canvas for image capture -->
      <canvas #canvasElement class="hidden"></canvas>
    </div>
  `
})
export class FaceRegistrationComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  private faceRecognitionService = inject(FaceRecognitionService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // State signals
  isProcessing = signal<boolean>(false);
  isCameraReady = signal<boolean>(false);
  capturedImage = signal<string | null>(null);
  registeredEmployees = signal<FaceEmployee[]>([]);
  faceRegistered = signal<boolean>(false);
  
  currentUser: User | null = null;
  private mediaStream: MediaStream | null = null;

  ngOnInit() {
    this.currentUser = this.authService.getStoredUser();
    this.loadRegisteredEmployees();
    this.checkFaceRegistration();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  // ==================== HELPERS ====================

  getFullName(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.firstName} ${this.currentUser.lastName || ''}`.trim();
  }

  isFaceRegistered(): boolean {
    return this.faceRegistered();
  }

  // ==================== CHECK REGISTRATION ====================

  checkFaceRegistration() {
    if (!this.currentUser?.id) return;

    this.faceRecognitionService.hasRegisteredFace(this.currentUser.id).subscribe({
      next: (hasFace) => {
        this.faceRegistered.set(hasFace);
      },
      error: () => {
        this.faceRegistered.set(false);
      }
    });
  }

  // ==================== CAMERA ====================

  async startCamera() {
    try {
      this.stopCamera();
      
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });

      const video = this.videoElement.nativeElement;
      video.srcObject = this.mediaStream;
      
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      this.isCameraReady.set(true);
    } catch (error) {
      console.error('Camera error:', error);
      this.toastService.error('Could not access camera. Please allow camera permission.');
    }
  }

  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.isCameraReady.set(false);
  }

  captureImage() {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    
    if (!video.videoWidth) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    this.capturedImage.set(imageData);
    
    // Pause camera while captured
    this.stopCamera();
  }

  retakeImage() {
    this.capturedImage.set(null);
    this.startCamera();
  }

  // ==================== REGISTRATION ====================

  registerFace() {
    if (!this.capturedImage() || !this.currentUser) return;

    this.isProcessing.set(true);
    
    // Speak instructions
    this.faceRecognitionService.speak('Registering your face. Please wait.');

    this.faceRecognitionService.registerFace(
      this.currentUser.id!,
      this.currentUser.orgId!,
      this.capturedImage()!
    ).subscribe({
      next: (res) => {
        this.isProcessing.set(false);
        
        if (res.success) {
          this.toastService.success('Face registered successfully!');
          this.faceRecognitionService.speak('Face registered successfully. You can now mark attendance using face recognition.');
          
          // Update local state
          this.faceRegistered.set(true);
          
          // Reload list
          this.loadRegisteredEmployees();
          
          // Retake photo
          this.retakeImage();
        } else {
          this.toastService.error(res.message || 'Failed to register face');
          this.faceRecognitionService.speakError('Failed to register face. ' + res.message);
        }
      },
      error: (err) => {
        this.isProcessing.set(false);
        const message = err?.error?.message || err?.friendlyMessage || 'Failed to register face. Please try again.';
        this.toastService.error(message);
        this.faceRecognitionService.speakError(message);
        console.error('Registration error:', err);
      }
    });
  }

  // ==================== TEST ATTENDANCE ====================

  testAttendance() {
    this.isProcessing.set(true);
    
    // Start camera and capture
    this.startCamera();
    
    setTimeout(() => {
      if (!this.isCameraReady()) {
        this.isProcessing.set(false);
        this.toastService.error('Camera not ready');
        return;
      }

      const video = this.videoElement.nativeElement;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx || !video.videoWidth) {
        this.isProcessing.set(false);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      
      this.faceRecognitionService.verifyAndMarkAttendance(
        this.currentUser!.id!,
        this.currentUser!.orgId!,
        imageData,
        'check_in'
      ).subscribe({
        next: (res) => {
          this.isProcessing.set(false);
          this.stopCamera();
          
          if (res.success) {
            this.toastService.success(`Welcome ${res.employee?.name}! Attendance marked.`);
            // TTS is handled in service
          } else {
            this.toastService.error(res.message);
            this.faceRecognitionService.speakError(res.message);
          }
        },
        error: (err) => {
          this.isProcessing.set(false);
          this.stopCamera();
          const message = err?.error?.message || err?.friendlyMessage || 'Verification failed';
          this.toastService.error(message);
          this.faceRecognitionService.speakError(message);
        }
      });
    }, 1500);
  }

  // ==================== EMPLOYEE MANAGEMENT ====================

  loadRegisteredEmployees() {
    if (!this.currentUser?.orgId) return;

    this.faceRecognitionService.getEmployeesWithFaces(this.currentUser.orgId).subscribe({
      next: (employees) => {
        this.registeredEmployees.set(employees);
      },
      error: (err) => {
        console.error('Failed to load employees:', err);
      }
    });
  }

  deleteRegistration(employeeId: number) {
    if (!confirm('Are you sure you want to remove your face registration?')) return;

    this.faceRecognitionService.deleteFaceRegistration(employeeId).subscribe({
      next: () => {
        this.toastService.success('Face registration removed');
        
        if (employeeId === this.currentUser?.id) {
          this.faceRegistered.set(false);
        }
        
        this.loadRegisteredEmployees();
      },
      error: () => {
        this.toastService.error('Failed to remove registration');
      }
    });
  }

  // ==================== NAVIGATION ====================

  goBack() {
    this.router.navigate(['/attendance']);
  }
}

