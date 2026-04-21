import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { EmployeeService } from '../../core/services/employee.service';
import { ToastService } from '../../core/services/toast.service';
import { LanguageService } from '../../core/services/language.service';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-view-employee',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mx-auto max-w-7xl space-y-5 px-1 py-2 sm:space-y-6">
      <section class="overflow-hidden rounded-md border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_38%),linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#f8fafc_100%)] shadow-sm">
        <div class="flex flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-8">
          <div class="min-w-0">
            <div class="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              <span class="h-2 w-2 rounded-full bg-slate-700"></span>
              {{ t('employee.peopleOperations') }}
            </div>
            <h1 class="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{{ t('employee.profileView') }}</h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{{ t('employee.profileViewSubtitle') }}</p>
          </div>

          <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button (click)="goBack()" class="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:min-w-[140px]">{{ t('employee.backToList') }}</button>
            <button (click)="editEmployee()" class="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:min-w-[140px]">{{ t('employee.editEmployee') }}</button>
          </div>
        </div>
      </section>

      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
        </div>
      } @else if (employee()) {
        <div class="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6">
          <aside class="space-y-6">
            <section class="app-surface-card p-5 text-center sm:p-6">
              <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-md bg-slate-100 text-3xl font-black text-slate-700">
                {{ initials() }}
              </div>
              <h2 class="mt-5 text-2xl font-black text-slate-900">{{ employee()!.firstName }} {{ employee()!.lastName }}</h2>
              <p class="mt-2 text-sm text-slate-500">{{ employee()!.email }}</p>

              <span class="mt-4 inline-flex rounded-full px-4 py-1 text-xs font-bold capitalize" [ngClass]="statusClass()">
                {{ employee()!.status?.replace('_', ' ') }}
              </span>

              <div class="mt-6 space-y-3 text-left">
                <div class="flex flex-col gap-1 rounded-md bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span class="text-sm text-slate-500">{{ t('common.employeeId') }}</span>
                  <span class="text-sm font-semibold text-slate-900">{{ employee()!.employeeCode || t('common.notAvailableShort') }}</span>
                </div>
                <div class="flex flex-col gap-1 rounded-md bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span class="text-sm text-slate-500">{{ t('common.role') }}</span>
                  <span class="text-sm font-semibold text-slate-900">{{ getRoleLabel(employee()!.roleId) }}</span>
                </div>
                <div class="flex flex-col gap-1 rounded-md bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span class="text-sm text-slate-500">{{ t('common.department') }}</span>
                  <span class="text-sm font-semibold text-slate-900">{{ employee()!.department?.name || t('common.notAssigned') }}</span>
                </div>
                <div class="flex flex-col gap-1 rounded-md bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span class="text-sm text-slate-500">{{ t('common.designation') }}</span>
                  <span class="text-sm font-semibold text-slate-900">{{ employee()!.designation?.name || t('common.notAssigned') }}</span>
                </div>
              </div>
            </section>

            <section class="app-surface-card p-5 sm:p-6">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ t('employee.verificationSnapshot') }}</p>
              <div class="mt-5 grid gap-3">
                <div class="rounded-md bg-slate-50 px-4 py-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ t('employee.phoneVerification') }}</p>
                  <p class="mt-2 text-sm font-bold" [ngClass]="employee()!.phoneVerified ? 'text-emerald-700' : 'text-slate-600'">{{ employee()!.phoneVerified ? t('common.connected') : t('common.notVerified') }}</p>
                </div>
                <div class="rounded-md bg-slate-50 px-4 py-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ t('employee.emailVerification') }}</p>
                  <p class="mt-2 text-sm font-bold" [ngClass]="employee()!.emailVerified ? 'text-emerald-700' : 'text-slate-600'">{{ employee()!.emailVerified ? t('common.connected') : t('common.notVerified') }}</p>
                </div>
                <div class="rounded-md bg-slate-50 px-4 py-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ t('employee.accountAccess') }}</p>
                  <p class="mt-2 text-sm font-bold" [ngClass]="employee()!.isLocked ? 'text-rose-700' : 'text-emerald-700'">{{ employee()!.isLocked ? t('common.locked') : t('common.active') }}</p>
                </div>
              </div>
            </section>
          </aside>

          <section class="space-y-6">
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div class="app-stat-card">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ t('employee.totalDaysPresent') }}</p>
                <p class="mt-3 text-3xl font-black text-slate-900">{{ stats().totalAttendance }}</p>
              </div>
              <div class="app-stat-card">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ t('employee.leaveDaysTaken') }}</p>
                <p class="mt-3 text-3xl font-black text-slate-900">{{ stats().leaveTaken }}</p>
              </div>
              <div class="app-stat-card">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ t('employee.leaveBalance') }}</p>
                <p class="mt-3 text-3xl font-black text-slate-900">{{ stats().leaveBalance }}</p>
              </div>
            </div>

            <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div class="rounded-md border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ t('employee.loginMethod') }}</p>
                  <p class="mt-2 text-lg font-black text-slate-900">{{ employee()!.loginType || 'email' }}</p>
              </div>
              <div class="rounded-md border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ t('employee.country') }}</p>
                  <p class="mt-2 text-lg font-black text-slate-900">{{ employee()!.countryName || employee()!.countryCode || t('common.notSet') }}</p>
              </div>
              <div class="rounded-md border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ t('employee.accountStatus') }}</p>
                  <p class="mt-2 text-lg font-black text-slate-900">{{ employee()!.isLocked ? t('common.locked') : t('common.active') }}</p>
              </div>
            </section>

            <section class="app-surface-card p-5 sm:p-6">
              <div class="mb-6">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ t('employee.personalInformation') }}</p>
                <h3 class="mt-2 text-2xl font-black text-slate-900">{{ t('employee.identityContactDetails') }}</h3>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-md bg-slate-50 p-5" *ngFor="let item of personalInfo()">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ item.label }}</p>
                  <p class="mt-3 text-base font-semibold text-slate-900">{{ item.value }}</p>
                </div>
              </div>
            </section>

            <section class="app-surface-card p-5 sm:p-6">
              <div class="mb-6">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ t('employee.employmentInformation') }}</p>
                <h3 class="mt-2 text-2xl font-black text-slate-900">{{ t('employee.assignmentPayrollContext') }}</h3>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-md bg-slate-50 p-5" *ngFor="let item of employmentInfo()">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ item.label }}</p>
                  <p class="mt-3 text-base font-semibold text-slate-900">{{ item.value }}</p>
                </div>
              </div>
            </section>

            <section class="app-surface-card p-5 sm:p-6">
              <div class="mb-6">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ t('employee.emergencyContact') }}</p>
                <h3 class="mt-2 text-2xl font-black text-slate-900">{{ t('employee.supportDetails') }}</h3>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-md bg-slate-50 p-5">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ t('employee.contactName') }}</p>
                  <p class="mt-3 text-base font-semibold text-slate-900">{{ employee()!.emergencyContact || t('common.notProvided') }}</p>
                </div>
                <div class="rounded-md bg-slate-50 p-5">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ t('employee.phoneNumber') }}</p>
                  <p class="mt-3 text-base font-semibold text-slate-900">{{ employee()!.emergencyPhone || t('common.notProvided') }}</p>
                </div>
              </div>
            </section>
          </section>
        </div>
      } @else {
        <div class="app-surface-card px-5 py-16 text-center sm:px-6">
          <p class="text-slate-500">{{ t('common.noResults') }}</p>
        </div>
      }
    </div>
  `,
  styles: []
})
export class ViewEmployeeComponent implements OnInit {
  private readonly permissionService = inject(PermissionService);
  private employeeService = inject(EmployeeService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private languageService = inject(LanguageService);

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
      { label: this.t('employee.fullName'), value: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || this.t('common.notSet') },
      { label: this.t('employee.emailAddress'), value: employee.email || this.t('common.notSet') },
      { label: this.t('common.phone'), value: employee.phone || this.t('common.notProvided') },
      { label: this.t('employee.gender'), value: employee.gender || this.t('common.notSet') },
      { label: this.t('employee.dateOfBirth'), value: employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('en-IN') : this.t('common.notSet') },
      { label: this.t('common.address'), value: employee.address || this.t('common.notProvided') }
    ];
  });

  employmentInfo = computed(() => {
    const employee = this.employee();
    if (!employee) return [];
    return [
      { label: this.t('employee.joinDate'), value: employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('en-IN') : this.t('common.notSet') },
      { label: this.t('employee.salary'), value: employee.salary ? `Rs ${Number(employee.salary).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : this.t('common.notProvided') },
      { label: this.t('employee.bankAccount'), value: employee.bankAccount || this.t('common.notProvided') },
      { label: this.t('employee.bankName'), value: employee.bankName || this.t('common.notProvided') },
      { label: this.t('employee.ifscCode'), value: employee.ifscCode || this.t('common.notProvided') },
      { label: this.t('employee.panNumber'), value: employee.panNumber || this.t('common.notProvided') },
      { label: this.t('employee.loginMethod'), value: employee.loginType || 'email' },
      { label: this.t('employee.country'), value: employee.countryName || employee.countryCode || this.t('common.notSet') }
    ];
  });

  ngOnInit() {
    this.employeeId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.employeeId) {
      this.toastService.error(this.t('employee.invalidEmployeeId'));
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
        this.toastService.error(err?.error?.message || this.t('employee.failedToLoad'));
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
    const label = this.permissionService.getRoleDisplayName({
      email: '',
      firstName: '',
      lastName: '',
      roleId,
    });

    switch (label) {
      case 'Super Admin':
        return this.t('sidebar.superAdmin');
      case 'Organization Admin':
        return this.t('sidebar.admin');
      case 'HR Manager':
        return 'HR Manager';
      case 'Manager':
        return this.t('sidebar.manager');
      case 'Employee':
      default:
        return this.t('sidebar.employee');
    }
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    this.languageService.currentLanguage();
    return this.languageService.t(key, params);
  }

  editEmployee() {
    this.router.navigate(['/employees/edit', this.employeeId]);
  }

  goBack() {
    this.router.navigate(['/employees']);
  }
}
