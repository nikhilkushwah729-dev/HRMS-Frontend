import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeService } from '../../../../core/services/employee.service';
import { ToastService } from '../../../../core/services/toast.service';
import { User } from '../../../../core/models/auth.model';

@Component({
  selector: 'app-kiosk-pin-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-6xl mx-auto py-8 space-y-6">
      <header class="app-module-hero">
        <p class="app-module-kicker">Kiosk Management</p>
        <h1 class="app-module-title mt-3">Kiosk PIN Management</h1>
        <p class="app-module-text mt-3">
          Set or reset secure kiosk PINs for employees who will use shared-device attendance.
        </p>
      </header>

      <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="grid gap-4 md:grid-cols-[1fr_0.9fr]">
          <div class="space-y-4">
            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Search employee</span>
              <input
                [value]="searchQuery()"
                (input)="searchQuery.set(($any($event.target).value || '').toString())"
                class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                placeholder="Search by name, email, or employee code"
              />
            </label>

            <div class="max-h-[26rem] overflow-y-auto rounded-2xl border border-slate-200">
              @for (employee of filteredEmployees(); track employee.id) {
                <button
                  type="button"
                  (click)="selectEmployee(employee)"
                  class="flex w-full items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 text-left transition last:border-b-0 hover:bg-slate-50"
                  [class.bg-slate-50]="selectedEmployee()?.id === employee.id"
                >
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-slate-900">
                      {{ employee.firstName }} {{ employee.lastName }}
                    </p>
                    <p class="mt-1 text-xs text-slate-500">
                      {{ employee.employeeCode || 'No code' }} · {{ employee.email || 'No email' }}
                    </p>
                  </div>
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                    {{ employee.status || 'active' }}
                  </span>
                </button>
              } @empty {
                <div class="px-4 py-8 text-center text-sm text-slate-500">
                  No employees found.
                </div>
              }
            </div>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            @if (selectedEmployee()) {
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Selected Employee</p>
                <h2 class="mt-3 text-2xl font-black text-slate-900">
                  {{ selectedEmployee()!.firstName }} {{ selectedEmployee()!.lastName }}
                </h2>
                <p class="mt-2 text-sm text-slate-500">
                  {{ selectedEmployee()!.employeeCode || 'No employee code' }}
                </p>
              </div>

              <form [formGroup]="pinForm" (ngSubmit)="savePin()" class="mt-6 space-y-4">
                <label class="block">
                  <span class="mb-2 block text-sm font-semibold text-slate-700">New kiosk PIN</span>
                  <input
                    formControlName="pin"
                    type="password"
                    inputmode="numeric"
                    class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    placeholder="Enter 4 to 12 digit PIN"
                  />
                </label>

                <label class="block">
                  <span class="mb-2 block text-sm font-semibold text-slate-700">Confirm kiosk PIN</span>
                  <input
                    formControlName="confirmPin"
                    type="password"
                    inputmode="numeric"
                    class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    placeholder="Re-enter PIN"
                  />
                </label>

                @if (pinMismatch()) {
                  <p class="text-sm font-medium text-rose-600">
                    PIN and confirm PIN must match.
                  </p>
                }

                <div class="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    [disabled]="pinForm.invalid || pinMismatch() || saving()"
                    class="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {{ saving() ? 'Saving...' : 'Set Kiosk PIN' }}
                  </button>
                  <button
                    type="button"
                    (click)="resetPin()"
                    [disabled]="!selectedEmployee() || saving()"
                    class="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reset PIN
                  </button>
                </div>
              </form>
            } @else {
              <div class="flex h-full items-center justify-center text-center text-sm text-slate-500 min-h-[18rem]">
                Select an employee from the left to set or reset a kiosk PIN.
              </div>
            }
          </div>
        </div>
      </section>
    </div>
  `,
})
export class KioskPinManagementComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  employees = signal<User[]>([]);
  selectedEmployee = signal<User | null>(null);
  searchQuery = signal('');
  saving = signal(false);

  pinForm = this.fb.nonNullable.group({
    pin: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(12)]],
    confirmPin: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(12)]],
  });

  filteredEmployees = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const employees = this.employees();
    if (!query) {
      return employees;
    }

    return employees.filter((employee) => {
      const name = `${employee.firstName || ''} ${employee.lastName || ''}`.toLowerCase();
      return (
        name.includes(query) ||
        String(employee.employeeCode || '').toLowerCase().includes(query) ||
        String(employee.email || '').toLowerCase().includes(query)
      );
    });
  });

  pinMismatch = computed(() => {
    const { pin, confirmPin } = this.pinForm.getRawValue();
    return Boolean(pin && confirmPin && pin !== confirmPin);
  });

  ngOnInit() {
    this.employeeService.getEmployees().subscribe({
      next: (employees) => this.employees.set(employees),
      error: () => this.toastService.error('Unable to load employees for kiosk PIN management.'),
    });
  }

  selectEmployee(employee: User) {
    this.selectedEmployee.set(employee);
    this.pinForm.reset({ pin: '', confirmPin: '' });
  }

  savePin() {
    const employee = this.selectedEmployee();
    if (!employee?.id || this.pinForm.invalid || this.pinMismatch()) {
      this.pinForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.employeeService.setKioskPin(employee.id, this.pinForm.getRawValue().pin).subscribe({
      next: () => {
        this.toastService.success(`Kiosk PIN updated for ${employee.firstName} ${employee.lastName}.`);
        this.pinForm.reset({ pin: '', confirmPin: '' });
        this.saving.set(false);
      },
      error: (error) => {
        this.toastService.error(error?.error?.message || 'Unable to save kiosk PIN.');
        this.saving.set(false);
      },
    });
  }

  resetPin() {
    const employee = this.selectedEmployee();
    if (!employee?.id) {
      return;
    }

    this.saving.set(true);
    this.employeeService.resetKioskPin(employee.id).subscribe({
      next: () => {
        this.toastService.success(`Kiosk PIN reset for ${employee.firstName} ${employee.lastName}.`);
        this.pinForm.reset({ pin: '', confirmPin: '' });
        this.saving.set(false);
      },
      error: (error) => {
        this.toastService.error(error?.error?.message || 'Unable to reset kiosk PIN.');
        this.saving.set(false);
      },
    });
  }
}
