import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { AttendanceService } from '../../../core/services/attendance.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { ToastService } from '../../../core/services/toast.service';

interface ShiftAssignment {
  id: number;
  employeeCode: string;
  empName: string;
  defaultShift: string;
  newShift: string;
  date: string;
  timeIn: string;
  timeOut: string;
}

@Component({
  selector: 'app-shift-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <!-- Tabs for Planner Modes -->
      <div class="flex items-center gap-4 bg-white p-1 rounded-md border border-slate-200 w-fit">
        <button (click)="plannerMode.set('history')"
                [class.bg-slate-900]="plannerMode() === 'history'"
                [class.text-white]="plannerMode() === 'history'"
                class="px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2">
          Assignment History
        </button>
        <button (click)="plannerMode.set('manager')"
                [class.bg-slate-900]="plannerMode() === 'manager'"
                [class.text-white]="plannerMode() === 'manager'"
                class="px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2">
          Roster Manager
        </button>
      </div>

      <!-- History View -->
      @if (plannerMode() === 'history') {
        <div class="card overflow-hidden border border-slate-200">
          <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 class="font-bold text-slate-800">Shift Assignments</h3>
            <div class="flex gap-2">
              <input type="text" placeholder="Search employee..." 
                     (input)="onSearch($event)"
                     class="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
            </div>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                  <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Default Shift</th>
                  <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Shift</th>
                  <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                  <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                @for (item of history(); track item.id) {
                  <tr class="hover:bg-slate-50/50 transition-colors">
                    <td class="px-6 py-4">
                      <div class="flex flex-col">
                        <span class="text-sm font-bold text-slate-900">{{ item.empName }}</span>
                        <span class="text-[10px] text-slate-400 font-bold uppercase">{{ item.employeeCode }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-600">{{ item.defaultShift }}</td>
                    <td class="px-6 py-4 text-sm font-bold text-primary-600">{{ item.newShift }}</td>
                    <td class="px-6 py-4 text-sm text-slate-600">{{ item.date }}</td>
                    <td class="px-6 py-4 text-right">
                      <button (click)="deleteAssignment(item.id)" class="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="px-6 py-12 text-center text-slate-400">No shift assignments found.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Manager View -->
      @if (plannerMode() === 'manager') {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Selection Sidebar -->
          <div class="lg:col-span-1 space-y-6">
            <div class="card p-6 border-slate-200">
              <h3 class="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-primary-500"></span>
                Select Employees
              </h3>
              
              <div class="space-y-4">
                <div class="relative">
                  <input type="text" placeholder="Filter employees..." 
                         [(ngModel)]="empFilter"
                         class="app-field pl-9 !py-2 text-sm">
                  <svg class="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                
                <div class="max-h-64 overflow-y-auto space-y-2 pr-2">
                  @for (emp of filteredEmployees(); track emp.id) {
                    <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                           [class.bg-primary-50]="isSelected(emp.id)">
                      <input type="checkbox" [checked]="isSelected(emp.id)" (change)="toggleEmployee(emp.id)" class="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300">
                      <span class="text-sm font-medium text-slate-700">{{ emp.firstName }} {{ emp.lastName }}</span>
                    </label>
                  }
                </div>
                
                <div class="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span class="text-xs font-bold text-slate-400">{{ selectedEmployeeIds().size }} selected</span>
                  <button (click)="selectedEmployeeIds().clear()" class="text-xs font-bold text-rose-500 hover:underline">Clear All</button>
                </div>
              </div>
            </div>

            <!-- Import Card -->
            <div class="card p-6 border-slate-200 bg-slate-900 text-white">
               <h3 class="text-xs font-black uppercase tracking-widest mb-2 opacity-80">Bulk Import</h3>
               <p class="text-xs text-slate-400 mb-4">Upload an Excel/CSV file to assign multiple shifts at once.</p>
               <label class="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-white/20 rounded-md hover:border-white/40 cursor-pointer transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span class="text-xs font-bold">Choose File</span>
                  <input type="file" class="hidden" (change)="onFileImport($event)">
               </label>
            </div>
          </div>

          <!-- Roster Form -->
          <div class="lg:col-span-2">
            <form [formGroup]="rosterForm" (ngSubmit)="submitRoster()" class="card p-8 border-slate-200 space-y-8">
              <h3 class="text-base font-black text-slate-900 tracking-tight flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                </div>
                Configure Roster
              </h3>

              <div formArrayName="assignedShifts" class="space-y-6">
                @for (item of assignedShifts.controls; track i; let i = $index) {
                  <div [formGroupName]="i" class="p-6 rounded-md border border-slate-100 bg-slate-50/50 relative group">
                    <button type="button" (click)="removeShift(i)" 
                            class="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div class="flex flex-col gap-1.5">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Type</label>
                        <select formControlName="shift" class="app-select !py-2">
                          <option value="">Select Shift</option>
                          @for (s of shifts; track s.id) {
                            <option [value]="s.id">{{ s.name }} ({{ s.start_time }} - {{ s.end_time }})</option>
                          }
                        </select>
                      </div>
                      <div class="flex flex-col gap-1.5">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">From Date</label>
                        <input type="date" formControlName="from" class="app-field !py-2 text-sm">
                      </div>
                      <div class="flex flex-col gap-1.5">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">To Date</label>
                        <input type="date" formControlName="to" class="app-field !py-2 text-sm">
                      </div>
                    </div>
                  </div>
                }
              </div>

              <div class="flex flex-col sm:flex-row justify-between items-center gap-6 pt-6 border-t border-slate-100">
                <button type="button" (click)="addShift()" 
                        class="text-sm font-bold text-primary-600 flex items-center gap-2 hover:bg-primary-50 px-4 py-2 rounded-md transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  Add Another Rotation
                </button>
                
                <div class="flex items-center gap-3 w-full sm:w-auto">
                  <button type="button" (click)="resetForm()" class="flex-1 sm:flex-none px-6 py-2.5 rounded-md text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">Reset</button>
                  <button type="submit" [disabled]="rosterForm.invalid || selectedEmployeeIds().size === 0 || processing()"
                          class="flex-1 sm:flex-none px-8 py-2.5 bg-slate-900 text-white rounded-md text-sm font-black hover:bg-slate-800 shadow-xl shadow-slate-900/10 disabled:opacity-50 transition-all">
                    {{ processing() ? 'Processing...' : 'Assign Roster' }}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .card { @apply bg-white rounded-md shadow-sm border border-slate-100; }
  `]
})
export class ShiftPlannerComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private employeeService = inject(EmployeeService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  plannerMode = signal<'history' | 'manager'>('history');
  history = signal<ShiftAssignment[]>([]);
  employees = signal<any[]>([]);
  shifts: any[] = [];
  selectedEmployeeIds = signal<Set<number>>(new Set());
  empFilter = '';
  processing = signal(false);

  rosterForm: FormGroup = this.fb.group({
    assignedShifts: this.fb.array([])
  });

  filteredEmployees = computed(() => {
    const filter = this.empFilter.toLowerCase();
    return this.employees().filter(e => 
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(filter) ||
      e.employeeCode?.toLowerCase().includes(filter)
    );
  });

  ngOnInit() {
    this.loadHistory();
    this.loadEmployees();
    this.loadShifts();
    this.addShift(); // Start with one row
  }

  loadHistory() {
    this.attendanceService.getShiftPlannerHistory({}).subscribe({
      next: (res) => {
         // Mock data if backend returns empty for now, to show the UI
         if (!res || res.length === 0) {
            this.history.set([
              { id: 1, employeeCode: 'EMP001', empName: 'John Doe', defaultShift: 'General Shift', newShift: 'Night Shift', date: '2026-03-21', timeIn: '22:00', timeOut: '06:00' },
              { id: 2, employeeCode: 'EMP005', empName: 'Sarah Smith', defaultShift: 'General Shift', newShift: 'Evening Shift', date: '2026-03-21', timeIn: '14:00', timeOut: '22:00' }
            ]);
         } else {
            this.history.set(res.data || res);
         }
      }
    });
  }

  loadEmployees() {
    this.employeeService.getEmployees().subscribe({
      next: (res) => this.employees.set(res)
    });
  }

  loadShifts() {
    this.attendanceService.getShifts().subscribe({
      next: (res) => this.shifts = res
    });
  }

  get assignedShifts() {
    return this.rosterForm.get('assignedShifts') as FormArray;
  }

  addShift() {
    const shiftGroup = this.fb.group({
      shift: ['', Validators.required],
      from: ['', Validators.required],
      to: ['', Validators.required]
    });
    this.assignedShifts.push(shiftGroup);
  }

  removeShift(index: number) {
    if (this.assignedShifts.length > 1) {
      this.assignedShifts.removeAt(index);
    }
  }

  isSelected(id: number) {
    return this.selectedEmployeeIds().has(id);
  }

  toggleEmployee(id: number) {
    const selected = new Set(this.selectedEmployeeIds());
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.selectedEmployeeIds.set(selected);
  }

  submitRoster() {
    if (this.rosterForm.valid && this.selectedEmployeeIds().size > 0) {
      this.processing.set(true);
      const data = {
        empList: Array.from(this.selectedEmployeeIds()),
        shiftRotArray: this.assignedShifts.value.map((s: any) => ({
          scheduledate: s.from,
          scheduledateto: s.to,
          shiftid: Number(s.shift)
        }))
      };

      this.attendanceService.createShiftAssignment(data).subscribe({
        next: () => {
          this.toastService.success('Shift roster assigned successfully');
          this.processing.set(false);
          this.resetForm();
          this.plannerMode.set('history');
          this.loadHistory();
        },
        error: () => {
          this.toastService.error('Failed to assign shift roster');
          this.processing.set(false);
        }
      });
    }
  }

  deleteAssignment(id: number) {
    if (confirm('Are you sure you want to delete this shift assignment?')) {
      this.attendanceService.deleteShiftAssignment(id).subscribe({
        next: () => {
          this.toastService.success('Assignment deleted');
          this.loadHistory();
        }
      });
    }
  }

  resetForm() {
    this.rosterForm.reset();
    while (this.assignedShifts.length > 0) {
      this.assignedShifts.removeAt(0);
    }
    this.addShift();
    this.selectedEmployeeIds.set(new Set());
  }

  onSearch(event: any) {
    const query = event.target.value;
    this.attendanceService.getShiftPlannerHistory({ search: query }).subscribe({
      next: (res) => this.history.set(res.data || res)
    });
  }

  onFileImport(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.attendanceService.importShiftPlanner(file).subscribe({
        next: () => {
          this.toastService.success('Shifts imported successfully');
          this.loadHistory();
        },
        error: () => this.toastService.error('Import failed')
      });
    }
  }
}
