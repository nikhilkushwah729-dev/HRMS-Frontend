import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { KioskService, KioskSummary } from '../../../../core/services/kiosk.service';

@Component({
  selector: 'app-kiosk-approvals',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-6xl mx-auto py-8 space-y-6">
      <header class="app-module-hero">
        <p class="app-module-kicker">Kiosk Management</p>
        <h1 class="app-module-title mt-3">Pending Kiosk Approvals</h1>
        <p class="app-module-text mt-3">
          Approve registered devices and issue their kiosk activation tokens.
        </p>
      </header>

      <div class="grid gap-4">
        @for (kiosk of pending(); track kiosk.id) {
          <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 class="text-xl font-semibold text-slate-900">{{ kiosk.name }}</h2>
                <p class="mt-2 text-sm text-slate-500">{{ kiosk.location }} · {{ kiosk.deviceId }}</p>
              </div>
              <button
                type="button"
                (click)="approve(kiosk)"
                class="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Approve & Issue Token
              </button>
            </div>
          </div>
        } @empty {
          <div class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            No kiosks are waiting for approval.
          </div>
        }
      </div>

      @if (issuedToken()) {
        <div class="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          {{ issuedToken() }}
        </div>
      }
    </div>
  `,
})
export class KioskApprovalsComponent implements OnInit {
  private kioskService = inject(KioskService);

  pending = signal<KioskSummary[]>([]);
  issuedToken = signal('');

  ngOnInit() {
    this.load();
  }

  load() {
    this.kioskService.getKiosks('pending').subscribe((items) => this.pending.set(items));
  }

  approve(kiosk: KioskSummary) {
    this.kioskService.approveKiosk(kiosk.id).subscribe((updated) => {
      this.issuedToken.set(
        updated.deviceToken
          ? `Token issued for ${updated.name}: ${updated.deviceToken}`
          : `${updated.name} approved.`,
      );
      this.load();
    });
  }
}
