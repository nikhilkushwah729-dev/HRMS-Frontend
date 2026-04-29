import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError, from } from 'rxjs';
import { map, catchError, finalize, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface FaceEmployee {
  id?: number;
  employeeId: number;
  name: string;
  email: string;
  status?: string;
  registeredAt?: string;
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
  matched?: boolean;
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

export interface FaceLivenessSample {
  detected: boolean;
  leftEyeRatio: number;
  rightEyeRatio: number;
  averageEyeRatio: number;
  mouthRatio: number;
  headTurnRatio: number;
}

export interface LiveFaceFrameSummary {
  status: 'no_face' | 'single_face' | 'multiple_faces';
  count: number;
}

@Injectable({
  providedIn: 'root',
})
export class FaceRecognitionService {
  private http = inject(HttpClient);
  private readonly modelBaseUrl =
    'https://justadudewhohacks.github.io/face-api.js/models';

  // Face API base URL - defaults to local server
  private readonly apiUrl =
    environment.apiUrl.replace('/api', '') + '/api/face';

  // State
  private speechSynthesis =
    typeof window !== 'undefined' ? window.speechSynthesis : null;
  private recognition: any = null;

  // Signals for UI state
  isProcessing = signal<boolean>(false);
  isCameraReady = signal<boolean>(false);
  detectedEmployees = signal<FaceDetectionResult['employees']>([]);

  // Media stream for camera
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private modelsReady: Promise<void> | null = null;
  private faceApiReady: Promise<any> | null = null;

  private async loadFaceApi(): Promise<any> {
    const globalFaceApi = (globalThis as any).faceapi;
    if (globalFaceApi) {
      return globalFaceApi;
    }

    if (!this.faceApiReady) {
      this.faceApiReady = new Promise((resolve, reject) => {
        const existing = document.querySelector(
          'script[data-face-api="true"]',
        ) as HTMLScriptElement | null;

        if (existing && (globalThis as any).faceapi) {
          resolve((globalThis as any).faceapi);
          return;
        }

        const script = document.createElement('script');
        script.src =
          'https://unpkg.com/face-api.js@0.22.2/dist/face-api.min.js';
        script.async = true;
        script.dataset['faceApi'] = 'true';
        script.onload = () => resolve((globalThis as any).faceapi);
        script.onerror = () =>
          reject(new Error('Face recognition library could not be loaded.'));
        document.head.appendChild(script);
      });
    }

    return this.faceApiReady;
  }

  private async ensureModelsLoaded(): Promise<void> {
    if (!this.modelsReady) {
      this.modelsReady = this.loadFaceApi().then((faceapi) =>
        Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(this.modelBaseUrl),
          faceapi.nets.faceLandmark68Net.loadFromUri(this.modelBaseUrl),
          faceapi.nets.faceRecognitionNet.loadFromUri(this.modelBaseUrl),
        ]).then(() => undefined),
      );
    }

    return this.modelsReady;
  }

  /**
   * Warm up the face stack early so the first live scan feels faster.
   */
  async primeFaceEngine(): Promise<void> {
    await this.ensureModelsLoaded();
  }

  private createImageElement(imageData: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Unable to read captured face image.'));
      image.src = imageData;
    });
  }

  private averageDescriptors(descriptors: number[][]): number[] {
    if (!descriptors.length) return [];

    const length = descriptors[0].length;
    const averaged = new Array<number>(length).fill(0);

    for (const descriptor of descriptors) {
      for (let i = 0; i < length; i += 1) {
        averaged[i] += descriptor[i] ?? 0;
      }
    }

    return averaged.map((value) => value / descriptors.length);
  }

  private async extractDescriptorFromImage(imageData: string): Promise<number[]> {
    await this.ensureModelsLoaded();
    const image = await this.createImageElement(imageData);
    const faceapi = await this.loadFaceApi();
    const detection = await faceapi
      .detectSingleFace(
        image,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 192,
          scoreThreshold: 0.35,
        }),
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error(
        'No face was detected. Please keep your face inside the camera frame.',
      );
    }

    return Array.from(detection.descriptor);
  }

  private async extractDescriptorFromVideo(
    video: HTMLVideoElement,
  ): Promise<number[]> {
    await this.ensureModelsLoaded();
    const faceapi = await this.loadFaceApi();
    const detection = await faceapi
      .detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 192,
          scoreThreshold: 0.35,
        }),
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error(
        'No face was detected. Please keep your face inside the camera frame.',
      );
    }

    return Array.from(detection.descriptor);
  }

  private pointDistance(
    a: { x: number; y: number },
    b: { x: number; y: number },
  ): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private eyeAspectRatio(points: Array<{ x: number; y: number }>): number {
    if (points.length < 6) return 0;

    const vertical1 = this.pointDistance(points[1], points[5]);
    const vertical2 = this.pointDistance(points[2], points[4]);
    const horizontal = this.pointDistance(points[0], points[3]);

    if (!horizontal) return 0;
    return (vertical1 + vertical2) / (2 * horizontal);
  }

  private mouthAspectRatio(points: Array<{ x: number; y: number }>): number {
    if (points.length < 8) return 0;

    const vertical1 = this.pointDistance(points[2], points[6]);
    const vertical2 = this.pointDistance(points[3], points[5]);
    const horizontal = this.pointDistance(points[0], points[4]);

    if (!horizontal) return 0;
    return (vertical1 + vertical2) / (2 * horizontal);
  }

  private centerOf(points: Array<{ x: number; y: number }>): { x: number; y: number } {
    if (!points.length) return { x: 0, y: 0 };

    const total = points.reduce(
      (acc, point) => ({
        x: acc.x + point.x,
        y: acc.y + point.y,
      }),
      { x: 0, y: 0 },
    );

    return {
      x: total.x / points.length,
      y: total.y / points.length,
    };
  }

  private async captureStableDescriptorFromVideo(
    video: HTMLVideoElement,
    sampleCount = 3,
    sampleDelayMs = 90,
  ): Promise<string> {
    const samples: number[][] = [];

    for (let i = 0; i < sampleCount; i += 1) {
      const descriptor = await this.extractDescriptorFromVideo(video);
      samples.push(descriptor);

      if (i < sampleCount - 1) {
        await new Promise((resolve) => setTimeout(resolve, sampleDelayMs));
      }
    }

    return JSON.stringify(this.averageDescriptors(samples));
  }

  private async captureEnrollmentTemplatesFromVideo(
    video: HTMLVideoElement,
    templateCount = 3,
  ): Promise<string[]> {
    const templates: string[] = [];

    for (let i = 0; i < templateCount; i += 1) {
      const template = await this.captureStableDescriptorFromVideo(video, 2, 120);
      templates.push(template);

      if (i < templateCount - 1) {
        await new Promise((resolve) => setTimeout(resolve, 220));
      }
    }

    return templates;
  }

  private async extractEmbedding(imageData: string): Promise<string> {
    const descriptor = await this.extractDescriptorFromImage(imageData);
    return JSON.stringify(descriptor);
  }

  async buildEmbeddingFromImage(imageData: string): Promise<number[]> {
    return this.extractDescriptorFromImage(imageData);
  }

  async buildEmbeddingFromVideo(video: HTMLVideoElement): Promise<number[]> {
    const descriptor = await this.captureStableDescriptorFromVideo(video);
    return JSON.parse(descriptor) as number[];
  }

  async evaluateLiveness(
    video: HTMLVideoElement,
  ): Promise<{
    confirmed: boolean;
    blinkDetected: boolean;
    headMovementDetected: boolean;
    samples: FaceLivenessSample[];
  }> {
    await this.ensureModelsLoaded();
    const faceapi = await this.loadFaceApi();
    const samples: FaceLivenessSample[] = [];

    for (let index = 0; index < 4; index += 1) {
      const detection = await faceapi
        .detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 192,
            scoreThreshold: 0.35,
          }),
        )
        .withFaceLandmarks();

      if (detection?.landmarks) {
        const leftEye = detection.landmarks.getLeftEye();
        const rightEye = detection.landmarks.getRightEye();
        const mouth = detection.landmarks.getMouth();
        const jaw = detection.landmarks.getJawOutline();
        const nose = detection.landmarks.getNose();

        const leftCenter = this.centerOf(leftEye);
        const rightCenter = this.centerOf(rightEye);
        const jawCenter = this.centerOf(jaw);
        const noseCenter = this.centerOf(nose);
        const eyeDistance = this.pointDistance(leftCenter, rightCenter) || 1;

        samples.push({
          detected: true,
          leftEyeRatio: this.eyeAspectRatio(leftEye),
          rightEyeRatio: this.eyeAspectRatio(rightEye),
          averageEyeRatio:
            (this.eyeAspectRatio(leftEye) + this.eyeAspectRatio(rightEye)) / 2,
          mouthRatio: this.mouthAspectRatio(mouth),
          headTurnRatio: Math.abs(noseCenter.x - jawCenter.x) / eyeDistance,
        });
      } else {
        samples.push({
          detected: false,
          leftEyeRatio: 0,
          rightEyeRatio: 0,
          averageEyeRatio: 0,
          mouthRatio: 0,
          headTurnRatio: 0,
        });
      }

      if (index < 3) {
        await new Promise((resolve) => setTimeout(resolve, 220));
      }
    }

    const eyeRatios = samples.filter((sample) => sample.detected).map((sample) => sample.averageEyeRatio);
    const headRatios = samples.filter((sample) => sample.detected).map((sample) => sample.headTurnRatio);
    const blinkDetected =
      eyeRatios.length > 1 &&
      Math.max(...eyeRatios) - Math.min(...eyeRatios) > 0.045;
    const headMovementDetected =
      headRatios.length > 1 &&
      Math.max(...headRatios) - Math.min(...headRatios) > 0.035;

    return {
      confirmed: blinkDetected || headMovementDetected,
      blinkDetected,
      headMovementDetected,
      samples,
    };
  }

  // ==================== FACE REGISTRATION ====================

  /**
   * Register employee's face
   */
  registerFace(
    employeeId: number,
    orgId: number,
    imageData: string,
  ): Observable<any> {
    this.isProcessing.set(true);

    return from(this.extractEmbedding(imageData)).pipe(
      switchMap((embedding) =>
        this.http.post<any>(`${this.apiUrl}/register`, {
          employeeId,
          orgId,
          embedding,
        }),
      ),
      finalize(() => this.isProcessing.set(false)),
    );
  }

  registerFaceFromVideo(
    employeeId: number,
    orgId: number,
    video: HTMLVideoElement,
  ): Observable<any> {
    this.isProcessing.set(true);

    return from(this.captureEnrollmentTemplatesFromVideo(video)).pipe(
      switchMap((embeddings) =>
        this.http.post<any>(`${this.apiUrl}/register`, {
          employeeId,
          orgId,
          embeddings,
        }),
      ),
      finalize(() => this.isProcessing.set(false)),
    );
  }

  /**
   * Check if employee has registered face
   */
  hasRegisteredFace(employeeId: number): Observable<boolean> {
    return this.http.get<any>(`${this.apiUrl}/status/${employeeId}`).pipe(
      map((res) => Boolean(res?.registered ?? res?.data?.registered)),
      catchError(() => of(false)),
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
    action: 'check_in' | 'check_out' = 'check_in',
  ): Observable<FaceVerificationResult> {
    this.isProcessing.set(true);

    return from(this.extractEmbedding(imageData)).pipe(
      switchMap((embedding) =>
        this.http.post<any>(`${this.apiUrl}/verify`, {
          employeeId,
          orgId,
          embedding,
          action,
        }),
      ),
      finalize(() => this.isProcessing.set(false)),
      map((res) => {
        if (res.success && res.tts) {
          this.speak(res.tts.message);
        }

        return res;
      }),
      catchError((error) => {
        const message =
          error?.error?.message ||
          error?.message ||
          'Face verification service is currently unavailable.';
        return throwError(() => ({ ...error, friendlyMessage: message }));
      }),
    );
  }

  verifyAndMarkAttendanceFromVideo(
    employeeId: number,
    orgId: number,
    video: HTMLVideoElement,
    action: 'check_in' | 'check_out' = 'check_in',
  ): Observable<FaceVerificationResult> {
    this.isProcessing.set(true);

    return from(this.captureStableDescriptorFromVideo(video)).pipe(
      switchMap((embedding) =>
        this.http.post<any>(`${this.apiUrl}/verify`, {
          employeeId,
          orgId,
          embedding,
          action,
        }),
      ),
      finalize(() => this.isProcessing.set(false)),
      map((res) => {
        if (res.success && res.tts) {
          this.speak(res.tts.message);
        }

        return res;
      }),
      catchError((error) => {
        const message =
          error?.error?.message ||
          error?.message ||
          'Face verification service is currently unavailable.';
        return throwError(() => ({ ...error, friendlyMessage: message }));
      }),
    );
  }

  /**
   * Check whether a face is visible in the current frame.
   */
  detectFacePresence(imageData: string): Observable<boolean> {
    return from(this.detectFacePresenceOnImage(imageData)).pipe(
      catchError(() => of(false)),
    );
  }

  /**
   * Check whether a face is visible directly from a live camera feed.
   * This skips JPEG re-encoding and is used by the auto-scan loops.
   */
  detectFacePresenceFromVideo(video: HTMLVideoElement): Observable<boolean> {
    return from(this.detectFacePresenceOnVideo(video)).pipe(
      catchError(() => of(false)),
    );
  }

  detectLivenessSampleFromVideo(
    video: HTMLVideoElement,
  ): Observable<FaceLivenessSample> {
    return from(this.detectLivenessSampleOnVideo(video)).pipe(
      catchError(() =>
        of({
          detected: false,
          leftEyeRatio: 0,
          rightEyeRatio: 0,
          averageEyeRatio: 0,
          mouthRatio: 0,
          headTurnRatio: 0,
        }),
      ),
    );
  }

  getLiveFaceFrameSummary(
    video: HTMLVideoElement,
  ): Observable<LiveFaceFrameSummary> {
    return from(this.detectFaceCountOnVideo(video)).pipe(
      map((count): LiveFaceFrameSummary => {
        const status: LiveFaceFrameSummary['status'] =
          count <= 0
            ? 'no_face'
            : count === 1
              ? 'single_face'
              : 'multiple_faces';

        return {
          count,
          status,
        };
      }),
      catchError(() =>
        of({
          count: 0,
          status: 'no_face' as const,
        }),
      ),
    );
  }

  private async detectFacePresenceOnImage(imageData: string): Promise<boolean> {
    await this.ensureModelsLoaded();
    const image = await this.createImageElement(imageData);
    const faceapi = await this.loadFaceApi();
    const detection = await faceapi.detectSingleFace(
      image,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 160,
        scoreThreshold: 0.3,
      }),
    );

    return Boolean(detection);
  }

  private async detectFacePresenceOnVideo(
    video: HTMLVideoElement,
  ): Promise<boolean> {
    await this.ensureModelsLoaded();
    const faceapi = await this.loadFaceApi();
    const detection = await faceapi.detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 160,
        scoreThreshold: 0.3,
      }),
    );

    return Boolean(detection);
  }

  private async detectFaceCountOnVideo(
    video: HTMLVideoElement,
  ): Promise<number> {
    await this.ensureModelsLoaded();
    const faceapi = await this.loadFaceApi();
    const detections = await faceapi.detectAllFaces(
      video,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 160,
        scoreThreshold: 0.3,
      }),
    );

    return Array.isArray(detections) ? detections.length : 0;
  }

  private async detectLivenessSampleOnVideo(
    video: HTMLVideoElement,
  ): Promise<FaceLivenessSample> {
    await this.ensureModelsLoaded();
    const faceapi = await this.loadFaceApi();
    const detection = await faceapi
      .detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 160,
          scoreThreshold: 0.3,
        }),
      )
      .withFaceLandmarks();

    if (!detection) {
      return {
        detected: false,
        leftEyeRatio: 0,
        rightEyeRatio: 0,
        averageEyeRatio: 0,
        mouthRatio: 0,
        headTurnRatio: 0,
      };
    }

    const landmarks = detection.landmarks;
    const leftEyeRatio = this.eyeAspectRatio(landmarks.getLeftEye());
    const rightEyeRatio = this.eyeAspectRatio(landmarks.getRightEye());
    const averageEyeRatio = (leftEyeRatio + rightEyeRatio) / 2;
    const mouthRatio = this.mouthAspectRatio(landmarks.getMouth());
    const leftEyeCenter = this.centerOf(landmarks.getLeftEye());
    const rightEyeCenter = this.centerOf(landmarks.getRightEye());
    const eyeCenter = {
      x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
      y: (leftEyeCenter.y + rightEyeCenter.y) / 2,
    };
    const nosePoints = landmarks.getNose();
    const noseTip = nosePoints[Math.min(3, nosePoints.length - 1)] || nosePoints[0] || eyeCenter;
    const eyeDistance = Math.max(
      this.pointDistance(leftEyeCenter, rightEyeCenter),
      1,
    );
    const headTurnRatio = (noseTip.x - eyeCenter.x) / eyeDistance;

    return {
      detected: true,
      leftEyeRatio,
      rightEyeRatio,
      averageEyeRatio,
      mouthRatio,
      headTurnRatio,
    };
  }

  /**
   * Detect faces in real-time without marking attendance
   */
  detectFaces(imageData: string): Observable<FaceDetectionResult> {
    return this.http
      .post<any>(`${this.apiUrl}/detect`, {
        image: imageData,
      })
      .pipe(
        map((res) => {
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
            employees: [],
          });
        }),
      );
  }

  // ==================== EMPLOYEE MANAGEMENT ====================

  /**
   * Get all employees with registered faces
   */
  getEmployeesWithFaces(orgId?: number): Observable<FaceEmployee[]> {
    let url = `${this.apiUrl}/employees`;
    if (orgId) {
      url += `?orgId=${orgId}`;
    }

    return this.http.get<any>(url).pipe(
      map((res) => res?.employees || res?.data || []),
      catchError(() => of([])),
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
    employeeId?: number;
    orgId?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<any[]> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Convert camelCase to snake_case for API if needed
        let apiKey = key;
        if (key === 'employeeId') apiKey = 'employee_id';
        else if (key === 'orgId') apiKey = 'org_id';
        else if (key === 'dateFrom') apiKey = 'date_from';
        else if (key === 'dateTo') apiKey = 'date_to';

        queryParams.set(apiKey, value.toString());
      }
    });

    const url = `${this.apiUrl}/attendance${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    return this.http.get<any>(url).pipe(
      map((res) => res?.records || res?.data || []),
      catchError(() => of([])),
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
    const englishVoice =
      voices.find(
        (v) => v.lang.startsWith('en-') && v.name.includes('Google'),
      ) ||
      voices.find((v) => v.lang.startsWith('en-')) ||
      voices[0];

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    this.speechSynthesis.speak(utterance);
  }

  /**
   * Speak attendance success message
   */
  speakAttendanceSuccess(employeeName: string): void {
    const message = `${employeeName}, your attendance has been marked successfully!`;
    this.speak(message);
  }

  /**
   * Speak error message
   */
  speakError(message: string): void {
    this.speak(`Error: ${message}`);
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
  async startCamera(
    videoElement: HTMLVideoElement,
    facingMode: 'user' | 'environment' = 'user',
  ): Promise<boolean> {
    try {
      this.stopCamera();
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera API is not available in this browser.');
      }

      const constraintsToTry: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        },
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        },
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

      this.videoElement = videoElement;
      videoElement.setAttribute('playsinline', 'true');
      videoElement.muted = true;
      videoElement.srcObject = this.mediaStream;

      await new Promise<void>((resolve) => {
        videoElement.onloadedmetadata = async () => {
          try {
            await videoElement.play();
          } catch {
            // Keep camera usable even if autoplay timing is blocked.
          }
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

  async startBestAvailableCamera(
    videoElement: HTMLVideoElement,
  ): Promise<boolean> {
    const strategies: Array<'user' | 'environment'> = ['user', 'environment'];

    for (const facingMode of strategies) {
      const started = await this.startCamera(videoElement, facingMode);
      if (started) {
        return true;
      }
    }

    try {
      this.stopCamera();
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
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
      console.error('Best camera auto-detect failed:', error);
      this.isCameraReady.set(false);
      return false;
    }
  }

  /**
   * Stop camera
   */
  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
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
  captureFrame(
    videoElement: HTMLVideoElement,
    canvas: HTMLCanvasElement,
  ): string | null {
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
