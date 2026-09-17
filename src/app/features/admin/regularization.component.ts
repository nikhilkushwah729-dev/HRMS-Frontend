import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  RegularizationService,
  RegularizationRequest,
} from '../../core/services/regularization.service';
import { ToastService } from '../../core/services/toast.service';
import { AiEmployeeAssistantService, AiAnomalyResponse } from '../../core/services/ai-employee-assistant.service';
import {
  UiSelectAdvancedComponent,
  SelectOption,
} from '../../core/components/ui/ui-select-advanced.component';

@Component({
  selector: 'app-regularization',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UiSelectAdvancedComponent],
  template: `
    <div class="space-y-6 p-1">
      <section class="app-module-hero">
        <div>
          <p class="app-module-kicker">Attendance Control</p>
          <h1 class="app-module-title">Regularization requests</h1>
          <p class="app-module-text">
            Review missed punches, timing corrections, and attendance exceptions
            from one approval workspace.
          </p>
        </div>

        <div class="app-module-highlight">
          <p
            class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
          >
            Open approvals
          </p>
          <p class="mt-3 text-3xl font-black text-slate-900">
            {{ pendingCount() }}
          </p>
          <p class="mt-2 text-sm text-slate-600">
            Total requests in view: {{ regularizations.length }}
          </p>
        </div>
      </section>

      <div class="flex justify-end">
        <button
          (click)="openModal()"
          class="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clip-rule="evenodd"
            />
          </svg>
          New Request
        </button>
      </div>

      <div class="app-surface-card">
        <div class="flex flex-wrap gap-4">
          <div class="min-w-[200px] flex-1">
            <label class="mb-1 block text-sm font-medium text-slate-700"
              >Status</label
            >
            <app-ui-select-advanced
              [(ngModel)]="filters.status"
              (ngModelChange)="scheduleLoadRegularizations()"
              [options]="statusFilterOptions"
              placeholder="All Status"
              size="sm"
              [searchable]="false"
              [showFooter]="false"
            ></app-ui-select-advanced>
          </div>
          <div class="min-w-[200px] flex-1">
            <label class="mb-1 block text-sm font-medium text-slate-700"
              >Type</label
            >
            <app-ui-select-advanced
              [(ngModel)]="filters.type"
              (ngModelChange)="scheduleLoadRegularizations()"
              [options]="typeFilterOptions"
              placeholder="All Types"
              size="sm"
              [searchable]="false"
              [showFooter]="false"
            ></app-ui-select-advanced>
          </div>
          <div class="min-w-[200px] flex-1">
            <label class="mb-1 block text-sm font-medium text-slate-700"
              >Date From</label
            >
            <input
              type="date"
              [(ngModel)]="filters.startDate"
              (change)="scheduleLoadRegularizations()"
              class="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200"
            />
          </div>
          <div class="min-w-[200px] flex-1">
            <label class="mb-1 block text-sm font-medium text-slate-700"
              >Date To</label
            >
            <input
              type="date"
              [(ngModel)]="filters.endDate"
              (change)="scheduleLoadRegularizations()"
              class="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200"
            />
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="flex items-center justify-center py-16">
        <div
          class="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"
        ></div>
      </div>

      <div *ngIf="!loading" class="app-surface-card overflow-hidden p-0">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50/90">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Date</th>
                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Employee</th>
                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Type</th>
                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Check In</th>
                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Check Out</th>
                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reason</th>
                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr *ngFor="let req of regularizations" class="hover:bg-slate-50/70">
                <td class="whitespace-nowrap px-6 py-4 text-sm text-slate-900">{{ req.regularizationDate | date: 'mediumDate' }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-slate-900">{{ req.employee?.firstName }} {{ req.employee?.lastName }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm">
                  <span class="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">{{ formatType(req.type) }}</span>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{{ req.checkIn || '-' }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{{ req.checkOut || '-' }}</td>
                <td class="max-w-xs truncate px-6 py-4 text-sm text-slate-600">{{ req.reason }}</td>
                <td class="whitespace-nowrap px-6 py-4">
                  <span [class]="getStatusClass(req.status)">{{ req.status | titlecase }}</span>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm">
                  <button *ngIf="req.status === 'pending'" (click)="runAiAudit(req)" class="mr-3 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 border border-purple-200 hover:bg-purple-100 transition">✨ AI Audit</button>
                  <button *ngIf="req.status === 'pending' && isAdmin" (click)="processRequest(req, 'approved')" class="mr-3 font-medium text-green-600 hover:text-green-900">Approve</button>
                  <button *ngIf="req.status === 'pending' && isAdmin" (click)="processRequest(req, 'rejected')" class="font-medium text-red-600 hover:text-red-900">Reject</button>
                </td>
              </tr>
              <tr *ngIf="regularizations.length === 0">
                <td colspan="8" class="px-6 py-14 text-center text-slate-500">No regularization requests found for the selected filters.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="!loading && regularizations.length > 0" class="mt-4 flex items-center justify-between">
        <div class="text-sm text-slate-700">Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, totalItems) }} of {{ totalItems }} entries</div>
        <div class="flex gap-2">
          <button (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1" class="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
          <button (click)="goToPage(currentPage + 1)" [disabled]="currentPage * pageSize >= totalItems" class="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>

    <!-- AI Audit Modal -->
    @if (showAiAuditModal) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
        <div class="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2 text-purple-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              <h3 class="font-bold text-slate-900 text-lg">AI Attendance Anomaly Audit</h3>
            </div>
            <button (click)="closeAiAuditModal()" class="text-slate-400 hover:text-slate-600">✕</button>
          </div>

          @if (aiAuditLoading) {
            <div class="flex flex-col items-center py-8 space-y-3">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
              <p class="text-xs font-semibold text-slate-600">Running AI Geofence & Pattern Audit...</p>
            </div>
          } @else if (aiAuditResult) {
            <div class="space-y-4">
              <div class="flex items-center justify-between rounded-lg p-3" [ngClass]="{
                'bg-emerald-50 border border-emerald-200 text-emerald-800': aiAuditResult.riskLevel === 'low',
                'bg-amber-50 border border-amber-200 text-amber-800': aiAuditResult.riskLevel === 'medium',
                'bg-rose-50 border border-rose-200 text-rose-800': aiAuditResult.riskLevel === 'high'
              }">
                <span class="text-xs font-bold uppercase tracking-wider">Risk Level</span>
                <span class="px-3 py-1 text-xs font-extrabold rounded-full uppercase" [ngClass]="{
                  'bg-emerald-200 text-emerald-900': aiAuditResult.riskLevel === 'low',
                  'bg-amber-200 text-amber-900': aiAuditResult.riskLevel === 'medium',
                  'bg-rose-200 text-rose-900': aiAuditResult.riskLevel === 'high'
                }">{{ aiAuditResult.riskLevel }} Risk</span>
              </div>

              <div>
                <p class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Detected Indicators</p>
                <ul class="space-y-1 text-xs text-slate-700">
                  <li *ngFor="let flag of aiAuditResult.flags" class="flex items-start gap-2">
                    <span class="text-purple-600 font-bold">•</span>
                    <span>{{ flag }}</span>
                  </li>
                </ul>
              </div>

              <div class="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <p class="text-xs font-bold uppercase tracking-wider text-slate-500">AI Recommendation</p>
                <p class="mt-1 text-xs font-semibold text-slate-800">{{ aiAuditResult.recommendation }}</p>
              </div>
            </div>
          }

          <div class="flex justify-end pt-2">
            <button (click)="closeAiAuditModal()" class="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg">Close Audit</button>
          </div>
        </div>
      </div>
    }

    <!-- Create/Edit Regularization Modal -->
    <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div class="w-full max-w-md overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div class="border-b border-slate-200 px-6 py-5">
          <h3 class="text-lg font-semibold text-slate-900">{{ editingId ? 'Update' : 'New' }} Regularization Request</h3>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Date *</label>
              <input type="date" [(ngModel)]="formData.regularizationDate" required class="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Type *</label>
              <app-ui-select-advanced [(ngModel)]="formData.type" [options]="typeFormOptions" [required]="true"></app-ui-select-advanced>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Check In Time</label>
              <input type="time" [(ngModel)]="formData.checkIn" class="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Check Out Time</label>
              <input type="time" [(ngModel)]="formData.checkOut" class="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Reason *</label>
              <textarea [(ngModel)]="formData.reason" rows="3" required class="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200" placeholder="Reason for regularization..."></textarea>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3 bg-slate-50 px-6 py-4">
          <button (click)="closeModal()" class="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Cancel</button>
          <button (click)="saveRegularization()" [disabled]="saving" class="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>
  `,
})
export class RegularizationComponent implements OnInit {
  private regularizationService = inject(RegularizationService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private filterDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  regularizations: RegularizationRequest[] = [];
  loading = false;
  saving = false;
  showModal = false;
  editingId: number | null = null;
  isAdmin = true;
  Math = Math;

  currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  filters = {
    status: '',
    type: '',
    startDate: '',
    endDate: '',
  };

  formData = {
    regularizationDate: '',
    type: 'late_arrival',
    checkIn: '',
    checkOut: '',
    reason: '',
  };

  statusFilterOptions: SelectOption[] = [
    { label: 'All Status', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];

  typeFilterOptions: SelectOption[] = [
    { label: 'All Types', value: '' },
    { label: 'Late Arrival', value: 'late_arrival' },
    { label: 'Early Departure', value: 'early_departure' },
    { label: 'Missed Punch', value: 'missed_punch' },
    { label: 'Overtime', value: 'overtime' },
    { label: 'Other', value: 'other' },
  ];

  typeFormOptions: SelectOption[] = [
    { label: 'Late Arrival', value: 'late_arrival' },
    { label: 'Early Departure', value: 'early_departure' },
    { label: 'Missed Punch', value: 'missed_punch' },
    { label: 'Overtime', value: 'overtime' },
    { label: 'Other', value: 'other' },
  ];

  ngOnInit() {
    const filterType = this.route.snapshot.data['filterType'];
    if (filterType) {
      this.filters.type = filterType;
    }
    this.loadRegularizations();
  }

  scheduleLoadRegularizations() {
    if (this.filterDebounceTimer) {
      clearTimeout(this.filterDebounceTimer);
    }
    this.filterDebounceTimer = setTimeout(() => this.loadRegularizations(), 250);
  }

  pendingCount(): number {
    return this.regularizations.filter((item) => item.status === 'pending')
      .length;
  }

  loadRegularizations() {
    this.loading = true;
    this.regularizationService.getRegularizations().subscribe({
      next: (data) => {
        this.regularizations = this.filterData(data);
        this.totalItems = this.regularizations.length;
        this.loading = false;
      },
      error: () => {
        this.toastService.error('Failed to load regularization requests');
        this.loading = false;
      },
    });
  }

  filterData(data: RegularizationRequest[]): RegularizationRequest[] {
    return data.filter((item) => {
      if (this.filters.status && item.status !== this.filters.status)
        return false;
      if (this.filters.type && item.type !== this.filters.type) return false;
      if (
        this.filters.startDate &&
        item.regularizationDate < this.filters.startDate
      )
        return false;
      if (
        this.filters.endDate &&
        item.regularizationDate > this.filters.endDate
      )
        return false;
      return true;
    });
  }

  openModal() {
    this.editingId = null;
    this.formData = {
      regularizationDate: new Date().toISOString().split('T')[0],
      type: 'late_arrival',
      checkIn: '',
      checkOut: '',
      reason: '',
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveRegularization() {
    if (!this.formData.regularizationDate || !this.formData.reason) {
      this.toastService.error('Please fill all required fields');
      return;
    }

    this.saving = true;
    const request = {
      regularizationDate: this.formData.regularizationDate,
      type: this.formData.type,
      checkIn: this.formData.checkIn || undefined,
      checkOut: this.formData.checkOut || undefined,
      reason: this.formData.reason,
    };

    const operation = this.editingId
      ? this.regularizationService.updateRegularization(this.editingId, request)
      : this.regularizationService.createRegularization(request);

    operation.subscribe({
      next: () => {
        this.toastService.success(
          'Regularization request submitted successfully',
        );
        this.saving = false;
        this.closeModal();
        this.loadRegularizations();
      },
      error: () => {
        this.toastService.error('Failed to submit regularization request');
        this.saving = false;
      },
    });
  }

  processRequest(req: RegularizationRequest, action: 'approved' | 'rejected') {
    const reason =
      action === 'rejected'
        ? prompt('Enter rejection reason:') || undefined
        : undefined;

    this.regularizationService
      .processRegularization(req.id, action, reason)
      .subscribe({
        next: () => {
          this.toastService.success(`Request ${action} successfully`);
          this.loadRegularizations();
        },
        error: () => {
          this.toastService.error(`Failed to ${action} request`);
        },
      });
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadRegularizations();
  }

  formatType(type: string): string {
    const types: Record<string, string> = {
      late_arrival: 'Late Arrival',
      early_departure: 'Early Departure',
      missed_punch: 'Missed Punch',
      overtime: 'Overtime',
      other: 'Other',
    };
    return types[type] || type;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      pending:
        'inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800',
      approved:
        'inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800',
      rejected:
        'inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800',
    };
    return classes[status] || '';
  }

  private aiAssistant = inject(AiEmployeeAssistantService);
  showAiAuditModal = false;
  aiAuditLoading = false;
  aiAuditResult: AiAnomalyResponse['data'] | null = null;

  runAiAudit(req: RegularizationRequest) {
    this.showAiAuditModal = true;
    this.aiAuditLoading = true;
    this.aiAuditResult = null;

    this.aiAssistant
      .detectAttendanceAnomalies({
        checkInTime: req.checkIn,
        checkOutTime: req.checkOut,
        isLate: req.type === 'late_arrival',
        reason: req.reason,
      })
      .subscribe({
        next: (res: any) => {
          this.aiAuditLoading = false;
          if (res.data) {
            this.aiAuditResult = res.data;
          }
        },
        error: () => {
          this.aiAuditLoading = false;
          this.toastService.error('Failed to run AI Audit.');
        },
      });
  }

  closeAiAuditModal() {
    this.showAiAuditModal = false;
    this.aiAuditResult = null;
  }
}
