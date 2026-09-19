import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-kiosk-offline-sync',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="rounded-3xl border border-white/10 bg-white/5 p-5 text-white shadow-xl backdrop-blur">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
            Offline Sync
          </p>
          <p class="mt-2 text-sm text-white/80">
            {{ online ? 'Connection active.' : 'Kiosk is offline.' }}
            {{ pendingCount }} {{ pendingCount === 1 ? 'attempt is' : 'attempts are' }}
            waiting to sync.
          </p>
        </div>
        <span
          class="rounded-full px-3 py-1 text-xs font-semibold"
          [ngClass]="online ? 'bg-emerald-500/20 text-emerald-100' : 'bg-amber-500/20 text-amber-100'"
        >
          {{ online ? 'Online' : 'Offline' }}
        </span>
      </div>

      <button
        type="button"
        (click)="sync.emit()"
        [disabled]="!online || syncing || pendingCount === 0"
        class="mt-4 w-full rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ syncing ? 'Syncing...' : 'Sync Pending Attendance' }}
      </button>
    </aside>
  `,
})
export class KioskOfflineSyncComponent {
  @Input() online = true;
  @Input() syncing = false;
  @Input() pendingCount = 0;
  @Output() sync = new EventEmitter<void>();
}
