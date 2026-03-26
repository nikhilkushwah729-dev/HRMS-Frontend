import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface FaceEmployee {
  id?: number;
  employee_id: number;
  name: string;
  email: string;
  status?: string;
  registered_at?: string;
}

export interface FaceVerificationResult {
  success: boolean;
  message: string;
  employee?: {
    id: number;
    name: string;
    email: string;
  };
  attendance?: {
    date: string;
    action: string;
    matchScore: string;
  };
  tts?: {
    name: string;
    message: string;
  };
  alreadyCheckedIn?: boolean;
  matchScore?: string;
}

export interface FaceDetectionResult {
  success: boolean;
  detected: boolean;
  count?: number;
  message?: string;
  employees: Array<{
    employee: {
      id: number;
      name: string;
      email: string;
    };
    confidence: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class FaceRecognitionService {
  private http = inject(HttpClient);
  
  // Face API base URL - defaults to local server
  private readonly apiUrl = environment.apiUrl.replace('/api', '') + '/api/face';
  
  // State
  private speechSynthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private recognition: any = null;
  
  // Signals for UI state
  isProcessing = signal<boolean>(false);
  isCameraReady = signal<boolean>(false);
  detectedEmployees = signal<FaceDetectionResult['employees']>([]);
  
  // Media stream for camera
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  // ==================== FACE REGISTRATION ====================

  /**
   * Register employee's face
   */
  registerFace(employeeId: number, orgId: number, imageData: string): Observable<any> {
    this.isProcessing.set(true);
    
    return this.http.post<any>(`${this.apiUrl}/register`, {
      employee_id: employeeId,
      org_id: orgId,
      image: imageData
    }).pipe(
      finalize(() => this.isProcessing.set(false))
    );
  }

  /**
   * Check if employee has registered face
   */
  hasRegisteredFace(employeeId: number): Observable<boolean> {
    return this.http.get<any>(`${this.apiUrl}/employees`).pipe(
      map(res => {
        const employees = res?.employees || res?.data || [];
        if (employees) {
          return employees.some((e: FaceEmployee) => e.employee_id === employeeId || e.id === employeeId);
        }
        return false;
      }),
      catchError(() => of(false))
    );
  }

  // ==================== FACE VERIFICATION ====================

  /**
   * Verify face and mark attendance
   */
  verifyAndMarkAttendance(
    employeeId: number, 
    orgId: number, 
    imageData: string,
    action: 'check_in' | 'check_out' = 'check_in'
  ): Observable<FaceVerificationResult> {
    this.isProcessing.set(true);
    
    return this.http.post<any>(`${this.apiUrl}/verify`, {
      employee_id: employeeId,
      org_id: orgId,
      image: imageData,
      action: action
    }).pipe(
      finalize(() => this.isProcessing.set(false)),
      map(res => {
        // Trigger TTS if successful
        if (res.success && res.tts) {
          this.speak(res.tts.message);
        }
        
        return res;
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Face verification service is currently unavailable.';
        return throwError(() => ({ ...error, friendlyMessage: message }));
      })
    );
  }

  /**
   * Detect faces in real-time without marking attendance
   */
  detectFaces(imageData: string): Observable<FaceDetectionResult> {
    return this.http.post<any>(`${this.apiUrl}/detect`, {
      image: imageData
    }).pipe(
      map(res => {
        if (res.employees && res.employees.length > 0) {
          this.detectedEmployees.set(res.employees);
        } else {
          this.detectedEmployees.set([]);
        }
        return res;
      }),
      catchError(() => {
        this.detectedEmployees.set([]);
        return of({
          success: false,
          detected: false,
          message: 'Face detection is currently unavailable.',
          employees: []
        });
      })
    );
  }

  // ==================== EMPLOYEE MANAGEMENT ====================

  /**
   * Get all employees with registered faces
   */
  getEmployeesWithFaces(orgId?: number): Observable<FaceEmployee[]> {
    let url = `${this.apiUrl}/employees`;
    if (orgId) {
      url += `?org_id=${orgId}`;
    }
    
    return this.http.get<any>(url).pipe(
      map(res => res?.employees || res?.data || []),
      catchError(() => of([]))
    );
  }

  /**
   * Delete face registration for an employee
   */
  deleteFaceRegistration(employeeId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/employee/${employeeId}`);
  }

  // ==================== ATTENDANCE HISTORY ====================

  /**
   * Get face attendance history
   */
  getFaceAttendanceHistory(params: {
    employee_id?: number;
    org_id?: number;
    date_from?: string;
    date_to?: string;
  }): Observable<any[]> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.set(key, value.toString());
      }
    });
    
    const url = `${this.apiUrl}/attendance${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    return this.http.get<any>(url).pipe(
      map(res => res?.records || res?.data || []),
      catchError(() => of([]))
    );
  }

  // ==================== TEXT TO SPEECH ====================

  /**
   * Speak text using browser's Speech Synthesis API
   */
  speak(text: string, lang: string = 'en-US'): void {
    if (!this.speechSynthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    this.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to get a good voice
    const voices = this.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en-') && v.name.includes('Google')) 
      || voices.find(v => v.lang.startsWith('en-'))
      || voices[0];
    
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    this.speechSynthesis.speak(utterance);
  }

  /**
   * Speak attendance success message
   */
  speakAttendanceSuccess(employeeName: string): void {
    const message = `${employeeName}, attendance marked successfully!`;
    this.speak(message);
  }

  /**
   * Speak error message
   */
  speakError(message: string): void {
    this.speak(message);
  }

  /**
   * Speak welcome/identification message
   */
  speakIdentified(employeeName: string): void {
    this.speak(`Welcome ${employeeName}`);
  }

  // ==================== CAMERA MANAGEMENT ====================

  /**
   * Start camera for face capture
   */
  async startCamera(videoElement: HTMLVideoElement, facingMode: 'user' | 'environment' = 'user'): Promise<boolean> {
    try {
      this.stopCamera();
      
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });

      this.videoElement = videoElement;
      videoElement.srcObject = this.mediaStream;
      
      await new Promise<void>((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          resolve();
        };
      });

      this.isCameraReady.set(true);
      return true;
    } catch (error) {
      console.error('Camera error:', error);
      this.isCameraReady.set(false);
      return false;
    }
  }

  /**
   * Stop camera
   */
  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    
    this.isCameraReady.set(false);
  }

  /**
   * Capture frame from video element
   */
  captureFrame(videoElement: HTMLVideoElement, canvas: HTMLCanvasElement): string | null {
    if (!videoElement || !canvas || !videoElement.videoWidth) {
      return null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg', 0.9);
  }

  /**
   * Capture frame from current video stream
   */
  captureCurrentFrame(): string | null {
    if (!this.videoElement) return null;
    
    const canvas = document.createElement('canvas');
    return this.captureFrame(this.videoElement, canvas);
  }

  // ==================== HEALTH CHECK ====================

  /**
   * Check if face recognition server is running
   */
  checkHealth(): Observable<{ status: string; faceApiLoaded: boolean }> {
    return this.http.get<any>(`${this.apiUrl.replace('/face', '/health')}`);
  }

  // ==================== CLEANUP ====================

  ngOnDestroy(): void {
    this.stopCamera();
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
  }
}

