import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AttendanceLogItem, KioskService } from '../../../../core/services/kiosk.service';

@Component({
  selector: 'app-kiosk-attendance-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto py-8 space-y-6">
      <header class="app-module-hero">
        <p class="app-module-kicker">Kiosk Management</p>
        <h1 class="app-module-title mt-3">Kiosk Attendance Logs</h1>
      </header>

      <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-wrap gap-3">
          <select [(ngModel)]="status" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="suspicious">Suspicious</option>
          </select>
          <select [(ngModel)]="method" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
            <option value="">All Methods</option>
            <option value="face">Face</option>
            <option value="pin">PIN</option>
            <option value="qr">QR</option>
          </select>
          <button
            type="button"
            (click)="load()"
            class="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Apply
          </button>
        </div>
      </div>

      <div class="grid gap-4">
        @for (log of logs(); track log.id) {
          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="text-sm font-semibold text-slate-900">
                  {{ displayEmployee(log) }} · {{ log.type | titlecase }} · {{ log.method | uppercase }}
                </p>
                <p class="mt-2 text-sm text-slate-500">
                  {{ log.timestamp | date: 'medium' }} · {{ log.kiosk?.name || 'Kiosk' }}
                </p>
              </div>
              <span
                class="rounded-full px-3 py-1 text-xs font-semibold"
                [ngClass]="{
                  'bg-emerald-100 text-emerald-700': log.status === 'success',
                  'bg-amber-100 text-amber-700': log.status === 'suspicious',
                  'bg-rose-100 text-rose-700': log.status === 'failed',
                }"
              >
                {{ log.status }}
              </span>
            </div>
            @if (log.failureReason) {
              <p class="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {{ log.failureReason }}
              </p>
            }
          </article>
        } @empty {
          <div class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            No kiosk attendance logs found for the current filters.
          </div>
        }
      </div>
    </div>
  `,
})
export class KioskAttendanceLogsComponent implements OnInit {
  private kioskService = inject(KioskService);

  logs = signal<AttendanceLogItem[]>([]);
  status = '';
  method = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.kioskService
      .getAttendanceLogs({
        status: this.status,
        method: this.method,
      })
      .subscribe((response) => this.logs.set(response.data));
  }

  displayEmployee(log: AttendanceLogItem) {
    const firstName = log.employee?.firstName ?? '';
    const lastName = log.employee?.lastName ?? '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || log.employee?.fullName || 'Unknown employee';
  }
}
