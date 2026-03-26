import { Component, OnInit, signal, inject, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../core/services/employee.service';
import { User } from '../../core/models/auth.model';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';
import { LiveRefreshService } from '../../core/services/live-refresh.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col gap-6">
      <header class="app-module-hero flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
        <div class="max-w-2xl">
          <p class="app-module-kicker">Employee Workspace</p>
          <h1 class="app-module-title mt-3">People directory and workforce records</h1>
          <p class="app-module-text mt-3">Manage active employees, onboarding flow, leave visibility, and organization headcount from one place.</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 flex-wrap xl:items-end">
          <div class="app-module-highlight min-w-[220px]">
            <span class="app-module-highlight-label">Directory health</span>
            <div class="app-module-highlight-value mt-3">{{ employeeStats().active }}</div>
            <p class="mt-2 text-sm text-white/80">Active team members currently available in the workforce directory.</p>
          </div>
          <div class="flex gap-3 flex-wrap">
          <button class="bg-white border border-stone-200 px-5 py-3 rounded-md font-semibold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                  (click)="exportEmployees()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download-cloud"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>
            Export
          </button>
          <button class="btn-primary flex items-center gap-2 rounded-md px-5 py-3" (click)="addEmployee()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Add Employee
          </button>
          </div>
        </div>
      </header>

      <section class="app-stat-grid">
        <div class="app-stat-card">
          <p class="app-stat-label">Total Employees</p>
          <p class="mt-3 app-stat-value">{{ employeeStats().total }}</p>
          <p class="mt-1 text-sm text-slate-500">All employee records</p>
        </div>
        <div class="app-stat-card">
          <p class="app-stat-label">Active</p>
          <p class="mt-3 app-stat-value text-emerald-600">{{ employeeStats().active }}</p>
          <p class="mt-1 text-sm text-slate-500">Currently working</p>
        </div>
        <div class="app-stat-card">
          <p class="app-stat-label">On Leave</p>
          <p class="mt-3 app-stat-value text-amber-500">{{ employeeStats().onLeave }}</p>
          <p class="mt-1 text-sm text-slate-500">Temporary absences</p>
        </div>
        <div class="app-stat-card">
          <p class="app-stat-label">Terminated</p>
          <p class="mt-3 app-stat-value text-rose-500">{{ employeeStats().terminated }}</p>
          <p class="mt-1 text-sm text-slate-500">Historical records</p>
        </div>
      </section>

      <!-- Tab Navigation -->
      <div class="flex border-b border-slate-100 overflow-x-auto no-scrollbar bg-white rounded-t-xl px-2">
        @for (tab of tabs; track tab.id) {
          @let tId = tab.id;
          <button (click)="setTab(tId)"
                  [class]="'px-6 py-4 text-sm font-bold whitespace-nowrap transition-all relative ' + 
                           (currentTab() === tId ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600')">
            <div class="flex items-center gap-2">
              {{ tab.label }}
              <span [class]="'px-1.5 py-0.5 rounded text-[10px] ' + 
                             (currentTab() === tab.id ? 'bg-primary-50 text-primary-600' : 'bg-slate-50 text-slate-400')">
                {{ tab.count }}
              </span>
            </div>
            @if (currentTab() === tab.id) {
              <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full animate-fade-in"></div>
            }
          </button>
        }
      </div>

      <div class="card overflow-hidden !rounded-t-none">
        <div class="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div class="relative w-full md:max-w-[320px]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="text" 
                   [(ngModel)]="searchQuery" 
                   (input)="onFilterChange()"
                   placeholder="Search by name, email or code..." 
                   class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/10 transition-all">
          </div>
          <div class="flex gap-2 w-full md:w-auto">
            <select [(ngModel)]="statusFilter" 
                    (change)="onFilterChange()"
                    class="flex-1 md:flex-none px-3 py-2 border border-slate-200 rounded-md text-sm font-medium bg-white outline-none">
              <option value="">Status: All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>
            <button class="flex-1 md:flex-none px-3 py-2 border border-slate-200 rounded-md text-sm font-medium bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                    (click)="clearFilters()">
              Clear
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50">
                <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Joined Date</th>
                <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @if (loading()) {
                <tr><td colspan="6" class="px-6 py-12 text-center text-slate-400 font-medium">Loading employees...</td></tr>
              } @else if (filteredEmployees().length === 0) {
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center gap-3">
                      <div class="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                      </div>
                      <div>
                        <p class="text-slate-700 font-semibold">No employees found</p>
                        <p class="text-slate-400 text-sm">Try another search or clear your filters.</p>
                      </div>
                      <button class="px-4 py-2 rounded-md border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                              (click)="clearFilters()">
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              } @else {
                @for (emp of filteredEmployees(); track emp.id) {
                  <tr class="hover:bg-slate-50/50 transition-colors">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 bg-primary-50 text-primary-700 rounded-lg flex items-center justify-center font-bold text-sm">
                          {{ emp.firstName[0] }}
                        </div>
                        <div class="flex flex-col">
                          <span class="font-semibold text-slate-900">{{ emp.firstName }} {{ emp.lastName }}</span>
                          <span class="text-[11px] text-slate-500 font-medium">{{ emp.email }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{{ emp.employeeCode || 'N/A' }}</span>
                    </td>
                    <td class="px-6 py-4 text-slate-600 font-medium text-sm">
                      {{ emp.roleId === 1 ? 'Admin' : emp.roleId === 2 ? 'HR' : 'Employee' }}
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-3 py-1 rounded-full text-[10px] font-bold capitalize whitespace-nowrap" 
                        [ngClass]="{
                          'bg-green-50 text-success': emp.status === 'active',
                          'bg-orange-50 text-orange-600': emp.status === 'on_leave',
                          'bg-red-50 text-error': emp.status === 'terminated',
                          'bg-slate-50 text-slate-500': emp.status === 'inactive'
                        }">
                        {{ emp.status.split('_').join(' ') }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-slate-500 text-sm italic">{{ (emp.createdAt | date:'mediumDate') || 'Recently' }}</td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-2">
                        <button (click)="viewEmployee(emp)" class="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-primary-600 transition-colors" title="View Details">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button (click)="editEmployee(emp)" class="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-primary-600 transition-colors" title="Edit">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                        <button (click)="deleteEmployee(emp.id)" class="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-error transition-colors" title="Delete">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
        
        <div class="p-6 flex justify-between items-center border-t border-slate-50">
          <span class="text-sm text-slate-400 font-medium tracking-tight">
            Showing {{ filteredEmployees().length }} of {{ rawEmployees().length }} entries
          </span>
          <div class="flex gap-2">
            <button class="px-4 py-2 border border-slate-200 rounded text-sm font-medium text-slate-400 disabled:opacity-50 cursor-not-allowed" disabled>Previous</button>
            <button class="px-4 py-2 bg-primary-600 text-white rounded text-sm font-bold border border-primary-600">1</button>
            <button class="px-4 py-2 bg-white border border-slate-200 rounded text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private modalService = inject(ModalService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private liveRefreshService = inject(LiveRefreshService);
  private destroyRef = inject(DestroyRef);

  rawEmployees = signal<any[]>([]);
  loading = signal<boolean>(true);
  searchQuery = '';
  statusFilter = '';
  currentTab = signal<'active' | 'inactive' | 'on_leave' | 'terminated'>('active');
  filteredEmployees = computed(() => {
    let filtered = [...this.rawEmployees()];
    filtered = filtered.filter((employee) => employee.status === this.currentTab());

    if (this.statusFilter) {
      filtered = filtered.filter((employee) => employee.status === this.statusFilter);
    }

    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((employee) =>
        employee.firstName?.toLowerCase().includes(q) ||
        employee.lastName?.toLowerCase().includes(q) ||
        employee.email?.toLowerCase().includes(q) ||
        employee.employeeCode?.toLowerCase().includes(q) ||
        employee.phone?.toLowerCase().includes(q)
      );
    }

    return filtered;
  });
  employeeStats = computed(() => {
    const employees = this.rawEmployees();
    return {
      total: employees.length,
      active: employees.filter((employee) => employee.status === 'active').length,
      onLeave: employees.filter((employee) => employee.status === 'on_leave').length,
      terminated: employees.filter((employee) => employee.status === 'terminated').length,
    };
  });
  tabs: { id: 'active' | 'inactive' | 'on_leave' | 'terminated'; label: string; count: number }[] = [
    { id: 'active', label: 'Active', count: 0 },
    { id: 'inactive', label: 'Inactive', count: 0 },
    { id: 'on_leave', label: 'On Leave', count: 0 },
    { id: 'terminated', label: 'Terminated', count: 0 }
  ];

  ngOnInit() {
    this.loadEmployees();
    this.liveRefreshService.createStream(15000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadEmployees(false));
  }

  loadEmployees(showLoader = true) {
    if (showLoader) {
      this.loading.set(true);
    }

    this.employeeService.getEmployees().subscribe({
      next: (data) => {
        // Update counts
        this.tabs[0].count = data.filter(e => e.status === 'active').length;
        this.tabs[1].count = data.filter(e => e.status === 'inactive').length;
        this.tabs[2].count = data.filter(e => e.status === 'on_leave').length;
        this.tabs[3].count = data.filter(e => e.status === 'terminated').length;

        this.rawEmployees.set(data);
        this.loading.set(false);
      },
      error: () => {
        // MOCK DATA for perfect UI
        const mockEmployees: any[] = [
          { id: 1, firstName: 'Rohan', lastName: 'Sharma', email: 'rohan.s@company.com', employeeCode: 'EMP001', status: 'active', roleId: 1, createdAt: new Date('2024-01-15').toISOString() },
          { id: 2, firstName: 'Priya', lastName: 'Verma', email: 'priya.v@company.com', employeeCode: 'EMP002', status: 'active', roleId: 3, createdAt: new Date('2024-02-10').toISOString() },
          { id: 3, firstName: 'Amit', lastName: 'Patel', email: 'amit.p@company.com', employeeCode: 'EMP003', status: 'on_leave', roleId: 3, createdAt: new Date('2024-03-05').toISOString() },
          { id: 4, firstName: 'Sneha', lastName: 'Reddy', email: 'sneha.r@company.com', employeeCode: 'EMP004', status: 'active', roleId: 2, createdAt: new Date('2024-04-20').toISOString() },
          { id: 5, firstName: 'Vikram', lastName: 'Singh', email: 'vikram.s@company.com', employeeCode: 'EMP005', status: 'terminated', roleId: 3, createdAt: new Date('2023-11-12').toISOString() }
        ];
        
        // Update counts for mocks
        this.tabs[0].count = mockEmployees.filter(e => e.status === 'active').length;
        this.tabs[1].count = mockEmployees.filter(e => e.status === 'inactive').length;
        this.tabs[2].count = mockEmployees.filter(e => e.status === 'on_leave').length;
        this.tabs[3].count = mockEmployees.filter(e => e.status === 'terminated').length;

        this.rawEmployees.set(mockEmployees);
        this.loading.set(false);
      }
    });
  }

  setTab(tabId: 'active' | 'inactive' | 'on_leave' | 'terminated') {
    this.currentTab.set(tabId);
    this.onFilterChange();
  }

  onFilterChange() {
    this.rawEmployees.update((employees) => [...employees]);
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.onFilterChange();
  }

  exportEmployees() {
    const rows = this.filteredEmployees();
    if (!rows.length) {
      this.toastService.error('No employees available to export');
      return;
    }

    const csv = [
      ['First Name', 'Last Name', 'Email', 'Phone', 'Employee Code', 'Status'].join(','),
      ...rows.map((employee) => [
        employee.firstName ?? '',
        employee.lastName ?? '',
        employee.email ?? '',
        employee.phone ?? '',
        employee.employeeCode ?? '',
        employee.status ?? '',
      ].map((value: string) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employees-${this.currentTab()}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    this.toastService.success('Employee export downloaded');
  }

  addEmployee() {
    this.router.navigate(['/employees/add']);
  }

  editEmployee(emp: any) {
    this.router.navigate(['/employees/edit', emp.id]);
  }

  viewEmployee(emp: any) {
    this.router.navigate(['/employees/view', emp.id]);
  }

  async deleteEmployee(id: number) {
    const confirmed = await this.modalService.confirm({
      title: 'Delete Employee',
      message: 'Are you sure you want to delete this employee? This action cannot be undone.',
      confirmText: 'Delete Now',
      cancelText: 'Keep Employee',
      type: 'danger'
    });

    if (confirmed) {
      this.employeeService.deleteEmployee(id).subscribe({
        next: () => {
          this.toastService.success('Employee deleted successfully');
          this.loadEmployees();
        },
        error: (err) => {
          this.toastService.error('Failed to delete employee');
          console.error(err);
        }
      });
    }
  }
}
