import {
  Component,
  OnInit,
  signal,
  inject,
  computed,
  Input,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, AttendanceRecord, AttendanceFilter } from '../../../core/services/attendance.service';
import { UiSelectAdvancedComponent, SelectOption } from '../../../core/components/ui/ui-select-advanced.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-attendance-table',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, UiSelectAdvancedComponent],
  template: `
    <div class="flex flex-col gap-4">
      <!-- Search and Filters -->
      <div class="flex flex-col items-start justify-between gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center bg-slate-50/50 rounded-t-xl">
        <div class="relative w-full lg:max-w-[320px]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="onFilterChange()"
            placeholder="Search employee or date..."
            class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all bg-white text-slate-800 placeholder:text-slate-400"
          />
        </div>
        
        <div class="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:items-center">
          <div class="w-full sm:w-[180px]">
            <app-ui-select-advanced
              [(ngModel)]="statusFilter"
              (ngModelChange)="onFilterChange()"
              [options]="statusOptions"
              placeholder="Filter Status"
              [searchable]="false"
            ></app-ui-select-advanced>
          </div>
          <button
            class="inline-flex h-[38px] items-center justify-center px-4 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            (click)="resetFilters()"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <!-- Table Content -->
      <div class="overflow-x-auto border border-slate-200/80 rounded-b-xl bg-white shadow-xs">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employee</th>
              <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
              <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Check In</th>
              <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Check Out</th>
              <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Work Hours</th>
              <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Selfie / Image</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs">
            @if (loading()) {
              @for (item of [1, 2, 3, 4, 5]; track item) {
                <tr class="animate-pulse">
                  <td class="px-5 py-4">
                    <div class="flex items-center gap-3">
                      <div class="h-9 w-9 rounded-full bg-slate-200"></div>
                      <div class="space-y-1.5 flex-1">
                        <div class="h-3 w-28 rounded bg-slate-200"></div>
                        <div class="h-2.5 w-16 rounded bg-slate-150"></div>
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-4"><div class="h-3 w-20 rounded bg-slate-200"></div></td>
                  <td class="px-5 py-4"><div class="h-3 w-16 rounded bg-slate-200"></div></td>
                  <td class="px-5 py-4"><div class="h-3 w-16 rounded bg-slate-200"></div></td>
                  <td class="px-5 py-4"><div class="h-3 w-14 rounded bg-slate-200"></div></td>
                  <td class="px-5 py-4"><div class="h-5 w-18 rounded-full bg-slate-200"></div></td>
                  <td class="px-5 py-4"><div class="h-8 w-8 rounded-md bg-slate-200"></div></td>
                </tr>
              }
            } @else if (paginatedRecords().length === 0) {
              <tr>
                <td colspan="7" class="px-6 py-12 text-center">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                    <p class="text-sm font-semibold text-slate-700">No attendance records found</p>
                    <p class="text-xs text-slate-400">Try adjusting your search query or filter options.</p>
                  </div>
                </td>
              </tr>
            } @else {
              @for (record of paginatedRecords(); track record.id) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="px-5 py-3.5">
                    <div class="flex items-center gap-3">
                      <div class="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {{ getInitials(record) }}
                      </div>
                      <div class="flex flex-col">
                        <span class="font-semibold text-slate-900">{{ getEmployeeName(record) }}</span>
                        <span class="text-[10px] text-slate-400">{{ record.employee?.department || 'General' }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-3.5 text-slate-700 font-medium">
                    {{ record.date | date:'mediumDate' }}
                  </td>
                  <td class="px-5 py-3.5">
                    <div class="flex flex-col">
                      <span class="font-semibold text-slate-900">{{ record.check_in ? (record.check_in | date:'shortTime') : '--:--' }}</span>
                      @if (record.is_late) {
                        <span class="text-[9px] font-bold text-amber-600 uppercase tracking-tight">Late</span>
                      }
                    </div>
                  </td>
                  <td class="px-5 py-3.5 font-semibold text-slate-900">
                    {{ record.check_out ? (record.check_out | date:'shortTime') : '--:--' }}
                  </td>
                  <td class="px-5 py-3.5 font-bold text-indigo-600">
                    {{ formatHours(record.work_hours || 0) }}
                  </td>
                  <td class="px-5 py-3.5">
                    <span
                      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize shadow-xs"
                      [ngClass]="getStatusClass(record.status)"
                    >
                      <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                      {{ record.status ? record.status.replace('_', ' ') : 'present' }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5">
                    @if (getTimeInImage(record)) {
                      <div class="relative inline-block">
                        <img [src]="getTimeInImage(record)" class="h-8 w-8 rounded-md object-cover border border-slate-200 shadow-xs" />
                      </div>
                    } @else {
                      <span class="text-[10px] text-slate-300 font-medium">--</span>
                    }
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>

        <!-- Server Pagination Footer Bar -->
        @if (!loading() && filteredRecords().length > 0) {
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-500">
            <div class="flex items-center gap-2">
              <span>Show</span>
              <select
                [(ngModel)]="pageSize"
                (change)="currentPage = 1"
                class="px-2 py-1 border border-slate-200 rounded-md bg-white text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
              >
                <option [value]="10">10</option>
                <option [value]="25">25</option>
                <option [value]="50">50</option>
              </select>
              <span>entries</span>
              <span class="ml-3 text-slate-400">
                Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ filteredRecords().length }} records
              </span>
            </div>

            <div class="flex items-center gap-1">
              <button
                [disabled]="currentPage === 1"
                (click)="currentPage = currentPage - 1"
                class="px-3 py-1.5 border border-slate-200 rounded-md bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
              >
                Previous
              </button>
              <span class="px-3 py-1 font-semibold text-slate-700">
                {{ currentPage }} / {{ totalPages }}
              </span>
              <button
                [disabled]="currentPage >= totalPages"
                (click)="currentPage = currentPage + 1"
                class="px-3 py-1.5 border border-slate-200 rounded-md bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [],
})
export class AttendanceDataTableComponent implements OnInit {
  private attendanceService = inject(AttendanceService);

  @Input() adminMode = false;
  
  records = signal<AttendanceRecord[]>([]);
  loading = signal<boolean>(true);
  
  searchQuery = '';
  statusFilter = '';
  
  currentPage = 1;
  pageSize = 10;
  
  statusOptions: SelectOption[] = [
    { label: 'All Status', value: '' },
    { label: 'Present', value: 'present' },
    { label: 'Late', value: 'late' },
    { label: 'Absent', value: 'absent' },
    { label: 'Half Day', value: 'half_day' },
    { label: 'On Leave', value: 'on_leave' },
  ];

  ngOnInit() {
    this.loadRecords();
  }

  loadRecords() {
    this.loading.set(true);
    const filter: AttendanceFilter = {};
    
    const obs = this.adminMode 
      ? this.attendanceService.getAllAttendance(filter)
      : this.attendanceService.getAttendanceHistory(filter);

    obs.pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.records.set(data || []),
        error: (err) => console.error('Failed to load attendance records', err)
      });
  }

  filteredRecords = computed(() => {
    let list = this.records();
    const q = this.searchQuery.toLowerCase().trim();
    const s = this.statusFilter;

    if (q) {
      list = list.filter(r => 
        this.getEmployeeName(r).toLowerCase().includes(q) ||
        r.date.includes(q)
      );
    }

    if (s) {
      list = list.filter(r => r.status === s);
    }

    return list;
  });

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRecords().length / this.pageSize));
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.filteredRecords().length);
  }

  paginatedRecords = computed(() => {
    const list = this.filteredRecords();
    return list.slice(this.startIndex, this.endIndex);
  });

  onFilterChange() {
    this.currentPage = 1;
  }

  resetFilters() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.currentPage = 1;
  }

  getEmployeeName(record: AttendanceRecord): string {
    if (record.employee) {
      return `${record.employee.firstName} ${record.employee.lastName || ''}`.trim();
    }
    return 'Unknown';
  }

  getInitials(record: AttendanceRecord): string {
    const name = this.getEmployeeName(record);
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'present': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'late': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'absent': return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'half_day': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'on_leave': return 'bg-sky-50 text-sky-700 border border-sky-200';
      default: return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  }

  formatHours(hours: number): string {
    if (!hours) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  getTimeInImage(record: AttendanceRecord): string | null {
    return record.check_in_photo || record.selfie_url || null;
  }
}
