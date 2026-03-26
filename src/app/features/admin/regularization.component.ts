import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RegularizationService, RegularizationRequest } from '../../core/services/regularization.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
    selector: 'app-regularization',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
        <div class="space-y-6 p-1">
            <section class="app-module-hero">
                <div>
                    <p class="app-module-kicker">Attendance Control</p>
                    <h1 class="app-module-title">Regularization requests</h1>
                    <p class="app-module-text">Review missed punches, timing corrections, and attendance exceptions from one approval workspace.</p>
                </div>

                <div class="app-module-highlight">
                    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Open approvals</p>
                    <p class="mt-3 text-3xl font-black text-slate-900">{{ pendingCount() }}</p>
                    <p class="mt-2 text-sm text-slate-600">Total requests in view: {{ regularizations.length }}</p>
                </div>
            </section>

            <div class="flex justify-end">
                <button (click)="openModal()"
                    class="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                    </svg>
                    New Request
                </button>
            </div>

            <div class="app-surface-card">
                <div class="flex flex-wrap gap-4">
                    <div class="min-w-[200px] flex-1">
                        <label class="mb-1 block text-sm font-medium text-slate-700">Status</label>
                        <select [(ngModel)]="filters.status" (change)="loadRegularizations()"
                            class="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200">
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div class="min-w-[200px] flex-1">
                        <label class="mb-1 block text-sm font-medium text-slate-700">Type</label>
                        <select [(ngModel)]="filters.type" (change)="loadRegularizations()"
                            class="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200">
                            <option value="">All Types</option>
                            <option value="late_arrival">Late Arrival</option>
                            <option value="early_departure">Early Departure</option>
                            <option value="missed_punch">Missed Punch</option>
                            <option value="overtime">Overtime</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="min-w-[200px] flex-1">
                        <label class="mb-1 block text-sm font-medium text-slate-700">Date From</label>
                        <input type="date" [(ngModel)]="filters.startDate" (change)="loadRegularizations()"
                            class="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200">
                    </div>
                    <div class="min-w-[200px] flex-1">
                        <label class="mb-1 block text-sm font-medium text-slate-700">Date To</label>
                        <input type="date" [(ngModel)]="filters.endDate" (change)="loadRegularizations()"
                            class="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200">
                    </div>
                </div>
            </div>

            <div *ngIf="loading" class="flex items-center justify-center py-16">
                <div class="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
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
                                <td class="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                                    {{ req.regularizationDate | date:'mediumDate' }}
                                </td>
                                <td class="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                                    {{ req.employee?.firstName }} {{ req.employee?.lastName }}
                                </td>
                                <td class="whitespace-nowrap px-6 py-4 text-sm">
                                    <span class="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                                        {{ formatType(req.type) }}
                                    </span>
                                </td>
                                <td class="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                    {{ req.checkIn || '-' }}
                                </td>
                                <td class="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                    {{ req.checkOut || '-' }}
                                </td>
                                <td class="max-w-xs truncate px-6 py-4 text-sm text-slate-600">
                                    {{ req.reason }}
                                </td>
                                <td class="whitespace-nowrap px-6 py-4">
                                    <span [class]="getStatusClass(req.status)">
                                        {{ req.status | titlecase }}
                                    </span>
                                </td>
                                <td class="whitespace-nowrap px-6 py-4 text-sm">
                                    <button *ngIf="req.status === 'pending' && isAdmin"
                                        (click)="processRequest(req, 'approved')"
                                        class="mr-3 font-medium text-green-600 hover:text-green-900">
                                        Approve
                                    </button>
                                    <button *ngIf="req.status === 'pending' && isAdmin"
                                        (click)="processRequest(req, 'rejected')"
                                        class="font-medium text-red-600 hover:text-red-900">
                                        Reject
                                    </button>
                                </td>
                            </tr>
                            <tr *ngIf="regularizations.length === 0">
                                <td colspan="8" class="px-6 py-14 text-center text-slate-500">
                                    No regularization requests found for the selected filters.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div *ngIf="!loading && regularizations.length > 0" class="mt-4 flex items-center justify-between">
                <div class="text-sm text-slate-700">
                    Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, totalItems) }} of {{ totalItems }} entries
                </div>
                <div class="flex gap-2">
                    <button (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1"
                        class="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                        Previous
                    </button>
                    <button (click)="goToPage(currentPage + 1)" [disabled]="currentPage * pageSize >= totalItems"
                        class="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                        Next
                    </button>
                </div>
            </div>
        </div>

        <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
            <div class="w-full max-w-md overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
                <div class="border-b border-slate-200 px-6 py-5">
                    <h3 class="text-lg font-semibold text-slate-900">
                        {{ editingId ? 'Update' : 'New' }} Regularization Request
                    </h3>
                </div>
                <div class="p-6">
                    <div class="space-y-4">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-slate-700">Date *</label>
                            <input type="date" [(ngModel)]="formData.regularizationDate" required
                                class="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200">
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-slate-700">Type *</label>
                            <select [(ngModel)]="formData.type" required
                                class="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200">
                                <option value="late_arrival">Late Arrival</option>
                                <option value="early_departure">Early Departure</option>
                                <option value="missed_punch">Missed Punch</option>
                                <option value="overtime">Overtime</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-slate-700">Check In Time</label>
                            <input type="time" [(ngModel)]="formData.checkIn"
                                class="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200">
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-slate-700">Check Out Time</label>
                            <input type="time" [(ngModel)]="formData.checkOut"
                                class="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200">
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-slate-700">Reason *</label>
                            <textarea [(ngModel)]="formData.reason" rows="3" required
                                class="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200"
                                placeholder="Explain the reason for regularization..."></textarea>
                        </div>
                    </div>
                </div>
                <div class="flex justify-end gap-3 bg-slate-50 px-6 py-4">
                    <button (click)="closeModal()"
                        class="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                        Cancel
                    </button>
                    <button (click)="saveRegularization()" [disabled]="saving"
                        class="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
                        {{ saving ? 'Saving...' : 'Save' }}
                    </button>
                </div>
            </div>
        </div>
    `
})
export class RegularizationComponent implements OnInit {
    private regularizationService = inject(RegularizationService);
    private toastService = inject(ToastService);

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
        endDate: ''
    };

    formData = {
        regularizationDate: '',
        type: 'late_arrival',
        checkIn: '',
        checkOut: '',
        reason: ''
    };

    ngOnInit() {
        this.loadRegularizations();
    }

    pendingCount(): number {
        return this.regularizations.filter(item => item.status === 'pending').length;
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
            }
        });
    }

    filterData(data: RegularizationRequest[]): RegularizationRequest[] {
        return data.filter(item => {
            if (this.filters.status && item.status !== this.filters.status) return false;
            if (this.filters.type && item.type !== this.filters.type) return false;
            if (this.filters.startDate && item.regularizationDate < this.filters.startDate) return false;
            if (this.filters.endDate && item.regularizationDate > this.filters.endDate) return false;
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
            reason: ''
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
            reason: this.formData.reason
        };

        const operation = this.editingId
            ? this.regularizationService.updateRegularization(this.editingId, request)
            : this.regularizationService.createRegularization(request);

        operation.subscribe({
            next: () => {
                this.toastService.success('Regularization request submitted successfully');
                this.saving = false;
                this.closeModal();
                this.loadRegularizations();
            },
            error: () => {
                this.toastService.error('Failed to submit regularization request');
                this.saving = false;
            }
        });
    }

    processRequest(req: RegularizationRequest, action: 'approved' | 'rejected') {
        const reason = action === 'rejected' ? prompt('Enter rejection reason:') || undefined : undefined;

        this.regularizationService.processRegularization(req.id, action, reason).subscribe({
            next: () => {
                this.toastService.success(`Request ${action} successfully`);
                this.loadRegularizations();
            },
            error: () => {
                this.toastService.error(`Failed to ${action} request`);
            }
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
            other: 'Other'
        };
        return types[type] || type;
    }

    getStatusClass(status: string): string {
        const classes: Record<string, string> = {
            pending: 'inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800',
            approved: 'inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800',
            rejected: 'inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800'
        };
        return classes[status] || '';
    }
}
