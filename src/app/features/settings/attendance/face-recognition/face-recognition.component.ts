import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EmployeeService } from '../../../../core/services/employee.service';
import {
  FaceEmployee,
  FaceRecognitionService,
} from '../../../../core/services/face-recognition.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LanguageService } from '../../../../core/services/language.service';

interface FaceData {
  id: number;
  employeeName: string;
  employeeId: string;
  email: string;
  status: 'Registered' | 'Unregistered';
  lastSync: string;
}

@Component({
  selector: 'app-face-recognition',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  template: `
    <div class="mx-auto max-w-7xl space-y-6">
      <section class="app-module-hero overflow-hidden">
        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div class="space-y-5">
            <div>
              <p class="app-module-kicker">Attendance Settings</p>
              <h1 class="app-module-title">Face Recognition Directory</h1>
              <p class="app-module-text max-w-2xl">
                Monitor biometric enrollment coverage and act quickly. This
                directory combines employee records with face registration
                status, even when biometric APIs are partially unavailable.
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Registered</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ registeredCount() }}</p>
                <p class="mt-1 text-xs text-slate-500">Biometric ready</p>
              </div>
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Pending</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ pendingCount() }}</p>
                <p class="mt-1 text-xs text-slate-500">Need enrollment</p>
              </div>
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Coverage</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ coverageLabel() }}</p>
                <p class="mt-1 text-xs text-slate-500">Overall rollout</p>
              </div>
            </div>
          </div>

          <div class="app-module-highlight">
            <p class="app-module-highlight-label">Biometric status</p>
            <p class="mt-3 app-module-highlight-value">Enrollment tracker</p>
            <p class="mt-3 text-sm leading-6 text-white/80">
              Review missing registrations quickly before enabling stricter
              attendance controls for the whole organisation.
            </p>
          </div>
        </div>
      </section>

      <section class="app-surface-card overflow-hidden p-0">
        <div class="border-b border-slate-100 px-6 py-5">
          <div
            class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <p
                class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
              >
                Biometric Enrollment
              </p>
              <h2 class="mt-2 text-2xl font-black text-slate-900">
                Employee face registry
              </h2>
              <p class="mt-2 text-sm leading-6 text-slate-500">
                Search employees, review their current registration status, and
                jump straight into enrollment when action is needed.
              </p>
            </div>
            <div class="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
              <input
                [value]="searchQuery()"
                (input)="updateSearch($event)"
                class="app-field flex-1"
                placeholder="Search employee or code"
              />
              <button
                type="button"
                (click)="goToEnrollment()"
                class="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open Enrollment
              </button>
            </div>
          </div>
        </div>

        <div class="divide-y divide-slate-100">
          @for (entry of filteredData(); track entry.id) {
            <article
              class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-3">
                  <p class="text-lg font-black text-slate-900">
                    {{ entry.employeeName }}
                  </p>
                  <span
                    class="rounded-full px-3 py-1 text-xs font-semibold"
                    [ngClass]="
                      entry.status === 'Registered'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    "
                    >{{ entry.status === 'Registered' ? t('common.connected') : t('common.pending') }}</span
                  >
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {{ entry.employeeId }}
                  </span>
                </div>
                <p class="mt-2 text-sm text-slate-600">
                  {{ entry.email }}
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  Last sync: {{ entry.lastSync }}
                </p>
              </div>
              <div class="flex gap-3">
                <button
                  type="button"
                  (click)="openEnrollmentFor(entry.id)"
                  class="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {{ entry.status === 'Registered' ? t('common.view') : 'Enroll' }}
                </button>
                <button
                  type="button"
                  [disabled]="
                    entry.status !== 'Registered' || busyId() === entry.id
                  "
                  (click)="removeRegistration(entry)"
                  class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {{ busyId() === entry.id ? 'Removing...' : t('common.delete') }}
                </button>
              </div>
            </article>
          } @empty {
            <div class="px-6 py-16 text-center">
              <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 10a3 3 0 1 0 6 0" />
                  <path d="M17 16.5c-.8-1.5-2.6-2.5-5-2.5s-4.2 1-5 2.5" />
                  <path d="M3 7.5C3 5 5 3 7.5 3h9C19 3 21 5 21 7.5v9c0 2.5-2 4.5-4.5 4.5h-9C5 21 3 19 3 16.5z" />
                </svg>
              </div>
              <p class="mt-4 text-base font-semibold text-slate-900">{{ t('common.noResults') }}</p>
              <p class="mt-2 text-sm text-slate-500">Try another employee name, code, or email to review enrollment coverage.</p>
            </div>
          }
        </div>
      </section>
    </div>
  `,
})
export class FaceRecognitionComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private faceRecognitionService = inject(FaceRecognitionService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private datePipe = inject(DatePipe);
  private languageService = inject(LanguageService);

  data = signal<FaceData[]>([]);
  searchQuery = signal('');
  busyId = signal<number | null>(null);

  filteredData = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.data();
    return this.data().filter(
      (entry) =>
        entry.employeeName.toLowerCase().includes(query) ||
        entry.employeeId.toLowerCase().includes(query) ||
        entry.email.toLowerCase().includes(query),
    );
  });

  registeredCount = computed(
    () => this.data().filter((entry) => entry.status === 'Registered').length,
  );

  pendingCount = computed(
    () => this.data().filter((entry) => entry.status !== 'Registered').length,
  );

  coverageLabel = computed(() => {
    const total = this.data().length;
    if (!total) return '0%';
    return `${Math.round((this.registeredCount() / total) * 100)}%`;
  });

  ngOnInit(): void {
    this.loadDirectory();
  }

  loadDirectory(): void {
    forkJoin({
      employees: this.employeeService
        .getEmployees()
        .pipe(catchError(() => of([]))),
      faceEmployees: this.faceRecognitionService
        .getEmployeesWithFaces()
        .pipe(catchError(() => of([] as FaceEmployee[]))),
    }).subscribe({
      next: ({ employees, faceEmployees }) => {
        const faceMap = new Map<number, FaceEmployee>();
        faceEmployees.forEach((entry) => {
          const id = Number(entry.employeeId ?? entry.id ?? 0);
          if (id) {
            faceMap.set(id, entry);
          }
        });

        this.data.set(
          employees.map((employee) => {
            const faceEntry = faceMap.get(Number(employee.id));
            const fullName =
              `${employee.firstName || ''} ${employee.lastName || ''}`.trim() ||
              employee.email;
            const lastSync = faceEntry?.registeredAt
              ? (this.datePipe.transform(faceEntry.registeredAt, 'medium') ??
                'Recently')
              : 'Pending enrollment';

            return {
              id: Number(employee.id ?? 0),
              employeeName: fullName,
              employeeId:
                employee.employeeCode ||
                `EMP-${String(employee.id ?? '').padStart(3, '0')}`,
              email: employee.email,
              status: faceEntry ? 'Registered' : 'Unregistered',
              lastSync,
            };
          }),
        );
      },
      error: () =>
        this.toastService.error(
          'Unable to load the biometric directory right now.',
        ),
    });
  }

  updateSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  goToEnrollment(): void {
    void this.router.navigate(['/face-registration']);
  }

  openEnrollmentFor(employeeId: number): void {
    void this.router.navigate(['/face-registration'], {
      queryParams: { employeeId },
    });
  }

  removeRegistration(entry: FaceData): void {
    if (entry.status !== 'Registered') {
      this.toastService.info('This employee is not registered yet.');
      return;
    }

    if (!confirm(`Delete biometric data for ${entry.employeeName}?`)) {
      return;
    }

    this.busyId.set(entry.id);
    this.faceRecognitionService
      .deleteFaceRegistration(entry.id)
      .pipe(
        catchError((error) => {
          this.toastService.error(
            error?.error?.message ||
              'Unable to delete biometric data right now.',
          );
          return of(null);
        }),
      )
      .subscribe((result) => {
        this.busyId.set(null);
        if (result === null) {
          return;
        }

        this.data.update((list) =>
          list.map((item) =>
            item.id === entry.id
              ? {
                  ...item,
                  status: 'Unregistered',
                  lastSync: 'Pending enrollment',
                }
              : item,
          ),
        );
        this.toastService.success('Biometric data removed successfully.');
      });
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    this.languageService.currentLanguage();
    return this.languageService.t(key, params);
  }
}
