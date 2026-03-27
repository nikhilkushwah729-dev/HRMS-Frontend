import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeService } from '../../core/services/employee.service';
import { OrganizationService, Department, Designation } from '../../core/services/organization.service';
import { ToastService } from '../../core/services/toast.service';
import { UiPhoneInputComponent } from '../../core/components/ui';

@Component({
  selector: 'app-add-employee',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiPhoneInputComponent],
  template: `
    <div class="mx-auto max-w-6xl space-y-6 px-1 py-2">
      <section class="overflow-hidden rounded-md border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_38%),linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#eefbf5_100%)] shadow-sm">
        <div class="grid gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8 lg:py-8">
          <div class="space-y-5">
            <div class="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              People Operations
            </div>
            <div>
              <h1 class="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Add new employee</h1>
              <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Set up employee identity, access role, department placement, and emergency details from a cleaner onboarding workspace.</p>
            </div>
          </div>

          <div class="rounded-md border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Generated code</p>
            <p class="mt-2 break-words text-2xl font-black text-slate-900">{{ employeeForm.get('employeeCode')?.value || 'Pending' }}</p>
            <p class="mt-2 text-sm text-slate-600">Organization prefix: {{ orgPrefix() }}</p>
          </div>
        </div>
      </section>

      <form [formGroup]="employeeForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <div class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section class="app-surface-card p-5 sm:p-6">
            <div class="mb-6">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Core Profile</p>
              <h2 class="mt-2 text-2xl font-black text-slate-900">Identity and access</h2>
            </div>

            <div class="grid gap-5 md:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">First Name</label>
                <input type="text" formControlName="firstName" class="app-field" placeholder="John">
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Last Name</label>
                <input type="text" formControlName="lastName" class="app-field" placeholder="Doe">
              </div>
              <div class="flex flex-col gap-2 md:col-span-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Email Address</label>
                <input type="email" formControlName="email" class="app-field" placeholder="john.doe@company.com">
              </div>
              <div class="flex flex-col gap-2 md:col-span-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Password</label>
                <input type="password" formControlName="password" class="app-field" placeholder="Create a secure password">
              </div>
              <div class="md:col-span-2">
                <app-ui-phone-input
                  label="Phone Number"
                  formControlName="phone"
                  placeholder="Enter phone number"
                  hint="International format managed automatically"
                ></app-ui-phone-input>
              </div>
              <div class="flex flex-col gap-2 md:col-span-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Employee Code</label>
                <div class="relative">
                  <input type="text" formControlName="employeeCode" class="app-field pr-12" placeholder="EMP-001">
                  <button type="button" (click)="onRefreshCode()" class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" title="Generate New Code">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section class="app-surface-card p-5 sm:p-6">
            <div class="mb-6">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Team Placement</p>
              <h2 class="mt-2 text-2xl font-black text-slate-900">Role and status</h2>
            </div>

            <div class="grid gap-5">
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Department</label>
                <select formControlName="departmentId" class="app-select">
                  <option value="">Select Department</option>
                  @for (dept of departments(); track dept.id) {
                    <option [value]="dept.id">{{ dept.name }}</option>
                  }
                </select>
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Designation</label>
                <select formControlName="designationId" class="app-select">
                  <option value="">Select Designation</option>
                  @for (designation of designations(); track designation.id) {
                    <option [value]="designation.id">{{ designation.name }}</option>
                  }
                </select>
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Role</label>
                <select formControlName="roleId" class="app-select">
                  <option [value]="4">Employee</option>
                  <option [value]="3">HR Manager</option>
                  <option [value]="2">Administrator</option>
                </select>
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Status</label>
                <select formControlName="status" class="app-select">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On Leave</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
              <div class="rounded-md border border-slate-200 bg-slate-50 p-5">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Onboarding note</p>
                <p class="mt-3 text-sm leading-7 text-slate-600">Once created, this employee can be moved into leave, attendance, payroll, and self-service workflows without leaving the people module.</p>
              </div>
            </div>
          </section>
        </div>

        <section class="app-surface-card p-5 sm:p-6">
          <div class="mb-6">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Employment Details</p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">Joining and emergency contact</h2>
          </div>

          <div class="grid gap-5 md:grid-cols-2">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Join Date</label>
              <input type="date" formControlName="joinDate" class="app-field">
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Emergency Contact</label>
              <input type="text" formControlName="emergencyContact" class="app-field" placeholder="Family member or guardian">
            </div>
            <div class="md:col-span-2">
              <app-ui-phone-input
                label="Emergency Phone"
                formControlName="emergencyPhone"
                placeholder="Enter emergency contact number"
                hint="Use a reachable emergency number"
              ></app-ui-phone-input>
            </div>
          </div>
        </section>

        <div class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
          <button type="button" (click)="goBack()" class="rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancel</button>
          <button type="submit" [disabled]="employeeForm.invalid || loading" class="rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
            {{ loading ? 'Creating...' : 'Create Employee' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: []
})
export class AddEmployeeComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);
  private orgService = inject(OrganizationService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  loading = false;
  orgPrefix = signal<string>('EMP');
  departments = signal<Department[]>([]);
  designations = signal<Designation[]>([]);

  employeeForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: [''],
    employeeCode: ['', [Validators.required]],
    departmentId: [''],
    designationId: [''],
    roleId: [4, [Validators.required]],
    status: ['active', [Validators.required]],
    joinDate: [''],
    emergencyContact: [''],
    emergencyPhone: ['']
  });

  ngOnInit() {
    this.orgService.getDepartments().subscribe({
      next: (depts) => this.departments.set(depts),
      error: () => this.departments.set([])
    });

    this.orgService.getDesignations().subscribe({
      next: (designations) => this.designations.set(designations),
      error: () => this.designations.set([])
    });

    this.orgService.getOrganization().subscribe({
      next: (org) => {
        const prefix = org.name ? org.name.substring(0, 3).toUpperCase() : 'EMP';
        this.orgPrefix.set(prefix);
        this.generateEmployeeCode(prefix);
      },
      error: () => this.generateEmployeeCode('EMP')
    });
  }

  onRefreshCode() {
    this.generateEmployeeCode(this.orgPrefix());
  }

  generateEmployeeCode(prefix: string = 'EMP') {
    const random = Math.floor(1000 + Math.random() * 9000);
    const code = `${prefix}-${random}`;
    this.employeeForm.patchValue({ employeeCode: code });
  }

  onSubmit() {
    if (this.employeeForm.invalid) {
      this.toastService.error('Please fill all required fields correctly.');
      return;
    }

    this.loading = true;
    const rawValue = this.employeeForm.value;
    const payload = { ...rawValue } as Record<string, any>;
    Object.keys(payload).forEach(key => {
      if (payload[key] === '') {
        payload[key] = null;
      }
    });

    this.employeeService.createEmployee(payload).subscribe({
      next: () => {
        this.toastService.success('Employee created successfully!');
        setTimeout(() => this.router.navigate(['/employees']), 1500);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.errors?.[0]?.message || err.error?.message || 'Failed to create employee. Email or code might already exist.';
        this.toastService.error(msg);
      }
    });
  }

  goBack() {
    this.router.navigate(['/employees']);
  }
}
