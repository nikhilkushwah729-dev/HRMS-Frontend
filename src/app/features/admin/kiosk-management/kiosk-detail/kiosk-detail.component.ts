import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { KioskService, KioskSummary } from '../../../../core/services/kiosk.service';

@Component({
  selector: 'app-kiosk-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto py-8 space-y-6">
      <a routerLink="/admin/kiosks" class="text-sm font-semibold text-sky-700 hover:text-sky-800">
        Back to kiosks
      </a>

      @if (kiosk()) {
        <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Kiosk Detail
          </p>
          <h1 class="mt-3 text-3xl font-semibold text-slate-900">{{ kiosk()!.name }}</h1>
          <p class="mt-2 text-slate-500">{{ kiosk()!.location }}</p>

          <dl class="mt-6 grid gap-4 md:grid-cols-2">
            <div class="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3" *ngFor="let item of details()">
              <dt class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{{ item.label }}</dt>
              <dd class="mt-2 text-sm font-medium text-slate-800">{{ item.value }}</dd>
            </div>
          </dl>
        </section>
      }
    </div>
  `,
})
export class KioskDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private kioskService = inject(KioskService);

  kiosk = signal<KioskSummary | null>(null);
  details = signal<Array<{ label: string; value: string }>>([]);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;

    this.kioskService.getKiosk(id).subscribe((kiosk) => {
      this.kiosk.set(kiosk);
      this.details.set(
        kiosk
          ? [
              { label: 'Device ID', value: kiosk.deviceId },
              { label: 'Status', value: kiosk.status },
              { label: 'Organization', value: String(kiosk.orgId) },
              { label: 'Location ID', value: kiosk.orgLocationId ? String(kiosk.orgLocationId) : '--' },
            ]
          : [],
      );
    });
  }
}
