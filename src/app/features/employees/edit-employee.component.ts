import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EmployeeService } from '../../core/services/employee.service';
import {
  OrganizationService,
  Department,
  Designation,
} from '../../core/services/organization.service';
import {
  AttendanceService,
  GeoFenceZone,
} from '../../core/services/attendance.service';
import { ToastService } from '../../core/services/toast.service';
import {
  UiPhoneInputComponent,
  UiSelectAdvancedComponent,
} from '../../core/components/ui';
import { SelectOption } from '../../core/components/ui/ui-select-advanced.component';

@Component({
  selector: 'app-edit-employee',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UiPhoneInputComponent,
    UiSelectAdvancedComponent,
  ],
  template: `
    <div class="mx-auto max-w-6xl space-y-6 px-1 py-2">
      <section
        class="overflow-hidden rounded-md border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_38%),linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#eef6ff_100%)] shadow-sm"
      >
        <div
          class="grid gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8 lg:py-8"
        >
          <div class="space-y-5">
            <div
              class="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
            >
              <span class="h-2 w-2 rounded-full bg-blue-500"></span>
              People Operations
            </div>
            <div>
              <h1
                class="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl"
              >
                Edit employee
              </h1>
              <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Update identity details, team placement, employment status, and
                geofence behavior from one polished employee management screen.
              </p>
            </div>
          </div>

          <div
            class="rounded-md border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5"
          >
            <p
              class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
            >
              Employee record
            </p>
            <p class="mt-2 break-words text-2xl font-black text-slate-900">
              {{ employeeForm.get('employeeCode')?.value || 'Loading' }}
            </p>
            <p class="mt-2 text-sm text-slate-600">
              Geofence required:
              {{ employeeGeofence().requires_geofence ? 'Yes' : 'No' }}
            </p>
          </div>
        </div>
      </section>

      <form
        [formGroup]="employeeForm"
        (ngSubmit)="onSubmit()"
        class="space-y-6"
      >
        <div class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section class="app-surface-card p-5 sm:p-6">
            <div class="mb-6">
              <p
                class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
              >
                Core Profile
              </p>
              <h2 class="mt-2 text-2xl font-black text-slate-900">
                Identity and assignment
              </h2>
            </div>

            <div class="grid gap-5 md:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >First Name</label
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
                  >Last Name</label
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
                  >Email Address</label
                >
                <input
                  type="email"
                  formControlName="email"
                  class="app-field bg-slate-100"
                  readonly
                />
              </div>
              <div class="flex flex-col gap-2 md:col-span-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >Employee Code</label
                >
                <input
                  type="text"
                  formControlName="employeeCode"
                  class="app-field"
                  placeholder="EMP-001"
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
              <div class="flex flex-col gap-2">
                <app-ui-select-advanced
                  formControlName="departmentId"
                  label="Department"
                  placeholder="Select Department"
                  [options]="departmentOptions()"
                  searchPlaceholder="Search departments..."
                ></app-ui-select-advanced>
              </div>
              <div class="flex flex-col gap-2">
                <app-ui-select-advanced
                  formControlName="designationId"
                  label="Designation"
                  placeholder="Select Designation"
                  [options]="designationOptions()"
                  searchPlaceholder="Search designations..."
                ></app-ui-select-advanced>
              </div>
              <div class="flex flex-col gap-2">
                <app-ui-select-advanced
                  formControlName="roleId"
                  label="Role"
                  placeholder="Select Role"
                  [options]="roleOptions"
                ></app-ui-select-advanced>
              </div>
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                  >Join Date</label
                >
                <input
                  type="date"
                  formControlName="joinDate"
                  class="app-field"
                />
              </div>
            </div>
          </section>

          <section class="space-y-6">
            <div class="app-surface-card p-5 sm:p-6">
              <div class="mb-6">
                <p
                  class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                >
                  Employment Status
                </p>
                <h2 class="mt-2 text-2xl font-black text-slate-900">
                  Availability
                </h2>
              </div>

              <div class="grid gap-5">
                <div class="flex flex-col gap-2">
                  <app-ui-select-advanced
                    formControlName="status"
                    label="Status"
                    placeholder="Select Status"
                    [options]="statusOptions"
                  ></app-ui-select-advanced>
                </div>
                <div class="rounded-md border border-slate-200 bg-slate-50 p-5">
                  <p
                    class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                  >
                    Access note
                  </p>
                  <p class="mt-3 text-sm leading-7 text-slate-600">
                    Email stays read-only here to protect existing auth flows
                    while other editable fields remain operational.
                  </p>
                </div>
              </div>
            </div>

            <div class="app-surface-card p-5 sm:p-6">
              <div class="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p
                    class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                  >
                    Geofence Settings
                  </p>
                  <h2 class="mt-2 text-2xl font-black text-slate-900">
                    Attendance location rules
                  </h2>
                </div>
                <button
                  type="button"
                  (click)="toggleGeofenceRequired()"
                  class="relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
                  [ngClass]="
                    employeeGeofence().requires_geofence
                      ? 'bg-emerald-500'
                      : 'bg-slate-300'
                  "
                >
                  <span
                    class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
                    [ngClass]="
                      employeeGeofence().requires_geofence
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    "
                  ></span>
                </button>
              </div>

              <div class="space-y-5">
                <div class="flex flex-col gap-2">
                  <label
                    class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                    >Assigned Location</label
                  >
                  <app-ui-select-advanced
                    [formControl]="geofenceZoneControl"
                    label="Assigned Location"
                    placeholder="No specific location (use org settings)"
                    [options]="geofenceOptions()"
                    [allowClear]="true"
                    searchPlaceholder="Search locations..."
                  ></app-ui-select-advanced>
                  <p class="text-xs text-slate-500">
                    Leave empty to use organization-level attendance settings.
                  </p>
                </div>

                <div
                  class="rounded-md border px-4 py-4"
                  [ngClass]="
                    employeeGeofence().requires_geofence
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-slate-200 bg-slate-50'
                  "
                >
                  <p
                    class="text-sm font-bold"
                    [ngClass]="
                      employeeGeofence().requires_geofence
                        ? 'text-amber-800'
                        : 'text-slate-700'
                    "
                  >
                    {{
                      employeeGeofence().requires_geofence
                        ? 'Geofence required'
                        : 'Geofence optional'
                    }}
                  </p>
                  <p
                    class="mt-2 text-sm leading-7"
                    [ngClass]="
                      employeeGeofence().requires_geofence
                        ? 'text-amber-700'
                        : 'text-slate-600'
                    "
                  >
                    {{
                      employeeGeofence().requires_geofence
                        ? 'This employee must be inside the assigned zone to mark attendance.'
                        : 'This employee can use broader organization settings for attendance capture.'
                    }}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section class="app-surface-card p-5 sm:p-6">
          <div class="mb-6">
            <p
              class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
            >
              Emergency Contact
            </p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">
              Support details
            </h2>
          </div>

          <div class="grid gap-5 md:grid-cols-2">
            <div class="flex flex-col gap-2">
              <label
                class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >Emergency Contact</label
              >
              <input
                type="text"
                formControlName="emergencyContact"
                class="app-field"
                placeholder="Family member or guardian"
              />
            </div>
            <div class="md:col-span-1">
              <app-ui-phone-input
                label="Emergency Phone"
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
            class="rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="employeeForm.invalid || loading"
            class="rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {{ loading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [],
})
export class EditEmployeeComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);
  private orgService = inject(OrganizationService);
  private attendanceService = inject(AttendanceService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = false;
  employeeId = 0;
  departments = signal<Department[]>([]);
  designations = signal<Designation[]>([]);
  geofenceZones = signal<GeoFenceZone[]>([]);

  departmentOptions = computed<SelectOption[]>(() =>
    this.departments().map((d) => ({ label: d.name, value: d.id })),
  );
  designationOptions = computed<SelectOption[]>(() =>
    this.designations().map((d) => ({ label: d.name, value: d.id })),
  );
  geofenceOptions = computed<SelectOption[]>(() =>
    this.geofenceZones().map((z) => ({
      label: `${z.name} (${z.radius_meters}m radius)`,
      value: z.id,
    })),
  );
  roleOptions: SelectOption[] = [
    { label: 'Employee', value: 5 },
    { label: 'Manager', value: 4 },
    { label: 'HR Manager', value: 3 },
    { label: 'Administrator', value: 2 },
  ];
  statusOptions: SelectOption[] = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'On Leave', value: 'on_leave' },
    { label: 'Terminated', value: 'terminated' },
  ];
  employeeGeofence = signal<{
    geofence_zone_id: number | null;
    requires_geofence: boolean;
  }>({
    geofence_zone_id: null,
    requires_geofence: false,
  });

  employeeForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    employeeCode: ['', [Validators.required]],
    phone: [''],
    departmentId: [''],
    designationId: [''],
    roleId: [4, [Validators.required]],
    status: ['active', [Validators.required]],
    joinDate: [''],
    emergencyContact: [''],
    emergencyPhone: [''],
  });

  geofenceZoneControl = this.fb.control<number | null>(null);

  ngOnInit() {
    this.employeeId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.employeeId) {
      this.toastService.error('Invalid employee ID');
      this.router.navigate(['/employees']);
      return;
    }

    this.loadData();
  }

  loadData() {
    this.orgService.getDepartments().subscribe({
      next: (depts) => this.departments.set(depts),
      error: () => this.departments.set([]),
    });

    this.orgService.getDesignations().subscribe({
      next: (designations) => this.designations.set(designations),
      error: () => this.designations.set([]),
    });

    this.attendanceService.getGeoFenceZones().subscribe({
      next: (zones) => this.geofenceZones.set(zones),
      error: () => this.geofenceZones.set([]),
    });

    this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: (employee) => {
        this.employeeForm.patchValue({
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          employeeCode: employee.employeeCode,
          phone: employee.phone,
          departmentId: employee.departmentId,
          designationId: employee.designationId,
          roleId: employee.roleId,
          status: employee.status,
          joinDate: employee.joinDate
            ? String(employee.joinDate).split('T')[0]
            : '',
          emergencyContact: employee.emergencyContact,
          emergencyPhone: employee.emergencyPhone,
        });
      },
      error: (err) => {
        this.toastService.error(
          err?.error?.message || 'Failed to load employee',
        );
        this.router.navigate(['/employees']);
      },
    });

    this.attendanceService.getEmployeeGeofence(this.employeeId).subscribe({
      next: (data) => {
        this.employeeGeofence.set(data);
        this.geofenceZoneControl.setValue(data.geofence_zone_id);
      },
      error: () => {
        this.employeeGeofence.set({
          geofence_zone_id: null,
          requires_geofence: false,
        });
      },
    });
  }

  toggleGeofenceRequired() {
    const current = this.employeeGeofence();
    const newValue = !current.requires_geofence;

    this.attendanceService
      .setEmployeeGeofence(this.employeeId, {
        geofence_zone_id: this.geofenceZoneControl.value,
        requires_geofence: newValue,
      })
      .subscribe({
        next: () => {
          this.employeeGeofence.set({
            ...this.employeeGeofence(),
            requires_geofence: newValue,
          });
          this.toastService.success(
            newValue
              ? 'Geofence requirement enabled'
              : 'Geofence requirement disabled',
          );
        },
        error: () => {
          this.toastService.error('Failed to update geofence settings');
        },
      });
  }

  onSubmit() {
    if (this.employeeForm.invalid) {
      this.toastService.error('Please fill all required fields correctly.');
      return;
    }

    this.loading = true;
    const payload = { ...this.employeeForm.value } as Record<string, any>;
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '') {
        payload[key] = null;
      }
    });

    this.employeeService.updateEmployee(this.employeeId, payload).subscribe({
      next: () => {
        this.attendanceService
          .setEmployeeGeofence(this.employeeId, {
            geofence_zone_id: this.geofenceZoneControl.value,
            requires_geofence: this.employeeGeofence().requires_geofence,
          })
          .subscribe({
            next: () => {
              this.toastService.success('Employee updated successfully!');
              this.loading = false;
              setTimeout(() => this.router.navigate(['/employees']), 1500);
            },
            error: () => {
              this.toastService.success('Employee updated successfully!');
              this.loading = false;
              setTimeout(() => this.router.navigate(['/employees']), 1500);
            },
          });
      },
      error: (err) => {
        this.loading = false;
        const msg =
          err.error?.errors?.[0]?.message ||
          err.error?.message ||
          'Failed to update employee.';
        this.toastService.error(msg);
      },
    });
  }

  goBack() {
    this.router.navigate(['/employees']);
  }
}
