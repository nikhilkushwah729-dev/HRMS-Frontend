import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  inject,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  LeaveService,
  LeaveRequest,
  LeaveTypeBalance,
  LeaveDashboard,
  MonthlyLeaveUsage,
  UpcomingHoliday,
} from '../../core/services/leave.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/auth.model';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';
import { Chart, registerables } from 'chart.js';
import {
  UiSelectAdvancedComponent,
  SelectOption,
} from '../../core/components/ui/ui-select-advanced.component';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-leaves',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiSelectAdvancedComponent],
  template: `
    <div class="relative flex flex-col gap-5 sm:gap-6 lg:gap-8">
      <!-- Leave Form Modal -->
      @if (showForm()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        >
          <div
            class="bg-white rounded-md shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200"
          >
            <header
              class="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center gap-3"
            >
              <h2 class="text-lg font-bold text-slate-900">
                {{ editingLeaveId() ? 'Edit Leave Request' : 'Request Leave' }}
              </h2>
              <button
                (click)="toggleForm()"
                class="p-1.5 hover:bg-slate-50 rounded-md transition-colors text-slate-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </header>
            <form
              [formGroup]="leaveForm"
              (ngSubmit)="submitLeave()"
            class="max-h-[calc(90vh-88px)] space-y-4 overflow-y-auto p-4 sm:p-6"
            >
              <div class="flex flex-col gap-1.5">
                <app-ui-select-advanced
                  formControlName="leaveTypeId"
                  label="Leave Type"
                  placeholder="Select Leave Type"
                  [options]="leaveTypeOptions()"
                  [searchable]="false"
                ></app-ui-select-advanced>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label
                    class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                    >Start Date</label
                  >
                  <input
                    type="date"
                    formControlName="startDate"
                    class="app-field"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label
                    class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                    >End Date</label
                  >
                  <input
                    type="date"
                    formControlName="endDate"
                    class="app-field"
                  />
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                  >Reason</label
                >
                <textarea
                  formControlName="reason"
                  rows="3"
                  class="app-field resize-none"
                  placeholder="Explain your request..."
                ></textarea>
              </div>
              <div
                class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-50"
              >
                <button
                  type="button"
                  (click)="toggleForm()"
                  class="px-5 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="leaveForm.invalid || processing()"
                  class="btn-primary"
                >
                  {{
                    processing()
                      ? editingLeaveId()
                        ? 'Updating...'
                        : 'Submitting...'
                      : editingLeaveId()
                        ? 'Update Request'
                        : 'Submit Request'
                  }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <header class="sticky top-3 z-30 mb-4 rounded-lg border border-slate-100 bg-white/95 p-4 shadow-lg shadow-slate-200/60 backdrop-blur sm:p-5">
        <div class="grid grid-cols-12 items-center gap-4">
          <div class="col-span-12 md:col-span-5">
            <h1 class="text-2xl font-semibold text-slate-900 max-sm:text-lg">
              Leave Dashboard
            </h1>
            <p class="mt-1 text-sm font-medium text-slate-500 max-sm:text-xs">
              {{ formattedToday() }}
            </p>
          </div>
          <div class="col-span-12 flex flex-col gap-3 md:col-span-7 md:flex-row md:items-center md:justify-end">
            <div class="inline-flex w-full rounded-lg border border-slate-200 bg-slate-50 p-1 sm:w-auto">
              <button
                type="button"
                (click)="currentView.set('dashboard')"
                class="flex-1 rounded-md px-4 py-2 text-xs font-black transition md:flex-none"
                [ngClass]="currentView() === 'dashboard' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
              >
                Dashboard
              </button>
              <button
                type="button"
                (click)="currentView.set('request')"
                class="flex-1 rounded-md px-4 py-2 text-xs font-black transition md:flex-none"
                [ngClass]="currentView() === 'request' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
              >
                Requests
              </button>
            </div>
            @if (canRequestLeave()) {
              <button
                type="button"
                (click)="toggleForm()"
                class="btn-primary flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-xs sm:w-auto"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
                Request Leave
              </button>
            }
          </div>
        </div>
      </header>

      @if (isLoadingDashboard()) {
        <div class="rounded-lg bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">
          Loading leave dashboard...
        </div>
      }

      @if (dashboardError()) {
        <div class="flex flex-col gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <span class="font-semibold">{{ dashboardError() }}</span>
          <button
            type="button"
            (click)="loadDashboard()"
            class="rounded-md bg-white px-3 py-2 text-xs font-black text-red-700 shadow-sm"
          >
            Retry
          </button>
        </div>
      }

      @if (currentView() === 'dashboard') {
        <div class="grid grid-cols-12 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          @for (card of dashboardCards(); track card.label) {
            <button
              type="button"
              (click)="openDashboardCard(card.target)"
              class="group col-span-6 cursor-pointer rounded-lg border border-l-4 bg-white p-4 text-left shadow-sm transition hover:shadow-md md:col-span-4"
              [ngClass]="card.border"
            >
              <div class="flex h-20 items-center gap-4">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" [ngClass]="card.bg">
                  <span class="text-sm font-black" [ngClass]="card.text">{{ card.icon }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-[11px] font-bold uppercase tracking-wide text-slate-500">{{ card.label }}</p>
                  <p class="mt-1 text-2xl font-black leading-none text-slate-900">{{ card.value }}</p>
                </div>
              </div>
            </button>
          }

          <section class="col-span-12 rounded-lg bg-white p-4 shadow-sm">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="text-base font-semibold text-slate-900">Leave Statistics</h3>
                <p class="mt-1 text-xs font-medium text-slate-500">
                  {{ fromDate() | date: 'dd MMM' }} - {{ toDate() | date: 'dd MMM yyyy' }}
                </p>
              </div>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                <label class="flex flex-col gap-1">
                  <span class="text-[10px] font-bold uppercase tracking-wide text-slate-400">From</span>
                  <input type="date" [value]="fromDate()" (change)="setFromDate($event)" class="min-w-[150px] rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" />
                </label>
                <label class="flex flex-col gap-1">
                  <span class="text-[10px] font-bold uppercase tracking-wide text-slate-400">To</span>
                  <input type="date" [value]="toDate()" (change)="setToDate($event)" class="min-w-[150px] rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" />
                </label>
                <button type="button" (click)="applyDashboardRange()" class="btn-primary mt-4 rounded-md px-5 py-2.5 text-xs sm:mt-5">Apply</button>
              </div>
            </div>
          </section>

          <section class="col-span-12 overflow-hidden rounded-lg bg-white shadow-sm md:col-span-6">
            <div class="border-b border-slate-100 px-5 py-4">
              <h3 class="text-base font-semibold text-slate-900">Leave Type</h3>
              <p class="mt-1 text-xs text-slate-500">Approved leave distribution by type.</p>
            </div>
            <div class="relative flex h-[300px] items-center justify-center p-5">
              @if (hasLeaveTypeUsage()) {
                <canvas id="leaveTypeChart"></canvas>
              } @else {
                <div class="rounded-md border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm font-semibold text-slate-500">No leave type data for selected range.</div>
              }
            </div>
          </section>

          <section class="col-span-12 overflow-hidden rounded-lg bg-white shadow-sm md:col-span-6">
            <div class="border-b border-slate-100 px-5 py-4">
              <h3 class="text-base font-semibold text-slate-900">Leave</h3>
              <p class="mt-1 text-xs text-slate-500">Paid and unpaid approved leave count.</p>
            </div>
            <div class="relative flex h-[300px] items-center justify-center p-5">
              @if (hasPaidUnpaidData()) {
                <canvas id="paidUnpaidChart"></canvas>
              } @else {
                <div class="rounded-md border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm font-semibold text-slate-500">No paid/unpaid data for selected range.</div>
              }
            </div>
          </section>

          <section class="col-span-12 overflow-hidden rounded-lg bg-white shadow-sm md:col-span-6">
            <div class="border-b border-slate-100 px-5 py-4">
              <h3 class="text-base font-semibold text-slate-900">Annual Leave Utilization By Month</h3>
              <p class="mt-1 text-xs text-slate-500">Paid and unpaid leave trend for {{ toDate() | date: 'yyyy' }}.</p>
            </div>
            <div class="relative flex h-[300px] items-center justify-center p-5">
              @if (hasMonthlyUsage()) {
                <canvas id="leaveUtilChart"></canvas>
              } @else {
                <div class="rounded-md border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm font-semibold text-slate-500">No monthly movement yet.</div>
              }
            </div>
          </section>

          <section class="col-span-12 overflow-hidden rounded-lg bg-white shadow-sm md:col-span-6">
            <div class="border-b border-slate-100 px-5 py-4">
              <h3 class="text-base font-semibold text-slate-900">Employee On Leave By Department Annually</h3>
              <p class="mt-1 text-xs text-slate-500">Department-wise approved leave volume.</p>
            </div>
            <div class="relative flex h-[300px] items-center justify-center p-5">
              @if (hasDepartmentAnnual()) {
                <canvas id="departmentLeaveChart"></canvas>
              } @else {
                <div class="rounded-md border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm font-semibold text-slate-500">No department leave data for this year.</div>
              }
            </div>
          </section>

          <section class="col-span-12 overflow-hidden rounded-lg bg-white shadow-sm">
            <div class="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 class="text-base font-semibold text-slate-900">Leave Calendar</h3>
                <p class="mt-1 text-xs text-slate-500">Upcoming holidays and active leave windows</p>
              </div>
              <span class="rounded-md bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">{{ upcomingHolidays().length }} upcoming holidays</span>
            </div>
            @if (upcomingHolidays().length) {
              <div class="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                @for (holiday of upcomingHolidays(); track holiday.id || holiday.name) {
                  <div class="group flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-3 shadow-sm transition hover:shadow-md">
                    <div class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md bg-slate-50">
                      <span class="text-[10px] font-black uppercase leading-none text-slate-400">{{ holiday.date | date: 'MMM' }}</span>
                      <span class="text-lg font-black text-slate-900">{{ holiday.date | date: 'dd' }}</span>
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-bold text-slate-900">{{ holiday.name }}</p>
                      <p class="text-xs text-slate-500">{{ holiday.date | date: 'EEEE' }}</p>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="m-5 rounded-md border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                No upcoming holidays configured.
              </div>
            }
          </section>
        </div>
      }

      @if (currentView() === 'request') {
        <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <!-- Leave Balances -->
          <div
            class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            @for (bal of leaveBalances(); track bal.id) {
              <div
                class="group flex min-h-[112px] flex-col justify-between rounded-lg border border-l-4 bg-white p-4 shadow-sm transition hover:shadow-md"
                [style.border-left]="'4px solid ' + bal.color"
              >
                <div class="mb-4 flex items-start justify-between gap-3">
                  <span
                    class="text-[11px] font-bold uppercase tracking-wide text-slate-500"
                    >{{ bal.type }}</span
                  >
                  <span
                    class="rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-400 transition-colors group-hover:bg-primary-50 group-hover:text-primary-600"
                    >{{ bal.year }}</span
                  >
                </div>
                <div class="flex items-end gap-2">
                  <span
                    class="text-3xl font-black tracking-tight text-slate-900"
                    >{{ bal.remaining }}</span
                  >
                  <span class="mb-1 text-xs font-bold text-slate-400"
                    >/ {{ bal.total }} Days</span
                  >
                </div>
              </div>
            }
          </div>

          <!-- Requests Table -->
          <div class="h-fit overflow-hidden rounded-lg bg-white shadow-sm">
            <div class="border-b border-slate-100 p-5">
              <div class="flex items-center justify-between gap-3">
                <h3 class="text-base font-semibold text-slate-900">
                  {{
                    activeModule() === 'approval'
                      ? 'Approval Module'
                      : 'Request Module'
                  }}
                </h3>
                @if (isApprover()) {
                  <div
                    class="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50"
                  >
                    <button
                      (click)="activeModule.set('approval')"
                      class="px-3 py-1.5 text-xs font-bold rounded-md transition-colors"
                      [ngClass]="
                        activeModule() === 'approval'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500'
                      "
                    >
                      Approval ({{ approvalCount() }})
                    </button>
                    <button
                      (click)="activeModule.set('request')"
                      class="px-3 py-1.5 text-xs font-bold rounded-md transition-colors"
                      [ngClass]="
                        activeModule() === 'request'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500'
                      "
                    >
                      Requests ({{ requestCount() }})
                    </button>
                  </div>
                }
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead>
                  <tr class="bg-slate-50/80">
                    @if (isApprover() && activeModule() === 'approval') {
                      <th
                        class="px-6 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400"
                      >
                        Requested By
                      </th>
                    }
                    <th
                      class="px-6 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400"
                    >
                      Leave Type
                    </th>
                    <th
                      class="px-6 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400"
                    >
                      Duration
                    </th>
                    <th
                      class="whitespace-nowrap px-6 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400"
                    >
                      Reason
                    </th>
                    <th
                      class="px-6 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400"
                    >
                      Pending With
                    </th>
                    <th
                      class="px-6 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400"
                    >
                      Status
                    </th>
                    <th
                      class="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wide text-slate-400"
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  @if (displayedLeaves().length === 0) {
                    <tr>
                      <td
                        colspan="7"
                        class="px-6 py-12 text-center text-slate-400 font-medium"
                      >
                        No leave requests found.
                      </td>
                    </tr>
                  } @else {
                    @for (leave of displayedLeaves(); track leave.id) {
                      <tr class="hover:bg-slate-50/50 transition-colors group">
                        @if (isApprover() && activeModule() === 'approval') {
                          <td class="px-6 py-4">
                            <span class="text-sm font-semibold text-slate-700">
                              {{
                                leave.employee?.fullName ||
                                  (leave.employee?.firstName || '') +
                                    ' ' +
                                    (leave.employee?.lastName || '')
                              }}
                            </span>
                          </td>
                        }
                        <td class="px-6 py-4">
                          <span
                            class="font-semibold text-slate-700 capitalize break-words"
                            >{{ leave.leaveType?.typeName || 'Unknown' }}</span
                          >
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex flex-col min-w-[120px]">
                            <span
                              class="text-[13px] font-bold text-slate-900 tracking-tight"
                              >{{ leave.startDate | date: 'mediumDate' }} -
                              {{ leave.endDate | date: 'mediumDate' }}</span
                            >
                          </div>
                        </td>
                        <td class="px-6 py-4">
                          <p
                            class="text-sm text-slate-500 max-w-[200px] truncate"
                            [title]="leave.reason"
                          >
                            {{ leave.reason }}
                          </p>
                        </td>
                        <td class="px-6 py-4">
                          @if (leave.status === 'pending') {
                            <span
                              class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                              [ngClass]="
                                isOwnLeavePublic(leave)
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-blue-50 text-blue-600'
                              "
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="8"
                                height="8"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <circle cx="12" cy="12" r="10" />
                              </svg>
                              {{ getPendingWith(leave) }}
                            </span>
                          } @else {
                            <span class="text-xs text-slate-400">&#x2014;</span>
                          }
                        </td>
                        <td class="px-6 py-4">
                          <span
                            class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter"
                            [ngClass]="{
                              'bg-yellow-50 text-warning':
                                leave.status === 'pending',
                              'bg-green-50 text-success':
                                leave.status === 'approved',
                              'bg-red-50 text-error':
                                leave.status === 'rejected',
                            }"
                            >{{ leave.status }}</span
                          >
                        </td>
                        <td class="px-6 py-4 text-right">
                          <div class="flex justify-end gap-1 opacity-100">
                            @if (canApprove(leave)) {
                              <button
                                (click)="updateStatus(leave.id, 'approved')"
                                [disabled]="statusUpdatingId() === leave.id"
                                class="p-1.5 text-success hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Approve"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2.5"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </button>
                              <button
                                (click)="updateStatus(leave.id, 'rejected')"
                                [disabled]="statusUpdatingId() === leave.id"
                                class="p-1.5 text-error hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Reject"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2.5"
                                >
                                  <path d="M18 6 6 18" />
                                  <path d="m6 6 12 12" />
                                </svg>
                              </button>
                            } @else if (canManageOwnPending(leave)) {
                              <button
                                (click)="viewLeave(leave)"
                                class="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="View"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2.5"
                                >
                                  <path
                                    d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                                  />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </button>
                            } @else {
                              <span
                                class="text-[11px] font-bold text-slate-300 px-2 italic"
                                >Processed</span
                              >
                            }
                          </div>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class LeavesComponent implements OnInit, OnDestroy {
  private leaveService = inject(LeaveService);
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  leaves = signal<LeaveRequest[]>([]);
  leaveTypes = signal<LeaveTypeBalance[]>([]);
  leaveBalances = signal<LeaveTypeBalance[]>([]);
  leaveDashboard = signal<LeaveDashboard | null>(null);
  monthlyUsage = signal<MonthlyLeaveUsage[]>([]);
  upcomingHolidays = signal<UpcomingHoliday[]>([]);
  fromDate = signal<string>(this.toDateInputValue(this.addDays(new Date(), -45)));
  toDate = signal<string>(this.toDateInputValue(new Date()));
  isLoadingDashboard = signal<boolean>(false);
  dashboardError = signal<string>('');
  showForm = signal<boolean>(false);
  processing = signal<boolean>(false);
  statusUpdatingId = signal<number | null>(null);
  currentUser = signal<User | null>(null);
  currentView = signal<'request' | 'dashboard'>('dashboard');
  activeModule = signal<'approval' | 'request'>('request');
  editingLeaveId = signal<number | null>(null);

  leaveTypeOptions = computed<SelectOption[]>(() =>
    this.leaveTypes().map((t) => ({ label: t.typeName, value: t.id })),
  );

  // Computed Stats
  totalEntitlement = computed(() =>
    this.leaveBalances().reduce((sum, b) => sum + b.total, 0),
  );
  totalUsed = computed(() =>
    this.leaveBalances().reduce((sum, b) => sum + b.used, 0),
  );
  totalRemaining = computed(() =>
    this.leaveBalances().reduce((sum, b) => sum + b.remaining, 0),
  );
  pendingLeaves = computed(() =>
    this.leaves().filter((leave) => leave.status === 'pending'),
  );
  dashboardCards = computed(() => {
    const summary = this.leaveDashboard()?.summary;
    return [
      {
        label: 'Total Employees',
        value: summary?.totalEmployees ?? 0,
        icon: 'T',
        bg: 'bg-green-50',
        text: 'text-green-600',
        border: 'border-green-400',
        accent: 'bg-green-400',
        target: 'employees' as const,
      },
      {
        label: 'On Leave',
        value: summary?.onLeave ?? 0,
        icon: 'L',
        bg: 'bg-red-50',
        text: 'text-red-600',
        border: 'border-red-400',
        accent: 'bg-red-400',
        target: 'on-leave' as const,
      },
      {
        label: 'Pending Request',
        value: summary?.pending ?? 0,
        icon: 'P',
        bg: 'bg-yellow-50',
        text: 'text-yellow-600',
        border: 'border-yellow-400',
        accent: 'bg-yellow-400',
        target: 'pending' as const,
      },
    ];
  });

  leaveForm: FormGroup = this.fb.group({
    leaveTypeId: [null, [Validators.required]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    reason: ['', [Validators.required, Validators.maxLength(500)]],
  });

  private distChart: any;
  private leaveTypeChart: any;
  private paidUnpaidChart: any;
  private utilChart: any;
  private departmentChart: any;
  private routeSubscription?: Subscription;

  constructor() {
    effect(() => {
      if (
        this.currentView() === 'dashboard' &&
        (
          this.hasLeaveTypeUsage() ||
          this.hasPaidUnpaidData() ||
          this.hasMonthlyUsage() ||
          this.hasDepartmentAnnual()
        )
      ) {
        setTimeout(() => this.initCharts(), 0);
      }
    });
  }

  ngOnInit(): void {
    this.currentUser.set(this.authService.getStoredUser());
    this.routeSubscription = this.route.queryParamMap.subscribe((params) => {
      const view = params.get('view');
      if (view === 'dashboard' || view === 'request') {
        this.currentView.set(view);
      }

      const mode = params.get('mode');
      if (mode === 'approval' && this.isApprover()) {
        this.currentView.set('request');
        this.activeModule.set('approval');
        return;
      }

      if (mode === 'request') {
        this.currentView.set('request');
        this.activeModule.set('request');
        return;
      }

      const currentUrl = this.router.url || '';
      if (currentUrl.includes('/admin/approvals/leave') && this.isApprover()) {
        this.currentView.set('request');
        this.activeModule.set('approval');
        return;
      }

      if (currentUrl.includes('/self-service/requests/leave')) {
        this.currentView.set('request');
        this.activeModule.set('request');
      }
    });
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.distChart?.destroy();
    this.leaveTypeChart?.destroy();
    this.paidUnpaidChart?.destroy();
    this.utilChart?.destroy();
    this.departmentChart?.destroy();
  }

  initCharts() {
    this.initDistChart();
    this.initLeaveTypeChart();
    this.initPaidUnpaidChart();
    this.initUtilChart();
    this.initDepartmentChart();
  }

  initDistChart() {
    const ctx = document.getElementById('leaveDistChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.distChart) this.distChart.destroy();

    const data = this.leaveBalances();
    if (!this.hasDistributionData()) return;
    this.distChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map((d) => d.type),
        datasets: [
          {
            data: data.map((d) => d.used),
            backgroundColor: data.map((d) => d.color),
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, font: { weight: 'bold', size: 10 } },
          },
        },
      },
    });
  }

  initLeaveTypeChart() {
    const ctx = document.getElementById('leaveTypeChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.leaveTypeChart) this.leaveTypeChart.destroy();
    if (!this.hasLeaveTypeUsage()) return;

    const data = this.leaveDashboard()?.leaveTypeUsage ?? [];
    const total = data.reduce((sum, item) => sum + item.totalLeaveCount, 0);
    this.leaveTypeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map((item) => item.leaveName),
        datasets: [
          {
            data: data.map((item) => item.totalLeaveCount),
            backgroundColor: data.map((item, index) => item.color || this.chartColors[index % this.chartColors.length]),
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, font: { weight: 'bold', size: 10 } },
          },
          tooltip: {
            callbacks: {
              footer: () => `Total Leaves: ${total}`,
            },
          },
        },
      },
    });
  }

  initPaidUnpaidChart() {
    const ctx = document.getElementById('paidUnpaidChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.paidUnpaidChart) this.paidUnpaidChart.destroy();
    if (!this.hasPaidUnpaidData()) return;

    const summary = this.leaveDashboard()?.paidUnpaidSummary ?? { paidCount: 0, unPaidCount: 0 };
    this.paidUnpaidChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Unpaid Count', 'Paid Count'],
        datasets: [
          {
            label: 'Count',
            data: [summary.unPaidCount, summary.paidCount],
            backgroundColor: ['#f43f5e', '#22c55e'],
            borderRadius: 8,
            maxBarThickness: 72,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  initUtilChart() {
    const ctx = document.getElementById('leaveUtilChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.utilChart) this.utilChart.destroy();

    if (!this.hasMonthlyUsage()) return;
    const usage = this.monthlyUsage();
    this.utilChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: usage.map((item) => item.month),
        datasets: [
          {
            label: 'Paid',
            data: usage.map((item) => item.paid),
            backgroundColor: '#6366f1',
            borderRadius: 6,
          },
          {
            label: 'Unpaid',
            data: usage.map((item) => item.unpaid),
            backgroundColor: '#cbd5e1',
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, grid: { color: '#f1f5f9' } },
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, font: { weight: 'bold', size: 10 } },
          },
        },
      },
    });
  }

  initDepartmentChart() {
    const ctx = document.getElementById('departmentLeaveChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.departmentChart) this.departmentChart.destroy();
    if (!this.hasDepartmentAnnual()) return;

    const data = this.leaveDashboard()?.departmentAnnual ?? [];
    this.departmentChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((item) => item.department),
        datasets: [
          {
            label: 'Leaves',
            data: data.map((item) => item.leaveCount),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.14)',
            fill: true,
            tension: 0.35,
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 0 } },
          y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, font: { weight: 'bold', size: 10 } },
          },
        },
      },
    });
  }

  loadDashboard() {
    this.isLoadingDashboard.set(true);
    this.dashboardError.set('');

    this.leaveService.getLeaveDashboard(new Date(this.toDate()).getFullYear(), this.fromDate(), this.toDate()).subscribe({
      next: (dashboard) => {
        this.leaveDashboard.set(dashboard);
        this.leaveTypes.set(dashboard.leaveTypes);
        this.leaveBalances.set(dashboard.balances);
        this.leaves.set(dashboard.requests);
        this.monthlyUsage.set(dashboard.monthlyUsage);
        this.upcomingHolidays.set(dashboard.upcomingHolidays);
        if (dashboard.range?.from) this.fromDate.set(dashboard.range.from);
        if (dashboard.range?.to) this.toDate.set(dashboard.range.to);

        if (dashboard.leaveTypes.length > 0 && !this.leaveForm.value.leaveTypeId) {
          this.leaveForm.patchValue({ leaveTypeId: dashboard.leaveTypes[0].id });
        }
      },
      error: () => {
        this.leaveDashboard.set(null);
        this.leaveTypes.set([]);
        this.leaveBalances.set([]);
        this.leaves.set([]);
        this.monthlyUsage.set([]);
        this.upcomingHolidays.set([]);
        this.dashboardError.set('Unable to load leave dashboard. Please try again.');
        this.toastService.show('Unable to load leave dashboard. Please try again.', 'error');
      },
      complete: () => this.isLoadingDashboard.set(false),
    });
  }

  usagePercent(): number {
    return this.percent(this.totalUsed(), this.totalEntitlement());
  }

  remainingPercent(): number {
    return this.percent(this.totalRemaining(), this.totalEntitlement());
  }

  hasDistributionData(): boolean {
    return this.leaveBalances().some((item) => Number(item.used) > 0);
  }

  hasMonthlyUsage(): boolean {
    return this.monthlyUsage().some((item) => Number(item.paid) > 0 || Number(item.unpaid) > 0);
  }

  hasLeaveTypeUsage(): boolean {
    return (this.leaveDashboard()?.leaveTypeUsage ?? []).some((item) => item.totalLeaveCount > 0);
  }

  hasPaidUnpaidData(): boolean {
    const summary = this.leaveDashboard()?.paidUnpaidSummary;
    return !!summary && (summary.paidCount > 0 || summary.unPaidCount > 0);
  }

  hasDepartmentAnnual(): boolean {
    return (this.leaveDashboard()?.departmentAnnual ?? []).some((item) => item.leaveCount > 0);
  }

  setFromDate(event: Event): void {
    this.fromDate.set((event.target as HTMLInputElement).value);
  }

  setToDate(event: Event): void {
    this.toDate.set((event.target as HTMLInputElement).value);
  }

  applyDashboardRange(): void {
    if (this.fromDate() && this.toDate() && this.fromDate() > this.toDate()) {
      this.toastService.show('From date cannot be after to date.', 'error');
      return;
    }
    this.loadDashboard();
  }

  formattedToday(): string {
    return new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  openDashboardCard(target: 'employees' | 'on-leave' | 'pending'): void {
    if (target === 'employees') {
      this.router.navigate(['/employees']);
      return;
    }
    if (target === 'pending') {
      this.currentView.set('request');
      this.activeModule.set(this.isApprover() ? 'approval' : 'request');
      return;
    }
    this.currentView.set('request');
  }

  private percent(value: number, total: number): number {
    if (!total) return 0;
    return Math.min(100, Math.max(0, (value / total) * 100));
  }

  private readonly chartColors = ['#54c682', '#f6b05d', '#4190ff', '#f74e57', '#808080', '#8b5cf6'];

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private toDateInputValue(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  toggleForm() {
    if (!this.canRequestLeave()) return;
    this.showForm.set(!this.showForm());
    if (!this.showForm() && this.leaveTypes().length > 0) {
      this.editingLeaveId.set(null);
      this.leaveForm.reset({ leaveTypeId: this.leaveTypes()[0].id });
    }
  }

  submitLeave() {
    if (this.leaveForm.valid) {
      this.processing.set(true);
      const requestPayload = this.leaveForm.value;
      const request$ = this.leaveService.applyLeave(requestPayload);

      request$.subscribe({
        next: () => {
          this.loadDashboard();
          this.processing.set(false);
          this.editingLeaveId.set(null);
          this.toggleForm();
        },
        error: () => this.processing.set(false),
      });
    }
  }

  updateStatus(id: number, status: string) {
    if (this.statusUpdatingId() !== null) return;

    let rejectionNote: string | undefined;
    if (status === 'rejected') {
      rejectionNote =
        prompt('Please enter a reason for rejection (optional):') || undefined;
    }

    if (confirm(`Are you sure you want to ${status} this leave request?`)) {
      this.statusUpdatingId.set(id);
      this.leaveService.updateLeaveStatus(id, status, rejectionNote).subscribe({
        next: () => {
          this.loadDashboard();
          this.toastService.show(
            `Leave request ${status} successfully.`,
            'success',
          );
        },
        error: () => {
          this.toastService.show(
            `Failed to ${status} leave request. Please try again.`,
            'error',
          );
        },
        complete: () => {
          this.statusUpdatingId.set(null);
        },
      });
    }
  }

  canApprove(leave: LeaveRequest): boolean {
    return (
      this.activeModule() === 'approval' &&
      this.isApprover() &&
      leave.status === 'pending' &&
      !this.isOwnLeave(leave)
    );
  }

  canRequestLeave(): boolean {
    return (
      this.permissionService.hasPermission(this.currentUser(), 'leave.apply') ||
      this.permissionService.hasPermission(this.currentUser(), 'leave.create')
    );
  }

  canManageOwnPending(leave: LeaveRequest): boolean {
    return (
      this.activeModule() === 'request' &&
      this.isOwnLeave(leave) &&
      leave.status === 'pending'
    );
  }

  isApprover(): boolean {
    return this.permissionService.canApproveLeaves(this.currentUser());
  }

  private currentEmployeeId(): number | undefined {
    const user = this.currentUser();
    return user?.employeeId ?? user?.id;
  }

  private isOwnLeave(leave: LeaveRequest): boolean {
    return leave.employeeId === this.currentEmployeeId();
  }

  isOwnLeavePublic(leave: LeaveRequest): boolean {
    return this.isOwnLeave(leave);
  }

  getPendingWith(leave: LeaveRequest): string {
    if (this.isOwnLeave(leave)) {
      const managerName = leave.employee?.manager?.fullName;
      return managerName ? managerName : 'Manager / HR';
    }
    return 'Awaiting You';
  }

  private approvalLeaves(): LeaveRequest[] {
    return this.leaves().filter(
      (leave) => leave.status === 'pending' && !this.isOwnLeave(leave),
    );
  }

  private requestLeaves(): LeaveRequest[] {
    return this.leaves().filter((leave) => this.isOwnLeave(leave));
  }

  displayedLeaves(): LeaveRequest[] {
    if (this.isApprover() && this.activeModule() === 'approval') {
      return this.approvalLeaves();
    }
    return this.requestLeaves();
  }

  approvalCount(): number {
    return this.approvalLeaves().length;
  }

  requestCount(): number {
    return this.requestLeaves().length;
  }

  viewLeave(leave: LeaveRequest) {
    const type = leave.leaveType?.typeName || 'Leave';
    this.toastService.show(
      `Type: ${type} • From: ${leave.startDate} • To: ${leave.endDate} • Status: ${leave.status} • Reason: ${leave.reason || '-'}`,
      'info',
    );
  }
}
