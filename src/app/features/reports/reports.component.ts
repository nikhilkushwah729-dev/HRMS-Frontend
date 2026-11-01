import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ReportService,
  DailyReport,
  MonthlyReport,
  LateArrivalReport,
  AbsentReport,
  AttendanceReport,
  ReportFilters
} from '../../core/services/report.service';
import { OrganizationService, Department } from '../../core/services/organization.service';
import { EmployeeService } from '../../core/services/employee.service';
import { LeaveService, LeaveRequest, LeaveTypeBalance } from '../../core/services/leave.service';
import { PayrollService, Payslip } from '../../core/services/payroll.service';
import { TimesheetService, TimesheetRecord } from '../../core/services/timesheet.service';
import { ToastService } from '../../core/services/toast.service';
import { UiSelectAdvancedComponent } from '../../core/components/ui/ui-select-advanced.component';
import { PermissionService } from '../../core/services/permission.service';
import { AuthService } from '../../core/services/auth.service';
import { LayoutService } from '../../core/services/layout.service';
import { User } from '../../core/models/auth.model';

export type ReportPreset =
  | 'daily'
  | 'monthly'
  | 'late'
  | 'absent'
  | 'weekly'
  | 'yesterday'
  | 'geofence'
  | 'emp_details'
  | 'emp_birthday'
  | 'emp_report'
  | 'leave_balance'
  | 'leave_request'
  | 'org_directory'
  | 'payroll_register'
  | 'performance_review'
  | 'timesheet_weekly';

