import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../core/services/attendance.service';
import { EmployeeService } from '../../core/services/employee.service';
import {
  OrganizationService,
  Department,
} from '../../core/services/organization.service';
import { User } from '../../core/models/auth.model';
import { ToastService } from '../../core/services/toast.service';
import {
  UiSelectAdvancedComponent,
  SelectOption,
} from '../../core/components/ui/ui-select-advanced.component';

interface NormalizedAttendance {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  department: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | null;
  netWorkHours: number | null;
  status: string;
  lateMinutes: number;
  source: string;
  method: string;
  kioskName: string | null;
}

@Component({
  selector: 'app-team-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, UiSelectAdvancedComponent],
  template: `
    <div class="flex flex-col gap-6 pb-10 max-w-7xl mx-auto">
      <!-- Header -->
      <header
        class="sticky top-3 z-20 rounded-lg border border-slate-100 bg-white/95 p-4 shadow-lg shadow-slate-200/60 backdrop-blur sm:p-5"
      >
        <div class="grid grid-cols-12 items-center gap-4">
        <div class="col-span-12 xl:col-span-5">
          <p class="text-[10px] font-bold uppercase tracking-wide text-teal-600">Manager Workspace</p>
          <h1 class="mt-1 text-2xl font-semibold text-slate-900 max-sm:text-lg">
            Team attendance monitoring and follow-up
          </h1>
          <p class="mt-2 text-sm font-medium text-slate-500">
            Review check-ins, late arrivals, department filters, and team
            attendance trends from one manager-friendly workspace.
          </p>
        </div>
        <div class="col-span-12 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:col-span-4">
          <div class="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <p class="text-[10px] font-bold uppercase tracking-wide text-slate-400">Visible employees</p>
            <p class="mt-1 text-sm font-black text-slate-900">{{ filteredAttendance().length }}</p>
          </div>
          <div class="rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2">
            <p class="text-[10px] font-bold uppercase tracking-wide text-cyan-500">Date</p>
            <p class="mt-1 text-sm font-black text-cyan-700">{{ selectedDate | date: 'dd MMM yyyy' }}</p>
          </div>
        </div>
        <div class="col-span-12 flex flex-col gap-3 xl:col-span-3 xl:items-end">
          <div class="flex items-center gap-2">
            <button
              (click)="refreshData()"
              [disabled]="loading()"
              class="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-md text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                [class.animate-spin]="loading()"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
        </div>
      </header>

      <!-- Filters -->
      <div class="bg-white rounded-md border border-slate-200 p-4">
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-400 uppercase"
              >Date</label
            >
            <input
              type="date"
              [(ngModel)]="selectedDate"
              (change)="scheduleLoadAttendance()"
              class="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-400 uppercase"
              >Department</label
            >
            <app-ui-select-advanced
              [(ngModel)]="selectedDepartment"
              (ngModelChange)="scheduleLoadAttendance()"
              [options]="departmentOptions()"
              placeholder="All Departments"
              size="sm"
              [searchable]="true"
            ></app-ui-select-advanced>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-400 uppercase"
              >Status</label
            >
            <app-ui-select-advanced
              [(ngModel)]="statusFilter"
              (ngModelChange)="scheduleFilterAttendance()"
              [options]="statusOptions"
              placeholder="All Status"
              size="sm"
              [searchable]="false"
              [showFooter]="false"
            ></app-ui-select-advanced>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-400 uppercase"
              >Search</label
            >
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="scheduleFilterAttendance()"
              placeholder="Search employee..."
              class="px-3 py-2 border border-slate-200 rounded-lg text-sm min-w-[200px]"
            />
          </div>
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div class="bg-white rounded-md border border-slate-200 p-4">
          <p class="text-xs font-bold text-slate-400 uppercase">Total</p>
          <p class="text-2xl font-black text-slate-900 mt-1">
            {{ stats().total }}
          </p>
        </div>
        <div class="bg-white rounded-md border border-slate-200 p-4">
          <p class="text-xs font-bold text-slate-400 uppercase">Present</p>
          <p class="text-2xl font-black text-success mt-1">
            {{ stats().present }}
          </p>
        </div>
        <div class="bg-white rounded-md border border-slate-200 p-4">
          <p class="text-xs font-bold text-slate-400 uppercase">Absent</p>
          <p class="text-2xl font-black text-error mt-1">
            {{ stats().absent }}
          </p>
        </div>
        <div class="bg-white rounded-md border border-slate-200 p-4">
          <p class="text-xs font-bold text-slate-400 uppercase">Late</p>
          <p class="text-2xl font-black text-warning mt-1">
            {{ stats().late }}
          </p>
        </div>
        <div class="bg-white rounded-md border border-slate-200 p-4">
          <p class="text-xs font-bold text-slate-400 uppercase">Half Day</p>
          <p class="text-2xl font-black text-orange-600 mt-1">
            {{ stats().halfDay }}
          </p>
        </div>
        <div class="bg-white rounded-md border border-slate-200 p-4">
          <p class="text-xs font-bold text-slate-400 uppercase">On Leave</p>
          <p class="text-2xl font-black text-blue-600 mt-1">
            {{ stats().onLeave }}
          </p>
        </div>
      </div>

      <!-- Attendance Table -->
      <div class="bg-white rounded-md border border-slate-200 overflow-hidden">
        <div
          class="p-4 border-b border-slate-100 flex justify-between items-center"
        >
          <h3 class="font-bold text-slate-800">
            Employee Attendance - {{ selectedDate | date: 'mediumDate' }}
          </h3>
          <span class="text-xs font-medium text-slate-400"
            >{{ filteredAttendance().length }} employees</span
          >
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-slate-50">
              <tr>
                <th
                  class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase"
                >
                  Employee
                </th>
                <th
                  class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase"
                >
                  Department
                </th>
                <th
                  class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase"
                >
                  Check In
                </th>
                <th
                  class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase"
                >
                  Check Out
                </th>
                <th
                  class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase"
                >
                  Work Hours
                </th>
                <th
                  class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase"
                >
                  Marked Via
                </th>
                <th
                  class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center"
                >
                  Status
                </th>
                <th
                  class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right"
                >
                  Late (min)
                </th>
                <th
                  class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @if (loading()) {
                <tr>
                  <td colspan="9" class="px-4 py-12 text-center text-slate-400">
                    <div class="flex items-center justify-center gap-2">
                      <svg
                        class="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        ></path>
                      </svg>
                      Loading attendance data...
                    </div>
                  </td>
                </tr>
              } @else if (filteredAttendance().length === 0) {
                <tr>
                  <td colspan="9" class="px-4 py-12 text-center text-slate-400">
                    No attendance records found.
                  </td>
                </tr>
              } @else {
                @for (record of filteredAttendance(); track record.id) {
                  <tr class="hover:bg-slate-50/50">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-3">
                        <div
                          class="w-9 h-9 bg-primary-50 text-primary-700 rounded-lg flex items-center justify-center font-bold text-sm"
                        >
                          {{ getEmployeeInitials(record) }}
                        </div>
                        <div class="flex flex-col">
                          <span class="font-semibold text-slate-900">{{ record.employeeName }}</span>
                          <span class="text-[11px] text-slate-500">{{ record.employeeCode }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <span class="text-sm text-slate-600">{{ record.department }}</span>
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="text-sm font-medium"
                        [class.text-warning]="record.status === 'late'"
                      >
                        {{
                          record.checkIn
                            ? (record.checkIn | date: 'shortTime')
                            : '--:--'
                        }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span class="text-sm text-slate-600">
                        {{
                          record.checkOut
                            ? (record.checkOut | date: 'shortTime')
                            : record.checkIn
                              ? 'Active'
                              : '--:--'
                        }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span class="text-sm font-medium text-slate-700">{{
                        formatHours(record.netWorkHours ?? record.workHours)
                      }}</span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex flex-col gap-1">
                        <span class="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700">
                          {{ sourceLabel(record.source) }}
                        </span>
                        <span class="text-[11px] text-slate-500">
                          {{ methodLabel(record.method) }}
                          @if (record.kioskName) {
                            <span>· {{ record.kioskName }}</span>
                          }
                        </span>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span
                        class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase"
                        [ngClass]="getStatusClass(record.status)"
                      >
                        {{ record.status }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      @if (record.lateMinutes > 0) {
                        <span
                          class="px-2 py-1 bg-amber-50 text-warning rounded text-xs font-bold"
                        >
                          +{{ record.lateMinutes }}
                        </span>
                      } @else {
                        <span class="text-xs text-slate-400">-</span>
                      }
                    </td>
                    <td class="px-4 py-3 text-right">
                      <button
                        (click)="viewDetails(record)"
                        class="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                          />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class TeamAttendanceComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private employeeService = inject(EmployeeService);
  private orgService = inject(OrganizationService);
  private toastService = inject(ToastService);
  private filterDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  // State
  loading = signal<boolean>(false);
  attendanceRecords = signal<NormalizedAttendance[]>([]);
  filteredAttendance = signal<NormalizedAttendance[]>([]);
  employees = signal<User[]>([]);
  departments = signal<Department[]>([]);

  departmentOptions = computed<SelectOption[]>(() => [
    { label: 'All Departments', value: null },
    ...this.departments().map((dept) => ({ label: dept.name, value: dept.id })),
  ]);

  statusOptions: SelectOption[] = [
    { label: 'All Status', value: '' },
    { label: 'Present', value: 'present' },
    { label: 'Absent', value: 'absent' },
    { label: 'Late', value: 'late' },
    { label: 'Half Day', value: 'half_day' },
    { label: 'On Leave', value: 'on_leave' },
  ];

  // Filters
  selectedDate = new Date().toISOString().split('T')[0];
  selectedDepartment: number | null = null;
  statusFilter = '';
  searchQuery = '';

  // Stats
  stats = signal<{
    total: number;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    onLeave: number;
  }>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    onLeave: 0,
  });

  ngOnInit() {
    this.loadDepartments();
    this.loadEmployees();
    this.loadAttendance();
  }

  scheduleLoadAttendance() {
    if (this.filterDebounceTimer) {
      clearTimeout(this.filterDebounceTimer);
    }
    this.filterDebounceTimer = setTimeout(() => this.loadAttendance(), 250);
  }

  scheduleFilterAttendance() {
    if (this.filterDebounceTimer) {
      clearTimeout(this.filterDebounceTimer);
    }
    this.filterDebounceTimer = setTimeout(() => this.filterAttendance(), 200);
  }

  private loadDepartments() {
    this.orgService.getDepartments().subscribe({
      next: (depts) => this.departments.set(depts),
      error: () => this.departments.set([]),
    });
  }

  private loadEmployees() {
    this.employeeService.getEmployees().subscribe({
      next: (emps) => this.employees.set(emps),
      error: () => this.employees.set([]),
    });
  }

  loadAttendance() {
    this.loading.set(true);
    this.attendanceService
      .getAllAttendance({
        startDate: this.selectedDate,
        endDate: this.selectedDate,
        departmentId: this.selectedDepartment ?? undefined,
      })
      .subscribe({
        next: (records) => {
          const normalized: NormalizedAttendance[] = records.map((record) => ({
            id: Number(record.id || 0),
            employeeId: Number(record.employee_id || 0),
            date: record.date || '',
            checkIn: record.check_in || null,
            checkOut: record.check_out || null,
            workHours: typeof record.work_hours === 'number' ? record.work_hours : null,
            netWorkHours: typeof record.net_work_hours === 'number' ? record.net_work_hours : null,
            status: record.status || 'absent',
            lateMinutes: record.is_late ? 15 : 0,
            employeeName: `${record.employee?.firstName || ''} ${record.employee?.lastName || ''}`.trim() || 'Unknown',
            employeeCode: record.employee_code || 'N/A',
            department: record.employee?.department || 'General',
            source: record.source || 'web',
            method: record.attendance_method || record.source || 'web',
            kioskName: record.kiosk_name || null,
          }));

          this.attendanceRecords.set(normalized);
          this.calculateStats();
          this.filterAttendance();
          this.loading.set(false);
        },
        error: () => {
          this.toastService.error('Failed to load attendance');
          this.loading.set(false);
        },
      });
  }

  filterAttendance() {
    let filtered = this.attendanceRecords();

    // Filter by department
    if (this.selectedDepartment) {
      filtered = filtered.filter((r) => {
        const emp = this.employees().find((e) => e.id === r.employeeId);
        return emp?.departmentId === this.selectedDepartment;
      });
    }

    // Filter by status
    if (this.statusFilter) {
      filtered = filtered.filter((r) => r.status === this.statusFilter);
    }

    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter((r) => {
        const name = r.employeeName.toLowerCase();
        const code = r.employeeCode.toLowerCase();
        return name.includes(query) || code.includes(query);
      });
    }

    this.filteredAttendance.set(filtered);
  }

  private calculateStats() {
    const records = this.attendanceRecords();
    const stats = {
      total: records.length,
      present: records.filter((r) => r.status === 'present').length,
      absent: records.filter((r) => r.status === 'absent').length,
      late: records.filter((r) => r.status === 'late').length,
      halfDay: records.filter((r) => r.status === 'half_day').length,
      onLeave: records.filter((r) => r.status === 'on_leave').length,
    };
    this.stats.set(stats);
  }

  refreshData() {
    this.loadAttendance();
  }

  viewDetails(record: NormalizedAttendance) {
    const message = `
Employee: ${record.employeeName}
Code: ${record.employeeCode}
Date: ${record.date}
Check In: ${record.checkIn || 'N/A'}
Check Out: ${record.checkOut || 'N/A'}
Status: ${record.status}
Work Hours: ${this.formatHours(record.netWorkHours ?? record.workHours)}
Source: ${this.sourceLabel(record.source)}
Method: ${this.methodLabel(record.method)}
Late Minutes: ${record.lateMinutes || 0}
    `.trim();
    this.toastService.show(message, 'info');
  }

  // Helper methods
  getEmployeeInitials(record: NormalizedAttendance): string {
    const parts = record.employeeName.split(' ').filter(Boolean);
    const first = parts[0]?.[0] || '?';
    const second = parts[1]?.[0] || '';
    return `${first}${second}`.toUpperCase();
  }

  formatHours(hours: number | undefined | null): string {
    if (!hours) return '--';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  getStatusClass(status: string | undefined): string {
    const classes: Record<string, string> = {
      present: 'bg-green-50 text-success border-green-200',
      absent: 'bg-red-50 text-error border-red-200',
      late: 'bg-amber-50 text-warning border-amber-200',
      half_day: 'bg-orange-50 text-orange-600 border-orange-200',
      on_leave: 'bg-blue-50 text-blue-600 border-blue-200',
      holiday: 'bg-purple-50 text-purple-600 border-purple-200',
    };
    return classes[status || ''] || 'bg-slate-50 text-slate-600';
  }

  sourceLabel(source: string | undefined): string {
    const normalized = String(source || 'web').replace(/_/g, ' ').trim().toLowerCase();
    if (normalized === 'kiosk') return 'Kiosk';
    if (normalized === 'geo fence') return 'Geo Fence';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  methodLabel(method: string | undefined): string {
    const normalized = String(method || 'web').replace(/_/g, ' ').trim().toLowerCase();
    if (normalized === 'pin') return 'PIN';
    if (normalized === 'qr') return 'QR';
    if (normalized === 'face') return 'Face';
    if (normalized === 'camera') return 'Selfie';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
}
