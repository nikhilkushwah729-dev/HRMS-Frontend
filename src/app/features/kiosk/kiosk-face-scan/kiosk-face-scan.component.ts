import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FaceRecognitionService } from '../../../core/services/face-recognition.service';

@Component({
  selector: 'app-kiosk-face-scan',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="mx-auto w-full max-w-5xl rounded-[2rem] border border-white/15 bg-slate-950/70 p-8 text-white shadow-2xl backdrop-blur">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
            Face Scan
          </p>
          <h2 class="mt-3 text-3xl font-semibold">Align face and hold still</h2>
          <p class="mt-2 text-sm text-white/70">
            Blink or move slightly so the kiosk can confirm liveness before marking attendance.
          </p>
        </div>
        <button
          type="button"
          (click)="cancel.emit()"
          class="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
        >
          Back
        </button>
      </div>

      <div class="mt-8 grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
        <div class="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-4">
          <div class="relative overflow-hidden rounded-[1.5rem] bg-black/40">
            <video
              #video
              autoplay
              muted
              playsinline
              class="aspect-[4/3] w-full object-cover"
            ></video>
            <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div class="h-72 w-72 rounded-full border-4 border-dashed border-sky-300/70 shadow-[0_0_0_999px_rgba(15,23,42,0.42)]"></div>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-white/45">
              Camera
            </p>
            <p class="mt-3 text-sm text-white/80">
              {{ cameraReady() ? liveStatus() : 'Starting camera...' }}
            </p>
          </div>

          <div class="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-white/45">
              Guidance
            </p>
            <ul class="mt-3 space-y-2 text-sm text-white/80">
              <li>Look directly at the camera.</li>
              <li>Keep one face inside the circle.</li>
              <li>Avoid hats or very dark lighting.</li>
            </ul>
          </div>

          <button
            type="button"
            (click)="capture()"
            [disabled]="busy() || !cameraReady()"
            class="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-sky-400 px-6 py-4 text-lg font-semibold text-slate-950 transition hover:from-emerald-300 hover:to-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{
              busy()
                ? 'Processing Face...'
                : autoCapturing()
                  ? 'Auto Capturing...'
                  : 'Capture Face Attendance'
            }}
          </button>
        </div>
      </div>

      <canvas #canvas class="hidden"></canvas>
    </section>
  `,
})
export class KioskFaceScanComponent implements AfterViewInit, OnDestroy {
  private faceService = inject(FaceRecognitionService);

  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  @Output() scanned = new EventEmitter<{
    embedding: number[];
    liveness: {
      confirmed: boolean;
      blinkDetected: boolean;
      headMovementDetected: boolean;
    };
  }>();
  @Output() failure = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  busy = signal(false);
  cameraReady = signal(false);
  faceDetected = signal(false);
  autoCapturing = signal(false);
  liveStatus = signal('Preparing camera...');

  private detectionTimer?: number;
  private faceSampleStreak = 0;
  private livenessSamples: Array<{
    averageEyeRatio: number;
    headTurnRatio: number;
  }> = [];

  async ngAfterViewInit() {
    await this.faceService.primeFaceEngine();
    const ready = await this.faceService.startBestAvailableCamera(
      this.videoRef.nativeElement,
    );
    this.cameraReady.set(ready);
    if (!ready) {
      this.failure.emit('Camera could not be started on this kiosk.');
      this.liveStatus.set('Camera unavailable on this device.');
      return;
    }

    this.liveStatus.set('Camera ready. Looking for a face...');
    this.monitorLoop();
  }

  async capture() {
    if (!this.videoRef?.nativeElement) {
      return;
    }

    this.busy.set(true);
    try {
      this.liveStatus.set('Checking liveness and capturing face...');
      const liveness = await this.faceService.evaluateLiveness(
        this.videoRef.nativeElement,
      );
      const embedding = await this.faceService.buildEmbeddingFromVideo(
        this.videoRef.nativeElement,
      );

      this.liveStatus.set('Face captured. Marking attendance...');
      this.scanned.emit({ embedding, liveness });
    } catch (error: any) {
      this.failure.emit(
        error?.message ??
          'Face could not be captured. Please align your face and try again.',
      );
      this.liveStatus.set('Capture failed. Re-align face and try again.');
    } finally {
      this.busy.set(false);
      this.autoCapturing.set(false);
    }
  }

  ngOnDestroy() {
    if (this.detectionTimer) {
      window.clearTimeout(this.detectionTimer);
    }
    this.faceService.stopCamera();
  }

  private async monitorLoop() {
    if (!this.videoRef?.nativeElement || this.busy()) {
      this.scheduleNextTick();
      return;
    }

    try {
      const sample = await firstValueFrom(
        this.faceService.detectLivenessSampleFromVideo(
          this.videoRef.nativeElement,
        ),
      );

      if (!sample?.detected) {
        this.faceDetected.set(false);
        this.faceSampleStreak = 0;
        this.livenessSamples = [];
        this.autoCapturing.set(false);
        this.liveStatus.set('No face detected. Please stand inside the circle.');
        this.scheduleNextTick();
        return;
      }

      this.faceDetected.set(true);
      this.faceSampleStreak += 1;
      this.livenessSamples = [
        ...this.livenessSamples.slice(-5),
        {
          averageEyeRatio: sample.averageEyeRatio,
          headTurnRatio: sample.headTurnRatio,
        },
      ];

      const blinkRange = this.rangeOf(this.livenessSamples, 'averageEyeRatio');
      const headRange = this.rangeOf(this.livenessSamples, 'headTurnRatio');
      const liveReady = blinkRange > 0.04 || headRange > 0.03;

      if (liveReady && this.faceSampleStreak >= 2 && !this.autoCapturing()) {
        this.autoCapturing.set(true);
        this.liveStatus.set('Face detected live. Capturing automatically...');
        await this.capture();
        return;
      }

      this.liveStatus.set(
        this.faceSampleStreak < 2
          ? 'Face detected. Hold still for a moment...'
          : 'Blink once or turn slightly for live attendance capture.',
      );
    } catch {
      this.liveStatus.set('Scanning camera feed...');
    }

    this.scheduleNextTick();
  }

  private scheduleNextTick() {
    this.detectionTimer = window.setTimeout(() => {
      void this.monitorLoop();
    }, 550);
  }

  private rangeOf(
    values: Array<{ averageEyeRatio: number; headTurnRatio: number }>,
    key: 'averageEyeRatio' | 'headTurnRatio',
  ) {
    const nums = values
      .map((item) => item[key])
      .filter((value) => Number.isFinite(value));

    if (!nums.length) {
      return 0;
    }

    return Math.max(...nums) - Math.min(...nums);
  }
}