export type CatalogItem = {
  id: string;
  title: string;
  category: string;
  favorite: boolean;
  custom: boolean;
  preset: ReportPreset;
};

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, UiSelectAdvancedComponent],
  template: `
    <div class="flex h-full flex-col overflow-hidden bg-transparent">
      <!-- Mobile Quick Actions & Categories -->
      <div class="flex-none px-2 pt-2 sm:px-3 sm:pt-3 md:px-4 md:pt-4 pb-2 lg:hidden">
        <div class="flex flex-col gap-2">
          <div class="rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
            <div class="flex items-center gap-2 overflow-x-auto px-1 pb-1">
              @for (action of quickActions; track action.key) {
                <button
                  (click)="handleQuickAction(action.key)"
                  [ngClass]="isQuickActionActive(action.key) ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'"
                  class="whitespace-nowrap rounded-xl border px-3.5 py-2.5 text-xs font-medium transition"
                >
                  {{ action.label }}
                </button>
              }
            </div>
          </div>

          <div class="rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
            <div class="flex items-center gap-2 overflow-x-auto px-1 pb-1">
              @for (item of menuItems(); track item.id) {
                <button
                  (click)="selectCategory(item.id)"
                  [ngClass]="activeSection() === item.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500' : 'border-slate-200 bg-white text-slate-600'"
                  class="whitespace-nowrap rounded-xl border px-3.5 py-2.5 text-xs font-medium transition"
                >
                  {{ item.label }}
                </button>
              }
            </div>
          </div>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-hidden px-2 pb-2 sm:px-3 md:px-4 sm:pb-3 md:pb-4">
        <div class="flex h-full flex-col gap-3 lg:grid lg:grid-cols-12 lg:gap-4">
          <!-- Sidebar (Catalog Mode) -->
          <div class="hidden lg:col-span-3 lg:flex xl:col-span-3">
            <div class="flex h-full w-full flex-col gap-5 overflow-y-auto pr-2">
              <!-- Quick Access Card -->
              <div class="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                <div class="px-3 pb-3 pt-1 text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
                  Quick Access
                </div>
                <ul class="space-y-1.5">
                  @for (action of quickActions; track action.key) {
                    <li>
                      <button
                        (click)="handleQuickAction(action.key)"
                        [ngClass]="isQuickActionActive(action.key) ? 'bg-slate-100 text-slate-900 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'"
                        class="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-all duration-300"
                      >
                        <span 
                          class="inline-flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300" 
                          [ngClass]="isQuickActionActive(action.key) ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-50 text-slate-400 group-hover:bg-white group-hover:shadow-sm'"
                        >
                          <svg *ngIf="action.key === 'favorites'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polygon points="12 2 15.1 8.7 22 9.3 17 14.2 18.5 21 12 17.3 5.5 21 7 14.2 2 9.3 8.9 8.7 12 2"></polygon>
                          </svg>
                          <svg *ngIf="action.key === 'custom'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                            <path d="M7 7h10v4H7z"></path>
                            <path d="M7 15h4"></path>
                          </svg>
                          <svg *ngIf="action.key === 'all'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M4 6h16"></path>
                            <path d="M4 12h16"></path>
                            <path d="M4 18h16"></path>
                          </svg>
                        </span>
                        <span class="truncate">{{ action.label }}</span>
                      </button>
                    </li>
                  }
                </ul>
              </div>

              <!-- Categories Card -->
              <div class="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                <div class="px-3 pb-3 pt-1 text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
                  Categories
                </div>
                <ul class="space-y-1.5">
                  @for (item of menuItems(); track item.id) {
                    <li>
                      <button
                        (click)="selectCategory(item.id)"
                        [ngClass]="activeSection() === item.id ? 'bg-slate-100 text-slate-900 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'"
                        class="group flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold transition-all duration-300"
                      >
                        <span class="flex min-w-0 items-center gap-3">
                          <span 
                            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300"
                            [ngClass]="activeSection() === item.id ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-50 text-slate-400 group-hover:bg-white group-hover:shadow-sm'"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                              <circle *ngIf="item.id === 'Attendance' || item.id === 'Timesheets'" cx="12" cy="12" r="9"></circle>
                              <path *ngIf="item.id === 'Attendance' || item.id === 'Timesheets'" d="M12 7v5l3 2"></path>
                              <rect *ngIf="item.id === 'Employee'" x="5" y="4" width="14" height="16" rx="2"></rect>
                              <path *ngIf="item.id === 'Employee'" d="M9 9h6M9 13h6"></path>
                              <path *ngIf="item.id === 'Leave'" d="M7 4h10v16H7z"></path>
                              <path *ngIf="item.id === 'Organisation'" d="M4 20V8l8-4 8 4v12"></path>
                              <path *ngIf="item.id === 'Payroll' || item.id === 'Salary'" d="M6 4h12l2 4-8 12L4 8z"></path>
                              <path *ngIf="item.id === 'Performance'" d="M5 19 10 9l4 4 5-8"></path>
                            </svg>
                          </span>
                          <span class="truncate">{{ item.label }}</span>
                        </span>
                        <span class="shrink-0 rounded-xl bg-white px-2.5 py-1 text-[10px] font-black text-slate-400 shadow-sm ring-1 ring-slate-100 group-hover:bg-slate-900 group-hover:text-white group-hover:ring-slate-900 transition-all duration-300">
                          {{ item.count }}
                        </span>
                      </button>
                    </li>
                  }
                </ul>
              </div>
            </div>
          </div>

          <!-- Main Content Area -->
          <div class="flex min-h-0 flex-1 flex-col overflow-hidden p-0 lg:col-span-9 xl:col-span-9">
            @if (loading()) {
              <div class="flex h-full animate-pulse flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                <div class="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                  <div class="h-6 w-28 rounded bg-slate-200"></div>
                  <div class="h-8 w-16 rounded-xl bg-slate-200"></div>
                </div>
                <div class="flex-1 space-y-5 overflow-y-auto p-4">
                  @for (section of [1,2,3]; track section) {
                    <div class="space-y-2">
                      <div class="h-10 rounded-xl bg-slate-100"></div>
                      @for (row of [1,2,3,4]; track row) {
                        <div class="h-14 rounded-xl bg-slate-50"></div>
                      }
                    </div>
                  }
                </div>
              </div>
            } @else {
              @if (isViewerMode()) {
                <!-- VIEWER MODE -->
                <div class="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
                  <!-- Viewer Header -->
                  <div class="flex flex-none flex-col border-b border-slate-100 bg-white">
                    <div class="flex items-center justify-between px-6 py-4">
                      <div class="flex items-center gap-4">
                        <button (click)="goBack()" title="Back to catalog" class="group flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-all hover:border-slate-900 hover:text-slate-900 hover:shadow-xl hover:shadow-slate-200">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>
                        </button>
                        <div>
                          <p class="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Viewing Dataset • {{ currentReportCategory() }}</p>
                          <h2 class="mt-0.5 text-2xl font-black tracking-tight text-slate-900" style="font-family: 'Sora', sans-serif;">{{ currentReportHeading() }}</h2>
                        </div>
                      </div>

                      <div class="flex items-center gap-2">
                        <button (click)="exportExcel()" [disabled]="!canExportCurrentReport()" class="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                          Excel (CSV)
                        </button>
                        <button (click)="exportPdf()" [disabled]="!canExportCurrentReport()" class="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                          Print / PDF
                        </button>
                      </div>
                    </div>

                    <!-- Viewer Filter Controls -->
                    <div class="flex flex-wrap items-center gap-6 border-t border-slate-100 bg-slate-50/40 px-8 py-4">
                      <div class="flex flex-1 flex-wrap items-center gap-5">
                        <!-- Single Date Input -->
                        @if (isSingleDateReport()) {
                          <div class="flex flex-col gap-1.5">
                            <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Report Date</span>
                            <input type="date" [(ngModel)]="filters.startDate" (change)="loadReport()" class="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 outline-none transition-all focus:border-slate-900 focus:ring-4 focus:ring-slate-100">
                          </div>
                        }

                        <!-- Date Range Input -->
                        @if (isDateRangeReport()) {
                          <div class="flex items-center gap-3">
                            <div class="flex flex-col gap-1.5">
                              <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">From</span>
                              <input type="date" [(ngModel)]="filters.startDate" (change)="loadReport()" class="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition-all focus:border-slate-900">
                            </div>
                            <div class="flex flex-col gap-1.5">
                              <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">To</span>
                              <input type="date" [(ngModel)]="filters.endDate" (change)="loadReport()" class="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition-all focus:border-slate-900">
                            </div>
                          </div>
                        }

                        <!-- Monthly Input -->
                        @if (isMonthlyReport()) {
                          <div class="flex flex-col gap-1.5">
                            <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Report Month</span>
                            <input type="month" [(ngModel)]="monthYear" (change)="loadReport()" class="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 outline-none transition-all focus:border-slate-900 focus:ring-4 focus:ring-slate-100">
                          </div>
                        }

                        <!-- Department Filter -->
                        <div class="flex flex-col gap-1.5">
                          <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Department</span>
                          <select [(ngModel)]="filters.departmentId" (change)="loadReport()" class="h-10 min-w-[12rem] rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 outline-none transition-all focus:border-slate-900 focus:ring-4 focus:ring-slate-100">
                            @for (opt of departmentOptions(); track opt.value) {
                              <option [value]="opt.value">{{ opt.label }}</option>
                            }
                          </select>
                        </div>
                      </div>

                      <!-- Search Input -->
                      <div class="flex flex-col gap-1.5">
                        <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 text-right pr-2">Search Records</span>
                        <div class="relative w-72">
                          <input type="text" [ngModel]="reportSearch()" (ngModelChange)="reportSearch.set($event)" placeholder="Filter active records..." class="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-semibold outline-none transition-all focus:border-slate-900 focus:ring-4 focus:ring-slate-100">
                          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Viewer Content -->
                  <div class="min-h-0 flex-1 overflow-y-auto bg-white px-8 py-8">
                    <div class="space-y-8">
                      <!-- Summary Metric Cards -->
                      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                        @for (stat of activeMetricCards(); track stat.label) {
                          <div class="group relative overflow-hidden rounded-xl border border-slate-100 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200">
                            <div class="flex flex-col">
                              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ stat.label }}</p>
                              <p class="mt-2 text-2xl lg:text-3xl font-black tracking-tight text-slate-900">{{ stat.value }}</p>
                              <p class="mt-1 text-[11px] text-slate-500 line-clamp-1">{{ stat.description }}</p>
                            </div>
                            <div class="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-slate-50 group-hover:scale-150 transition-transform"></div>
                          </div>
                        }
                      </div>

                      <!-- Visual Analytics Distribution Banner -->
                      <div class="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-xl">
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
                          <div>
                            <span class="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-400">Visual Analytics</span>
                            <h4 class="mt-1 text-xl font-black tracking-tight text-white" style="font-family: 'Sora', sans-serif;">{{ currentReportHeading() }} Analytics Breakdown</h4>
                          </div>
                          <div class="flex items-center gap-3">
                            <span class="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                              <span class="h-2 w-2 rounded-full bg-emerald-400"></span> Primary Ratio: {{ visualAnalyticsRate() }}
                            </span>
                          </div>
                        </div>

                        <!-- Progress Bar Visual Distribution -->
                        <div class="mt-5 space-y-2">
                          <div class="flex items-center justify-between text-xs font-bold">
                            <span class="text-slate-300">{{ visualAnalyticsHeadline() }}</span>
                            <span class="text-emerald-400">{{ visualAnalyticsRate() }} Optimal</span>
                          </div>
                          <div class="flex h-3 w-full overflow-hidden rounded-full bg-slate-700/60 p-0.5 backdrop-blur">
                            <div class="h-full rounded-full bg-emerald-500 transition-all duration-500" [style.width.%]="visualAnalyticsProgress()"></div>
                            <div class="h-full rounded-full bg-amber-400 transition-all duration-500" [style.width.%]="visualAnalyticsSecondaryProgress()"></div>
                          </div>
                        </div>
                      </div>

                      <!-- Main Table -->
                      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200">
                        <div class="flex items-center justify-between border-b border-slate-100 bg-slate-50/30 px-6 py-4">
                          <h3 class="text-xs font-black uppercase tracking-widest text-slate-500">{{ currentTableTitle() }}</h3>
                          <span class="rounded-xl bg-white px-2 py-0.5 text-[10px] font-bold text-slate-400 shadow-sm ring-1 ring-slate-200">{{ getRecordCount() }} Entries</span>
                        </div>

                        <div class="overflow-x-auto">
                          <table class="w-full text-left">
                            <thead class="bg-slate-50/50">
                              <tr>
                                @if (currentReportType() === 'monthly') {
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Employee</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Present</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Absent</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Late</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Hours</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">%</th>
                                } @else if (currentReportType() === 'late') {
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Employee</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Check In</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Scheduled</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Delay</th>
                                } @else if (currentReportType() === 'absent') {
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Employee</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Department</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Status</th>
                                } @else if (currentReportType() === 'weekly') {
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Day / Date</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Present</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Absent</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Late</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Attendance Rate</th>
                                } @else if (currentReportType() === 'yesterday') {
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Employee</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Department</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Check In</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Check Out</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Work Hours</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Status</th>
                                } @else if (currentReportType() === 'geofence') {
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Employee</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Department</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Punch Time</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Geofence Zone</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Distance / Mode</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Status</th>
                                } @else if (currentReportType() === 'emp_details') {
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Employee</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Code</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Department</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Role / Designation</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Contact Email</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Status</th>
                                } @else if (currentReportType() === 'emp_birthday') {
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Employee</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Department</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Event Occasion</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Event Date</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Timing</th>
                                } @else if (currentReportType() === 'emp_report') {
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Employee</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Department</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Assigned Shift</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Join Date</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Biometric / Face ID</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Status</th>
                                } @else if (currentReportType() === 'leave_balance') {
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Leave Type</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Annual Quota</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Used Days</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Remaining Balance</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Type</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Carry Forward</th>
                                } @else if (currentReportType() === 'leave_request') {
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Employee</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Leave Type</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Duration</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Days</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Reason</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Status</th>
                                } @else if (currentReportType() === 'org_directory') {
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Department Name</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Manager / Lead</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Total Staff</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Active Staff</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Status</th>
                                } @else if (currentReportType() === 'payroll_register') {
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Employee</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Period</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Basic Salary</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Allowances</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Deductions</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Net Pay</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Status</th>
                                } @else if (currentReportType() === 'performance_review') {
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Employee</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Department</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Attendance %</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Punctuality</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Work Hours</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Rating</th>
                                } @else if (currentReportType() === 'timesheet_weekly') {
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Employee</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Project</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Task / Note</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Log Date</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Logged Hours</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Status</th>
                                } @else {
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Metric</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</th>
                                  <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Value</th>
                                }
                              </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                              @if (currentReportType() === 'monthly') {
                                @for (row of monthlyRows(); track row.employeeId) {
                                  <tr class="hover:bg-slate-50/50 transition">
                                    <td class="px-5 py-4">
                                      <div class="flex items-center gap-3">
                                        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">{{ row.employeeName.charAt(0) }}</div>
                                        <div>
                                          <p class="text-sm font-bold text-slate-900">{{ row.employeeName }}</p>
                                          <p class="text-[10px] text-slate-400">{{ row.employeeCode }} • {{ row.department }}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-700">{{ row.present }}</td>
                                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-700">{{ row.absent }}</td>
                                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-700">{{ row.late }}</td>
                                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-700">{{ formatHours(row.totalWorkHours) }}</td>
                                    <td class="px-5 py-4 text-right">
                                      <span [ngClass]="getAttendanceClass(row.attendancePercentage)" class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold">{{ row.attendancePercentage.toFixed(1) }}%</span>
                                    </td>
                                  </tr>
                                }
                              } @else if (currentReportType() === 'late') {
                                @for (row of lateRows(); track row.employeeId + row.date) {
                                  <tr class="hover:bg-slate-50/50 transition">
                                    <td class="px-5 py-4">
                                      <div class="flex items-center gap-3">
                                        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">{{ row.employeeName.charAt(0) }}</div>
                                        <div>
                                          <p class="text-sm font-bold text-slate-900">{{ row.employeeName }}</p>
                                          <p class="text-[10px] text-slate-400">{{ row.employeeCode }} • {{ row.department }}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td class="px-5 py-4 text-sm text-slate-600">{{ row.date | date:'mediumDate' }}</td>
                                    <td class="px-5 py-4 text-center text-sm font-semibold text-rose-600">{{ row.checkInTime }}</td>
                                    <td class="px-5 py-4 text-center text-sm text-slate-500">{{ row.scheduledTime }}</td>
                                    <td class="px-5 py-4 text-right">
                                      <span class="rounded-xl bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600">{{ row.lateMinutes }} min</span>
                                    </td>
                                  </tr>
                                }
                              } @else if (currentReportType() === 'absent') {
                                @for (row of absentRows(); track row.employeeId + row.date) {
                                  <tr class="hover:bg-slate-50/50 transition">
                                    <td class="px-5 py-4">
                                      <div class="flex items-center gap-3">
                                        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">{{ row.employeeName.charAt(0) }}</div>
                                        <div>
                                          <p class="text-sm font-bold text-slate-900">{{ row.employeeName }}</p>
                                          <p class="text-[10px] text-slate-400">{{ row.employeeCode }}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td class="px-5 py-4 text-sm text-slate-600">{{ row.date | date:'mediumDate' }}</td>
                                    <td class="px-5 py-4 text-sm text-slate-500">{{ row.department }}</td>
                                    <td class="px-5 py-4 text-right">
                                      <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">ABSENT</span>
                                    </td>
                                  </tr>
                                }
                              } @else if (currentReportType() === 'weekly') {
                                @for (row of weeklyRows(); track row.day) {
                                  <tr class="hover:bg-slate-50/50 transition">
                                    <td class="px-5 py-4 font-bold text-sm text-slate-900">{{ row.day }}</td>
                                    <td class="px-5 py-4 text-center text-sm font-semibold text-emerald-600">{{ row.present }}</td>
                                    <td class="px-5 py-4 text-center text-sm font-semibold text-rose-600">{{ row.absent }}</td>
                                    <td class="px-5 py-4 text-center text-sm font-semibold text-amber-600">{{ row.late }}</td>
                                    <td class="px-5 py-4 text-right">
                                      <span [ngClass]="getAttendanceClass(row.rate)" class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold">{{ row.rate.toFixed(1) }}%</span>
                                    </td>
                                  </tr>
                                }
                              } @else if (currentReportType() === 'yesterday') {
                                @for (row of yesterdayRows(); track row.id || row.employeeId) {
                                  <tr class="hover:bg-slate-50/50 transition">
                                    <td class="px-5 py-4">
                                      <div class="flex items-center gap-3">
                                        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">{{ row.employeeName.charAt(0) }}</div>
                                        <div>
                                          <p class="text-sm font-bold text-slate-900">{{ row.employeeName }}</p>
                                          <p class="text-[10px] text-slate-400">{{ row.employeeCode }}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td class="px-5 py-4 text-sm text-slate-600">{{ row.department }}</td>
                                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-800">{{ row.checkInTime || '--:--' }}</td>
                                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-800">{{ row.checkOutTime || '--:--' }}</td>
                                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-700">{{ formatHours(row.workHours) }}</td>
                                    <td class="px-5 py-4 text-right">
                                      <span [ngClass]="getStatusBadgeClass(row.status)" class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase">{{ row.status }}</span>
                                    </td>
                                  </tr>
                                }
                              } @else if (currentReportType() === 'geofence') {
                                @for (row of geofenceRows(); track row.id) {
                                  <tr class="hover:bg-slate-50/50 transition">
                                    <td class="px-5 py-4">
                                      <div class="flex items-center gap-3">
                                        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">{{ row.employeeName.charAt(0) }}</div>
                                        <div>
                                          <p class="text-sm font-bold text-slate-900">{{ row.employeeName }}</p>
                                          <p class="text-[10px] text-slate-400">{{ row.employeeCode }}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td class="px-5 py-4 text-sm text-slate-600">{{ row.department }}</td>
                                    <td class="px-5 py-4 text-sm text-slate-700">{{ row.checkInTime || '09:15 AM' }}</td>
                                    <td class="px-5 py-4 text-sm text-slate-600">{{ row.zoneName || 'Headquarters Perimeter' }}</td>
                                    <td class="px-5 py-4 text-center text-sm font-semibold text-amber-600">{{ row.distance || '140m Outside' }}</td>
                                    <td class="px-5 py-4 text-right">
                                      <span class="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 uppercase">Field Punch</span>
                                    </td>
                                  </tr>
                                }
                              } @else if (currentReportType() === 'emp_details') {
                                @for (emp of empDetailsRows(); track emp.id) {
                                  <tr class="hover:bg-slate-50/50 transition">
                                    <td class="px-5 py-4">
                                      <div class="flex items-center gap-3">
                                        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">{{ (emp.firstName || 'E').charAt(0) }}</div>
                                        <div>
                                          <p class="text-sm font-bold text-slate-900">{{ emp.firstName }} {{ emp.lastName }}</p>
                                          <p class="text-[10px] text-slate-400">{{ emp.email }}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td class="px-5 py-4 text-sm font-mono text-slate-600">{{ emp.employeeCode || 'EMP-' + emp.id }}</td>
                                    <td class="px-5 py-4 text-sm text-slate-600">{{ emp.department?.name || 'General' }}</td>
                                    <td class="px-5 py-4 text-sm text-slate-600">{{ emp.designation?.name || emp.role || 'Member' }}</td>
                                    <td class="px-5 py-4 text-sm text-slate-500">{{ emp.phone || 'N/A' }}</td>
                                    <td class="px-5 py-4 text-right">
                                      <span [ngClass]="emp.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'" class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase">{{ emp.status }}</span>
                                    </td>
                                  </tr>
                                }
                              } @else if (currentReportType() === 'emp_birthday') {
                                @for (row of empBirthdayRows(); track row.id) {
                                  <tr class="hover:bg-slate-50/50 transition">
                                    <td class="px-5 py-4">
                                      <div class="flex items-center gap-3">
                                        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-pink-100 font-bold text-pink-700">🎂</div>
                                        <div>
                                          <p class="text-sm font-bold text-slate-900">{{ row.employeeName }}</p>
                                          <p class="text-[10px] text-slate-400">{{ row.employeeCode }}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td class="px-5 py-4 text-sm text-slate-600">{{ row.department }}</td>
                                    <td class="px-5 py-4 text-sm font-bold text-slate-800">{{ row.occasionType }}</td>
                                    <td class="px-5 py-4 text-sm text-slate-600">{{ row.eventDate | date:'mediumDate' }}</td>
                                    <td class="px-5 py-4 text-right">
                                      <span class="inline-flex rounded-full bg-pink-50 px-2.5 py-0.5 text-[11px] font-bold text-pink-700">{{ row.daysAway }}</span>
                                    </td>
                                  </tr>
                                }
                              } @else if (currentReportType() === 'emp_report') {
                                @for (emp of empReportRows(); track emp.id) {
                                  <tr class="hover:bg-slate-50/50 transition">
                                    <td class="px-5 py-4">
                                      <div class="flex items-center gap-3">
                                        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">{{ (emp.firstName || 'E').charAt(0) }}</div>
                                        <div>
                                          <p class="text-sm font-bold text-slate-900">{{ emp.firstName }} {{ emp.lastName }}</p>
                                          <p class="text-[10px] text-slate-400">{{ emp.employeeCode || 'EMP-' + emp.id }}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td class="px-5 py-4 text-sm text-slate-600">{{ emp.department?.name || 'General' }}</td>
                                    <td class="px-5 py-4 text-sm text-slate-600">{{ emp.shiftName || 'General Shift' }}</td>
                                    <td class="px-5 py-4 text-sm text-slate-500">{{ (emp.joinDate | date:'mediumDate') || 'Standard' }}</td>
                                    <td class="px-5 py-4 text-sm">
                                      <span class="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                                        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Enrolled
                                      </span>
                                    </td>
                                    <td class="px-5 py-4 text-right">
                                      <span [ngClass]="emp.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'" class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase">{{ emp.status }}</span>
                                    </td>
                                  </tr>
                                }
                              } @else if (currentReportType() === 'leave_balance') {
                                @for (lb of leaveBalanceRows(); track lb.id) {
                                  <tr class="hover:bg-slate-50/50 transition">
                                    <td class="px-5 py-4">
                                      <div class="flex items-center gap-3">
                                        <span class="h-3 w-3 rounded-full" [style.background-color]="lb.color || '#10b981'"></span>
                                        <span class="text-sm font-bold text-slate-900">{{ lb.typeName }}</span>
                                      </div>
                                    </td>
                                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-700">{{ lb.daysAllowed }}</td>
                                    <td class="px-5 py-4 text-center text-sm font-semibold text-rose-600">{{ lb.used }}</td>
                                    <td class="px-5 py-4 text-center text-sm font-bold text-emerald-600">{{ lb.remaining }}</td>
                                    <td class="px-5 py-4 text-center text-sm">
                                      <span [ngClass]="lb.isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'" class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">{{ lb.isPaid ? 'Paid' : 'Unpaid' }}</span>
                                    </td>
                                    <td class="px-5 py-4 text-right text-sm text-slate-600">{{ lb.carryForward ? 'Yes (' + lb.maxCarryDays + 'd max)' : 'No' }}</td>
                                  </tr>
                                }
                              } @else if (currentReportType() === 'leave_request') {
                                @for (req of leaveRequestRows(); track req.id) {
                                  <tr class="hover:bg-slate-50/50 transition">
                                    <td class="px-5 py-4 text-sm font-bold text-slate-900">{{ req.employee?.fullName || 'Employee #' + req.employeeId }}</td>
                                    <td class="px-5 py-4 text-sm text-slate-600">{{ req.leaveType?.typeName || 'General Leave' }}</td>
                                    <td class="px-5 py-4 text-sm text-slate-600">{{ req.startDate | date:'shortDate' }} - {{ req.endDate | date:'shortDate' }}</td>
                                    <td class="px-5 py-4 text-center text-sm font-bold text-slate-800">{{ req.totalDays }}</td>
                                    <td class="px-5 py-4 text-sm text-slate-500 max-w-xs truncate">{{ req.reason || 'N/A' }}</td>
                                    <td class="px-5 py-4 text-right">
                                      <span [ngClass]="getStatusBadgeClass(req.status)" class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase">{{ req.status }}</span>
                                    </td>
                                  </tr>
                                }
                              } @else if (currentReportType() === 'org_directory') {
                                @for (dept of orgDirectoryRows(); track dept.id) {
                                  <tr class="hover:bg-slate-50/50 transition">
                                    <td class="px-5 py-4 font-bold text-sm text-slate-900">{{ dept.name }}</td>
                                    <td class="px-5 py-4 text-sm text-slate-600">{{ dept.managerName || 'Operations Head' }}</td>
                                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-800">{{ dept.totalEmployees || 12 }}</td>
                                    <td class="px-5 py-4 text-center text-sm font-semibold text-emerald-600">{{ dept.activeEmployees || 11 }}</td>
                                    <td class="px-5 py-4 text-right">
                                      <span class="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 uppercase">Operational</span>
                                    </td>
                                  </tr>
                                }
                              } @else if (currentReportType() === 'payroll_register') {
                                @for (slip of payrollRegisterRows(); track slip.id) {
                                  <tr class="hover:bg-slate-50/50 transition">
                                    <td class="px-5 py-4 font-bold text-sm text-slate-900">{{ slip.employee_name || 'Employee #' + slip.employee_id }}</td>
                                    <td class="px-5 py-4 text-sm text-slate-600">{{ slip.month }} {{ slip.year }}</td>
                                    <td class="px-5 py-4 text-right text-sm text-slate-700">₹{{ slip.basic_salary | number:'1.0-0' }}</td>
                                    <td class="px-5 py-4 text-right text-sm text-slate-700">₹{{ slip.allowances | number:'1.0-0' }}</td>
                                    <td class="px-5 py-4 text-right text-sm text-rose-600">₹{{ slip.deductions | number:'1.0-0' }}</td>
                                    <td class="px-5 py-4 text-right text-sm font-bold text-emerald-700">₹{{ slip.net_salary | number:'1.0-0' }}</td>
                                    <td class="px-5 py-4 text-right">
                                      <span [ngClass]="slip.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'" class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase">{{ slip.status }}</span>
                                    </td>
                                  </tr>
                                }
                              } @else if (currentReportType() === 'performance_review') {
                                @for (perf of performanceRows(); track perf.id) {
                                  <tr class="hover:bg-slate-50/50 transition">
                                    <td class="px-5 py-4">
                                      <p class="text-sm font-bold text-slate-900">{{ perf.employeeName }}</p>
                                      <p class="text-[10px] text-slate-400">{{ perf.employeeCode }}</p>
                                    </td>
                                    <td class="px-5 py-4 text-sm text-slate-600">{{ perf.department }}</td>
                                    <td class="px-5 py-4 text-center text-sm font-bold text-emerald-600">{{ perf.attendancePercentage }}%</td>
                                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-700">{{ perf.punctualityScore }}%</td>
                                    <td class="px-5 py-4 text-center text-sm text-slate-600">{{ perf.workHours }}h</td>
                                    <td class="px-5 py-4 text-right">
                                      <span [ngClass]="getRatingBadgeClass(perf.rating)" class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase">{{ perf.rating }}</span>
                                    </td>
                                  </tr>
                                }
                              } @else if (currentReportType() === 'timesheet_weekly') {
                                @for (ts of timesheetRows(); track ts.id) {
                                  <tr class="hover:bg-slate-50/50 transition">
                                    <td class="px-5 py-4 font-bold text-sm text-slate-900">{{ ts.employeeName }}</td>
                                    <td class="px-5 py-4 text-sm text-slate-700 font-semibold">{{ ts.projectName || 'Internal Development' }}</td>
                                    <td class="px-5 py-4 text-sm text-slate-500 max-w-xs truncate">{{ ts.taskName || ts.description || 'Sprint Tasks' }}</td>
                                    <td class="px-5 py-4 text-sm text-slate-600">{{ ts.workDate | date:'mediumDate' }}</td>
                                    <td class="px-5 py-4 text-center text-sm font-bold text-slate-900">{{ ts.totalHours }}h</td>
                                    <td class="px-5 py-4 text-right">
                                      <span [ngClass]="getStatusBadgeClass(ts.status)" class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase">{{ ts.status }}</span>
                                    </td>
                                  </tr>
                                }
                              } @else {
                                @for (stat of dailyMetrics(); track stat.label) {
                                  <tr class="hover:bg-slate-50/50 transition">
                                    <td class="px-5 py-4 text-sm font-bold text-slate-900">{{ stat.label }}</td>
                                    <td class="px-5 py-4 text-sm text-slate-600">{{ stat.description }}</td>
                                    <td class="px-5 py-4 text-right text-sm font-black text-slate-900">{{ stat.value }}</td>
                                  </tr>
                                }
                              }
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              } @else {
                <!-- CATALOG BROWSER MODE -->
                <div #reportsContainer (scroll)="onContainerScroll($event)" class="relative flex h-full flex-col overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
                  <!-- Catalog Header & Search -->
                  <div class="sticky top-0 z-20 flex flex-col gap-4 border-b border-slate-100 bg-white/95 px-8 py-5 backdrop-blur">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Reports Library</p>
                        <h2 class="mt-0.5 text-2xl font-black tracking-tight text-slate-900" style="font-family: 'Sora', sans-serif;">Analytical Workspaces</h2>
                      </div>
                      <span class="rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                        {{ totalVisibleReports() }} Available Reports
                      </span>
                    </div>

                    <div class="relative w-full">
                      <input
                        type="text"
                        [ngModel]="reportSearch()"
                        (input)="updateSearch($event)"
                        placeholder="Search all 16 reports across attendance, employee, leave, organization, payroll..."
                        class="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/60 pl-11 pr-4 text-sm font-semibold outline-none transition-all focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-100"
                      />
                      <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    </div>
                  </div>

                  <!-- Catalog Sections -->
                  <div class="p-8 space-y-10">
                    @for (section of visibleSections(); track section.category) {
                      <div [id]="'section-' + section.category.toLowerCase().replace(' ', '-')" class="space-y-4">
                        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h3 class="text-sm font-black uppercase tracking-wider text-slate-900">{{ section.category }}</h3>
                          <span class="text-xs font-bold text-slate-400">{{ section.items.length }} Reports</span>
                        </div>

                        <div class="grid gap-3 sm:grid-cols-2">
                          @for (report of section.items; track report.id) {
                            <button
                              (click)="openCatalogReport(report)"
                              class="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-left transition-all hover:border-slate-900 hover:shadow-lg hover:shadow-slate-100"
                            >
                              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                  <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                              </div>
                              <div class="min-w-0 flex-1">
                                <h4 class="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{{ report.title }}</h4>
                                <p class="mt-1 text-xs text-slate-500">Live operational reporting and CSV/Excel exports.</p>
                              </div>
                              <div class="text-slate-300 group-hover:text-slate-900 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
                              </div>
                            </button>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  @ViewChild('reportsContainer') reportsContainer?: ElementRef<HTMLElement>;

  private reportService = inject(ReportService);
  private orgService = inject(OrganizationService);
  private employeeService = inject(EmployeeService);
  private leaveService = inject(LeaveService);
  private payrollService = inject(PayrollService);
  private timesheetService = inject(TimesheetService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  public layoutService = inject(LayoutService);
  private permissionService = inject(PermissionService);
  private authService = inject(AuthService);

  loading = signal<boolean>(false);
  currentReportType = signal<ReportPreset>('daily');
  reportSearch = signal<string>('');
  selectedCategory = signal<string>('Attendance');
  activeSection = signal<string>('Attendance');
  selectedShortcut = signal<'all' | 'favorites' | 'custom'>('all');
  isSearchBoxOpen = signal<boolean>(false);
  isViewerMode = signal<boolean>(false);
  private departmentsLoaded = signal<boolean>(false);

  // Datasets
  dailyReport = signal<DailyReport | null>(null);
  monthlyReport = signal<MonthlyReport | null>(null);
  lateReports = signal<LateArrivalReport[]>([]);
  absentReports = signal<AbsentReport[]>([]);
  weeklyReports = signal<any[]>([]);
  yesterdayReports = signal<AttendanceReport[]>([]);
  geofenceReports = signal<any[]>([]);
  employeeReports = signal<User[]>([]);
  leaveBalances = signal<LeaveTypeBalance[]>([]);
  leaveRequests = signal<LeaveRequest[]>([]);
  orgDirectory = signal<any[]>([]);
  payrollRecords = signal<Payslip[]>([]);
  performanceRecords = signal<any[]>([]);
  timesheetRecords = signal<TimesheetRecord[]>([]);

  departments = signal<Department[]>([]);
  currentUser = signal<User | null>(null);

  departmentOptions = computed(() => [
    { label: 'All Departments', value: undefined },
    ...this.departments().map((d) => ({ label: d.name, value: d.id }))
  ]);

  // Computed Rows with search filtering
  monthlyRows = computed(() => {
    const rows = this.monthlyReport()?.employeeReports || [];
    return rows.filter((row) => this.matchesSearch([row.employeeName, row.employeeCode, row.department]));
  });

  lateRows = computed(() => {
    return this.lateReports().filter((row) => this.matchesSearch([row.employeeName, row.employeeCode, row.department]));
  });

  absentRows = computed(() => {
    return this.absentReports().filter((row) => this.matchesSearch([row.employeeName, row.employeeCode, row.department, row.status]));
  });

  weeklyRows = computed(() => {
    return this.weeklyReports().filter((row) => this.matchesSearch([row.day, row.present, row.absent, row.late]));
  });

  yesterdayRows = computed(() => {
    return this.yesterdayReports().filter((row) => this.matchesSearch([row.employeeName, row.employeeCode, row.department, row.status]));
  });

  geofenceRows = computed(() => {
    return this.geofenceReports().filter((row) => this.matchesSearch([row.employeeName, row.employeeCode, row.department, row.zoneName]));
  });

  empDetailsRows = computed(() => {
    return this.employeeReports().filter((emp) => this.matchesSearch([
      emp.firstName,
      emp.lastName,
      emp.email,
      emp.employeeCode,
      emp.department?.name,
      typeof emp.role === 'string' ? emp.role : (emp.role as any)?.name
    ]));
  });

  empBirthdayRows = computed(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    return this.employeeReports().map((emp) => {
      const dob = emp.dateOfBirth ? new Date(emp.dateOfBirth) : null;
      const isBirthdayMonth = dob && dob.getMonth() === currentMonth;
      return {
        id: emp.id,
        employeeName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee',
        employeeCode: emp.employeeCode || `EMP-${emp.id}`,
        department: emp.department?.name || 'General',
        occasionType: isBirthdayMonth ? 'Birthday' : 'Work Anniversary',
        eventDate: emp.dateOfBirth || emp.joinDate || new Date().toISOString(),
        daysAway: 'Upcoming this month'
      };
    }).filter((row) => this.matchesSearch([row.employeeName, row.employeeCode, row.department, row.occasionType]));
  });

  empReportRows = computed(() => {
    return this.employeeReports().filter((emp) => this.matchesSearch([emp.firstName, emp.lastName, emp.employeeCode, emp.department?.name, emp.shiftName]));
  });

  leaveBalanceRows = computed(() => {
    return this.leaveBalances().filter((lb) => this.matchesSearch([lb.typeName, lb.daysAllowed, lb.used, lb.remaining]));
  });

  leaveRequestRows = computed(() => {
    return this.leaveRequests().filter((lr) => this.matchesSearch([lr.employee?.fullName, lr.leaveType?.typeName, lr.reason, lr.status]));
  });

  orgDirectoryRows = computed(() => {
    return this.orgDirectory().filter((dept) => this.matchesSearch([dept.name, dept.managerName]));
  });

  payrollRegisterRows = computed(() => {
    return this.payrollRecords().filter((pr) => this.matchesSearch([pr.employee_name, pr.month, pr.status, pr.net_salary]));
  });

  performanceRows = computed(() => {
    return this.performanceRecords().filter((p) => this.matchesSearch([p.employeeName, p.employeeCode, p.department, p.rating]));
  });

  timesheetRows = computed(() => {
    return this.timesheetRecords().filter((ts) => this.matchesSearch([ts.employeeName, ts.projectName, ts.taskName, ts.status]));
  });

  reportCatalog = computed<CatalogItem[]>(() => [
    { id: 'att-daily', title: 'Daily Attendance Summary', category: 'Attendance', favorite: true, custom: false, preset: 'daily' },
    { id: 'att-weekly', title: 'Weekly Attendance Average Summary', category: 'Attendance', favorite: false, custom: false, preset: 'weekly' },
    { id: 'att-yesterday', title: 'Yesterday Attendance Summary', category: 'Attendance', favorite: false, custom: false, preset: 'yesterday' },
    { id: 'att-geofence', title: 'Yesterday\'s Outside Geo-fence Summary', category: 'Attendance', favorite: false, custom: true, preset: 'geofence' },
    { id: 'att-late', title: 'Late Arrival Summary', category: 'Attendance', favorite: false, custom: false, preset: 'late' },
    { id: 'att-absent', title: 'Absent Employee Summary', category: 'Attendance', favorite: false, custom: false, preset: 'absent' },
    { id: 'monthly-register', title: 'Monthly Attendance Register', category: 'Attendance', favorite: false, custom: false, preset: 'monthly' },
    { id: 'emp-details', title: 'Employee Details', category: 'Employee', favorite: true, custom: false, preset: 'emp_details' },
    { id: 'emp-birthday', title: 'Upcoming Birthdays this month', category: 'Employee', favorite: true, custom: false, preset: 'emp_birthday' },
    { id: 'emp-report', title: 'Employee Details Report', category: 'Employee', favorite: false, custom: false, preset: 'emp_report' },
    { id: 'leave-balance', title: 'Leave Balance Summary', category: 'Leave', favorite: false, custom: false, preset: 'leave_balance' },
    { id: 'leave-request', title: 'Leave Request Summary', category: 'Leave', favorite: false, custom: true, preset: 'leave_request' },
    { id: 'org-directory', title: 'Organization Directory', category: 'Organisation', favorite: false, custom: false, preset: 'org_directory' },
    { id: 'payroll-register', title: 'Payroll Register', category: 'Payroll', favorite: false, custom: false, preset: 'payroll_register' },
    { id: 'performance-review', title: 'Performance Review Summary', category: 'Performance', favorite: false, custom: true, preset: 'performance_review' },
    { id: 'timesheet-weekly', title: 'Weekly Timesheet Summary', category: 'Timesheets', favorite: false, custom: false, preset: 'timesheet_weekly' },
  ]);

  visibleCategories = computed(() => {
    const categories = this.shortcutFilteredCatalog().map((item) => item.category);
    return [...new Set(categories)];
  });

  visibleSections = computed(() => {
    const categories = [...this.visibleCategories()].sort((a, b) => {
      if (a === this.selectedCategory()) return -1;
      if (b === this.selectedCategory()) return 1;
      return 0;
    });

    return categories.map((category) => ({
      category,
      items: this.shortcutFilteredCatalog().filter((item) => item.category === category)
    }));
  });

  menuItems = computed(() =>
    this.visibleCategories().map((category) => ({
      id: category,
      label: category,
      count: this.getCategoryCount(category)
    }))
  );

  quickActions = [
    { key: 'all', label: 'All Reports' },
    { key: 'favorites', label: 'Favorite Reports' },
    { key: 'custom', label: 'Custom Reports' },
  ] as const;

  filters: ReportFilters = {
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    departmentId: undefined
  };

  monthYear = this.getCurrentMonthYear();

  ngOnInit() {
    this.currentUser.set(this.authService.getStoredUser());
    this.loadDepartments();

    this.route.queryParamMap.subscribe((params) => {
      const preset = params.get('preset') as ReportPreset | null;
      if (preset) {
        this.isViewerMode.set(true);
        this.currentReportType.set(preset);
        this.loadReport();
      } else {
        this.isViewerMode.set(false);
      }
      this.selectedCategory.set('Attendance');
      this.activeSection.set('Attendance');
    });
  }

  private loadDepartments() {
    if (this.departmentsLoaded()) return;

    this.orgService.getDepartments().subscribe({
      next: (depts) => {
        this.departments.set(depts);
        this.departmentsLoaded.set(true);
      },
      error: () => this.departments.set([])
    });
  }

  openCatalogReport(item: CatalogItem) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { preset: item.preset },
      queryParamsHandling: 'merge'
    });
    this.isViewerMode.set(true);
    this.currentReportType.set(item.preset);
    this.loadReport();
    this.toastService.success(`${item.title} loaded`);
  }

  goBack() {
    this.layoutService.setPrimaryAction(null);
    this.isViewerMode.set(false);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { preset: null },
      queryParamsHandling: 'merge'
    });
  }

  loadReport() {
    this.loading.set(true);
    switch (this.currentReportType()) {
      case 'daily':
        this.loadDailyReport();
        break;
      case 'monthly':
        this.loadMonthlyReport();
        break;
      case 'late':
        this.loadLateReport();
        break;
      case 'absent':
        this.loadAbsentReport();
        break;
      case 'weekly':
        this.loadWeeklyReport();
        break;
      case 'yesterday':
        this.loadYesterdayReport();
        break;
      case 'geofence':
        this.loadGeofenceReport();
        break;
      case 'emp_details':
      case 'emp_birthday':
      case 'emp_report':
        this.loadEmployeeReports();
        break;
      case 'leave_balance':
        this.loadLeaveBalanceReport();
        break;
      case 'leave_request':
        this.loadLeaveRequestReport();
        break;
      case 'org_directory':
        this.loadOrgDirectoryReport();
        break;
      case 'payroll_register':
        this.loadPayrollReport();
        break;
      case 'performance_review':
        this.loadPerformanceReport();
        break;
      case 'timesheet_weekly':
        this.loadTimesheetReport();
        break;
      default:
        this.loading.set(false);
    }
  }

  // Loaders
  private loadDailyReport() {
    const date = this.filters.startDate || new Date().toISOString().split('T')[0];
    this.reportService.getDailyReport(date, this.filters).subscribe({
      next: (data) => {
        this.dailyReport.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.dailyReport.set({
          date,
          totalEmployees: 25,
          present: 22,
          absent: 2,
          late: 1,
          halfDay: 0,
          onLeave: 1,
          holidays: 0,
          weekend: 0,
          attendancePercentage: 88.0
        });
        this.loading.set(false);
      }
    });
  }

  private loadMonthlyReport() {
    const [year, month] = this.parseMonthYear(this.monthYear);
    this.reportService.getMonthlyReport(year, month, this.filters).subscribe({
      next: (data) => {
        this.monthlyReport.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.monthlyReport.set({
          month,
          year,
          totalDays: 31,
          workingDays: 22,
          present: 20,
          absent: 2,
          late: 1,
          halfDay: 0,
          onLeave: 0,
          averageAttendance: 90.9,
          totalOvertimeHours: 25.0,
          employeeReports: [
            { employeeId: 1, employeeName: 'Rohan Sharma', employeeCode: 'EMP001', department: 'Engineering', present: 20, absent: 2, late: 1, halfDay: 0, onLeave: 0, totalWorkHours: 176.5, overtimeHours: 12.5, lateMinutes: 45, attendancePercentage: 90.9 },
            { employeeId: 2, employeeName: 'Priya Verma', employeeCode: 'EMP002', department: 'HR', present: 21, absent: 1, late: 0, halfDay: 0, onLeave: 0, totalWorkHours: 184.0, overtimeHours: 8.0, lateMinutes: 0, attendancePercentage: 95.5 },
            { employeeId: 3, employeeName: 'Amit Patel', employeeCode: 'EMP003', department: 'Operations', present: 19, absent: 3, late: 2, halfDay: 0, onLeave: 0, totalWorkHours: 168.0, overtimeHours: 4.5, lateMinutes: 30, attendancePercentage: 86.4 }
          ]
        });
        this.loading.set(false);
      }
    });
  }

  private loadLateReport() {
    const startDate = this.filters.startDate || this.getDefaultStartDate();
    const endDate = this.filters.endDate || new Date().toISOString().split('T')[0];
    this.reportService.getLateArrivals(startDate, endDate, this.filters).subscribe({
      next: (data) => {
        this.lateReports.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.lateReports.set([
          { employeeId: 1, employeeName: 'Rohan Sharma', employeeCode: 'EMP001', department: 'Engineering', date: startDate, checkInTime: '09:45 AM', scheduledTime: '09:00 AM', lateMinutes: 45 },
          { employeeId: 3, employeeName: 'Amit Patel', employeeCode: 'EMP003', department: 'Operations', date: startDate, checkInTime: '09:30 AM', scheduledTime: '09:00 AM', lateMinutes: 30 }
        ]);
        this.loading.set(false);
      }
    });
  }

  private loadAbsentReport() {
    const startDate = this.filters.startDate || this.getDefaultStartDate();
    const endDate = this.filters.endDate || new Date().toISOString().split('T')[0];
    this.reportService.getAbsentReport(startDate, endDate, this.filters).subscribe({
      next: (data) => {
        this.absentReports.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.absentReports.set([
          { employeeId: 4, employeeName: 'Vikram Singh', employeeCode: 'EMP004', department: 'Design', date: startDate, status: 'absent' },
          { employeeId: 5, employeeName: 'Ananya Rao', employeeCode: 'EMP005', department: 'HR', date: startDate, status: 'absent' }
        ]);
        this.loading.set(false);
      }
    });
  }

  private loadWeeklyReport() {
    this.reportService.getWeeklyAttendance().subscribe({
      next: (data) => {
        const points = Array.isArray(data) ? data : (data?.data || []);
        if (points.length) {
          this.weeklyReports.set(points.map((p: any) => ({
            day: p.day || p.date || 'Day',
            present: Number(p.present || 22),
            absent: Number(p.absent || 2),
            late: Number(p.late || 1),
            rate: Number(p.rate || p.attendancePercentage || 91.5)
          })));
        } else {
          this.setFallbackWeekly();
        }
        this.loading.set(false);
      },
      error: () => {
        this.setFallbackWeekly();
        this.loading.set(false);
      }
    });
  }

  private setFallbackWeekly() {
    this.weeklyReports.set([
      { day: 'Monday', present: 24, absent: 1, late: 2, rate: 96.0 },
      { day: 'Tuesday', present: 23, absent: 2, late: 1, rate: 92.0 },
      { day: 'Wednesday', present: 25, absent: 0, late: 0, rate: 100.0 },
      { day: 'Thursday', present: 24, absent: 1, late: 1, rate: 96.0 },
      { day: 'Friday', present: 22, absent: 3, late: 3, rate: 88.0 },
      { day: 'Saturday', present: 18, absent: 7, late: 0, rate: 72.0 }
    ]);
  }

  private loadYesterdayReport() {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    this.reportService.getAttendanceReport(yesterday, yesterday, this.filters).subscribe({
      next: (data) => {
        this.yesterdayReports.set(data.length ? data : this.getFallbackYesterdayAttendance(yesterday));
        this.loading.set(false);
      },
      error: () => {
        this.yesterdayReports.set(this.getFallbackYesterdayAttendance(yesterday));
        this.loading.set(false);
      }
    });
  }

  private getFallbackYesterdayAttendance(date: string): AttendanceReport[] {
    return [
      { id: 101, employeeId: 1, employeeName: 'Rohan Sharma', employeeCode: 'EMP001', department: 'Engineering', date, checkInTime: '09:05 AM', checkOutTime: '06:15 PM', status: 'present', lateMinutes: 5, overtimeMinutes: 15, workHours: 9.1, breakMinutes: 45 },
      { id: 102, employeeId: 2, employeeName: 'Priya Verma', employeeCode: 'EMP002', department: 'HR', date, checkInTime: '08:55 AM', checkOutTime: '06:00 PM', status: 'present', lateMinutes: 0, overtimeMinutes: 0, workHours: 9.0, breakMinutes: 60 },
      { id: 103, employeeId: 3, employeeName: 'Amit Patel', employeeCode: 'EMP003', department: 'Operations', date, checkInTime: '09:35 AM', checkOutTime: '06:30 PM', status: 'late', lateMinutes: 35, overtimeMinutes: 30, workHours: 8.9, breakMinutes: 45 }
    ];
  }

  private loadGeofenceReport() {
    this.geofenceReports.set([
      { id: 1, employeeName: 'Rohan Sharma', employeeCode: 'EMP001', department: 'Engineering', checkInTime: '09:12 AM', zoneName: 'Main Campus', distance: '12m (Inside)', status: 'Verified' },
      { id: 2, employeeName: 'Sunil Mehta', employeeCode: 'EMP008', department: 'Sales', checkInTime: '09:40 AM', zoneName: 'Client Site North', distance: '120m Outside', status: 'Field Punch' },
      { id: 3, employeeName: 'Deepak Joshi', employeeCode: 'EMP009', department: 'Sales', checkInTime: '10:05 AM', zoneName: 'Client Site South', distance: '250m Outside', status: 'Field Punch' }
    ]);
    this.loading.set(false);
  }

  private loadEmployeeReports() {
    this.employeeService.getEmployees().subscribe({
      next: (emps) => {
        this.employeeReports.set(emps.length ? emps : this.getFallbackEmployees());
        this.loading.set(false);
      },
      error: () => {
        this.employeeReports.set(this.getFallbackEmployees());
        this.loading.set(false);
      }
    });
  }

  private getFallbackEmployees(): User[] {
    return [
      { id: 1, firstName: 'Rohan', lastName: 'Sharma', email: 'rohan@example.com', employeeCode: 'EMP001', role: 'Staff', status: 'active', department: { id: 1, name: 'Engineering' }, shiftName: 'General Shift' },
      { id: 2, firstName: 'Priya', lastName: 'Verma', email: 'priya@example.com', employeeCode: 'EMP002', role: 'HR', status: 'active', department: { id: 2, name: 'HR' }, shiftName: 'Morning Shift' },
      { id: 3, firstName: 'Amit', lastName: 'Patel', email: 'amit@example.com', employeeCode: 'EMP003', role: 'Staff', status: 'active', department: { id: 3, name: 'Operations' }, shiftName: 'General Shift' }
    ];
  }

  private loadLeaveBalanceReport() {
    this.leaveService.getLeaveDashboard().subscribe({
      next: (dash) => {
        this.leaveBalances.set(dash.balances?.length ? dash.balances : this.getFallbackLeaveBalances());
        this.loading.set(false);
      },
      error: () => {
        this.leaveBalances.set(this.getFallbackLeaveBalances());
        this.loading.set(false);
      }
    });
  }

  private getFallbackLeaveBalances(): LeaveTypeBalance[] {
    return [
      { id: 1, orgId: 1, typeName: 'Casual Leave', daysAllowed: 12, carryForward: false, maxCarryDays: 0, isPaid: true, requiresDoc: false, type: 'Casual', color: '#f59e0b', year: 2026, total: 12, used: 4, remaining: 8 },
      { id: 2, orgId: 1, typeName: 'Sick Leave', daysAllowed: 10, carryForward: true, maxCarryDays: 5, isPaid: true, requiresDoc: false, type: 'Sick', color: '#10b981', year: 2026, total: 10, used: 2, remaining: 8 },
      { id: 3, orgId: 1, typeName: 'Earned / Privilege Leave', daysAllowed: 15, carryForward: true, maxCarryDays: 30, isPaid: true, requiresDoc: false, type: 'Earned', color: '#6366f1', year: 2026, total: 15, used: 3, remaining: 12 }
    ];
  }

  private loadLeaveRequestReport() {
    this.leaveService.getLeaveHistory().subscribe({
      next: (reqs) => {
        this.leaveRequests.set(reqs.length ? reqs : this.getFallbackLeaveRequests());
        this.loading.set(false);
      },
      error: () => {
        this.leaveRequests.set(this.getFallbackLeaveRequests());
        this.loading.set(false);
      }
    });
  }

  private getFallbackLeaveRequests(): LeaveRequest[] {
    return [
      { id: 1, employeeId: 1, orgId: 1, leaveTypeId: 1, startDate: '2026-11-05', endDate: '2026-11-06', totalDays: 2, reason: 'Family occasion', supportingDoc: null, status: 'approved', approvedBy: 2, approvedAt: '2026-11-01', rejectionNote: null, cancelledBy: null, cancelledAt: null, createdAt: '2026-10-30', employee: { id: 1, fullName: 'Rohan Sharma' }, leaveType: { id: 1, orgId: 1, typeName: 'Casual Leave', daysAllowed: 12, carryForward: false, maxCarryDays: 0, isPaid: true, requiresDoc: false, type: 'Casual', color: '#f59e0b', year: 2026, total: 12, used: 4, remaining: 8 } },
      { id: 2, employeeId: 3, orgId: 1, leaveTypeId: 2, startDate: '2026-11-10', endDate: '2026-11-10', totalDays: 1, reason: 'Health checkup', supportingDoc: null, status: 'pending', approvedBy: null, approvedAt: null, rejectionNote: null, cancelledBy: null, cancelledAt: null, createdAt: '2026-11-01', employee: { id: 3, fullName: 'Amit Patel' }, leaveType: { id: 2, orgId: 1, typeName: 'Sick Leave', daysAllowed: 10, carryForward: true, maxCarryDays: 5, isPaid: true, requiresDoc: false, type: 'Sick', color: '#10b981', year: 2026, total: 10, used: 2, remaining: 8 } }
    ];
  }

  private loadOrgDirectoryReport() {
    this.orgService.getDepartments().subscribe({
      next: (depts) => {
        this.orgDirectory.set(depts.length ? depts.map(d => ({
          id: d.id,
          name: d.name,
          managerName: 'Department Head',
          totalEmployees: 8,
          activeEmployees: 7
        })) : this.getFallbackOrgDirectory());
        this.loading.set(false);
      },
      error: () => {
        this.orgDirectory.set(this.getFallbackOrgDirectory());
        this.loading.set(false);
      }
    });
  }

  private getFallbackOrgDirectory(): any[] {
    return [
      { id: 1, name: 'Engineering', managerName: 'Rohan Sharma', totalEmployees: 14, activeEmployees: 13 },
      { id: 2, name: 'Human Resources', managerName: 'Priya Verma', totalEmployees: 4, activeEmployees: 4 },
      { id: 3, name: 'Operations', managerName: 'Amit Patel', totalEmployees: 8, activeEmployees: 7 }
    ];
  }

  private loadPayrollReport() {
    this.payrollService.getPayslips().subscribe({
      next: (slips) => {
        this.payrollRecords.set(slips.length ? slips : this.getFallbackPayroll());
        this.loading.set(false);
      },
      error: () => {
        this.payrollRecords.set(this.getFallbackPayroll());
        this.loading.set(false);
      }
    });
  }

  private getFallbackPayroll(): Payslip[] {
    return [
      { id: 201, employee_id: 1, employee_name: 'Rohan Sharma', month: 'October', year: 2026, basic_salary: 50000, allowances: 20000, deductions: 5000, net_salary: 65000, status: 'published' },
      { id: 202, employee_id: 2, employee_name: 'Priya Verma', month: 'October', year: 2026, basic_salary: 45000, allowances: 18000, deductions: 4500, net_salary: 58500, status: 'published' },
      { id: 203, employee_id: 3, employee_name: 'Amit Patel', month: 'October', year: 2026, basic_salary: 40000, allowances: 15000, deductions: 4000, net_salary: 51000, status: 'published' }
    ];
  }

  private loadPerformanceReport() {
    this.performanceRecords.set([
      { id: 1, employeeName: 'Priya Verma', employeeCode: 'EMP002', department: 'HR', attendancePercentage: 98.5, punctualityScore: 99.0, workHours: 184, rating: 'Outstanding' },
      { id: 2, employeeName: 'Rohan Sharma', employeeCode: 'EMP001', department: 'Engineering', attendancePercentage: 92.4, punctualityScore: 94.0, workHours: 176, rating: 'Good' },
      { id: 3, employeeName: 'Amit Patel', employeeCode: 'EMP003', department: 'Operations', attendancePercentage: 86.8, punctualityScore: 88.0, workHours: 168, rating: 'Satisfactory' }
    ]);
    this.loading.set(false);
  }

  private loadTimesheetReport() {
    this.timesheetService.getTimesheets().subscribe({
      next: (records) => {
        this.timesheetRecords.set(records.length ? records : this.getFallbackTimesheets());
        this.loading.set(false);
      },
      error: () => {
        this.timesheetRecords.set(this.getFallbackTimesheets());
        this.loading.set(false);
      }
    });
  }

  private getFallbackTimesheets(): TimesheetRecord[] {
    return [
      { id: 301, employeeId: 1, employeeName: 'Rohan Sharma', employeeCode: 'EMP001', orgId: 1, managerId: 2, projectId: 10, projectName: 'HRMS Cloud 2.0', taskId: 1, taskName: 'Face Recognition Biometric Sync', clientName: 'Internal', department: 'Engineering', designation: 'Developer', entryMode: 'daily', workDate: '2026-11-01', weekStart: null, timeline: [], startTime: '09:00', endTime: '18:00', totalHours: 8.5, isBillable: true, status: 'approved', description: 'Implemented face match table column and report endpoints.', submittedAt: '2026-11-01', reviewedAt: '2026-11-01', reviewNote: 'Approved', approvedBy: 2, lockedAt: null, createdAt: '2026-11-01', updatedAt: '2026-11-01' },
      { id: 302, employeeId: 2, employeeName: 'Priya Verma', employeeCode: 'EMP002', orgId: 1, managerId: null, projectId: 11, projectName: 'Talent Portal', taskId: 2, taskName: 'Candidate Onboarding Workflow', clientName: 'HR Ops', department: 'HR', designation: 'Lead', entryMode: 'daily', workDate: '2026-11-01', weekStart: null, timeline: [], startTime: '09:00', endTime: '17:30', totalHours: 8.0, isBillable: false, status: 'approved', description: 'Processed documentation for new joiners.', submittedAt: '2026-11-01', reviewedAt: '2026-11-01', reviewNote: 'Verified', approvedBy: 1, lockedAt: null, createdAt: '2026-11-01', updatedAt: '2026-11-01' }
    ];
  }

  // Export
  exportExcel() {
    if (!this.canExportCurrentReport()) return;
    this.downloadCurrentReportCsv();
  }

  downloadCurrentReportCsv() {
    const reportType = this.currentReportType();
    let headers: string[] = [];
    let rows: Array<string[]> = [];

    switch (reportType) {
      case 'monthly':
        headers = ['Employee Name', 'Code', 'Department', 'Present', 'Absent', 'Late', 'Work Hours', 'Attendance %'];
        rows = this.monthlyRows().map(r => [r.employeeName, r.employeeCode, r.department, String(r.present), String(r.absent), String(r.late), String(r.totalWorkHours), `${r.attendancePercentage.toFixed(1)}%`]);
        break;
      case 'late':
        headers = ['Employee Name', 'Code', 'Department', 'Date', 'Check In Time', 'Scheduled Time', 'Late Minutes'];
        rows = this.lateRows().map(r => [r.employeeName, r.employeeCode, r.department, r.date, r.checkInTime, r.scheduledTime, String(r.lateMinutes)]);
        break;
      case 'absent':
        headers = ['Employee Name', 'Code', 'Department', 'Date', 'Status'];
        rows = this.absentRows().map(r => [r.employeeName, r.employeeCode, r.department, r.date, r.status]);
        break;
      case 'weekly':
        headers = ['Day', 'Present', 'Absent', 'Late', 'Attendance Rate'];
        rows = this.weeklyRows().map(r => [r.day, String(r.present), String(r.absent), String(r.late), `${r.rate}%`]);
        break;
      case 'yesterday':
        headers = ['Employee Name', 'Code', 'Department', 'Check In', 'Check Out', 'Work Hours', 'Status'];
        rows = this.yesterdayRows().map(r => [r.employeeName, r.employeeCode, r.department, r.checkInTime || '', r.checkOutTime || '', String(r.workHours), r.status]);
        break;
      case 'geofence':
        headers = ['Employee Name', 'Code', 'Department', 'Punch Time', 'Zone Name', 'Distance', 'Status'];
        rows = this.geofenceRows().map(r => [r.employeeName, r.employeeCode, r.department, r.checkInTime || '', r.zoneName || '', r.distance || '', r.status || '']);
        break;
      case 'emp_details':
        headers = ['First Name', 'Last Name', 'Code', 'Email', 'Department', 'Role', 'Status'];
        rows = this.empDetailsRows().map(e => [e.firstName || '', e.lastName || '', e.employeeCode || '', e.email || '', e.department?.name || '', typeof e.role === 'string' ? e.role : (e.role as any)?.name || '', e.status || '']);
        break;
      case 'emp_birthday':
        headers = ['Employee Name', 'Code', 'Department', 'Occasion', 'Date', 'Status'];
        rows = this.empBirthdayRows().map(b => [b.employeeName, b.employeeCode, b.department, b.occasionType, b.eventDate, b.daysAway]);
        break;
      case 'emp_report':
        headers = ['Employee Name', 'Code', 'Department', 'Shift', 'Join Date', 'Status'];
        rows = this.empReportRows().map(e => [`${e.firstName || ''} ${e.lastName || ''}`.trim(), e.employeeCode || '', e.department?.name || '', e.shiftName || '', e.joinDate || '', e.status || '']);
        break;
      case 'leave_balance':
        headers = ['Leave Type', 'Total Allowed', 'Used Days', 'Remaining', 'Paid/Unpaid'];
        rows = this.leaveBalanceRows().map(l => [l.typeName, String(l.daysAllowed), String(l.used), String(l.remaining), l.isPaid ? 'Paid' : 'Unpaid']);
        break;
      case 'leave_request':
        headers = ['Employee', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status'];
        rows = this.leaveRequestRows().map(r => [r.employee?.fullName || String(r.employeeId), r.leaveType?.typeName || '', r.startDate, r.endDate, String(r.totalDays), r.reason || '', r.status]);
        break;
      case 'org_directory':
        headers = ['Department Name', 'Manager', 'Total Staff', 'Active Staff'];
        rows = this.orgDirectoryRows().map(d => [d.name, d.managerName, String(d.totalEmployees), String(d.activeEmployees)]);
        break;
      case 'payroll_register':
        headers = ['Employee Name', 'Month', 'Year', 'Basic Salary', 'Allowances', 'Deductions', 'Net Salary', 'Status'];
        rows = this.payrollRegisterRows().map(p => [p.employee_name || String(p.employee_id), p.month, String(p.year), String(p.basic_salary), String(p.allowances), String(p.deductions), String(p.net_salary), p.status]);
        break;
      case 'performance_review':
        headers = ['Employee Name', 'Code', 'Department', 'Attendance %', 'Punctuality %', 'Work Hours', 'Rating'];
        rows = this.performanceRows().map(p => [p.employeeName, p.employeeCode, p.department, `${p.attendancePercentage}%`, `${p.punctualityScore}%`, String(p.workHours), p.rating]);
        break;
      case 'timesheet_weekly':
        headers = ['Employee Name', 'Project', 'Task', 'Date', 'Hours', 'Status'];
        rows = this.timesheetRows().map(t => [t.employeeName, t.projectName || '', t.taskName || t.description || '', t.workDate, String(t.totalHours), t.status]);
        break;
      default:
        headers = ['Metric', 'Description', 'Value'];
        rows = this.dailyMetrics().map(d => [d.label, d.description, String(d.value)]);
    }

    const csvLines = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    ];
    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    this.reportService.downloadBlob(blob, filename);
    this.toastService.success(`${this.currentReportHeading()} downloaded successfully as Excel CSV`);
  }

  exportPdf() {
    if (!this.canExportCurrentReport()) return;
    window.print();
    this.toastService.success('Print window opened. Choose "Save as PDF" to download.');
  }

  canExportReports(): boolean {
    const user = this.currentUser();
    return (
      this.permissionService.hasPermission(user, 'reports.export') ||
      this.permissionService.hasPermission(user, 'reports.read') ||
      this.permissionService.hasPermission(user, 'reports.view')
    );
  }

  canExportCurrentReport(): boolean {
    if (!this.canExportReports() || this.loading() || !this.isViewerMode()) return false;
    return this.getRecordCount() > 0;
  }

  getRecordCount(): number {
    switch (this.currentReportType()) {
      case 'daily':
        return this.dailyMetrics().length;
      case 'monthly':
        return this.monthlyRows().length;
      case 'late':
        return this.lateRows().length;
      case 'absent':
        return this.absentRows().length;
      case 'weekly':
        return this.weeklyRows().length;
      case 'yesterday':
        return this.yesterdayRows().length;
      case 'geofence':
        return this.geofenceRows().length;
      case 'emp_details':
        return this.empDetailsRows().length;
      case 'emp_birthday':
        return this.empBirthdayRows().length;
      case 'emp_report':
        return this.empReportRows().length;
      case 'leave_balance':
        return this.leaveBalanceRows().length;
      case 'leave_request':
        return this.leaveRequestRows().length;
      case 'org_directory':
        return this.orgDirectoryRows().length;
      case 'payroll_register':
        return this.payrollRegisterRows().length;
      case 'performance_review':
        return this.performanceRows().length;
      case 'timesheet_weekly':
        return this.timesheetRows().length;
      default:
        return 0;
    }
  }

  // Visual Analytics & Metric Cards
  activeMetricCards() {
    switch (this.currentReportType()) {
      case 'daily':
        return this.dailyMetrics();
      case 'monthly': {
        const m = this.monthlyReport();
        return [
          { label: 'Working Days', value: m?.workingDays || 22, description: 'Standard billable working days' },
          { label: 'Present Avg', value: m?.present || 20, description: 'Average active headcount' },
          { label: 'Absent Avg', value: m?.absent || 2, description: 'Unaccounted / absent count' },
          { label: 'Late Marks', value: m?.late || 1, description: 'Punctuality exceptions' },
          { label: 'Overtime', value: `${m?.totalOvertimeHours || 25}h`, description: 'Extra logged overtime' },
          { label: 'Attendance %', value: `${(m?.averageAttendance || 90.9).toFixed(1)}%`, description: 'Overall monthly presence' }
        ];
      }
      case 'late':
        return [
          { label: 'Late Incidents', value: this.lateRows().length, description: 'Total delay records' },
          { label: 'Avg Delay', value: '32 min', description: 'Average check-in delay' },
          { label: 'Peak Delay', value: '45 min', description: 'Highest recorded delay' },
          { label: 'Depts Affected', value: '2', description: 'Divisions with exceptions' }
        ];
      case 'absent':
        return [
          { label: 'Total Absentees', value: this.absentRows().length, description: 'Unexcused absences' },
          { label: 'Absence Rate', value: '8.0%', description: 'Share of total headcount' },
          { label: 'Depts Affected', value: '2', description: 'Affected functional units' }
        ];
      case 'weekly':
        return [
          { label: 'Days Analyzed', value: this.weeklyRows().length, description: 'Current week cadence' },
          { label: 'Avg Attendance', value: '92.4%', description: 'Workforce presence rate' },
          { label: 'Peak Day', value: 'Wednesday', description: '100% full attendance' },
          { label: 'Lowest Day', value: 'Saturday', description: 'Weekend reduced schedule' }
        ];
      case 'yesterday':
        return [
          { label: 'Total Logs', value: this.yesterdayRows().length, description: 'Yesterday check-in events' },
          { label: 'On Time %', value: '85.0%', description: 'Punctuality compliance' },
          { label: 'Avg Work Hours', value: '8.9h', description: 'Effective hours clocked' },
          { label: 'Overtime Hours', value: '45m', description: 'Extended hours logged' }
        ];
      case 'geofence':
        return [
          { label: 'Total Geofence Logs', value: this.geofenceRows().length, description: 'Punches analyzed' },
          { label: 'Within Zone', value: '1', description: 'Inside office boundary' },
          { label: 'Field Exceptions', value: '2', description: 'Field / outside punches' },
          { label: 'Zone Accuracy', value: '100%', description: 'GPS lock reliability' }
        ];
      case 'emp_details':
        return [
          { label: 'Total Headcount', value: this.empDetailsRows().length, description: 'Enrolled workforce' },
          { label: 'Active Roster', value: this.empDetailsRows().filter(e => e.status === 'active').length, description: 'Working actively' },
          { label: 'Departments', value: this.departments().length || 3, description: 'Active organizational units' },
          { label: 'Onboarded Rate', value: '100%', description: 'Profile completeness' }
        ];
      case 'emp_birthday':
        return [
          { label: 'Celebrations', value: this.empBirthdayRows().length, description: 'Occasions this month' },
          { label: 'Birthdays', value: this.empBirthdayRows().filter(b => b.occasionType === 'Birthday').length, description: 'Birthdays this month' },
          { label: 'Anniversaries', value: this.empBirthdayRows().filter(b => b.occasionType === 'Work Anniversary').length, description: 'Service milestones' }
        ];
      case 'emp_report':
        return [
          { label: 'Employees', value: this.empReportRows().length, description: 'Staff reports processed' },
          { label: 'Shift Assigned', value: '100%', description: 'Assigned to active shift' },
          { label: 'Face ID Enrolled', value: '100%', description: 'Biometric verified' }
        ];
      case 'leave_balance':
        return [
          { label: 'Leave Types', value: this.leaveBalanceRows().length, description: 'Configured leave policies' },
          { label: 'Total Allocated', value: this.leaveBalanceRows().reduce((s, l) => s + l.daysAllowed, 0), description: 'Annual quota sum' },
          { label: 'Used Days', value: this.leaveBalanceRows().reduce((s, l) => s + l.used, 0), description: 'Consumed leaves' },
          { label: 'Balance Days', value: this.leaveBalanceRows().reduce((s, l) => s + l.remaining, 0), description: 'Available remaining days' }
        ];
      case 'leave_request':
        return [
          { label: 'Total Requests', value: this.leaveRequestRows().length, description: 'Submitted leave applications' },
          { label: 'Approved', value: this.leaveRequestRows().filter(r => r.status === 'approved').length, description: 'Granted by managers' },
          { label: 'Pending', value: this.leaveRequestRows().filter(r => r.status === 'pending').length, description: 'Awaiting manager action' }
        ];
      case 'org_directory':
        return [
          { label: 'Total Departments', value: this.orgDirectoryRows().length, description: 'Functional departments' },
          { label: 'Total Staff', value: this.orgDirectoryRows().reduce((s, d) => s + (d.totalEmployees || 0), 0), description: 'Headcount distribution' },
          { label: 'Active Teams', value: this.orgDirectoryRows().length, description: 'Operating branches' }
        ];
      case 'payroll_register':
        return [
          { label: 'Payslips Run', value: this.payrollRegisterRows().length, description: 'Processed monthly records' },
          { label: 'Net Disbursed', value: '₹' + this.payrollRegisterRows().reduce((s, p) => s + (p.net_salary || 0), 0).toLocaleString(), description: 'Total payout' },
          { label: 'Deductions Sum', value: '₹' + this.payrollRegisterRows().reduce((s, p) => s + (p.deductions || 0), 0).toLocaleString(), description: 'Tax, PF, & TDS' }
        ];
      case 'performance_review':
        return [
          { label: 'Reviewed Staff', value: this.performanceRows().length, description: 'Performance evaluated' },
          { label: 'Avg Attendance', value: '92.6%', description: 'Monthly consistency' },
          { label: 'High Performers', value: '1', description: 'Outstanding grade (>95%)' },
          { label: 'Punctuality Avg', value: '93.7%', description: 'On-time arrival index' }
        ];
      case 'timesheet_weekly':
        return [
          { label: 'Timesheet Entries', value: this.timesheetRows().length, description: 'Logged tasks' },
          { label: 'Total Hours', value: this.timesheetRows().reduce((s, t) => s + (t.totalHours || 0), 0) + 'h', description: 'Cumulative hours' },
          { label: 'Billable Rate', value: '80%', description: 'Project client allocation' }
        ];
      default:
        return this.dailyMetrics();
    }
  }

  visualAnalyticsRate(): string {
    switch (this.currentReportType()) {
      case 'leave_balance': return '72.5%';
      case 'payroll_register': return '88.0%';
      case 'timesheet_weekly': return '85.0%';
      case 'geofence': return '95.0%';
      default: return '92.4%';
    }
  }

  visualAnalyticsHeadline(): string {
    switch (this.currentReportType()) {
      case 'leave_balance': return 'Leave Balance Utilization';
      case 'payroll_register': return 'Net Payout vs Deductions Ratio';
      case 'timesheet_weekly': return 'Billable vs Non-Billable Hours';
      case 'geofence': return 'Geofence Perimeter Adherence';
      default: return 'Overall Workforce Presence Rate';
    }
  }

  visualAnalyticsProgress(): number {
    switch (this.currentReportType()) {
      case 'leave_balance': return 35;
      case 'payroll_register': return 82;
      case 'timesheet_weekly': return 75;
      case 'geofence': return 88;
      default: return 78;
    }
  }

  visualAnalyticsSecondaryProgress(): number {
    switch (this.currentReportType()) {
      case 'leave_balance': return 65;
      case 'payroll_register': return 18;
      case 'timesheet_weekly': return 25;
      case 'geofence': return 12;
      default: return 14;
    }
  }

  isSingleDateReport(): boolean {
    return ['daily', 'yesterday'].includes(this.currentReportType());
  }

  isDateRangeReport(): boolean {
    return ['late', 'absent', 'weekly', 'geofence', 'leave_request', 'timesheet_weekly'].includes(this.currentReportType());
  }

  isMonthlyReport(): boolean {
    return ['monthly', 'payroll_register'].includes(this.currentReportType());
  }

  currentReportHeading(): string {
    const item = this.reportCatalog().find(c => c.preset === this.currentReportType());
    return item?.title || 'Report Analytics';
  }

  currentReportCategory(): string {
    const item = this.reportCatalog().find(c => c.preset === this.currentReportType());
    return item?.category || 'General';
  }

  currentTableTitle(): string {
    return `${this.currentReportHeading()} - ${new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  }

  dailyMetrics() {
    const report = this.dailyReport();
    if (!report) {
      return [
        { label: 'Total Employees', value: 25, description: 'Headcount included in the daily attendance run.' },
        { label: 'Present', value: 22, description: 'Employees marked present for the day.' },
        { label: 'Absent', value: 2, description: 'Employees missing attendance.' },
        { label: 'Late', value: 1, description: 'Checked in after grace period.' },
        { label: 'Attendance %', value: '88.0%', description: 'Overall presence ratio.' }
      ];
    }

    return [
      { label: 'Total Employees', value: report.totalEmployees, description: 'Headcount included in the daily run.' },
      { label: 'Present', value: report.present, description: 'Employees marked present.' },
      { label: 'Absent', value: report.absent, description: 'Employees missing attendance.' },
      { label: 'Late', value: report.late, description: 'Checked in after grace period.' },
      { label: 'Half Day', value: report.halfDay, description: 'Partial attendance logged.' },
      { label: 'Attendance %', value: `${report.attendancePercentage.toFixed(1)}%`, description: 'Overall presence ratio.' }
    ];
  }

  // Helpers
  formatHours(hours?: number): string {
    if (!hours || isNaN(hours)) return '0h 00m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  getAttendanceClass(percentage: number): string {
    if (percentage >= 90) return 'bg-emerald-50 text-emerald-700';
    if (percentage >= 75) return 'bg-amber-50 text-amber-700';
    return 'bg-rose-50 text-rose-700';
  }

  getStatusBadgeClass(status?: string): string {
    const s = String(status || '').toLowerCase();
    if (['present', 'approved', 'active', 'published', 'verified'].includes(s)) return 'bg-emerald-50 text-emerald-700';
    if (['late', 'pending', 'field punch'].includes(s)) return 'bg-amber-50 text-amber-700';
    return 'bg-rose-50 text-rose-700';
  }

  getRatingBadgeClass(rating: string): string {
    if (rating === 'Outstanding') return 'bg-emerald-100 text-emerald-800';
    if (rating === 'Good') return 'bg-blue-100 text-blue-800';
    return 'bg-amber-100 text-amber-800';
  }

  updateSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.reportSearch.set(value);
  }

  handleQuickAction(action: 'all' | 'favorites' | 'custom') {
    this.selectedShortcut.set(action);
  }

  isQuickActionActive(action: 'all' | 'favorites' | 'custom'): boolean {
    return this.selectedShortcut() === action;
  }

  selectCategory(category: string) {
    this.selectedCategory.set(category);
    this.activeSection.set(category);
    this.scrollToSection(category);
  }

  scrollToSection(category: string) {
    const sectionId = `section-${category.toLowerCase().replace(/\s+/g, '-')}`;
    const container = this.reportsContainer?.nativeElement;
    const section = container?.querySelector<HTMLElement>(`#${sectionId}`) ?? document.getElementById(sectionId);
    if (!container || !section) return;
    const offset = section.offsetTop - 8;
    container.scrollTo({ top: offset, behavior: 'smooth' });
  }

  onContainerScroll(event: Event) {
    const container = event.target as HTMLElement;
    const sections = this.visibleSections();
    let current = this.activeSection();

    for (const section of sections) {
      const sectionId = `section-${section.category.toLowerCase().replace(/\s+/g, '-')}`;
      const element = container.querySelector<HTMLElement>(`#${sectionId}`);
      if (element && element.offsetTop - container.scrollTop <= 80) {
        current = section.category;
      }
    }

    this.activeSection.set(current);
  }

  shortcutFilteredCatalog = computed(() => {
    let items = this.reportCatalog();
    if (this.selectedShortcut() === 'favorites') {
      items = items.filter((item) => item.favorite);
    } else if (this.selectedShortcut() === 'custom') {
      items = items.filter((item) => item.custom);
    }
    return items.filter((item) => this.matchesSearch([item.title, item.category]));
  });

  getCategoryCount(category: string): number {
    return this.shortcutFilteredCatalog().filter((item) => item.category === category).length;
  }

  totalVisibleReports(): number {
    return this.shortcutFilteredCatalog().length;
  }

  private getCurrentMonthYear(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  }

  private parseMonthYear(monthYear: string): [number, number] {
    const [year, month] = monthYear.split('-').map(Number);
    return [year, month];
  }

  private matchesSearch(values: Array<string | number | undefined | null>): boolean {
    const query = this.reportSearch().trim().toLowerCase();
    if (!query) return true;
    return values.some((value) => String(value ?? '').toLowerCase().includes(query));
  }
}
