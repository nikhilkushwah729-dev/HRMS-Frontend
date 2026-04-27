import {
  Component,
  OnInit,
  signal,
  inject,
  computed,
  Input,
  Output,
  EventEmitter,
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
      <div class="flex flex-col items-start justify-between gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center bg-slate-50/30 rounded-t-md">
        <div class="relative w-full lg:max-w-[300px]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
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
            placeholder="Search records..."
            class="w-full pl-11 pr-4 py-2 border border-slate-200 rounded-md text-sm font-semibold outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-500/5 transition-all bg-white"
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
            class="inline-flex h-[38px] items-center justify-center px-4 border border-slate-200 rounded-md text-xs font-black uppercase tracking-widest bg-white text-slate-500 hover:bg-slate-50 transition-all"
            (click)="resetFilters()"
          >
            Reset
          </button>
        </div>
      </div>

      <!-- Table Content -->
      <div class="overflow-x-auto no-scrollbar border border-slate-200 rounded-b-md bg-white">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-100">
              <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Employee</th>
              <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
              <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Punch In</th>
              <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Punch Out</th>
              <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hours</th>
              <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
              <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Selfie</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @if (loading()) {
              <tr>
                <td colspan="7" class="px-6 py-12 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="h-8 w-8 animate-spin rounded-full border-4 border-slate-100 border-t-teal-600"></div>
                    <p class="text-sm font-bold text-slate-500">Loading attendance records...</p>
                  </div>
                </td>
              </tr>
            } @else if (filteredRecords().length === 0) {
              <tr>
                <td colspan="7" class="px-6 py-12 text-center">
                  <div class="flex flex-col items-center gap-2">
                    <span class="text-3xl">📅</span>
                    <p class="text-sm font-bold text-slate-500">No records found for the selected filters.</p>
                  </div>
                </td>
              </tr>
            } @else {
              @for (record of filteredRecords(); track record.id) {
                <tr class="hover:bg-slate-50/80 transition-all group">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
                        {{ getInitials(record) }}
                      </div>
                      <div class="flex flex-col">
                        <span class="text-sm font-bold text-slate-900">{{ getEmployeeName(record) }}</span>
                        <span class="text-[11px] font-medium text-slate-400">{{ record.employee?.department || 'General' }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-sm font-semibold text-slate-700">{{ record.date | date:'mediumDate' }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex flex-col">
                      <span class="text-sm font-bold text-slate-900">{{ record.check_in ? (record.check_in | date:'shortTime') : '--:--' }}</span>
                      <span class="text-[10px] font-medium text-slate-400">{{ record.is_late ? 'Late Arrival' : 'On Time' }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-sm font-bold text-slate-900">{{ record.check_out ? (record.check_out | date:'shortTime') : '--:--' }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-sm font-black text-teal-700">{{ formatHours(record.work_hours || 0) }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm ring-1 ring-inset"
                      [ngClass]="getStatusClass(record.status)"
                    >
                      <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                      {{ record.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    @if (record.selfie_url) {
                      <div class="relative group/image">
                        <img [src]="record.selfie_url" class="h-10 w-10 rounded-md object-cover border border-slate-200 cursor-pointer hover:scale-110 transition-transform" />
                        <div class="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                      </div>
                    } @else {
                      <span class="text-[10px] font-bold text-slate-300">N/A</span>
                    }
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
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
  
  statusOptions: SelectOption[] = [
    { label: 'All Status', value: '' },
    { label: 'Present', value: 'present' },
    { label: 'Late', value: 'late' },
    { label: 'Absent', value: 'absent' },
    { label: 'Half Day', value: 'half_day' },
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

  onFilterChange() {
    // Computed will update
  }

  resetFilters() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.onFilterChange();
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
      case 'present': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
      case 'late': return 'bg-amber-50 text-amber-700 ring-amber-600/20';
      case 'absent': return 'bg-rose-50 text-rose-700 ring-rose-600/20';
      case 'half_day': return 'bg-indigo-50 text-indigo-700 ring-indigo-600/20';
      default: return 'bg-slate-50 text-slate-600 ring-slate-500/20';
    }
  }

  formatHours(hours: number): string {
    if (!hours) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }
}
