import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-kiosk-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-5xl mx-auto py-8 space-y-6">
      <header class="app-module-hero">
        <p class="app-module-kicker">Kiosk Management</p>
        <h1 class="app-module-title mt-3">Kiosk Settings</h1>
        <p class="app-module-text mt-3">
          Configure rollout rules and operational guardrails for shared attendance devices.
        </p>
      </header>

      <div class="grid gap-5 md:grid-cols-2">
        <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Recommended Rules</h2>
          <ul class="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Approve every kiosk before issuing a device token.</li>
            <li>Rotate kiosk tokens whenever a device changes hands.</li>
            <li>Use face attendance only after HR approves face profiles.</li>
            <li>Keep PIN attempts rate limited and monitored in audit logs.</li>
          </ul>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Production Checklist</h2>
          <ul class="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Enable HTTPS for kiosk routes in production.</li>
            <li>Assign kiosk devices to correct organization locations.</li>
            <li>Verify browser camera permissions on the shared device.</li>
            <li>Test offline sync before live rollout.</li>
          </ul>
        </section>
      </div>
    </div>
  `,
})
export class KioskSettingsComponent {}
