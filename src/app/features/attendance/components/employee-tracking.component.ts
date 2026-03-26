import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, AttendanceRecord } from '../../../core/services/attendance.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-employee-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)]">
      <!-- Left: Employee List -->
      <div class="w-full lg:w-80 bg-white border border-slate-200 rounded-md flex flex-col shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 class="font-bold text-slate-900 mb-3 flex justify-between items-center">
            Live Status
            <span class="px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full text-[10px] uppercase tracking-wider">{{ employees().length }} Online</span>
          </h3>
          <div class="relative">
            <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="filterEmployees()" 
                   placeholder="Search employee..." 
                   class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <div *ngFor="let emp of filteredEmployees()" 
               (click)="selectEmployee(emp)"
               [class.bg-primary-50]="selectedEmployee()?.id === emp.employee_id"
               [class.border-l-4]="selectedEmployee()?.id === emp.employee_id"
               [class.border-primary-600]="selectedEmployee()?.id === emp.employee_id"
               class="p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors flex items-center gap-3">
            <div class="relative">
                <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase border border-slate-200 overflow-hidden">
                    <img *ngIf="emp.employee?.avatar" [src]="emp.employee?.avatar" class="w-full h-full object-cover">
                    <span *ngIf="!emp.employee?.avatar">{{ (emp.employee?.firstName?.charAt(0) || '') + (emp.employee?.lastName?.charAt(0) || '') }}</span>
                </div>
                <div [class]="emp.check_out ? 'bg-slate-300' : 'bg-success'" 
                     class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"></div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-slate-900 truncate">{{ emp.employee?.firstName }} {{ emp.employee?.lastName }}</p>
              <p class="text-[10px] text-slate-500 truncate">{{ emp.location_address || 'Locating...' }}</p>
            </div>
          </div>
          
          <div *ngIf="employees().length === 0" class="p-8 text-center text-slate-400">
            <svg class="mx-auto mb-2 opacity-20" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <p class="text-xs font-medium">No one is currently clocked in</p>
          </div>
        </div>
      </div>

      <!-- Right: Map View -->
      <div class="flex-1 bg-white border border-slate-200 rounded-md shadow-sm relative overflow-hidden flex flex-col">
        <!-- Map Header -->
        <div class="p-4 border-b border-slate-100 flex justify-between items-center z-10 bg-white/80 backdrop-blur-md">
            <div *ngIf="selectedEmployee(); else noSelection" class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-[10px]">
                    {{ selectedEmployee()?.employee?.firstName?.charAt(0) }}
                </div>
                <div>
                    <h4 class="text-sm font-bold text-slate-900">{{ selectedEmployee()?.employee?.firstName }}'s Last Location</h4>
                    <p class="text-[10px] text-slate-500">Updated: {{ selectedEmployee()?.updated_at | date:'shortTime' }}</p>
                </div>
            </div>
            <ng-template #noSelection>
                <h4 class="text-sm font-bold text-slate-900">Fleet Map Overview</h4>
            </ng-template>

            <div class="flex items-center gap-2">
                <button (click)="refreshData()" class="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors" title="Refresh Locations">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                </button>
            </div>
        </div>

        <!-- Simulated Map Placeholder -->
        <div class="flex-1 bg-slate-100 relative group">
            <!-- Map Grid Pattern -->
            <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(#000 0.5px, transparent 0.5px); background-size: 20px 20px;"></div>
            
            <!-- Map Pins (Simulated) -->
            <div *ngFor="let emp of filteredEmployees()" 
                 [style.left]="getSimulatedX(emp) + '%'" 
                 [style.top]="getSimulatedY(emp) + '%'"
                 (click)="selectEmployee(emp)"
                 class="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000">
                
                <!-- Pulse Effect for Active -->
                <div *ngIf="!emp.check_out" class="absolute inset-0 w-full h-full bg-primary-500 rounded-full animate-ping opacity-20 scale-150"></div>
                
                <!-- Pin Body -->
                <div [class]="selectedEmployee()?.id === emp.id ? 'scale-125 z-50' : 'z-10'"
                     class="relative flex flex-col items-center">
                    <div [class]="emp.check_out ? 'bg-slate-600' : 'bg-primary-600'" 
                         class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center overflow-hidden">
                        <img *ngIf="emp.employee?.avatar" [src]="emp.employee?.avatar" class="w-full h-full object-cover">
                        <span *ngIf="!emp.employee?.avatar" class="text-white text-[10px] font-bold">{{ emp.employee?.firstName?.charAt(0) }}</span>
                    </div>
                    <div [class]="emp.check_out ? 'border-t-slate-600' : 'border-t-primary-600'"
                         class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] -mt-1"></div>
                </div>

                <!-- Tooltip (Visible on hover or selection) -->
                <div [class]="selectedEmployee()?.id === emp.id ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'"
                     class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-slate-900 text-white p-2 rounded-lg text-[10px] shadow-2xl transition-all pointer-events-none">
                    <p class="font-bold truncate">{{ emp.employee?.firstName }} {{ emp.employee?.lastName }}</p>
                    <p class="opacity-70">{{ emp.check_out ? 'Offline' : 'Online' }} · {{ emp.check_in | date:'shortTime' }}</p>
                </div>
            </div>

            <!-- Empty Map State -->
            <div *ngIf="filteredEmployees().length === 0" class="absolute inset-0 flex items-center justify-center flex-col text-slate-400">
                <div class="w-20 h-20 bg-slate-200 rounded-full mb-4 flex items-center justify-center border-4 border-white shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <p class="font-bold">No active locations tracked</p>
                <p class="text-xs">Once employees clock in, they will appear here.</p>
            </div>

            <!-- Legend Overlay -->
            <div class="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg border border-slate-200 shadow-lg text-[10px] font-bold flex flex-col gap-2 pointer-events-none">
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-primary-600"></div>
                    <span class="text-slate-700">Clocked In (Live)</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-slate-600"></div>
                    <span class="text-slate-700">Clocked Out (Last Pos)</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `]
})
export class EmployeeTrackingComponent implements OnInit, OnDestroy {
  private attendanceService = inject(AttendanceService);

  employees = signal<AttendanceRecord[]>([]);
  filteredEmployees = signal<AttendanceRecord[]>([]);
  selectedEmployee = signal<AttendanceRecord | null>(null);
  searchQuery = '';

  private pollSub?: Subscription;

  ngOnInit() {
    this.refreshData();
    // Poll for updates every 15 seconds
    this.pollSub = interval(15000).subscribe(() => this.refreshData());
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  refreshData() {
    this.attendanceService.getTodayAllAttendance().subscribe({
      next: (data) => {
        this.employees.set(data);
        this.filterEmployees();
      },
      error: (err) => console.error('Tracking refresh failed', err)
    });
  }

  filterEmployees() {
    const query = this.searchQuery.toLowerCase();
    const filtered = this.employees().filter(e => 
      (e.employee?.firstName?.toLowerCase().includes(query) || 
       e.employee?.lastName?.toLowerCase().includes(query))
    );
    this.filteredEmployees.set(filtered);
  }

  selectEmployee(emp: AttendanceRecord) {
    this.selectedEmployee.set(emp);
  }

  // Simulated coordinates for map placeholder based on lat/lng or a random position if missing
  getSimulatedX(emp: AttendanceRecord): number {
    if (emp.longitude) {
        // Map longitude to percentage (simple mapping for demo)
        return ((emp.longitude % 1) * 1000) % 90 + 5;
    }
    return (emp.employee_id * 17) % 80 + 10;
  }

  getSimulatedY(emp: AttendanceRecord): number {
    if (emp.latitude) {
        return ((emp.latitude % 1) * 1000) % 80 + 10;
    }
    return (emp.employee_id * 31) % 70 + 15;
  }
}
