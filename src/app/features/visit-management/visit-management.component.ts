import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { VisitDashboardResponse, VisitManagementService, VisitRecord, VisitReferencesResponse, VisitStatus } from '../../core/services/visit-management.service';
import { CustomModalComponent } from '../../core/components/modal/custom-modal.component';

@Component({
  selector: 'app-visit-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, CustomModalComponent],
  template: `
    <div class="mx-auto max-w-7xl space-y-6">
      <section class="app-module-hero">
        <div class="space-y-4">
          <p class="app-module-kicker">Visit Operations</p>
          <h1 class="app-module-title">Visit Management Control Center</h1>
          <p class="app-module-text max-w-3xl">Schedule visits, manage client and visitor masters, run approvals, capture GPS check-in/out, log notes, track follow-ups, and review analytics from one unified workspace.</p>
          <div class="flex flex-wrap gap-3">
            <button type="button" (click)="downloadReport('csv')" class="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">Export CSV</button>
            <button type="button" (click)="downloadReport('json')" class="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Export JSON</button>
          </div>
        </div>
        <div class="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div class="app-stat-card">
            <p class="app-stat-label">Total Visits</p>
            <p class="app-stat-value mt-2">{{ summary().total }}</p>
          </div>
          <div class="app-stat-card">
            <p class="app-stat-label text-amber-600">Pending</p>
            <p class="app-stat-value mt-2">{{ summary().pendingApproval }}</p>
          </div>
          <div class="app-stat-card">
            <p class="app-stat-label text-blue-600">In Progress</p>
            <p class="app-stat-value mt-2">{{ summary().inProgress }}</p>
          </div>
          <div class="app-stat-card">
            <p class="app-stat-label text-rose-600">Overdue</p>
            <p class="app-stat-value mt-2">{{ summary().overdueFollowUps }}</p>
          </div>
        </div>
      </section>

      <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article class="app-stat-card border-l-4 border-l-teal-500">
          <p class="app-stat-label">Today's Visits</p>
          <p class="app-stat-value mt-2">{{ summary().todaysVisits }}</p>
          <p class="mt-2 text-xs font-medium text-slate-400">Scheduled for today</p>
        </article>
        <article class="app-stat-card border-l-4 border-l-amber-500">
          <p class="app-stat-label">Reminders</p>
          <p class="app-stat-value mt-2">{{ summary().upcomingReminders }}</p>
          <p class="mt-2 text-xs font-medium text-slate-400">Upcoming prompts</p>
        </article>
        <article class="app-stat-card border-l-4 border-l-emerald-500">
          <p class="app-stat-label">Completed</p>
          <p class="app-stat-value mt-2">{{ summary().completed }}</p>
          <p class="mt-2 text-xs font-medium text-slate-400">Successfully closed</p>
        </article>
        <article class="app-stat-card border-l-4 border-l-violet-500">
          <p class="app-stat-label">Average Time</p>
          <p class="app-stat-value mt-2">{{ reports().summary?.averageVisitHours || 0 }}h</p>
          <p class="mt-2 text-xs font-medium text-slate-400">Avg. visit duration</p>
        </article>
      </section>

      <div class="grid gap-8 lg:grid-cols-[380px_1fr] xl:gap-10">
        <section class="space-y-6">
          <article class="app-glass-card overflow-hidden rounded-xl border-none shadow-2xl">
            <div class="bg-slate-900/5 px-6 py-6">
              <p class="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">{{ editingVisitId() ? 'Update Entry' : 'New Entry' }}</p>
              <h2 class="mt-2 text-2xl font-black text-slate-900">Visit Planner</h2>
            </div>
            <form [formGroup]="visitForm" (ngSubmit)="saveVisit()" class="space-y-5 px-6 py-8">
              <div class="space-y-1.5">
                <label class="app-field-label ml-1">Title</label>
                <input formControlName="title" class="app-field" placeholder="e.g. QBR Review">
              </div>
              <div class="space-y-1.5">
                <label class="app-field-label ml-1">Purpose</label>
                <textarea formControlName="purpose" rows="3" class="app-field resize-none" placeholder="Primary objectives..."></textarea>
              </div>
                <div class="grid gap-4">
                  <div class="space-y-1.5">
                    <label class="app-field-label ml-1">Client</label>
                    <select formControlName="clientId" class="app-field">
                      <option [ngValue]="null">Select client</option>
                      @for (client of references().clients; track client.id) {
                        <option [ngValue]="client.id">{{ client.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="space-y-1.5">
                    <label class="app-field-label ml-1">Visitor</label>
                    <select formControlName="visitorId" class="app-field">
                      <option [ngValue]="null">Select visitor</option>
                      @for (visitor of references().visitors; track visitor.id) {
                        <option [ngValue]="visitor.id">{{ visitor.fullName }}</option>
                      }
                    </select>
                  </div>
                </div>
                <div class="grid gap-4">
                  <div class="space-y-1.5">
                    <label class="app-field-label ml-1">Host</label>
                    <select formControlName="hostEmployeeId" class="app-field">
                      <option [ngValue]="null">Select host</option>
                      @for (employee of references().employees; track employee.id) {
                        <option [ngValue]="employee.id">{{ employee.fullName }}</option>
                      }
                    </select>
                  </div>
                  <div class="space-y-1.5">
                    <label class="app-field-label ml-1">Approver</label>
                    <select formControlName="approverEmployeeId" class="app-field">
                      <option [ngValue]="null">Select approver</option>
                      @for (employee of references().employees; track employee.id) {
                        <option [ngValue]="employee.id">{{ employee.fullName }}</option>
                      }
                    </select>
                  </div>
                </div>
                <div class="grid gap-4">
                  <div class="space-y-1.5">
                    <label class="app-field-label ml-1">Schedule Start</label>
                    <input type="datetime-local" formControlName="scheduledStart" class="app-field">
                  </div>
                  <div class="space-y-1.5">
                    <label class="app-field-label ml-1">Schedule End</label>
                    <input type="datetime-local" formControlName="scheduledEnd" class="app-field">
                  </div>
                </div>
              <div class="space-y-1.5">
                <label class="app-field-label ml-1">Location</label>
                <input formControlName="locationName" class="app-field" placeholder="Meeting room or address">
              </div>
              <div class="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                <input type="checkbox" formControlName="requiresApproval" class="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500">
                <span class="text-sm font-bold text-slate-700">Requires formal approval</span>
              </div>
              <div class="grid gap-3 pt-2">
                <button type="submit" [disabled]="visitForm.invalid || savingVisit()" class="flex h-12 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white transition hover:-translate-y-px hover:bg-slate-800 disabled:opacity-50">
                  {{ savingVisit() ? 'Processing...' : editingVisitId() ? 'Update Schedule' : 'Schedule Visit' }}
                </button>
                <button type="button" (click)="resetVisitForm()" class="flex h-12 items-center justify-center rounded-xl border border-slate-200 text-sm font-bold text-slate-500 transition hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </article>

          <article class="app-surface-card overflow-hidden !rounded-xl p-0">
            <div class="border-b border-slate-100 bg-slate-50/30 px-6 py-5">
              <p class="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Directory</p>
              <h2 class="mt-2 text-xl font-black text-slate-900">Registry</h2>
            </div>
            <div class="space-y-6 px-6 py-8">
              <form [formGroup]="clientForm" (ngSubmit)="saveClient()" class="space-y-4">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-black uppercase text-slate-900">{{ editingClientId() ? 'Update Client' : 'Add Client' }}</p>
                  @if (editingClientId()) {
                    <button type="button" (click)="resetClientForm()" class="text-[10px] font-bold uppercase text-rose-500">Cancel</button>
                  }
                </div>
                <div class="grid gap-3">
                  <input formControlName="name" class="app-field !py-2" placeholder="Client name">
                  <input formControlName="contactPerson" class="app-field !py-2" placeholder="Contact person">
                </div>
                <button type="submit" class="w-full rounded-lg border border-slate-200 bg-white py-2 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:bg-slate-50">Register Client</button>
              </form>
              <form [formGroup]="visitorForm" (ngSubmit)="saveVisitor()" class="space-y-4 border-t border-slate-100 pt-6">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-black uppercase text-slate-900">{{ editingVisitorId() ? 'Update Visitor' : 'Add Visitor' }}</p>
                  @if (editingVisitorId()) {
                    <button type="button" (click)="resetVisitorForm()" class="text-[10px] font-bold uppercase text-rose-500">Cancel</button>
                  }
                </div>
                <input formControlName="fullName" class="app-field !py-2" placeholder="Visitor full name">
                <div class="grid gap-3">
                  <select formControlName="clientId" class="app-field !py-2">
                    <option [ngValue]="null">Link client</option>
                    @for (client of references().clients; track client.id) {
                      <option [ngValue]="client.id">{{ client.name }}</option>
                    }
                  </select>
                  <input formControlName="phone" class="app-field !py-2" placeholder="Phone number">
                </div>
                <button type="submit" class="w-full rounded-lg border border-slate-200 bg-white py-2 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:bg-slate-50">Register Visitor</button>
              </form>
              <div class="grid gap-6 border-t border-slate-100 pt-6">
                <div class="space-y-3">
                  <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Recent Clients</p>
                  <div class="grid gap-2">
                    @for (client of references().clients.slice(0, 4); track client.id) {
                      <button type="button" (click)="editClient(client.id)" class="group flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition hover:border-teal-200 hover:bg-teal-50/30">
                        <span class="min-w-0 pr-2 text-left">
                          <span class="block truncate text-sm font-bold text-slate-800 transition group-hover:text-teal-900">{{ client.name }}</span>
                          <span class="block truncate text-[10px] text-slate-400">{{ client.contactPerson || 'General Inquiry' }}</span>
                        </span>
                        <span class="text-[10px] font-black uppercase text-slate-400 group-hover:text-teal-600">Modify</span>
                      </button>
                    }
                  </div>
                </div>
                <div class="space-y-3">
                  <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Recent Visitors</p>
                  <div class="grid gap-2">
                    @for (visitor of references().visitors.slice(0, 4); track visitor.id) {
                      <button type="button" (click)="editVisitor(visitor.id)" class="group flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition hover:border-violet-200 hover:bg-violet-50/30">
                        <span class="min-w-0 pr-2 text-left">
                          <span class="block truncate text-sm font-bold text-slate-800 transition group-hover:text-violet-900">{{ visitor.fullName }}</span>
                          <span class="block truncate text-[10px] text-slate-400">{{ linkedClientName(visitor.clientId) }}</span>
                        </span>
                        <span class="text-[10px] font-black uppercase text-slate-400 group-hover:text-violet-600">Modify</span>
                      </button>
                    }
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section class="space-y-6">
          <article class="app-surface-card overflow-hidden !rounded-xl p-0 shadow-sm transition hover:shadow-md">
            <div class="border-b border-slate-100 bg-slate-50/20 px-6 py-6 font-primary">
               <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Reports Snapshot</p>
               <h2 class="mt-2 text-2xl font-black tracking-tight text-slate-900">Operations Analytics</h2>
            </div>
            <div class="grid gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-10 grid-cols-1 sm:grid-cols-3">
              <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Total visits</p>
                <div class="mt-3 flex items-end justify-between">
                  <p class="text-4xl font-black tracking-tighter text-slate-900 md:text-5xl">{{ reports().summary?.totalVisits || 0 }}</p>
                  <div class="mb-1 h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                  </div>
                </div>
              </div>
              <div class="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/50 to-white p-6 shadow-sm transition hover:shadow-md">
                <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600">Successfully closed</p>
                <div class="mt-3 flex items-end justify-between">
                  <p class="text-4xl font-black tracking-tighter text-teal-900 md:text-5xl">{{ reports().summary?.completedVisits || 0 }}</p>
                  <div class="mb-1 h-10 w-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                  </div>
                </div>
              </div>
              <div class="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/50 to-white p-6 shadow-sm transition hover:shadow-md">
                <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Pending approval</p>
                <div class="mt-3 flex items-end justify-between">
                  <p class="text-4xl font-black tracking-tighter text-amber-900 md:text-5xl">{{ reports().summary?.approvalPending || 0 }}</p>
                  <div class="mb-1 h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                </div>
              </div>
            </div>
            <div class="grid gap-8 px-6 py-10 sm:grid-cols-2">
              <div class="space-y-4">
                <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">By Status</p>
                <div class="grid gap-2">
                  @for (item of dashboard().statusBreakdown; track item.status) {
                    <div class="flex items-center justify-between min-w-0 rounded-xl bg-slate-50 p-4 transition hover:bg-white hover:shadow-sm">
                      <span class="truncate text-sm font-bold text-slate-700">{{ statusLabel(item.status) }}</span>
                      <span class="ml-3 flex-shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-black text-slate-900 shadow-sm">{{ item.count }}</span>
                    </div>
                  }
                </div>
              </div>
              <div class="space-y-4 border-t border-slate-100 pt-8 sm:border-t-0 sm:pt-0">
                <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Top Clients</p>
                <div class="grid gap-2">
                  @for (item of reportClients(); track item.clientName) {
                    <div class="flex items-center justify-between min-w-0 rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50">
                      <span class="truncate text-sm font-bold text-slate-700">{{ item.clientName }}</span>
                      <span class="ml-3 flex-shrink-0 text-xs font-black text-slate-900">{{ item.count }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </article>

          <article class="app-surface-card overflow-hidden p-0">
            <div class="border-b border-slate-100 bg-slate-50/20 px-6 py-6 font-primary">
              <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div class="min-w-0">
                  <p class="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Visit Pipeline</p>
                  <h2 class="mt-2 truncate text-2xl font-black text-slate-900">Operations Control</h2>
                </div>
                <div class="flex w-full flex-1 items-center gap-3 lg:max-w-xl">
                  <div class="relative flex-1 min-w-0">
                    <input [value]="visitSearch()" (input)="visitSearch.set(($any($event.target)).value)" class="app-field !pr-10" placeholder="Search visits, visitors, clients...">
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </span>
                  </div>
                  <select [value]="filterStatus()" (change)="filterStatus.set(($any($event.target)).value)" class="app-field w-auto min-w-[120px]">
                    <option value="">All Status</option>
                    @for (status of statuses; track status) {
                      <option [value]="status">{{ statusLabel(status) }}</option>
                    }
                  </select>
                </div>
              </div>
            </div>
            <div class="divide-y divide-slate-100">
              @for (visit of filteredVisits(); track visit.id) {
                <div [ngClass]="{ 'bg-teal-50/30': selectedVisitId() === visit.id }" class="group relative flex flex-col gap-5 px-6 py-6 transition-all hover:bg-slate-50 xl:flex-row xl:items-center xl:justify-between">
                  <div class="absolute left-0 top-0 h-full w-1 origin-left scale-y-0 bg-teal-500 transition-transform group-hover:scale-y-100" [class.scale-y-100]="selectedVisitId() === visit.id"></div>
                  <div class="flex flex-1 items-start gap-4">
                    <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl font-bold bg-slate-100 text-slate-500">
                      {{ visit.visitor?.fullName?.charAt(0) || 'V' }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-3">
                        <button type="button" (click)="openVisit(visit.id)" class="text-left text-lg font-black text-slate-900 hover:text-teal-600">{{ visit.title }}</button>
                        <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider" [ngClass]="statusClass(visit.status)">
                          {{ statusLabel(visit.status) }}
                        </span>
                      </div>
                      <p class="mt-1 text-sm font-medium text-slate-500">
                        <span class="text-slate-900">{{ visit.visitor?.fullName || 'Untitled Visitor' }}</span>
                        <span class="mx-2 opacity-30 text-slate-400">|</span>
                        <span>{{ visit.client?.name || 'In-House' }}</span>
                        <span class="mx-2 opacity-30 text-slate-400">|</span>
                        <span class="font-bold">{{ visit.scheduledStart | date:'dd MMM, hh:mm a' }}</span>
                      </p>
                    </div>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 self-end xl:self-center">
                    <button type="button" (click)="editVisit(visit)" class="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 transition hover:bg-white hover:shadow-sm">Modify</button>
                    @if (canApprove() && visit.status === 'pending_approval') {
                      <div class="flex flex-wrap gap-2 rounded-lg bg-teal-50/50 p-1">
                         <button type="button" (click)="reviewVisit(visit.id, 'approve')" class="rounded-md bg-emerald-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-emerald-700">Approve</button>
                         <button type="button" (click)="reviewVisit(visit.id, 'reject')" class="rounded-md bg-rose-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-rose-700">Reject</button>
                      </div>
                    }
                    @if (visit.status === 'planned') {
                      <button type="button" (click)="submitCheckAction(visit.id, 'checkIn')" class="rounded-lg bg-sky-600 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-sky-700 hover:shadow-lg hover:shadow-sky-500/20">Initiate</button>
                    }
                    @if (visit.status === 'in_progress') {
                      <button type="button" (click)="submitCheckAction(visit.id, 'checkOut')" class="rounded-lg bg-amber-600 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-amber-700 hover:shadow-lg hover:shadow-amber-500/20">Complete</button>
                    }
                    <button type="button" (click)="openPass(visit)" class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-white hover:text-indigo-600 hover:shadow-sm" title="Generate Gate Pass">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="px-6 py-14 text-center text-slate-500">No visits matched the current filters.</div>
              }
            </div>
          </article>

          <div class="grid gap-6 sm:grid-cols-2">
            <article class="app-surface-card overflow-hidden !rounded-xl p-0">
              <div class="border-b border-slate-100 bg-slate-50/20 px-6 py-5">
                <p class="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Queue Management</p>
                <h2 class="mt-2 text-xl font-black text-slate-900">Upcoming Queue</h2>
              </div>
              <div class="divide-y divide-slate-100">
                @for (item of dashboard().upcomingVisits; track item.id) {
                  <div class="flex items-center gap-4 px-6 py-5 transition hover:bg-slate-50">
                    <div class="h-2 w-2 rounded-full" [ngClass]="statusClass(item.status)"></div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-bold text-slate-900">{{ item.title }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ item.scheduledStart | date:'dd MMM, hh:mm a' }}</p>
                    </div>
                    <span class="text-[10px] font-black uppercase text-slate-400">{{ statusLabel(item.status) }}</span>
                  </div>
                } @empty {
                  <div class="py-12 text-center text-sm font-bold text-slate-300">No entries in upcoming queue</div>
                }
              </div>
            </article>

            <article class="app-surface-card overflow-hidden !rounded-xl p-0">
              <div class="border-b border-slate-100 bg-slate-50/20 px-6 py-5">
                <p class="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Operational Log</p>
                <h2 class="mt-2 text-xl font-black text-slate-900">Recent Activity</h2>
              </div>
              <div class="divide-y divide-slate-100">
                @for (activity of dashboard().recentActivity; track activity.visitId + '-' + activity.createdAt) {
                  <div class="px-6 py-5 transition hover:bg-slate-50">
                    <div class="flex items-center justify-between">
                      <p class="truncate text-sm font-bold text-slate-900">{{ activity.visitTitle }}</p>
                      <span class="text-[9px] font-black uppercase text-teal-600">{{ statusLabel(activity.noteType) }}</span>
                    </div>
                    <p class="mt-1.5 line-clamp-2 text-xs text-slate-500">{{ activity.content }}</p>
                    <div class="mt-3 flex items-center justify-between">
                       <span class="text-[10px] font-bold text-slate-400">{{ activity.employee?.name || 'System' }}</span>
                       <span class="text-[10px] text-slate-400">{{ activity.createdAt | date:'dd MMM, HH:mm' }}</span>
                    </div>
                  </div>
                } @empty {
                  <div class="py-12 text-center text-sm font-bold text-slate-300">No recent activity detected</div>
                }
              </div>
            </article>
          </div>

          <article class="app-glass-card overflow-hidden !rounded-xl border-none shadow-2xl">
            <div class="bg-indigo-900/5 px-6 py-6 font-primary">
              <div class="flex items-center justify-between">
                <div class="min-w-0">
                  <p class="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-400">Context Explorer</p>
                  <h2 class="mt-2 text-2xl font-black text-slate-900">{{ selectedVisit()?.title || 'Details & Activity' }}</h2>
                </div>
                @if (selectedVisit()) {
                  <span class="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-black uppercase text-indigo-600">{{ selectedVisit()?.status }}</span>
                }
              </div>
            </div>
            <div class="space-y-8 px-6 py-8">
              @if (selectedVisit()) {
                <div class="grid gap-8 lg:grid-cols-2">
                  <div class="space-y-6">
                    <div class="rounded-xl border border-indigo-100 bg-indigo-50/20 p-5">
                      <p class="text-sm leading-relaxed text-slate-600">{{ selectedVisit()!.purpose }}</p>
                      <div class="mt-6 flex flex-wrap gap-4 border-t border-indigo-100 pt-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <div class="flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>Host: {{ selectedVisit()!.host?.name || 'Unassigned' }}</div>
                        <div class="flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>In: {{ gpsLabel(selectedVisit()!.gps?.checkIn) }}</div>
                        <div class="flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span>Out: {{ gpsLabel(selectedVisit()!.gps?.checkOut) }}</div>
                      </div>
                    </div>

                    <div class="space-y-5">
                      <p class="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Timeline Highlights</p>
                      <div class="grid gap-3">
                        @for (note of selectedVisit()!.notes.slice(0, 3); track note.id) {
                          <div class="group relative rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-indigo-200">
                            <div class="flex items-center justify-between">
                              <span class="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-black uppercase text-slate-600">{{ note.noteType }}</span>
                              <span class="text-[10px] text-slate-400">{{ note.createdAt | date:'HH:mm, dd MMM' }}</span>
                            </div>
                            <p class="mt-2 text-sm text-slate-700">{{ note.content }}</p>
                          </div>
                        }
                      </div>
                    </div>
                  </div>

                  <div class="space-y-6">
                    <form [formGroup]="noteForm" (ngSubmit)="saveNote()" class="space-y-4 rounded-xl border border-slate-100 bg-slate-50/30 p-6">
                      <p class="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Direct Action & Logging</p>
                      <div class="grid gap-4">
                        <select formControlName="noteType" class="app-field !py-2">
                          <option value="general">General Note</option>
                          <option value="planning">Planning Details</option>
                          <option value="follow_up">Follow Up Log</option>
                        </select>
                        <textarea formControlName="content" rows="4" class="app-field !py-3 resize-none bg-white" placeholder="Capture key insights or field observations..."></textarea>
                        <div class="flex gap-3">
                          <input type="file" (change)="captureNoteImageFile($event)" class="hidden" #noteFileInput>
                          <button type="button" (click)="noteFileInput.click()" class="flex h-11 flex-1 items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-600 transition hover:bg-white">Attach Proof</button>
                          <button type="submit" class="h-11 flex-[2] rounded-lg bg-slate-900 text-sm font-bold text-white transition hover:bg-slate-800">Add Log Entry</button>
                        </div>
                        <button type="button" (click)="openPass(selectedVisit()!)" class="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-indigo-100 bg-white text-sm font-bold text-indigo-600 transition hover:bg-indigo-50">
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                          Print Gate Pass
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              } @else {
                <div class="py-20 text-center">
                  <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-200">
                    <svg class="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </div>
                  <p class="mt-6 text-sm font-bold text-slate-400">Select an active visit for granular context and execution logging.</p>
                </div>
              }
            </div>
          </article>

          <div class="grid gap-6 xl:grid-cols-2">
            <article class="app-surface-card overflow-hidden !rounded-xl p-0">
              <div class="border-b border-slate-100 bg-slate-50/20 px-6 py-5">
                <p class="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Queue Management</p>
                <h2 class="mt-2 text-xl font-black text-slate-900">Upcoming Queue</h2>
              </div>
              <div class="divide-y divide-slate-100">
                @for (item of dashboard().upcomingVisits; track item.id) {
                  <div class="flex items-center gap-4 px-6 py-5 transition hover:bg-slate-50">
                    <div class="h-2 w-2 rounded-full" [ngClass]="statusClass(item.status)"></div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-bold text-slate-900">{{ item.title }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ item.scheduledStart | date:'dd MMM, hh:mm a' }}</p>
                    </div>
                    <span class="text-[10px] font-black uppercase text-slate-400">{{ statusLabel(item.status) }}</span>
                  </div>
                } @empty {
                  <div class="py-12 text-center text-sm font-bold text-slate-300">No entries in upcoming queue</div>
                }
              </div>
            </article>

            <article class="app-surface-card overflow-hidden !rounded-xl p-0">
              <div class="border-b border-slate-100 bg-slate-50/20 px-6 py-5">
                <p class="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Operational Log</p>
                <h2 class="mt-2 text-xl font-black text-slate-900">Recent Activity</h2>
              </div>
              <div class="divide-y divide-slate-100">
                @for (activity of dashboard().recentActivity; track activity.visitId + '-' + activity.createdAt) {
                  <div class="px-6 py-5 transition hover:bg-slate-50">
                    <div class="flex items-center justify-between">
                      <p class="truncate text-sm font-bold text-slate-900">{{ activity.visitTitle }}</p>
                      <span class="text-[9px] font-black uppercase text-teal-600">{{ statusLabel(activity.noteType) }}</span>
                    </div>
                    <p class="mt-1.5 line-clamp-2 text-xs text-slate-500">{{ activity.content }}</p>
                    <div class="mt-3 flex items-center justify-between">
                       <span class="text-[10px] font-bold text-slate-400">{{ activity.employee?.name || 'System' }}</span>
                       <span class="text-[10px] text-slate-400">{{ activity.createdAt | date:'dd MMM, HH:mm' }}</span>
                    </div>
                  </div>
                } @empty {
                  <div class="py-12 text-center text-sm font-bold text-slate-300">No recent activity detected</div>
                }
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>

    <!-- Digital Gate Pass Modal -->
    <app-custom-modal [openModal]="showPassModal()" (closeModal)="showPassModal.set(false)" maxWidth="max-w-xl">
      <div id="gate-pass-printable" class="relative overflow-hidden rounded-3xl bg-white p-0 shadow-2xl border border-slate-200">
        <!-- Top Security Strip -->
        <div class="h-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
        
        <div class="px-8 py-10">
          <!-- Branded Header -->
          <div class="flex items-center justify-between font-primary">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </div>
              <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Visitor Entry Authorization</p>
            </div>
            <div class="text-right">
              <p class="text-[10px] font-bold uppercase text-slate-400">Pass ID</p>
              <p class="text-sm font-black text-slate-900">#VP-{{ passVisit()?.id || '0000' }}</p>
            </div>
          </div>

          <!-- Main Content -->
          <div class="mt-12 text-center font-primary">
            <div class="relative mx-auto h-32 w-32 overflow-hidden rounded-3xl bg-slate-100 border-4 border-white shadow-xl">
               <!-- Placeholder for visitor photo -->
               <div class="flex h-full w-full items-center justify-center text-4xl font-black text-slate-300">
                 {{ passVisit()?.visitor?.fullName?.charAt(0) || 'V' }}
               </div>
            </div>
            <h3 class="mt-6 text-3xl font-black tracking-tight text-slate-900">{{ passVisit()?.visitor?.fullName || 'Guest Visitor' }}</h3>
            <p class="text-xs font-bold text-indigo-600 uppercase tracking-[0.2em]">{{ passVisit()?.client?.name || 'In-House Authorized' }}</p>
            
            <div class="mt-8 inline-flex items-center rounded-full bg-emerald-50 px-6 py-2 border border-emerald-100">
              <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="ml-3 text-[10px] font-black uppercase tracking-widest text-emerald-600">Entry Authorized</span>
            </div>
          </div>

          <!-- Pass Details Grid -->
          <div class="mt-12 grid grid-cols-2 gap-y-8 border-t border-dashed border-slate-200 pt-10 font-primary">
            <div class="text-left">
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Host Contact</p>
              <p class="mt-1 text-sm font-black text-slate-800">{{ passVisit()?.host?.name || 'Reception Hub' }}</p>
            </div>
            <div class="text-left">
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Valid From</p>
              <p class="mt-1 text-sm font-black text-slate-800">{{ passVisit()?.scheduledStart | date:'HH:mm, dd MMM' }}</p>
            </div>
            <div class="text-left">
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Authorized Purpose</p>
              <p class="mt-1 text-sm font-bold text-slate-600 truncate pr-4">{{ passVisit()?.title || 'Operational Support' }}</p>
            </div>
            <div class="flex items-center justify-end pr-4">
               <!-- QR Placeholder -->
               <div class="h-20 w-20 bg-slate-900 rounded-xl p-3 shadow-2xl">
                  <div class="h-full w-full border-2 border-white/30 border-dashed rounded-md"></div>
               </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-12 flex gap-4 no-print font-primary">
            <button type="button" (click)="printPass()" class="flex-1 rounded-2xl bg-indigo-600 py-4 text-sm font-black text-white shadow-xl shadow-indigo-200 transition hover:bg-emerald-600 active:scale-95">Print Physical Pass</button>
            <button type="button" (click)="showPassModal.set(false)" class="flex-1 rounded-2xl border-2 border-slate-100 bg-white py-4 text-sm font-black text-slate-600 transition hover:bg-slate-50 active:scale-95">Dismiss</button>
          </div>
        </div>
        
        <!-- Bottom Pattern -->
        <div class="h-3 bg-[radial-gradient(circle,theme(colors.slate.200)_1px,transparent_1px)] bg-[length:12px_12px]"></div>
      </div>
    </app-custom-modal>
  `,
})
export class VisitManagementComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly visitService = inject(VisitManagementService);

  readonly statuses: VisitStatus[] = ['pending_approval', 'planned', 'in_progress', 'completed', 'rejected'];
  summary = computed(() => this.dashboard().summary);
  dashboard = signal<VisitDashboardResponse>({
    summary: { total: 0, planned: 0, inProgress: 0, completed: 0, pendingApproval: 0, todaysVisits: 0, overdueFollowUps: 0, upcomingReminders: 0 },
    statusBreakdown: [],
    hostBreakdown: [],
    upcomingVisits: [],
    dueFollowUps: [],
    recentActivity: [],
  });
  references = signal<VisitReferencesResponse>({ role: { name: 'Employee' }, clients: [], visitors: [], employees: [] });
  visits = signal<VisitRecord[]>([]);
  reports = signal<any>({ summary: {}, byClient: [], visits: [] });
  reportClients = computed(() => (Array.isArray(this.reports().byClient) ? this.reports().byClient : []));

  visitSearch = signal('');
  filterStatus = signal('');
  savingVisit = signal(false);
  editingVisitId = signal<number | null>(null);
  editingClientId = signal<number | null>(null);
  editingVisitorId = signal<number | null>(null);
  selectedVisitId = signal<number | null>(null);
  showPassModal = signal(false);
  passVisit = signal<VisitRecord | null>(null);
  private visitPhotoBase64 = signal<string | null>(null);
  private notePhotoBase64 = signal<string | null>(null);

  visitForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    purpose: ['', [Validators.required, Validators.minLength(3)]],
    clientId: [null as number | null],
    visitorId: [null as number | null],
    hostEmployeeId: [null as number | null],
    approverEmployeeId: [null as number | null],
    scheduledStart: ['', Validators.required],
    scheduledEnd: [''],
    reminderAt: [''],
    locationName: [''],
    attachmentUrlsText: [''],
    requiresApproval: [true],
  });
  clientForm = this.fb.nonNullable.group({ name: ['', Validators.required], contactPerson: [''] });
  visitorForm = this.fb.nonNullable.group({ fullName: ['', Validators.required], clientId: [null as number | null], phone: [''] });
  noteForm = this.fb.nonNullable.group({ noteType: ['general'], content: ['', Validators.required], attachmentUrlsText: [''] });
  followUpForm = this.fb.nonNullable.group({ title: ['', Validators.required], description: [''], assignedTo: [null as number | null], priority: ['medium'], dueAt: [''] });

  filteredVisits = computed(() => {
    const query = this.visitSearch().trim().toLowerCase();
    const status = this.filterStatus();
    return this.visits().filter((visit: VisitRecord) => {
      const matchesStatus = !status || visit.status === status;
      const matchesSearch = !query || JSON.stringify({ title: visit.title, purpose: visit.purpose, visitor: visit.visitor?.fullName, client: visit.client?.name }).toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  });
  selectedVisit = computed(() => this.visits().find((visit: VisitRecord) => visit.id === this.selectedVisitId()) ?? null);

  ngOnInit(): void {
    this.refreshAll();
  }

  refreshAll(): void {
    this.visitService.getDashboard().subscribe({ next: (data: VisitDashboardResponse) => this.dashboard.set(data) });
    this.visitService.getReferences().subscribe({ next: (data: VisitReferencesResponse) => this.references.set(data) });
    this.visitService.getVisits().subscribe({ next: (data: VisitRecord[]) => { this.visits.set(data); if (!this.selectedVisitId() && data.length) this.selectedVisitId.set(data[0].id); } });
    this.visitService.getReports().subscribe({ next: (data: any) => this.reports.set(data) });
  }

  saveVisit(): void {
    if (this.visitForm.invalid) return;
    const value = this.visitForm.getRawValue();
    const payload = {
      ...value,
      scheduledStart: new Date(value.scheduledStart).toISOString(),
      scheduledEnd: value.scheduledEnd ? new Date(value.scheduledEnd).toISOString() : undefined,
      reminderAt: value.reminderAt ? new Date(value.reminderAt).toISOString() : undefined,
      attachmentUrls: this.parseUrls(value.attachmentUrlsText),
      photoProofBase64: this.visitPhotoBase64(),
    };
    this.savingVisit.set(true);
    const request$ = this.editingVisitId() ? this.visitService.updateVisit(this.editingVisitId()!, payload) : this.visitService.createVisit(payload);
    request$.subscribe({
      next: (visit: VisitRecord) => {
        this.upsertVisit(visit);
        this.selectedVisitId.set(visit.id);
        this.resetVisitForm();
        this.refreshAll();
        this.toastService.success('Visit saved successfully.');
      },
      error: () => this.toastService.error('Unable to save visit right now.'),
      complete: () => this.savingVisit.set(false),
    });
  }

  editVisit(visit: VisitRecord): void {
    this.editingVisitId.set(visit.id);
    this.selectedVisitId.set(visit.id);
    this.visitForm.patchValue({
      title: visit.title,
      purpose: visit.purpose,
      clientId: visit.client?.id ?? null,
      visitorId: visit.visitor?.id ?? null,
      hostEmployeeId: visit.host?.id ?? null,
      approverEmployeeId: visit.approver?.id ?? null,
      scheduledStart: this.toInputDateTime(visit.scheduledStart),
      scheduledEnd: this.toInputDateTime(visit.scheduledEnd),
      reminderAt: this.toInputDateTime(visit.reminderAt),
      locationName: visit.locationName ?? '',
      attachmentUrlsText: visit.attachmentUrls.join('\n'),
      requiresApproval: visit.requiresApproval,
    });
  }

  reviewVisit(id: number, action: 'approve' | 'reject'): void {
    this.visitService.reviewVisit(id, action).subscribe({
      next: (visit: VisitRecord) => { this.upsertVisit(visit); this.refreshAll(); this.toastService.success(`Visit ${action}d successfully.`); },
      error: () => this.toastService.error(`Unable to ${action} this visit right now.`),
    });
  }

  async submitCheckAction(id: number, mode: 'checkIn' | 'checkOut'): Promise<void> {
    this.selectedVisitId.set(id);
    const location = await this.resolveCurrentLocation();
    const action$ = mode === 'checkIn'
      ? this.visitService.checkIn(id, location)
      : this.visitService.checkOut(id, location);
    action$.subscribe({
      next: (visit: VisitRecord) => { this.upsertVisit(visit); this.refreshAll(); this.toastService.success(mode === 'checkIn' ? 'Visit checked in.' : 'Visit checked out.'); },
      error: () => this.toastService.error('Unable to process visit action right now.'),
    });
  }

  saveNote(): void {
    if (!this.selectedVisit() || this.noteForm.invalid) return;
    const value = this.noteForm.getRawValue();
    this.visitService.addNote(this.selectedVisit()!.id, {
      noteType: value.noteType,
      content: value.content,
      attachmentUrls: this.parseUrls(value.attachmentUrlsText),
      photoProofBase64: this.notePhotoBase64(),
    }).subscribe({
      next: () => { this.notePhotoBase64.set(null); this.noteForm.reset({ noteType: 'general', content: '', attachmentUrlsText: '' }); this.openVisit(this.selectedVisit()!.id); this.toastService.success('Visit note added.'); },
      error: () => this.toastService.error('Unable to add note right now.'),
    });
  }

  saveFollowUp(): void {
    if (!this.selectedVisit() || this.followUpForm.invalid) return;
    const value = this.followUpForm.getRawValue();
    this.visitService.addFollowUp(this.selectedVisit()!.id, { ...value, dueAt: value.dueAt ? new Date(value.dueAt).toISOString() : undefined }).subscribe({
      next: () => { this.followUpForm.reset({ title: '', description: '', assignedTo: null, priority: 'medium', dueAt: '' }); this.openVisit(this.selectedVisit()!.id); this.toastService.success('Follow-up added.'); },
      error: () => this.toastService.error('Unable to add follow-up right now.'),
    });
  }

  saveClient(): void {
    if (this.clientForm.invalid) return;
    const request$ = this.editingClientId() ? this.visitService.updateClient(this.editingClientId()!, this.clientForm.getRawValue()) : this.visitService.createClient(this.clientForm.getRawValue());
    request$.subscribe({
      next: (client: any) => { this.references.update((state: VisitReferencesResponse) => ({ ...state, clients: this.upsertById(state.clients, client) })); this.clientForm.reset({ name: '', contactPerson: '' }); this.editingClientId.set(null); this.toastService.success('Client saved.'); },
      error: () => this.toastService.error('Unable to save client right now.'),
    });
  }

  saveVisitor(): void {
    if (this.visitorForm.invalid) return;
    const request$ = this.editingVisitorId() ? this.visitService.updateVisitor(this.editingVisitorId()!, this.visitorForm.getRawValue()) : this.visitService.createVisitor(this.visitorForm.getRawValue());
    request$.subscribe({
      next: (visitor: any) => { this.references.update((state: VisitReferencesResponse) => ({ ...state, visitors: this.upsertById(state.visitors, visitor) })); this.visitorForm.reset({ fullName: '', clientId: null, phone: '' }); this.editingVisitorId.set(null); this.toastService.success('Visitor saved.'); },
      error: () => this.toastService.error('Unable to save visitor right now.'),
    });
  }

  openVisit(id: number): void {
    this.selectedVisitId.set(id);
    this.visitService.getVisit(id).subscribe({ next: (visit: VisitRecord) => this.upsertVisit(visit) });
  }

  canApprove(): boolean {
    return [1, 2, 3, 4].includes(Number(this.references().role.id ?? 5));
  }

  statusLabel(status: VisitStatus | string): string {
    return String(status).replace(/_/g, ' ').replace(/\b\w/g, (value) => value.toUpperCase());
  }

  statusClass(status: VisitStatus | string): string {
    const classes: Record<string, string> = {
      pending_approval: 'bg-amber-100 text-amber-700',
      planned: 'bg-sky-100 text-sky-700',
      in_progress: 'bg-violet-100 text-violet-700',
      completed: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-rose-100 text-rose-700',
    };
    return classes[status] || 'bg-slate-100 text-slate-600';
  }

  gpsLabel(point?: { latitude: number; longitude: number; address?: string } | null): string {
    if (!point) return 'Not captured';
    return `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`;
  }

  linkedClientName(clientId?: number | null): string {
    return this.references().clients.find((client: any) => client.id === clientId)?.name || 'No client linked';
  }

  editClient(id: number): void {
    const client = this.references().clients.find((item: any) => item.id === id);
    if (!client) return;
    this.editingClientId.set(id);
    this.clientForm.reset({
      name: client.name,
      contactPerson: client.contactPerson || '',
    });
  }

  editVisitor(id: number): void {
    const visitor = this.references().visitors.find((item: any) => item.id === id);
    if (!visitor) return;
    this.editingVisitorId.set(id);
    this.visitorForm.reset({
      fullName: visitor.fullName,
      clientId: visitor.clientId ?? null,
      phone: visitor.phone || '',
    });
  }

  resetClientForm(): void {
    this.editingClientId.set(null);
    this.clientForm.reset({ name: '', contactPerson: '' });
  }

  resetVisitorForm(): void {
    this.editingVisitorId.set(null);
    this.visitorForm.reset({ fullName: '', clientId: null, phone: '' });
  }

  captureNoteImageFile(event: Event): void {
    this.readImageFile(event, (value) => this.notePhotoBase64.set(value));
  }

  completeFollowUp(id: number): void {
    this.visitService.updateFollowUp(id, { status: 'completed' }).subscribe({
      next: () => {
        if (this.selectedVisit()) {
          this.openVisit(this.selectedVisit()!.id);
        }
        this.refreshAll();
        this.toastService.success('Follow-up marked as completed.');
      },
      error: () => this.toastService.error('Unable to update follow-up right now.'),
    });
  }

  downloadReport(format: 'csv' | 'json'): void {
    this.visitService.exportReports(format, {
      status: this.filterStatus() || undefined,
      search: this.visitSearch() || undefined,
    }).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = format === 'json' ? 'visit-report.json' : 'visit-report.csv';
        anchor.click();
        URL.revokeObjectURL(url);
        this.toastService.success(`Visit report exported as ${format.toUpperCase()}.`);
      },
      error: () => this.toastService.error('Unable to export visit report right now.'),
    });
  }

  resetVisitForm(): void {
    this.editingVisitId.set(null);
    this.visitPhotoBase64.set(null);
    this.visitForm.reset({ title: '', purpose: '', clientId: null, visitorId: null, hostEmployeeId: null, approverEmployeeId: null, scheduledStart: '', scheduledEnd: '', reminderAt: '', locationName: '', attachmentUrlsText: '', requiresApproval: true });
  }

  captureImageFile(event: Event): void {
    this.readImageFile(event, (value) => this.visitPhotoBase64.set(value));
  }

  private parseUrls(value?: string | null): string[] {
    return String(value || '').split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
  }

  private async resolveCurrentLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return {};
    }

    return new Promise<{ latitude?: number; longitude?: number }>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
        () => resolve({}),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    });
  }

  private readImageFile(event: Event, callback: (value: string | null) => void): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => callback(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  }

  private toInputDateTime(value?: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private upsertVisit(visit: VisitRecord): void {
    this.visits.update((items: VisitRecord[]) => this.upsertById(items, visit).sort((left, right) => new Date(right.scheduledStart).getTime() - new Date(left.scheduledStart).getTime()));
  }

  private upsertById<T extends { id: number }>(items: T[], value: T): T[] {
    const exists = items.some((item) => item.id === value.id);
    return exists ? items.map((item) => (item.id === value.id ? value : item)) : [value, ...items];
  }

  openPass(visit: VisitRecord): void {
    this.passVisit.set(visit);
    this.showPassModal.set(true);
  }

  printPass(): void {
    window.print();
  }
}
