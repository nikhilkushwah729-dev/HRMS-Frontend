import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-module-demo-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible()) {
      <div class="fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur-sm" (click)="close.emit()"></div>
      <section class="fixed inset-x-3 top-4 z-[91] mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div class="grid max-h-[88vh] lg:grid-cols-[1.2fr_0.8fr]">
          <div class="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_28%),linear-gradient(180deg,#0f172a_0%,#111827_55%,#1e293b_100%)] p-5 text-white sm:p-6">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/80">Interactive Demo</p>
                <h2 class="mt-2 text-2xl font-black tracking-tight">{{ title() }}</h2>
                <p class="mt-2 max-w-xl text-sm leading-6 text-slate-200">{{ outcome() }}</p>
              </div>
              <button type="button" (click)="close.emit()" class="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/15">
                Close
              </button>
            </div>

            <div class="mt-5 flex flex-wrap gap-2">
              <span class="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">{{ duration() }}</span>
              <span class="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">{{ audience() }}</span>
              <span class="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">{{ locked() ? 'Upgrade-aware' : 'Live workspace' }}</span>
            </div>

            <div class="mt-6 flex gap-2">
              @for (step of steps(); track $index) {
                <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    class="h-full rounded-full bg-cyan-300 transition-all duration-300"
                    [style.width.%]="$index < currentIndex() ? 100 : ($index === currentIndex() ? progress() : 0)"
                  ></div>
                </div>
              }
            </div>

            <div class="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/80">Scene {{ currentIndex() + 1 }}</p>
                  <h3 class="mt-2 text-xl font-black text-white">{{ currentStep() }}</h3>
                </div>
                <div class="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
                  {{ moduleLabel() }}
                </div>
              </div>

              <div class="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div class="rounded-[22px] border border-white/10 bg-slate-950/30 p-4">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Preview Screen</p>
                      <p class="mt-2 text-sm font-bold text-white">{{ currentSceneTitle() }}</p>
                    </div>
                    <span class="rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                      {{ currentSceneChip() }}
                    </span>
                  </div>

                  <div class="mt-4 space-y-3">
                    <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                      <div class="flex items-center justify-between gap-3">
                        <span class="text-xs font-bold text-slate-200">Main action</span>
                        <span class="rounded-full bg-cyan-400/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">Live</span>
                      </div>
                      <p class="mt-2 text-lg font-black text-white">{{ currentSceneAction() }}</p>
                      <p class="mt-2 text-xs leading-5 text-slate-300">{{ currentSceneHint() }}</p>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div class="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Status</p>
                        <p class="mt-2 text-sm font-bold text-white">{{ currentSceneStatus() }}</p>
                      </div>
                      <div class="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Outcome</p>
                        <p class="mt-2 text-sm font-bold text-white">{{ currentSceneOutcome() }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="rounded-[22px] border border-white/10 bg-white/10 p-4">
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/80">How it works</p>
                  <div class="mt-4 space-y-3">
                    @for (step of steps(); track step; let idx = $index) {
                      <div class="flex items-start gap-3 rounded-2xl border px-3 py-3 transition"
                        [ngClass]="idx === currentIndex() ? 'border-cyan-300/40 bg-cyan-300/10' : 'border-white/10 bg-white/5'">
                        <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                          [ngClass]="idx === currentIndex() ? 'bg-cyan-300 text-slate-950' : 'bg-white/10 text-slate-100'">
                          {{ idx + 1 }}
                        </span>
                        <div class="min-w-0">
                          <p class="text-sm font-bold text-white">{{ step }}</p>
                          <p class="mt-1 text-xs leading-5 text-slate-300">{{ sceneCaption(idx) }}</p>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside class="overflow-y-auto bg-slate-50 p-5 sm:p-6">
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Next Actions</p>
            <h3 class="mt-2 text-2xl font-black tracking-tight text-slate-900">Learn, then continue</h3>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              Watch the guided flow, then jump directly into the module or move to the upgrade journey if the module is premium.
            </p>

            <div class="mt-5 space-y-3">
              <div class="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Recommended action</p>
                <p class="mt-2 text-base font-black text-slate-900">{{ locked() ? 'Review plan and activate module' : 'Open the workspace and follow the same steps' }}</p>
              </div>

              <div class="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Quick summary</p>
                <div class="mt-3 space-y-2 text-sm text-slate-600">
                  <div class="flex items-start gap-2">
                    <span class="mt-1 h-2 w-2 rounded-full bg-slate-300"></span>
                    <span>The demo auto-plays through the module workflow.</span>
                  </div>
                  <div class="flex items-start gap-2">
                    <span class="mt-1 h-2 w-2 rounded-full bg-slate-300"></span>
                    <span>Users can understand what happens before buying or opening the module.</span>
                  </div>
                  <div class="flex items-start gap-2">
                    <span class="mt-1 h-2 w-2 rounded-full bg-slate-300"></span>
                    <span>Use the CTA below to continue without extra navigation.</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 grid gap-3">
              <button type="button" (click)="openFlow.emit()" class="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-slate-800">
                {{ locked() ? 'Open Guided Workspace' : 'Open Module Now' }}
              </button>
              <button type="button" (click)="openBilling.emit()" class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50">
                {{ locked() ? 'Open Buy Flow' : 'Open Upgrade & Pricing' }}
              </button>
            </div>
          </aside>
        </div>
      </section>
    }
  `,
})
export class ModuleDemoPlayerComponent {
  private readonly destroyRef = inject(DestroyRef);
  private progressTimer: ReturnType<typeof setInterval> | null = null;

  visible = input(false);
  title = input('');
  duration = input('');
  audience = input('');
  outcome = input('');
  steps = input<string[]>([]);
  moduleLabel = input('');
  locked = input(false);

  close = output<void>();
  openFlow = output<void>();
  openBilling = output<void>();

  currentIndex = signal(0);
  progress = signal(0);

  currentStep = computed(() => this.steps()[this.currentIndex()] || '');

  constructor() {
    effect(() => {
      if (this.visible() && this.steps().length > 0) {
        this.currentIndex.set(0);
        this.progress.set(0);
        this.startPlayback();
        return;
      }

      this.stopPlayback();
    });

    this.destroyRef.onDestroy(() => this.stopPlayback());
  }

  currentSceneTitle(): string {
    const titles = [
      'Start from the main workspace',
      'Review the action panel',
      'Complete the task confidently',
      'Track status and next steps',
    ];
    return titles[this.currentIndex()] || 'Module walkthrough';
  }

  currentSceneAction(): string {
    const actions = [
      'Open the module and review key summary cards',
      'Use the primary action button to begin the workflow',
      'Submit or save the record with guided validation',
      'Check status, history, and follow-up actions',
    ];
    return actions[this.currentIndex()] || 'Continue the workflow';
  }

  currentSceneHint(): string {
    const hints = [
      'The opening screen gives users immediate context, current status, and important KPIs.',
      'Primary actions stay visible so the user can move forward without hunting for controls.',
      'The workflow remains clear with validation, helper text, and progress feedback.',
      'After submission, users can track what changed and what to do next.',
    ];
    return hints[this.currentIndex()] || 'The UI keeps users on a guided path.';
  }

  currentSceneStatus(): string {
    const states = ['Workspace Ready', 'Action In Progress', 'Submission Ready', 'Tracked'];
    return states[this.currentIndex()] || 'Ready';
  }

  currentSceneOutcome(): string {
    const outcomes = ['Quick orientation', 'Clear action path', 'Safe completion', 'Visibility after action'];
    return outcomes[this.currentIndex()] || 'Completed';
  }

  currentSceneChip(): string {
    const chips = ['Overview', 'Action', 'Submit', 'Track'];
    return chips[this.currentIndex()] || 'Flow';
  }

  sceneCaption(index: number): string {
    const captions = [
      'Users understand the module layout and main metrics first.',
      'The guided UI shows where to click and why it matters.',
      'The workflow remains clear until the task is submitted.',
      'History and status make the module easy to trust daily.',
    ];
    return captions[index] || 'Guided workflow preview.';
  }

  private startPlayback(): void {
    this.stopPlayback();
    this.progressTimer = setInterval(() => {
      const nextProgress = this.progress() + 4;
      if (nextProgress >= 100) {
        const nextIndex = this.currentIndex() + 1;
        if (nextIndex >= this.steps().length) {
          this.currentIndex.set(0);
          this.progress.set(0);
          return;
        }

        this.currentIndex.set(nextIndex);
        this.progress.set(0);
        return;
      }

      this.progress.set(nextProgress);
    }, 120);
  }

  private stopPlayback(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }
}
