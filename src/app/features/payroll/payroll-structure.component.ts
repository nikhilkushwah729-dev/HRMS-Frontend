import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { User } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { PayrollService, SalaryComponentItem, SalaryStructure } from '../../core/services/payroll.service';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-payroll-structure',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p class="text-[11px] font-black uppercase tracking-[0.24em] text-fuchsia-600">Salary Structure</p>
        <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Set salary components and deduction rules employee by employee</h1>
        <p class="mt-2 max-w-3xl text-sm text-slate-500">
          Define basic salary, HRA, allowances, bonuses, CTC, deduction rules, and monthly gross/net references in a dedicated payroll structure screen.
        </p>
      </section>

      @if (loading()) {
        <div class="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500 shadow-sm">Loading salary structures...</div>
      } @else {
        <section class="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 class="text-lg font-black text-slate-900">Structure Setup</h2>
            <div class="mt-4 grid gap-3 md:grid-cols-2">
              <select [(ngModel)]="employeeId" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400 md:col-span-2">
                <option value="">Select employee</option>
                @for (employee of employees(); track employee.id) {
                  <option [value]="employee.id">{{ employee.firstName }} {{ employee.lastName }}</option>
                }
              </select>
              <input [(ngModel)]="basicSalary" type="number" placeholder="Basic salary" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400" />
              <input [(ngModel)]="ctc" type="number" placeholder="CTC" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400" />
              <select [(ngModel)]="hraType" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400">
                <option value="percentage">HRA %</option>
                <option value="fixed">HRA Fixed</option>
              </select>
              <input [(ngModel)]="hraValue" type="number" placeholder="HRA value" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400" />
              <input [(ngModel)]="monthlyGross" type="number" placeholder="Monthly gross" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400" />
              <input [(ngModel)]="estimatedNet" type="number" placeholder="Estimated net" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400" />
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700"><input [(ngModel)]="pfEnabled" type="checkbox" /> PF enabled</label>
              <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700"><input [(ngModel)]="esiEnabled" type="checkbox" /> ESI enabled</label>
              <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700"><input [(ngModel)]="professionalTaxEnabled" type="checkbox" /> Professional tax</label>
              <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700"><input [(ngModel)]="tdsEnabled" type="checkbox" /> TDS enabled</label>
              <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 sm:col-span-2"><input [(ngModel)]="overtimeEnabled" type="checkbox" /> Overtime earning enabled</label>
            </div>

            <div class="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-black text-slate-900">Allowance Components</p>
                <button type="button" (click)="addAllowance()" class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50">Add</button>
              </div>
              <div class="mt-4 space-y-3">
                @for (item of allowances(); track $index) {
                  <div class="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.7fr_auto]">
                    <input [(ngModel)]="item.name" placeholder="Allowance name" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400" />
                    <select [(ngModel)]="item.mode" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400">
                      <option value="fixed">Fixed</option>
                      <option value="percentage">Percentage</option>
                    </select>
                    <input [(ngModel)]="item.value" type="number" placeholder="Value" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400" />
                    <button type="button" (click)="removeAllowance($index)" class="rounded-xl border border-rose-200 px-4 py-3 text-xs font-black text-rose-600 transition hover:bg-rose-50">Remove</button>
                  </div>
                }
              </div>
            </div>

            <div class="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-black text-slate-900">Deduction Rules</p>
                <button type="button" (click)="addDeduction()" class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50">Add</button>
              </div>
              <div class="mt-4 space-y-3">
                @for (item of deductions(); track $index) {
                  <div class="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.7fr_auto]">
                    <input [(ngModel)]="item.name" placeholder="Deduction name" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400" />
                    <select [(ngModel)]="item.mode" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400">
                      <option value="fixed">Fixed</option>
                      <option value="percentage">Percentage</option>
                    </select>
                    <input [(ngModel)]="item.value" type="number" placeholder="Value" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400" />
                    <button type="button" (click)="removeDeduction($index)" class="rounded-xl border border-rose-200 px-4 py-3 text-xs font-black text-rose-600 transition hover:bg-rose-50">Remove</button>
                  </div>
                }
              </div>
            </div>

            <div class="mt-5 flex justify-end">
              <button type="button" (click)="save()" class="rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800">Save Salary Structure</button>
            </div>
          </article>

          <article class="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div class="border-b border-slate-100 px-5 py-4">
              <h2 class="text-lg font-black text-slate-900">Saved Structures</h2>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr class="text-left text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    <th class="px-4 py-4">Employee</th>
                    <th class="px-4 py-4">Basic</th>
                    <th class="px-4 py-4">Gross</th>
                    <th class="px-4 py-4">Net</th>
                    <th class="px-4 py-4">Policy</th>
                    <th class="px-4 py-4">Updated</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (item of structures(); track item.id) {
                    <tr>
                      <td class="px-4 py-4 text-sm font-black text-slate-900">{{ item.employeeName }}</td>
                      <td class="px-4 py-4 text-sm text-slate-600">{{ item.basicSalary | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td class="px-4 py-4 text-sm text-slate-600">{{ item.monthlyGross | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td class="px-4 py-4 text-sm font-black text-slate-900">{{ item.estimatedNet | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td class="px-4 py-4 text-sm text-slate-600">{{ item.policyName }}</td>
                      <td class="px-4 py-4 text-sm text-slate-500">{{ item.updatedAt | date:'mediumDate' }}</td>
                    </tr>
                  } @empty {
                    <tr><td colspan="6" class="px-4 py-12 text-center text-sm font-semibold text-slate-500">No salary structures saved yet.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </article>
        </section>
      }
    </div>
  `,
})
export class PayrollStructureComponent {
  private readonly payrollService = inject(PayrollService);
  private readonly employeeService = inject(EmployeeService);
  private readonly permissionService = inject(PermissionService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly loading = signal(true);
  readonly employees = signal<User[]>([]);
  readonly structures = signal<SalaryStructure[]>([]);
  readonly allowances = signal<SalaryComponentItem[]>([]);
  readonly deductions = signal<SalaryComponentItem[]>([]);

  employeeId = '';
  basicSalary: number | '' = '';
  ctc: number | '' = '';
  hraType: 'fixed' | 'percentage' = 'percentage';
  hraValue: number | '' = '';
  monthlyGross: number | '' = '';
  estimatedNet: number | '' = '';
  pfEnabled = true;
  esiEnabled = false;
  professionalTaxEnabled = true;
  tdsEnabled = true;
  overtimeEnabled = false;

  constructor() {
    const user = this.authService.getStoredUser();
    const role = this.permissionService.getRoleDisplayName(user).toLowerCase();
    const allowed = role.includes('admin') || role.includes('hr') || this.permissionService.hasPermission(user, 'payroll.update');
    if (!allowed) {
      this.router.navigate(['/self-service/payroll']);
      return;
    }
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      employees: this.employeeService.getEmployees(),
      structures: this.payrollService.getSalaryStructures(),
    }).subscribe({
      next: ({ employees, structures }) => {
        this.employees.set(employees);
        this.structures.set(structures);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.show('Unable to load payroll structure data.', 'error');
        this.loading.set(false);
      },
    });
  }

  addAllowance(): void {
    this.allowances.update((items) => [...items, { name: '', type: 'allowance', mode: 'fixed', value: 0 }]);
  }

  removeAllowance(index: number): void {
    this.allowances.update((items) => items.filter((_, idx) => idx !== index));
  }

  addDeduction(): void {
    this.deductions.update((items) => [...items, { name: '', type: 'deduction', mode: 'fixed', value: 0 }]);
  }

  removeDeduction(index: number): void {
    this.deductions.update((items) => items.filter((_, idx) => idx !== index));
  }

  save(): void {
    const employee = this.employees().find((item) => String(item.id) === this.employeeId);
    if (!employee) {
      this.toastService.show('Select an employee before saving the salary structure.', 'error');
      return;
    }

    const payload: SalaryStructure = {
      id: Date.now(),
      employeeId: Number(employee.id),
      employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
      department: employee.department?.name,
      designation: employee.designation?.name,
      basicSalary: Number(this.basicSalary || 0),
      hraType: this.hraType,
      hraValue: Number(this.hraValue || 0),
      allowances: this.allowances(),
      deductions: this.deductions(),
      ctc: Number(this.ctc || 0),
      monthlyGross: Number(this.monthlyGross || 0),
      estimatedNet: Number(this.estimatedNet || 0),
      pfEnabled: this.pfEnabled,
      esiEnabled: this.esiEnabled,
      professionalTaxEnabled: this.professionalTaxEnabled,
      tdsEnabled: this.tdsEnabled,
      overtimeEnabled: this.overtimeEnabled,
      policyName: 'Standard Payroll Policy',
      updatedAt: new Date().toISOString(),
    };

    this.payrollService.saveSalaryStructure(payload).subscribe({
      next: () => {
        this.toastService.show('Salary structure saved successfully.', 'success');
        this.employeeId = '';
        this.basicSalary = '';
        this.ctc = '';
        this.hraValue = '';
        this.monthlyGross = '';
        this.estimatedNet = '';
        this.allowances.set([]);
        this.deductions.set([]);
        this.load();
      },
      error: () => this.toastService.show('Unable to save salary structure.', 'error'),
    });
  }
}
