import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-kiosk-result',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="mx-auto w-full max-w-2xl rounded-[2rem] border border-white/15 bg-slate-950/70 p-8 text-white shadow-2xl backdrop-blur"
    >
      <div class="flex items-start gap-5">
        <div
          class="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold"
          [ngClass]="{
            'bg-emerald-500/20 text-emerald-200': tone === 'success',
            'bg-amber-500/20 text-amber-200': tone === 'warning',
            'bg-rose-500/20 text-rose-200': tone === 'error',
            'bg-sky-500/20 text-sky-200': tone === 'info',
          }"
        >
          {{ icon }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold uppercase tracking-[0.35em] text-white/55">
            Kiosk Status
          </p>
          <h2 class="mt-3 text-3xl font-semibold">{{ title }}</h2>
          <p class="mt-3 text-base leading-7 text-slate-200">{{ message }}</p>

          @if (details.length) {
            <dl class="mt-6 grid gap-3 sm:grid-cols-2">
              @for (detail of details; track detail.label) {
                <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <dt class="text-xs uppercase tracking-[0.24em] text-white/45">
                    {{ detail.label }}
                  </dt>
                  <dd class="mt-2 text-sm font-medium text-white">
                    {{ detail.value }}
                  </dd>
                </div>
              }
            </dl>
          }
        </div>
      </div>
    </section>
  `,
})
export class KioskResultComponent {
  @Input() tone: 'success' | 'warning' | 'error' | 'info' = 'info';
  @Input() title = '';
  @Input() message = '';
  @Input() details: Array<{ label: string; value: string }> = [];

  get icon() {
    switch (this.tone) {
      case 'success':
        return 'OK';
      case 'warning':
        return '!';
      case 'error':
        return 'X';
      default:
        return 'i';
    }
  }
}
