import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { EmployeeService } from '../../core/services/employee.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-view-employee',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mx-auto max-w-7xl space-y-6 px-1 py-2">
      <section class="app-module-hero">
        <div>
          <p class="app-module-kicker">People Operations</p>
          <h1 class="app-module-title">Employee profile view</h1>
          <p class="app-module-text max-w-2xl">Review identity, employment details, verification state, and a quick people snapshot from one premium employee detail page.</p>
        </div>

        <div class="flex flex-wrap gap-3">
          <button (click)="goBack()" class="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Back to List</button>
          <button (click)="editEmployee()" class="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Edit Employee</button>
        </div>
      </section>

      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
        </div>
      } @else if (employee()) {
        <div class="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside class="space-y-6">
            <section class="app-surface-card text-center">
              <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-3xl font-black text-slate-700">
                {{ initials() }}
              </div>
              <h2 class="mt-5 text-2xl font-black text-slate-900">{{ employee()!.firstName }} {{ employee()!.lastName }}</h2>
              <p class="mt-2 text-sm text-slate-500">{{ employee()!.email }}</p>

              <span class="mt-4 inline-flex rounded-full px-4 py-1 text-xs font-bold capitalize" [ngClass]="statusClass()">
                {{ employee()!.status?.replace('_', ' ') }}
              </span>

              <div class="mt-6 space-y-3 text-left">
                <div class="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3">
                  <span class="text-sm text-slate-500">Employee ID</span>
                  <span class="text-sm font-semibold text-slate-900">{{ employee()!.employeeCode || 'N/A' }}</span>
                </div>
                <div class="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3">
                  <span class="text-sm text-slate-500">Role</span>
                  <span class="text-sm font-semibold text-slate-900">{{ getRoleLabel(employee()!.roleId) }}</span>
                </div>
                <div class="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3">
                  <span class="text-sm text-slate-500">Department</span>
                  <span class="text-sm font-semibold text-slate-900">{{ employee()!.department?.name || 'Not Assigned' }}</span>
                </div>
                <div class="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3">
                  <span class="text-sm text-slate-500">Designation</span>
                  <span class="text-sm font-semibold text-slate-900">{{ employee()!.designation?.name || 'Not Assigned' }}</span>
                </div>
              </div>
            </section>

            <section class="app-surface-card">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Verification Snapshot</p>
              <div class="mt-5 grid gap-3">
                <div class="rounded-md bg-slate-50 px-4 py-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Phone Verification</p>
                  <p class="mt-2 text-sm font-bold" [ngClass]="employee()!.phoneVerified ? 'text-emerald-700' : 'text-slate-600'">{{ employee()!.phoneVerified ? 'Verified' : 'Not verified' }}</p>
                </div>
                <div class="rounded-md bg-slate-50 px-4 py-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email Verification</p>
                  <p class="mt-2 text-sm font-bold" [ngClass]="employee()!.emailVerified ? 'text-emerald-700' : 'text-slate-600'">{{ employee()!.emailVerified ? 'Verified' : 'Not verified' }}</p>
                </div>
                <div class="rounded-md bg-slate-50 px-4 py-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Account Access</p>
                  <p class="mt-2 text-sm font-bold" [ngClass]="employee()!.isLocked ? 'text-rose-700' : 'text-emerald-700'">{{ employee()!.isLocked ? 'Locked' : 'Available' }}</p>
                </div>
              </div>
            </section>
          </aside>

          <section class="space-y-6">
            <div class="grid gap-4 md:grid-cols-3">
              <div class="app-stat-card">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Days Present</p>
                <p class="mt-3 text-3xl font-black text-slate-900">{{ stats().totalAttendance }}</p>
              </div>
              <div class="app-stat-card">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Leave Days Taken</p>
                <p class="mt-3 text-3xl font-black text-slate-900">{{ stats().leaveTaken }}</p>
              </div>
              <div class="app-stat-card">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Leave Balance</p>
                <p class="mt-3 text-3xl font-black text-slate-900">{{ stats().leaveBalance }}</p>
              </div>
            </div>

            <section class="app-surface-card">
              <div class="mb-6">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Personal Information</p>
                <h3 class="mt-2 text-2xl font-black text-slate-900">Identity and contact details</h3>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-md bg-slate-50 p-5" *ngFor="let item of personalInfo()">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ item.label }}</p>
                  <p class="mt-3 text-base font-semibold text-slate-900">{{ item.value }}</p>
                </div>
              </div>
            </section>

            <section class="app-surface-card">
              <div class="mb-6">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Employment Information</p>
                <h3 class="mt-2 text-2xl font-black text-slate-900">Assignment and payroll context</h3>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-md bg-slate-50 p-5" *ngFor="let item of employmentInfo()">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ item.label }}</p>
                  <p class="mt-3 text-base font-semibold text-slate-900">{{ item.value }}</p>
                </div>
              </div>
            </section>

            <section class="app-surface-card">
              <div class="mb-6">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Emergency Contact</p>
                <h3 class="mt-2 text-2xl font-black text-slate-900">Support details</h3>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-md bg-slate-50 p-5">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Contact Name</p>
                  <p class="mt-3 text-base font-semibold text-slate-900">{{ employee()!.emergencyContact || 'Not Provided' }}</p>
                </div>
                <div class="rounded-md bg-slate-50 p-5">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Phone Number</p>
                  <p class="mt-3 text-base font-semibold text-slate-900">{{ employee()!.emergencyPhone || 'Not Provided' }}</p>
                </div>
              </div>
            </section>
          </section>
        </div>
      } @else {
        <div class="app-surface-card py-16 text-center">
          <p class="text-slate-500">Employee not found.</p>
        </div>
      }
    </div>
  `,
  styles: []
})
export class ViewEmployeeComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  employeeId = 0;
  loading = signal(true);
  employee = signal<any>(null);

  stats = signal({
    totalAttendance: 0,
    leaveTaken: 0,
    leaveBalance: 0
  });

  personalInfo = computed(() => {
    const employee = this.employee();
    if (!employee) return [];
    return [
      { label: 'Full Name', value: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Not Set' },
      { label: 'Email Address', value: employee.email || 'Not Set' },
      { label: 'Phone', value: employee.phone || 'Not Provided' },
      { label: 'Gender', value: employee.gender || 'Not Set' },
      { label: 'Date of Birth', value: employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('en-IN') : 'Not Set' },
      { label: 'Address', value: employee.address || 'Not Provided' }
    ];
  });

  employmentInfo = computed(() => {
    const employee = this.employee();
    if (!employee) return [];
    return [
      { label: 'Join Date', value: employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('en-IN') : 'Not Set' },
      { label: 'Salary', value: employee.salary ? `Rs ${Number(employee.salary).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Not Provided' },
      { label: 'Bank Account', value: employee.bankAccount || 'Not Provided' },
      { label: 'Bank Name', value: employee.bankName || 'Not Provided' },
      { label: 'IFSC Code', value: employee.ifscCode || 'Not Provided' },
      { label: 'PAN Number', value: employee.panNumber || 'Not Provided' },
      { label: 'Login Type', value: employee.loginType || 'email' },
      { label: 'Country', value: employee.countryName || employee.countryCode || 'Not set' }
    ];
  });

  ngOnInit() {
    this.employeeId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.employeeId) {
      this.toastService.error('Invalid employee ID');
      this.router.navigate(['/employees']);
      return;
    }
    this.loadEmployee();
  }

  loadEmployee() {
    this.loading.set(true);
    this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: (data) => {
        this.employee.set(data);
        this.loadStats();
        this.loading.set(false);
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to load employee');
        this.router.navigate(['/employees']);
      }
    });
  }

  loadStats() {
    const emp = this.employee();
    if (emp) {
      this.stats.set({
        totalAttendance: emp.presentDays || 0,
        leaveTaken: emp.leaveTaken || 0,
        leaveBalance: emp.leaveBalance || 0
      });
    }
  }

  initials(): string {
    const employee = this.employee();
    return `${employee?.firstName?.charAt(0) || ''}${employee?.lastName?.charAt(0) || ''}` || 'HR';
  }

  statusClass(): string {
    const status = this.employee()?.status;
    if (status === 'active') return 'bg-emerald-100 text-emerald-800';
    if (status === 'on_leave') return 'bg-amber-100 text-amber-800';
    if (status === 'terminated') return 'bg-rose-100 text-rose-800';
    return 'bg-slate-100 text-slate-700';
  }

  getRoleLabel(roleId?: number): string {
    switch (roleId) {
      case 1: return 'Admin';
      case 2: return 'HR';
      case 3: return 'Manager';
      case 4: return 'Employee';
      default: return 'Employee';
    }
  }

  editEmployee() {
    this.router.navigate(['/employees/edit', this.employeeId]);
  }

  goBack() {
    this.router.navigate(['/employees']);
  }
}
