import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService, DailyReport, MonthlyReport, LateArrivalReport, AbsentReport, ReportFilters } from '../../core/services/report.service';
import { OrganizationService, Department } from '../../core/services/organization.service';
import { ToastService } from '../../core/services/toast.service';
import { UiSelectAdvancedComponent } from '../../core/components/ui/ui-select-advanced.component';
import { PermissionService } from '../../core/services/permission.service';
import { AuthService } from '../../core/services/auth.service';
import { LayoutService } from '../../core/services/layout.service';
import { User } from '../../core/models/auth.model';

type CatalogItem = {
  id: string;
  title: string;
  category: string;
  favorite: boolean;
  custom: boolean;
  preset?: 'daily' | 'monthly' | 'late' | 'absent';
};

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, UiSelectAdvancedComponent],
  template: `
    <div class="flex h-full flex-col overflow-hidden bg-transparent">
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
          <div class="hidden lg:col-span-3 lg:flex xl:col-span-3">
            <div class="flex h-full w-full flex-col gap-5 overflow-y-auto pr-2">
              <!-- Quick Actions Card -->
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
                <div class="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
                  <!-- Viewer Header -->
                  <div class="flex flex-none flex-col border-b border-slate-100 bg-white">
                    <div class="flex items-center justify-between px-6 py-4">
                      <div class="flex items-center gap-4">
                        <button (click)="goBack()" class="group flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-all hover:border-slate-900 hover:text-slate-900 hover:shadow-xl hover:shadow-slate-200">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>
                        </button>
                        <div>
                          <p class="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Viewing Dataset</p>
                          <h2 class="mt-0.5 text-2xl font-black tracking-tight text-slate-900" style="font-family: 'Sora', sans-serif;">{{ currentReportHeading() }}</h2>
                        </div>
                      </div>

                      <div class="flex items-center gap-2">
                        <button (click)="exportExcel()" class="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                          Excel
                        </button>
                        <button (click)="exportPdf()" class="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                          PDF
                        </button>
                      </div>
                    </div>

                    <div class="flex items-center gap-6 border-t border-slate-100 bg-slate-50/40 px-8 py-4">
                      <div class="flex flex-1 items-center gap-5">
                        @if (currentReportType() === 'daily' || currentReportType() === 'late' || currentReportType() === 'absent') {
                          <div class="flex flex-col gap-1.5">
                            <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Report Date</span>
                            <input type="date" [(ngModel)]="filters.startDate" (change)="loadReport()" class="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 outline-none transition-all focus:border-slate-900 focus:ring-4 focus:ring-slate-100">
                          </div>
                        }

                        @if (currentReportType() === 'monthly') {
                          <div class="flex flex-col gap-1.5">
                            <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Report Month</span>
                            <input type="month" [(ngModel)]="monthYear" (change)="loadReport()" class="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 outline-none transition-all focus:border-slate-900 focus:ring-4 focus:ring-slate-100">
                          </div>
                        }

                        <div class="flex flex-col gap-1.5">
                          <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Department</span>
                          <select [(ngModel)]="filters.departmentId" (change)="loadReport()" class="h-10 min-w-[12rem] rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 outline-none transition-all focus:border-slate-900 focus:ring-4 focus:ring-slate-100">
                            @for (opt of departmentOptions(); track opt.value) {
                              <option [value]="opt.value">{{ opt.label }}</option>
                            }
                          </select>
                        </div>
                      </div>

                      <div class="flex flex-col gap-1.5">
                        <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 text-right pr-2">Search Records</span>
                        <div class="relative w-72">
                          <input type="text" [ngModel]="reportSearch()" (ngModelChange)="reportSearch.set($event)" placeholder="Filter by name, code or status..." class="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-semibold outline-none transition-all focus:border-slate-900 focus:ring-4 focus:ring-slate-100">
                          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Viewer Content -->
                  <div class="min-h-0 flex-1 overflow-y-auto bg-white px-8 py-8">
                    <div class="space-y-10">
                      <!-- Summary Stats -->
                      @if (currentReportType() === 'daily') {
                        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                          @for (stat of dailyMetrics(); track stat.label) {
                            <div class="group relative overflow-hidden rounded-xl border border-slate-100 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200">
                              <div class="flex flex-col">
                                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ stat.label }}</p>
                                <p class="mt-2 text-3xl font-black tracking-tight text-slate-900">{{ stat.value }}</p>
                              </div>
                              <div class="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-slate-50 group-hover:scale-150 transition-transform"></div>
                            </div>
                          }
                        </div>
                      }

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
                              } @else {
                                @for (stat of dailyMetrics(); track stat.label) {
                                  <tr class="hover:bg-slate-50/50 transition">
                                    <td class="px-5 py-4 text-sm font-bold text-slate-900">{{ stat.label }}</td>
                                    <td class="px-5 py-4 text-sm text-slate-600">{{ stat.description }}</td>
                                    <td class="px-5 py-4 text-right text-sm font-black text-slate-900">{{ stat.value }}</td>
                                  </tr>
                                }
                              }

                              @if (isEmpty()) {
                                <tr>
                                  <td colspan="10" class="px-5 py-12 text-center">
                                    <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                                    </div>
                                    <p class="mt-4 text-sm font-semibold text-slate-900">No records found</p>
                                    <p class="mt-1 text-xs text-slate-500">Try adjusting your filters or search query.</p>
                                  </td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              } @else {
                <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
                  <div class="flex items-center justify-between border-b border-slate-100 bg-white px-8 py-6">
                    <div>
                      <h2 class="text-2xl font-black tracking-tight text-slate-900" style="font-family: 'Sora', sans-serif;">Report Catalog</h2>
                      <p class="mt-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Browse and generate available system reports</p>
                    </div>
                    <div class="rounded-xl bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ring-1 ring-slate-200">
                      {{ allReportsFlat().length }} Total Reports
                    </div>
                  </div>

                  <div #reportsContainer (scroll)="onContainerScroll($event)" class="min-h-0 flex-1 overflow-y-auto bg-white scroll-smooth">
                    @for (section of sectionsComputed(); track section.id) {
                      <div [id]="'section-' + section.id">
                        <div class="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/90 backdrop-blur-xl px-8 py-4">
                          <div class="flex items-center gap-3">
                            <span class="h-6 w-1 rounded-full bg-slate-900"></span>
                            <span class="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900">{{ section.label }}</span>
                          </div>
                          <span class="rounded-xl bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-400 shadow-sm ring-1 ring-slate-200">{{ section.count }}</span>
                        </div>

                        <div class="divide-y divide-slate-100">
                          @for (report of section.data; track report.id) {
                            <button
                              (click)="openCatalogReport(report)"
                              class="group flex w-full items-center gap-5 px-8 py-6 text-left transition-all hover:bg-slate-50"
                            >
                              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:shadow-xl group-hover:shadow-slate-200 transition-all duration-300">
                                <svg *ngIf="!report.favorite" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                                <svg *ngIf="report.favorite" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="text-amber-400"><path d="M12 17.75l-6.172 3.245 1.179-6.873-4.993-4.867 6.9-1.002L12 2l3.086 6.253 6.9 1.002-4.993 4.867 1.179 6.873z"/></svg>
                              </div>
                              <div class="min-w-0 flex-1">
                                <h4 class="text-base font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors" style="font-family: 'Sora', sans-serif;">{{ report.title }}</h4>
                                <p class="mt-1 text-xs font-medium text-slate-500">Access comprehensive analytics for {{ section.label.toLowerCase() }} data models.</p>
                              </div>
                              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-transparent group-hover:border-slate-200 group-hover:bg-white transition-all">
                                <svg class="h-4 w-4 text-slate-300 group-hover:translate-x-0.5 group-hover:text-slate-900 transition-all" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                              </div>
                            </button>
                          }
                        </div>
                      </div>
                    }
                    <div class="h-20"></div>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ReportsComponent implements OnInit {
  @ViewChild('reportsContainer') reportsContainer?: ElementRef<HTMLElement>;

  private reportService = inject(ReportService);
  private orgService = inject(OrganizationService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  public layoutService = inject(LayoutService);

  goBack() {
    this.layoutService.setPrimaryAction(null);
    this.isViewerMode.set(false);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { preset: null },
      queryParamsHandling: 'merge'
    });
  }
  private permissionService = inject(PermissionService);
  private authService = inject(AuthService);


  loading = signal<boolean>(false);
  currentReportType = signal<'daily' | 'monthly' | 'late' | 'absent'>('daily');
  reportSearch = signal<string>('');
  selectedCategory = signal<string>('Attendance');
  activeSection = signal<string>('Attendance');
  selectedShortcut = signal<'all' | 'favorites' | 'custom'>('all');
  isSearchBoxOpen = signal<boolean>(false);
  isViewerMode = signal<boolean>(false);

  dailyReport = signal<DailyReport | null>(null);
  monthlyReport = signal<MonthlyReport | null>(null);
  lateReports = signal<LateArrivalReport[]>([]);
  absentReports = signal<AbsentReport[]>([]);
  departments = signal<Department[]>([]);
  currentUser = signal<User | null>(null);

  departmentOptions = computed(() => {
    return [
      { label: 'All Departments', value: undefined },
      ...this.departments().map((d) => ({ label: d.name, value: d.id }))
    ];
  });

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

  reportCatalog = computed<CatalogItem[]>(() => [
    { id: 'att-daily', title: 'Daily Attendance Summary', category: 'Attendance', favorite: true, custom: false, preset: 'daily' as const },
    { id: 'att-weekly', title: 'Weekly Attendance Average Summary', category: 'Attendance', favorite: false, custom: false },
    { id: 'att-yesterday', title: 'Yesterday Attendance Summary', category: 'Attendance', favorite: false, custom: false },
    { id: 'att-geofence', title: 'Yesterday\'s Outside Geo-fence Summary', category: 'Attendance', favorite: false, custom: true },
    { id: 'att-late', title: 'Late Arrival Summary', category: 'Attendance', favorite: false, custom: false, preset: 'late' as const },
    { id: 'att-absent', title: 'Absent Employee Summary', category: 'Attendance', favorite: false, custom: false, preset: 'absent' as const },
    { id: 'emp-details', title: 'Employee Details', category: 'Employee', favorite: true, custom: false },
    { id: 'emp-birthday', title: 'Upcoming Birthdays this month', category: 'Employee', favorite: true, custom: false },
    { id: 'emp-report', title: 'Employee Details Report', category: 'Employee', favorite: false, custom: false },
    { id: 'leave-balance', title: 'Leave Balance Summary', category: 'Leave', favorite: false, custom: false },
    { id: 'leave-request', title: 'Leave Request Summary', category: 'Leave', favorite: false, custom: true },
    { id: 'org-directory', title: 'Organization Directory', category: 'Organisation', favorite: false, custom: false },
    { id: 'payroll-register', title: 'Payroll Register', category: 'Payroll', favorite: false, custom: false },
    { id: 'performance-review', title: 'Performance Review Summary', category: 'Performance', favorite: false, custom: true },
    { id: 'timesheet-weekly', title: 'Weekly Timesheet Summary', category: 'Timesheets', favorite: false, custom: false },
    { id: 'monthly-register', title: 'Monthly Attendance Register', category: 'Attendance', favorite: false, custom: false, preset: 'monthly' as const },
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

  sectionsComputed = computed(() =>
    this.visibleSections().map((section) => ({
      id: section.category.toLowerCase().replace(/\s+/g, '-'),
      label: section.category,
      count: section.items.length,
      data: section.items
    }))
  );

  allReportsFlat = computed(() => this.shortcutFilteredCatalog());

  filteredReports = computed(() => {
    const query = this.reportSearch().trim().toLowerCase();
    if (!query) return [];
    return this.allReportsFlat().filter((report) =>
      [report.title, report.category].some((value) => String(value ?? '').toLowerCase().includes(query))
    );
  });

  groupedSearchResults = computed(() => {
    const groups: Record<string, CatalogItem[]> = {};
    for (const report of this.filteredReports()) {
      const category = String(report.category || 'Other').toUpperCase();
      if (!groups[category]) groups[category] = [];
      groups[category].push(report);
    }
    return groups;
  });

  searchResultKeys = computed(() => Object.keys(this.groupedSearchResults()).sort());

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
      const preset = params.get('preset') as 'daily' | 'monthly' | 'late' | 'absent' | null;
      this.isViewerMode.set(!!preset);
      if (preset && ['daily', 'monthly', 'late', 'absent'].includes(preset)) {
        this.currentReportType.set(preset);
      }
      this.selectedCategory.set('Attendance');
      this.activeSection.set('Attendance');
      this.loadReport();
    });
  }

  private loadDepartments() {
    this.orgService.getDepartments().subscribe({
      next: (depts) => this.departments.set(depts),
      error: () => this.departments.set([])
    });
  }

  setReportType(type: 'daily' | 'monthly' | 'late' | 'absent') {
    this.currentReportType.set(type);
    this.loadReport();
  }

  updateSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.reportSearch.set(value);
    this.isSearchBoxOpen.set(!!value.trim());
  }

  onSearchFocus() {
    this.isSearchBoxOpen.set(!!this.reportSearch().trim());
  }

  onSearchBlur() {
    setTimeout(() => this.isSearchBoxOpen.set(false), 150);
  }

  handleQuickAction(action: 'all' | 'favorites' | 'custom') {
    if (action === 'all') {
      this.selectedShortcut.set('all');
      return;
    }
    this.selectShortcut(action);
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
    const sections = this.sectionsComputed();
    let current = this.activeSection();

    for (const section of sections) {
      const element = container.querySelector<HTMLElement>(`#section-${section.id}`);
      if (element && element.offsetTop - container.scrollTop <= 80) {
        current = section.label;
      }
    }

    this.activeSection.set(current);
  }

  selectShortcut(mode: 'favorites' | 'custom') {
    this.selectedShortcut.set(this.selectedShortcut() === mode ? 'all' : mode);
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
    let items = this.reportCatalog().filter((item) => item.category === category);
    if (this.selectedShortcut() === 'favorites') {
      items = items.filter((item) => item.favorite);
    } else if (this.selectedShortcut() === 'custom') {
      items = items.filter((item) => item.custom);
    }
    return items.length;
  }

  totalVisibleReports(): number {
    return this.visibleSections().reduce((sum, section) => sum + section.items.length, 0);
  }

  openCatalogReport(item: { title: string; preset?: 'daily' | 'monthly' | 'late' | 'absent' }) {
    if (item.preset) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { preset: item.preset },
        queryParamsHandling: 'merge'
      });
      this.toastService.success(`${item.title} selected`);
      return;
    }

    this.toastService.info(`${item.title} will be connected next.`);
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
    }
  }

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
          totalEmployees: 45,
          present: 38,
          absent: 4,
          late: 3,
          halfDay: 0,
          onLeave: 0,
          holidays: 0,
          weekend: 0,
          attendancePercentage: 84.4
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
          present: 18,
          absent: 2,
          late: 2,
          halfDay: 0,
          onLeave: 0,
          averageAttendance: 81.8,
          totalOvertimeHours: 25.0,
          employeeReports: [
            { employeeId: 1, employeeName: 'Rohan Sharma', employeeCode: 'EMP001', department: 'Engineering', present: 20, absent: 2, late: 1, halfDay: 0, onLeave: 0, totalWorkHours: 176.5, overtimeHours: 12.5, lateMinutes: 45, attendancePercentage: 90.9 },
            { employeeId: 2, employeeName: 'Priya Verma', employeeCode: 'EMP002', department: 'HR', present: 21, absent: 1, late: 0, halfDay: 0, onLeave: 0, totalWorkHours: 184.0, overtimeHours: 8.0, lateMinutes: 0, attendancePercentage: 95.5 },
            { employeeId: 3, employeeName: 'Amit Patel', employeeCode: 'EMP003', department: 'Engineering', present: 19, absent: 3, late: 4, halfDay: 1, onLeave: 0, totalWorkHours: 168.0, overtimeHours: 4.5, lateMinutes: 120, attendancePercentage: 86.4 }
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
          { employeeId: 1, employeeName: 'Rohan Sharma', employeeCode: 'EMP001', department: 'Engineering', date: '2025-03-24', checkInTime: '09:45 AM', scheduledTime: '09:00 AM', lateMinutes: 45 },
          { employeeId: 3, employeeName: 'Amit Patel', employeeCode: 'EMP003', department: 'Engineering', date: '2025-03-24', checkInTime: '09:20 AM', scheduledTime: '09:00 AM', lateMinutes: 20 },
          { employeeId: 4, employeeName: 'Sneha Reddy', employeeCode: 'EMP004', department: 'Design', date: '2025-03-23', checkInTime: '09:15 AM', scheduledTime: '09:00 AM', lateMinutes: 15 }
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
          { employeeId: 5, employeeName: 'Vikram Singh', employeeCode: 'EMP005', department: 'Engineering', date: '2025-03-24', status: 'absent' },
          { employeeId: 6, employeeName: 'Ananya Rao', employeeCode: 'EMP006', department: 'HR', date: '2025-03-24', status: 'absent' }
        ]);
        this.loading.set(false);
      }
    });
  }

  exportExcel() {
    this.reportService.exportToExcel(this.filters).subscribe({
      next: (blob) => {
        if (!blob || blob.size === 0) {
          this.toastService.error('Excel export is not available from the current backend yet.');
          return;
        }
        const filename = `attendance_${this.currentReportType()}_${new Date().toISOString().split('T')[0]}.xlsx`;
        this.reportService.downloadBlob(blob, filename);
        this.toastService.success('Excel file downloaded successfully');
      },
      error: () => {
        this.toastService.error('Failed to export Excel file');
      }
    });
  }

  exportPdf() {
    this.reportService.exportToPdf(this.filters).subscribe({
      next: (blob) => {
        if (!blob || blob.size === 0) {
          this.toastService.error('PDF export is not available from the current backend yet.');
          return;
        }
        const filename = `attendance_${this.currentReportType()}_${new Date().toISOString().split('T')[0]}.pdf`;
        this.reportService.downloadBlob(blob, filename);
        this.toastService.success('PDF file downloaded successfully');
      },
      error: () => {
        this.toastService.error('Failed to export PDF file');
      }
    });
  }

  canExportReports(): boolean {
    const user = this.currentUser();
    return (
      this.permissionService.hasPermission(user, 'reports.export') ||
      this.permissionService.hasPermission(user, 'reports.read') ||
      this.permissionService.hasPermission(user, 'reports.view')
    );
  }

  getRecordCount(): number {
    switch (this.currentReportType()) {
      case 'daily':
        return this.dailySummaryCount();
      case 'monthly':
        return this.monthlyRows().length;
      case 'late':
        return this.lateRows().length;
      case 'absent':
        return this.absentRows().length;
      default:
        return 0;
    }
  }

  isEmpty(): boolean {
    return this.getRecordCount() === 0 && !this.loading();
  }

  formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  getAttendanceClass(percentage: number): string {
    if (percentage >= 90) return 'bg-emerald-50 text-emerald-700';
    if (percentage >= 75) return 'bg-amber-50 text-amber-700';
    return 'bg-rose-50 text-rose-700';
  }

  getMonthYearString(): string {
    const [year, month] = this.parseMonthYear(this.monthYear);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  currentReportLabel(): string {
    switch (this.currentReportType()) {
      case 'daily':
        return 'Daily';
      case 'monthly':
        return 'Monthly';
      case 'late':
        return 'Late arrivals';
      case 'absent':
        return 'Absent';
      default:
        return 'Reports';
    }
  }

  currentReportHeading(): string {
    switch (this.currentReportType()) {
      case 'daily':
        return 'Daily Attendance';
      case 'monthly':
        return 'Monthly Register';
      case 'late':
        return 'Late Arrival Report';
      case 'absent':
        return 'Absent Report';
      default:
        return 'Attendance Reports';
    }
  }

  currentReportSubheading(): string {
    switch (this.currentReportType()) {
      case 'daily':
        return 'Snapshot of presence, absence, late marks, and daily attendance coverage.';
      case 'monthly':
        return 'Compare monthly attendance distribution, working hours, and employee performance at one glance.';
      case 'late':
        return 'Track delayed check-ins and identify punctuality exceptions by date range.';
      case 'absent':
        return 'Review employees marked absent for the selected period.';
      default:
        return 'Operational attendance analytics.';
    }
  }

  currentTableTitle(): string {
    switch (this.currentReportType()) {
      case 'daily':
        return `Daily Attendance Summary - ${new Date(this.filters.startDate || new Date().toISOString().split('T')[0]).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`;
      case 'monthly':
        return `Monthly Attendance Register - ${this.getMonthYearString()}`;
      case 'late':
        return 'Late Arrival Register';
      case 'absent':
        return 'Absent Employee Register';
      default:
        return 'Attendance Register';
    }
  }

  dailySummaryCount(): number {
    return this.dailyReport() ? this.dailyMetrics().length : 0;
  }

  dailyMetrics() {
    const report = this.dailyReport();
    if (!report) return [];

    return [
      { label: 'Total Employees', value: report.totalEmployees, description: 'Headcount included in the daily attendance run.' },
      { label: 'Present', value: report.present, description: 'Employees marked present for the selected day.' },
      { label: 'Absent', value: report.absent, description: 'Employees missing attendance for the selected day.' },
      { label: 'Late', value: report.late, description: 'Employees who checked in after the scheduled time.' },
      { label: 'Half Day', value: report.halfDay, description: 'Employees with partial attendance for the day.' },
      { label: 'Attendance %', value: `${report.attendancePercentage.toFixed(1)}%`, description: 'Overall presence ratio for the selected date.' }
    ].filter((row) => this.matchesSearch([row.label, row.description, row.value]));
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
