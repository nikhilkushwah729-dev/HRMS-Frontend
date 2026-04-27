import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KioskService, KioskSummary } from '../../../../core/services/kiosk.service';

@Component({
  selector: 'app-kiosk-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto py-8 space-y-6">
      <header class="app-module-hero flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="app-module-kicker">Kiosk Management</p>
          <h1 class="app-module-title mt-3">Registered Kiosks</h1>
          <p class="app-module-text mt-3">
            Approve, block, or rotate kiosk tokens for office attendance devices.
          </p>
        </div>
      </header>

      <div class="grid gap-4 md:grid-cols-4">
        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" *ngFor="let item of summaryCards()">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            {{ item.label }}
          </p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">
            {{ item.value }}
          </p>
        </div>
      </div>

      <div class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 class="text-lg font-semibold text-slate-900">All Devices</h2>
          <a
            routerLink="/admin/kiosks/approvals"
            class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Pending Approvals
          </a>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-100">
            <thead class="bg-slate-50/80">
              <tr class="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <th class="px-6 py-4">Kiosk</th>
                <th class="px-6 py-4">Location</th>
                <th class="px-6 py-4">Status</th>
                <th class="px-6 py-4">Last Seen</th>
                <th class="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (kiosk of kiosks(); track kiosk.id) {
                <tr class="align-top">
                  <td class="px-6 py-4">
                    <p class="font-semibold text-slate-900">{{ kiosk.name }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ kiosk.deviceId }}</p>
                  </td>
                  <td class="px-6 py-4 text-sm text-slate-700">{{ kiosk.location }}</td>
                  <td class="px-6 py-4">
                    <span
                      class="rounded-full px-3 py-1 text-xs font-semibold"
                      [ngClass]="statusClass(kiosk.status)"
                    >
                      {{ kiosk.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-slate-700">
                    {{ kiosk.lastSeenAt ? (kiosk.lastSeenAt | date: 'medium') : 'Never' }}
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex flex-wrap gap-2">
                      <a
                        [routerLink]="['/admin/kiosks', kiosk.id]"
                        class="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </a>
                      <button
                        type="button"
                        (click)="approve(kiosk)"
                        *ngIf="kiosk.status === 'pending'"
                        class="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        (click)="toggle(kiosk)"
                        class="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {{ kiosk.status === 'active' ? 'Deactivate' : 'Activate' }}
                      </button>
                      <button
                        type="button"
                        (click)="resetToken(kiosk)"
                        class="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                      >
                        Reset Token
                      </button>
                      <button
                        type="button"
                        (click)="block(kiosk)"
                        class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        Block
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (tokenMessage()) {
        <div class="rounded-3xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-800">
          {{ tokenMessage() }}
        </div>
      }
    </div>
  `,
})
export class KioskListComponent implements OnInit {
  private kioskService = inject(KioskService);

  kiosks = signal<KioskSummary[]>([]);
  tokenMessage = signal('');

  summaryCards = signal([
    { label: 'Total', value: '0' },
    { label: 'Pending', value: '0' },
    { label: 'Active', value: '0' },
    { label: 'Blocked', value: '0' },
  ]);

  ngOnInit() {
    this.load();
  }

  load() {
    this.kioskService.getKiosks().subscribe((items) => {
      this.kiosks.set(items);
      this.summaryCards.set([
        { label: 'Total', value: String(items.length) },
        { label: 'Pending', value: String(items.filter((item) => item.status === 'pending').length) },
        { label: 'Active', value: String(items.filter((item) => item.status === 'active').length) },
        { label: 'Blocked', value: String(items.filter((item) => item.status === 'blocked').length) },
      ]);
    });
  }

  approve(kiosk: KioskSummary) {
    this.kioskService.approveKiosk(kiosk.id).subscribe((updated) => {
      this.showTokenIfPresent(updated);
      this.load();
    });
  }

  toggle(kiosk: KioskSummary) {
    this.kioskService.toggleKiosk(kiosk.id).subscribe(() => this.load());
  }

  resetToken(kiosk: KioskSummary) {
    this.kioskService.resetToken(kiosk.id).subscribe((updated) => {
      this.showTokenIfPresent(updated);
      this.load();
    });
  }

  block(kiosk: KioskSummary) {
    this.kioskService.blockKiosk(kiosk.id).subscribe(() => this.load());
  }

  statusClass(status: string) {
    return {
      'bg-amber-100 text-amber-700': status === 'pending',
      'bg-emerald-100 text-emerald-700': status === 'active',
      'bg-slate-200 text-slate-700': status === 'inactive',
      'bg-rose-100 text-rose-700': status === 'blocked',
    };
  }

  private showTokenIfPresent(kiosk: KioskSummary) {
    this.tokenMessage.set(
      kiosk.deviceToken
        ? `Token for ${kiosk.name}: ${kiosk.deviceToken}`
        : '',
    );
  }
}
