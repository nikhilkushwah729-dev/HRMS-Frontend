import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  RegularizationRequest,
  RegularizationService,
} from '../../core/services/regularization.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-my-regularization-requests',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-4 sm:p-5">


      <div class="overflow-hidden rounded-lg border border-slate-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-100">
            <thead class="bg-slate-50/80">
              <tr>
                <th class="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Date</th>
                <th class="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Type</th>
                <th class="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Reason</th>
                <th class="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              @for (item of rows(); track item.id) {
                <tr class="hover:bg-slate-50/70">
                  <td class="px-5 py-4 text-sm text-slate-700">{{ formatDate(item.regularizationDate) }}</td>
                  <td class="px-5 py-4 text-sm font-semibold text-slate-900">{{ formatType(item.type) }}</td>
                  <td class="px-5 py-4 text-sm text-slate-600">{{ item.reason }}</td>
                  <td class="px-5 py-4"><span [class]="statusClass(item.status)">{{ item.status }}</span></td>
                </tr>
              }
              @if (rows().length === 0) {
                <tr>
                  <td colspan="4" class="px-5 py-12 text-center text-sm text-slate-500">No requests found for this category.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class MyRegularizationRequestsComponent implements OnInit {
  private readonly regularizationService = inject(RegularizationService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly items = signal<RegularizationRequest[]>([]);
  readonly title = signal('Regularization Requests');
  readonly subtitle = signal(
    'Your attendance correction requests, exactly separated from admin approval queues.',
  );
  readonly ctaLabel = signal('New Request');
  readonly ctaRoute = signal('/self-service/attendance');
  readonly requestType = signal('');

  private readonly currentEmployeeId = Number(
    this.authService.getStoredUser()?.employeeId ??
      this.authService.getStoredUser()?.id ??
      0,
  );

  readonly rows = computed(() =>
    [...this.items()]
      .filter((item) => item.employeeId === this.currentEmployeeId)
      .filter((item) =>
        this.requestType() ? item.type === this.requestType() : true,
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  );

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    this.title.set(data['title'] || 'Regularization Requests');
    this.subtitle.set(
      data['subtitle'] ||
        'Your attendance correction requests, exactly separated from admin approval queues.',
    );
    this.ctaLabel.set(data['ctaLabel'] || 'New Request');
    this.ctaRoute.set(data['ctaRoute'] || '/self-service/attendance');
    this.requestType.set(data['requestType'] || '');

    this.regularizationService.getRegularizations().subscribe({
      next: (data) => this.items.set(data),
      error: () => this.items.set([]),
    });
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  statusClass(status: string): string {
    const base =
      'inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ';

    switch (status) {
      case 'approved':
        return `${base} bg-emerald-100 text-emerald-700`;
      case 'rejected':
        return `${base} bg-rose-100 text-rose-700`;
      default:
        return `${base} bg-amber-100 text-amber-700`;
    }
  }
}
