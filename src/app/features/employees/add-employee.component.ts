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
import { AiEmployeeAssistantService } from '../../core/services/ai-employee-assistant.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-employee',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="openAiResumeModal()"
                    class="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-sm transition hover:brightness-110"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                    <span>AI Resume Fill</span>
                  </button>
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
                </div>

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

            <!-- Photo Upload Dropzone -->
            <div class="mb-5 rounded-md border border-dashed border-slate-300 p-4 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div class="flex flex-col items-center justify-center gap-3">
                @if (avatarPreview()) {
                  <div class="relative">
                    <img [src]="avatarPreview()" alt="Avatar Preview" class="h-20 w-20 rounded-full object-cover border-2 border-emerald-500 shadow-md">
                    <button type="button" (click)="removePhoto()" class="absolute -top-1 -right-1 rounded-full bg-rose-500 text-white p-1 shadow-sm hover:bg-rose-600 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                } @else {
                  <div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                }
                <div>
                  <label class="cursor-pointer text-xs font-bold text-emerald-600 hover:text-emerald-700">
                    <span>{{ avatarPreview() ? 'Change Photo' : 'Upload Profile Photo' }}</span>
                    <input type="file" accept="image/*" (change)="onPhotoSelected($event)" class="hidden">
                  </label>
                  <p class="text-[11px] text-slate-400 mt-0.5">PNG, JPG up to 5MB</p>
                </div>
              </div>
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
                  formControlName="shiftId"
                  label="Work Shift Timing"
                  placeholder="Select shift timing"
                  [options]="shiftOptions"
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

      <!-- AI Resume Parser Modal -->
      @if (showAiResumeModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div class="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div class="flex items-center gap-2 text-purple-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                <h3 class="font-bold text-slate-900 text-lg">AI Smart Resume Data Auto-Fill</h3>
              </div>
              <button (click)="closeAiResumeModal()" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <p class="text-xs text-slate-600">Paste raw resume or profile text below. Antigravity AI will automatically extract and pre-fill candidate details into the form!</p>
            <textarea
              [(ngModel)]="aiResumeRawText"
              rows="6"
              class="w-full rounded-lg border border-slate-300 p-3 text-xs focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="e.g. John Doe, Senior Software Engineer. Email: john@example.com, Phone: +91 9876543210..."
            ></textarea>
            <div class="flex justify-end gap-3 pt-2">
              <button (click)="closeAiResumeModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button [disabled]="parsingAiResume || !aiResumeRawText.trim()" (click)="parseAiResume()" class="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50">
                {{ parsingAiResume ? 'Extracting Data...' : 'Auto-Fill Form' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class AddEmployeeComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);
  private orgService = inject(OrganizationService);
  private aiAssistant = inject(AiEmployeeAssistantService);
  private toastService = inject(ToastService);
  private languageService = inject(LanguageService);
  private router = inject(Router);

  loading = false;
  showOnboardingMenu = signal(false);
  showAiResumeModal = signal(false);
  parsingAiResume = false;
  aiResumeRawText = '';
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
    { label: 'Employee', value: 5 },
    { label: 'Manager', value: 4 },
    { label: 'HR Manager', value: 3 },
    { label: 'Organization Admin', value: 2 },
  ];
  statusOptions: SelectOption[] = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'On Leave', value: 'on_leave' },
    { label: 'Terminated', value: 'terminated' },
  ];

  avatarPreview = signal<string | null>(null);

  shiftOptions: SelectOption[] = [
    { label: 'General Shift (09:00 AM - 05:00 PM)', value: 1 },
    { label: 'Evening Shift (02:00 PM - 10:00 PM)', value: 2 },
    { label: 'Night Shift (10:00 PM - 06:00 AM)', value: 3 },
    { label: 'Flexible Shift', value: 4 },
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
    roleId: [5, [Validators.required]],
    status: ['active', [Validators.required]],
    shiftId: [1],
    avatar: [''],
    joinDate: [''],
    emergencyContact: [''],
    emergencyPhone: [''],
  });

  onPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        this.avatarPreview.set(result);
        this.employeeForm.patchValue({ avatar: result });
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto() {
    this.avatarPreview.set(null);
    this.employeeForm.patchValue({ avatar: '' });
  }

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

  openAiResumeModal() {
    this.showAiResumeModal.set(true);
  }

  closeAiResumeModal() {
    this.showAiResumeModal.set(false);
    this.aiResumeRawText = '';
  }

  parseAiResume() {
    if (!this.aiResumeRawText.trim()) return;
    this.parsingAiResume = true;
    this.aiAssistant.parseResumeText(this.aiResumeRawText).subscribe({
      next: (res: any) => {
        this.parsingAiResume = false;
        if (res.data) {
          this.employeeForm.patchValue({
            firstName: res.data.firstName || this.employeeForm.value.firstName,
            lastName: res.data.lastName || this.employeeForm.value.lastName,
            email: res.data.email || this.employeeForm.value.email,
            phone: res.data.phone || this.employeeForm.value.phone,
          });
          this.toastService.success('Candidate data extracted successfully with AI!');
          this.closeAiResumeModal();
        }
      },
      error: () => {
        this.parsingAiResume = false;
        this.toastService.error('Failed to parse resume text.');
      },
    });
  }
}
