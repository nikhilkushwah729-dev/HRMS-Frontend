import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeService } from '../../core/services/employee.service';
import {
  OrganizationService,
  Department,
  Designation,
} from '../../core/services/organization.service';
import { ToastService } from '../../core/services/toast.service';
import { LanguageService } from '../../core/services/language.service';
import {
  UiPhoneInputComponent,
  UiSelectAdvancedComponent,
} from '../../core/components/ui';
import { SelectOption } from '../../core/components/ui/ui-select-advanced.component';

@Component({
  selector: 'app-add-employee',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UiPhoneInputComponent,
    UiSelectAdvancedComponent,
  ],
  template: `
    <div class="mx-auto max-w-6xl space-y-5 px-1 py-2 sm:space-y-6">
      <section
        class="overflow-hidden rounded-md border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_38%),linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#eefbf5_100%)] shadow-sm"
      >
        <div
          class="grid gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8 lg:py-8"
        >
          <div class="min-w-0 space-y-5">
            <div
              class="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
            >
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              {{ t('employee.peopleOperations') }}
            </div>
            <div>
              <h1
                class="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl"
              >
                {{ t('employee.addNew') }}
              </h1>
              <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                {{ t('employee.subtitle') }}
              </p>
            </div>
          </div>

          <div
            class="rounded-md border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p
                  class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  {{ t('employee.generatedCode') }}
                </p>
                <p class="mt-2 break-words text-2xl font-black text-slate-900">
                  {{ employeeForm.get('employeeCode')?.value || t('common.pending') }}
                </p>
                <p class="mt-2 text-sm text-slate-600">
                  {{ t('employee.organizationPrefix', { prefix: orgPrefix() }) }}
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  {{ t('employee.prefixHint') }}
                </p>
              </div>

              <div class="relative shrink-0">
                <button
                  type="button"
                  (click)="toggleOnboardingMenu()"
                  class="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50"
                >
                  <span>{{ t('common.onboarding') }}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                @if (showOnboardingMenu()) {
                  <div class="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl">
                    <button
                      type="button"
                      class="flex w-full items-center justify-between bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-white"
                    >
                      <span>{{ t('common.addEmployee') }}</span>
                      <span class="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em]">{{ t('common.current') }}</span>
                    </button>
                    <button
                      type="button"
                      (click)="openInvitations()"
                      class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <span>{{ t('common.invitations') }}</span>
                      <span class="text-slate-400">&rarr;</span>
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </section>

      <form
        [formGroup]="employeeForm"
        (ngSubmit)="onSubmit()"
        class="space-y-6"
      >
        <div class="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6">
          <section class="app-surface-card p-5 sm:p-6">
            <div class="mb-6">
              <p
                class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
              >
                {{ t('employee.coreProfile') }}
              </p>
              <h2 class="mt-2 text-2xl font-black text-slate-900">
                {{ t('employee.identityAccess') }}
              </h2>
            </div>

            <div class="grid gap-5 md:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >{{ t('employee.firstName') }}</label
                >
                <input
                  type="text"
                  formControlName="firstName"
                  class="app-field"
                  placeholder="John"
                />
              </div>
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >{{ t('employee.lastName') }}</label
                >
                <input
                  type="text"
                  formControlName="lastName"
                  class="app-field"
                  placeholder="Doe"
                />
              </div>
              <div class="flex flex-col gap-2 md:col-span-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >{{ t('employee.emailAddress') }}</label
                >
                <input
                  type="email"
                  formControlName="email"
                  class="app-field"
                  placeholder="john.doe@company.com"
                />
              </div>
              <div class="flex flex-col gap-2 md:col-span-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >{{ t('employee.password') }}</label
                >
                <input
                  type="password"
                  formControlName="password"
                  class="app-field"
                  placeholder="Create a secure password"
                />
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
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >{{ t('employee.employeeCode') }}</label
                >
                <div class="relative">
                  <input
                    type="text"
                    formControlName="employeeCode"
                    class="app-field pr-12"
                    placeholder="EMP-001"
                  />
                  <button
                    type="button"
                    (click)="onRefreshCode()"
                    class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    title="Generate New Code"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
                      />
                      <path d="M21 3v5h-5" />
                      <path
                        d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
                      />
                      <path d="M8 16H3v5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section class="app-surface-card p-5 sm:p-6">
            <div class="mb-6">
              <p
                class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
              >
                {{ t('employee.teamPlacement') }}
              </p>
              <h2 class="mt-2 text-2xl font-black text-slate-900">
                {{ t('employee.roleStatus') }}
              </h2>
            </div>

            <div class="grid gap-5">
              <div class="flex flex-col gap-2">
                <app-ui-select-advanced
                  formControlName="departmentId"
                  [label]="t('employee.department')"
                  [placeholder]="t('employee.selectDepartment')"
                  [options]="departmentOptions()"
                  searchPlaceholder="Search departments..."
                ></app-ui-select-advanced>
              </div>
              <div class="flex flex-col gap-2">
                <app-ui-select-advanced
                  formControlName="designationId"
                  [label]="t('employee.designation')"
                  [placeholder]="t('employee.selectDesignation')"
                  [options]="designationOptions()"
                  searchPlaceholder="Search designations..."
                ></app-ui-select-advanced>
              </div>
              <div class="flex flex-col gap-2">
                <app-ui-select-advanced
                  formControlName="roleId"
                  [label]="t('employee.role')"
                  [placeholder]="t('employee.selectRole')"
                  [options]="roleOptions"
                ></app-ui-select-advanced>
              </div>
              <div class="flex flex-col gap-2">
                <app-ui-select-advanced
                  formControlName="status"
                  [label]="t('employee.status')"
                  [placeholder]="t('employee.selectStatus')"
                  [options]="statusOptions"
                ></app-ui-select-advanced>
              </div>
              <div class="rounded-md border border-slate-200 bg-slate-50 p-5">
                <p
                  class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  {{ t('employee.onboardingNote') }}
                </p>
                <p class="mt-3 text-sm leading-7 text-slate-600">
                  {{ t('employee.onboardingNoteBody') }}
                </p>
              </div>
            </div>
          </section>
        </div>

        <section class="app-surface-card p-5 sm:p-6">
          <div class="mb-6">
            <p
              class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
            >
              {{ t('employee.employmentDetails') }}
            </p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">
              {{ t('employee.joiningEmergency') }}
            </h2>
          </div>

          <div class="grid gap-5 md:grid-cols-2">
            <div class="flex flex-col gap-2">
              <label
                class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >{{ t('employee.joinDate') }}</label
              >
              <input type="date" formControlName="joinDate" class="app-field" />
            </div>
            <div class="flex flex-col gap-2">
              <label
                class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >{{ t('employee.emergencyContact') }}</label
              >
              <input
                type="text"
                formControlName="emergencyContact"
                class="app-field"
                placeholder="Family member or guardian"
              />
            </div>
            <div class="md:col-span-2">
              <app-ui-phone-input
                [label]="t('employee.emergencyPhone')"
                formControlName="emergencyPhone"
                placeholder="Enter emergency contact number"
                hint="Use a reachable emergency number"
              ></app-ui-phone-input>
            </div>
          </div>
        </section>

        <div
          class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end"
        >
          <button
            type="button"
            (click)="goBack()"
            class="rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:min-w-[140px]"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="submit"
            [disabled]="employeeForm.invalid || loading"
            class="rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 sm:min-w-[160px]"
          >
            {{ loading ? t('common.creating') : t('common.createEmployee') }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [],
})
export class AddEmployeeComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);
  private orgService = inject(OrganizationService);
  private toastService = inject(ToastService);
  private languageService = inject(LanguageService);
  private router = inject(Router);

  loading = false;
  showOnboardingMenu = signal(false);
  orgPrefix = signal<string>('EMP');
  departments = signal<Department[]>([]);
  designations = signal<Designation[]>([]);

  departmentOptions = computed<SelectOption[]>(() =>
    this.departments().map((d) => ({ label: d.name, value: d.id })),
  );
  designationOptions = computed<SelectOption[]>(() =>
    this.designations().map((d) => ({ label: d.name, value: d.id })),
  );
  roleOptions: SelectOption[] = [
    { label: 'Employee', value: 4 },
    { label: 'HR Manager', value: 3 },
    { label: 'Administrator', value: 2 },
  ];
  statusOptions: SelectOption[] = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'On Leave', value: 'on_leave' },
    { label: 'Terminated', value: 'terminated' },
  ];

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
    emergencyPhone: [''],
  });

  ngOnInit() {
    this.orgService.getDepartments().subscribe({
      next: (depts) => this.departments.set(depts),
      error: () => this.departments.set([]),
    });

    this.orgService.getDesignations().subscribe({
      next: (designations) => this.designations.set(designations),
      error: () => this.designations.set([]),
    });

    this.orgService.getOrganization().subscribe({
      next: (org) => {
        const fallbackPrefix = this.resolveFallbackPrefix(org?.name);
        this.orgService.getEmployeeCodePrefix().subscribe({
          next: (savedPrefix) => {
            const prefix = savedPrefix || fallbackPrefix;
            this.orgPrefix.set(prefix);
            this.generateEmployeeCode(prefix);
          },
          error: () => {
            this.orgPrefix.set(fallbackPrefix);
            this.generateEmployeeCode(fallbackPrefix);
          },
        });
      },
      error: () => {
        this.orgPrefix.set('EMP');
        this.generateEmployeeCode('EMP');
      },
    });
  }

  onRefreshCode() {
    this.generateEmployeeCode(this.orgPrefix());
  }

  private resolveFallbackPrefix(orgName?: string | null): string {
    const cleaned = String(orgName ?? '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    return cleaned.slice(0, 3) || 'EMP';
  }

  generateEmployeeCode(prefix: string = 'EMP') {
    const random = Math.floor(1000 + Math.random() * 9000);
    const normalizedPrefix = String(prefix || 'EMP')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 3) || 'EMP';
    const code = `${normalizedPrefix}-${random}`;
    this.employeeForm.patchValue({ employeeCode: code });
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    return this.languageService.t(key, params);
  }

  onSubmit() {
    if (this.employeeForm.invalid) {
      this.toastService.error(this.t('employee.validationError'));
      return;
    }

    this.loading = true;
    const rawValue = this.employeeForm.value;
    const payload = { ...rawValue } as Record<string, any>;
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '') {
        payload[key] = null;
      }
    });

    this.employeeService.createEmployee(payload).subscribe({
      next: () => {
        this.toastService.success(this.t('employee.createdSuccess'));
        setTimeout(() => this.router.navigate(['/employees']), 1500);
      },
      error: (err) => {
        this.loading = false;
        const msg =
          err.error?.errors?.[0]?.message ||
          err.error?.message ||
          this.t('employee.createFailed');
        this.toastService.error(msg);
      },
    });
  }

  goBack() {
    this.router.navigate(['/employees']);
  }

  toggleOnboardingMenu() {
    this.showOnboardingMenu.update((value) => !value);
  }

  openInvitations() {
    this.showOnboardingMenu.set(false);
    this.router.navigate(['/employees/invitations']);
  }
}
