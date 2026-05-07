import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EmployeeService } from '../../../../core/services/employee.service';
import { User } from '../../../../core/models/auth.model';
import { CustomButtonComponent } from '../../../../core/components/button/custom-button.component';
import { SettingsWorkspaceService } from '../../shared/settings-workspace.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { AuthService } from '../../../../core/services/auth.service';

interface AttendanceModeDefinition {
  key:
    | 'desktop_kiosk'
    | 'exempt_attendance'
    | 'biometric_attendance'
    | 'employee_selfie'
    | 'selfie_with_face'
    | 'app_qr';
  label: string;
  description: string;
  code: number;
  badge: string;
}

interface AttendanceModeAssignment {
  id: string;
  modeKey: AttendanceModeDefinition['key'];
  modeCode: number;
  label: string;
  employeeIds: number[];
  employeeNames: string[];
  updatedAt: string;
}

@Component({
  selector: 'app-attendance-mode',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomButtonComponent],
  template: `
    <div class="mx-auto max-w-7xl space-y-6">
      <section class="app-module-hero overflow-hidden">
        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div class="space-y-5">
            <div>
              <p class="app-module-kicker">Attendance Settings</p>
              <h1 class="app-module-title">Attendance Mode</h1>
              <p class="app-module-text max-w-2xl">
                Assign the right attendance mode to the right employees. Keep kiosk, exempt,
                selfie, biometric, selfie with face, and app QR flows separate and controlled.
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Live Modes</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ visibleModes().length }}</p>
                <p class="mt-1 text-xs text-slate-500">Attendance channels visible here</p>
              </div>
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Assigned Employees</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ totalAssignedEmployees() }}</p>
                <p class="mt-1 text-xs text-slate-500">Selections saved for this organization</p>
              </div>
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Available Employees</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ employees().length }}</p>
                <p class="mt-1 text-xs text-slate-500">Selectable from the assignment modal</p>
              </div>
            </div>
          </div>

          <div class="app-module-highlight">
            <p class="app-module-highlight-label">Mode Control</p>
            <p class="mt-3 app-module-highlight-value">
              {{ canEditSettings() ? 'Ready' : 'View Only' }}
            </p>
            <p class="mt-3 text-sm leading-6 text-slate-600">
              Assign employees mode-wise like Angular_Web, without mixing this setup with the
              self-service attendance screen.
            </p>
            <div class="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              Biometric row {{ showBiometricMode() ? 'visible' : 'hidden' }}
            </div>
            <div class="mt-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
              Selfie and selfie with face can be assigned separately from kiosk, exempt, and QR attendance.
            </div>
          </div>
        </div>
      </section>

      <section class="app-surface-card overflow-hidden">
        <div class="border-b border-slate-100 px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Attendance Mode Assignment</p>
          <h2 class="mt-2 text-2xl font-black text-slate-900">Choose a mode and assign employees</h2>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            Each mode keeps its own employee list so your attendance channels stay clear and operational.
          </p>
        </div>

        <div class="divide-y divide-slate-100">
          <div
            *ngFor="let mode of visibleModes()"
            class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-3">
                <p class="text-lg font-black text-slate-900">{{ mode.label }}</p>
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {{ mode.badge }}
                </span>
                <span class="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                  {{ assignedCount(mode.key) }} assigned
                </span>
              </div>
              <p class="mt-2 text-sm leading-6 text-slate-500">{{ mode.description }}</p>
              <p class="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                {{ assignmentSummary(mode.key) }}
              </p>
            </div>

            <div class="w-full lg:w-[220px]">
              <app-custom-button
                [disabled]="!canEditSettings()"
                (btnClick)="openAssignModal(mode)"
              >
                Assign
              </app-custom-button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div
      *ngIf="selectedMode()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-3xl overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl">
        <div class="border-b border-slate-100 px-6 py-5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Assign Employees</p>
              <h3 class="mt-2 break-words text-2xl font-black text-slate-900">
                {{ selectedMode()?.label }}
              </h3>
              <p class="mt-2 text-sm leading-6 text-slate-500">
                Pick one or more employees for this attendance mode.
              </p>
            </div>
            <button
              type="button"
              (click)="closeAssignModal()"
              class="self-start rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        <div class="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div class="space-y-4">
            <div class="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex min-w-0 flex-1 items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-slate-400">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    [ngModel]="searchTerm()"
                    (ngModelChange)="searchTerm.set($event)"
                    type="text"
                    placeholder="Search employee"
                    class="w-full border-0 bg-transparent text-sm text-slate-700 outline-none"
                  />
                </div>
                <span class="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-500">
                  {{ filteredEmployees().length }} employees
                </span>
              </div>
            </div>

            <div class="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
              <label
                *ngFor="let employee of filteredEmployees(); let index = index"
                class="flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 transition"
                [ngClass]="isSelected(employee) ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'"
              >
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  [checked]="isSelected(employee)"
                  (change)="toggleEmployee(employee)"
                />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-bold text-slate-900">{{ index + 1 }}. {{ employee.firstName }} {{ employee.lastName }}</p>
                  <p class="mt-1 truncate text-xs text-slate-500">
                    {{ employee.employeeCode || 'No Code' }}
                    <span *ngIf="employee.department?.name">• {{ employee.department?.name }}</span>
                    <span *ngIf="employee.designation?.name">• {{ employee.designation?.name }}</span>
                  </p>
                </div>
              </label>

              <div
                *ngIf="!filteredEmployees().length"
                class="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500"
              >
                No employees found for this search.
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Selected Employees</p>
              <p class="mt-2 text-2xl font-black text-slate-900">{{ selectedEmployees().length }}</p>
              <p class="mt-2 text-sm text-slate-500">These employees will be assigned to {{ selectedMode()?.label }}.</p>
            </div>

            <div class="rounded-md border border-slate-200 bg-white p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Preview</p>
              <div class="mt-3 max-h-56 space-y-2 overflow-y-auto">
                <div
                  *ngFor="let employee of selectedEmployees()"
                  class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  {{ employee.firstName }} {{ employee.lastName }}
                </div>
                <div
                  *ngIf="!selectedEmployees().length"
                  class="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500"
                >
                  No employees selected yet.
                </div>
              </div>
            </div>

            <div class="grid gap-3">
              <app-custom-button
                [disabled]="saving() || !canEditSettings()"
                (btnClick)="saveAssignments()"
              >
                {{ saving() ? 'Saving...' : 'Save Assignment' }}
              </app-custom-button>
              <app-custom-button
                type="secondary"
                [disabled]="saving()"
                (btnClick)="closeAssignModal()"
              >
                Cancel
              </app-custom-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AttendanceModeComponent implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly workspace = inject(SettingsWorkspaceService);
  private readonly toastService = inject(ToastService);
  private readonly permissionService = inject(PermissionService);
  private readonly authService = inject(AuthService);

  private readonly storageKey = 'hrms_setting_attendance_mode_assignments';

  currentUser = this.authService.getStoredUser();
  employees = signal<User[]>([]);
  assignments = signal<AttendanceModeAssignment[]>([]);
  selectedMode = signal<AttendanceModeDefinition | null>(null);
  selectedEmployees = signal<User[]>([]);
  saving = signal(false);
  searchTerm = signal('');

  canEditSettings = signal(
    this.permissionService.canManageSettings(this.currentUser),
  );

  modes = signal<AttendanceModeDefinition[]>([
    {
      key: 'desktop_kiosk',
      label: 'Desktop Kiosk',
      description: 'Assign kiosk-based attendance for shared desktop or reception terminal flows.',
      code: 2,
      badge: 'Kiosk',
    },
    {
      key: 'exempt_attendance',
      label: 'Exempt From Attendance',
      description: 'Assign employees who should not follow normal attendance punching.',
      code: 5,
      badge: 'Exempt',
    },
    {
      key: 'biometric_attendance',
      label: 'Biometric Attendance',
      description: 'Assign biometric attendance for employees who should verify from approved biometric setup.',
      code: 4,
      badge: 'Biometric',
    },
    {
      key: 'employee_selfie',
      label: 'Employee Selfie',
      description: 'Assign selfie-based attendance with no separate face workflow requirement.',
      code: 3,
      badge: 'Selfie',
    },
    {
      key: 'selfie_with_face',
      label: 'Selfie With Face',
      description: 'Assign selfie attendance with smart face verification and auto-detect flow.',
      code: 1,
      badge: 'Face Check',
    },
    {
      key: 'app_qr',
      label: 'App QR',
      description: 'Assign QR-based attendance for mobile-assisted scan workflows.',
      code: 6,
      badge: 'QR',
    },
  ]);

  showBiometricMode = computed(() => true);

  visibleModes = computed(() =>
    this.modes().filter(
      (mode) =>
        mode.key !== 'biometric_attendance' || this.showBiometricMode(),
    ),
  );

  filteredEmployees = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) return this.employees();

    return this.employees().filter((employee) =>
      [
        employee.firstName,
        employee.lastName,
        employee.employeeCode,
        employee.department?.name,
        employee.designation?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  });

  totalAssignedEmployees = computed(() =>
    this.assignments().reduce(
      (count, assignment) => count + assignment.employeeIds.length,
      0,
    ),
  );

  ngOnInit(): void {
    forkJoin({
      employees: this.employeeService.getEmployees().pipe(catchError(() => of([]))),
      assignments: this.workspace
        .getCollection<AttendanceModeAssignment>(this.storageKey, [])
        .pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ employees, assignments }) => {
        this.employees.set(employees);
        this.assignments.set(Array.isArray(assignments) ? assignments : []);
      },
      error: () => {
        this.toastService.error('Unable to load attendance mode settings.');
      },
    });
  }

  assignedCount(modeKey: AttendanceModeDefinition['key']): number {
    return (
      this.assignments().find((assignment) => assignment.modeKey === modeKey)
        ?.employeeIds.length || 0
    );
  }

  assignmentSummary(modeKey: AttendanceModeDefinition['key']): string {
    const assignment = this.assignments().find(
      (item) => item.modeKey === modeKey,
    );

    if (!assignment?.employeeNames.length) {
      return 'No employees assigned yet';
    }

    return assignment.employeeNames.join(', ');
  }

  openAssignModal(mode: AttendanceModeDefinition): void {
    if (!this.canEditSettings()) return;

    this.selectedMode.set(mode);
    this.searchTerm.set('');
    const assignedIds =
      this.assignments().find((item) => item.modeKey === mode.key)?.employeeIds ||
      [];
    this.selectedEmployees.set(
      this.employees().filter((employee) =>
        assignedIds.includes(employee.id || employee.employeeId || 0),
      ),
    );
  }

  closeAssignModal(): void {
    this.selectedMode.set(null);
    this.selectedEmployees.set([]);
    this.searchTerm.set('');
    this.saving.set(false);
  }

  isSelected(employee: User): boolean {
    const employeeId = employee.id || employee.employeeId || 0;
    return this.selectedEmployees().some(
      (item) => (item.id || item.employeeId || 0) === employeeId,
    );
  }

  toggleEmployee(employee: User): void {
    const employeeId = employee.id || employee.employeeId || 0;
    if (!employeeId) return;

    if (this.isSelected(employee)) {
      this.selectedEmployees.set(
        this.selectedEmployees().filter(
          (item) => (item.id || item.employeeId || 0) !== employeeId,
        ),
      );
      return;
    }

    this.selectedEmployees.set([...this.selectedEmployees(), employee]);
  }

  saveAssignments(): void {
    const mode = this.selectedMode();
    if (!mode) return;

    this.saving.set(true);
    const selectedEmployees = this.selectedEmployees();
    const selectedEmployeeIds = selectedEmployees
      .map((employee) => employee.id || employee.employeeId || 0)
      .filter((id) => id > 0);

    const previousAssignments = this.assignments();
    const currentModeAssignment = previousAssignments.find(
      (item) => item.modeKey === mode.key,
    );
    const previousModeEmployeeIds = currentModeAssignment?.employeeIds || [];

    const nextAssignments = previousAssignments
      .map((assignment) => {
        if (assignment.modeKey === mode.key) {
          return assignment;
        }

        const remainingEmployeeIds = assignment.employeeIds.filter(
          (employeeId) => !selectedEmployeeIds.includes(employeeId),
        );
        const remainingEmployeeNames = assignment.employeeNames.filter(
          (_, index) => remainingEmployeeIds.includes(assignment.employeeIds[index]),
        );

        return {
          ...assignment,
          employeeIds: remainingEmployeeIds,
          employeeNames: remainingEmployeeNames,
          updatedAt: new Date().toISOString(),
        };
      })
      .filter((assignment) => assignment.employeeIds.length > 0)
      .filter((assignment) => assignment.modeKey !== mode.key);

    const updatedRecord: AttendanceModeAssignment = {
      id: `attendance-mode-${mode.key}`,
      modeKey: mode.key,
      modeCode: mode.code,
      label: mode.label,
      employeeIds: selectedEmployeeIds,
      employeeNames: selectedEmployees.map(
        (employee) => `${employee.firstName} ${employee.lastName}`.trim(),
      ),
      updatedAt: new Date().toISOString(),
    };

    const payload = [...nextAssignments, updatedRecord].filter(
      (assignment) => assignment.employeeIds.length > 0,
    );

    const removedEmployeeIds = previousModeEmployeeIds.filter(
      (employeeId) => !selectedEmployeeIds.includes(employeeId),
    );

    const employeeUpdates = [
      ...selectedEmployeeIds.map((employeeId) =>
        this.employeeService.updateEmployee(employeeId, {
          modeOfAttendance: mode.code,
        }),
      ),
      ...removedEmployeeIds.map((employeeId) =>
        this.employeeService.updateEmployee(employeeId, {
          modeOfAttendance: null,
        }),
      ),
    ];

    const update$ = employeeUpdates.length
      ? forkJoin(employeeUpdates).pipe(catchError(() => of([])))
      : of([]);

    forkJoin({
      savedAssignments: this.workspace.saveCollection(this.storageKey, payload),
      employeeSync: update$,
    }).subscribe({
      next: ({ savedAssignments }) => {
        this.assignments.set(savedAssignments);
        this.saving.set(false);
        this.toastService.success(`${mode.label} assignment saved.`);
        this.closeAssignModal();
      },
      error: () => {
        this.saving.set(false);
        this.toastService.error('Unable to save attendance mode assignment.');
      },
    });
  }
}
