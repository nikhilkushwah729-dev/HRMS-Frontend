import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EmployeeService } from '../../../../core/services/employee.service';
import { FaceEmployee, FaceRecognitionService } from '../../../../core/services/face-recognition.service';
import { ToastService } from '../../../../core/services/toast.service';

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
    <div class="mx-auto max-w-7xl space-y-6 px-1 py-2">
      <section class="app-module-hero">
        <div>
          <p class="app-module-kicker">Attendance Settings</p>
          <h1 class="app-module-title">Face Recognition Directory</h1>
          <p class="app-module-text max-w-2xl">Monitor enrollment coverage and take action quickly. The list now syncs employee data with biometric registration status, and gracefully falls back when face APIs are partially unavailable.</p>
        </div>
        <div class="app-module-highlight">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Registered employees</p>
          <p class="mt-3 text-3xl font-black text-slate-900">{{ registeredCount() }}</p>
          <p class="mt-2 text-sm text-slate-600">Coverage: {{ coverageLabel() }}</p>
        </div>
      </section>

      <section class="app-surface-card overflow-hidden p-0">
        <div class="border-b border-slate-100 px-6 py-5">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Biometric Enrollment</p>
              <h2 class="mt-2 text-2xl font-black text-slate-900">Employee face registry</h2>
            </div>
            <div class="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
              <input [value]="searchQuery()" (input)="updateSearch($event)" class="app-field flex-1" placeholder="Search employee or code">
              <button type="button" (click)="goToEnrollment()" class="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Open Enrollment</button>
            </div>
          </div>
        </div>

        <div class="divide-y divide-slate-100">
          @for (entry of filteredData(); track entry.id) {
            <article class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-3">
                  <p class="text-lg font-black text-slate-900">{{ entry.employeeName }}</p>
                  <span class="rounded-full px-3 py-1 text-xs font-semibold" [ngClass]="entry.status === 'Registered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">{{ entry.status }}</span>
                </div>
                <p class="mt-2 text-sm text-slate-600">{{ entry.employeeId }} | {{ entry.email }}</p>
                <p class="mt-1 text-xs text-slate-500">Last sync: {{ entry.lastSync }}</p>
              </div>
              <div class="flex gap-3">
                <button type="button" (click)="openEnrollmentFor(entry.id)" class="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{{ entry.status === 'Registered' ? 'Review' : 'Enroll' }}</button>
                <button type="button" [disabled]="entry.status !== 'Registered' || busyId() === entry.id" (click)="removeRegistration(entry)" class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">{{ busyId() === entry.id ? 'Removing...' : 'Delete Data' }}</button>
              </div>
            </article>
          } @empty {
            <div class="px-6 py-14 text-center text-slate-500">No employees matched the current biometric search.</div>
          }
        </div>
      </section>
    </div>
  `
})
export class FaceRecognitionComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private faceRecognitionService = inject(FaceRecognitionService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private datePipe = inject(DatePipe);

  data = signal<FaceData[]>([]);
  searchQuery = signal('');
  busyId = signal<number | null>(null);

  filteredData = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.data();
    return this.data().filter((entry) =>
      entry.employeeName.toLowerCase().includes(query) ||
      entry.employeeId.toLowerCase().includes(query) ||
      entry.email.toLowerCase().includes(query)
    );
  });

  registeredCount = computed(() => this.data().filter((entry) => entry.status === 'Registered').length);

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
      employees: this.employeeService.getEmployees().pipe(catchError(() => of([]))),
      faceEmployees: this.faceRecognitionService.getEmployeesWithFaces().pipe(catchError(() => of([] as FaceEmployee[])))
    }).subscribe({
      next: ({ employees, faceEmployees }) => {
        const faceMap = new Map<number, FaceEmployee>();
        faceEmployees.forEach((entry) => {
          const id = Number(entry.employee_id ?? entry.id ?? 0);
          if (id) {
            faceMap.set(id, entry);
          }
        });

        this.data.set(
          employees.map((employee) => {
            const faceEntry = faceMap.get(Number(employee.id));
            const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.email;
            const lastSync = faceEntry?.registered_at
              ? this.datePipe.transform(faceEntry.registered_at, 'medium') ?? 'Recently'
              : 'Pending enrollment';

            return {
              id: Number(employee.id ?? 0),
              employeeName: fullName,
              employeeId: employee.employeeCode || `EMP-${String(employee.id ?? '').padStart(3, '0')}`,
              email: employee.email,
              status: faceEntry ? 'Registered' : 'Unregistered',
              lastSync
            };
          })
        );
      },
      error: () => this.toastService.error('Unable to load the biometric directory right now.')
    });
  }

  updateSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  goToEnrollment(): void {
    void this.router.navigate(['/face-registration']);
  }

  openEnrollmentFor(employeeId: number): void {
    void this.router.navigate(['/face-registration'], { queryParams: { employeeId } });
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
    this.faceRecognitionService.deleteFaceRegistration(entry.id).pipe(
      catchError((error) => {
        this.toastService.error(error?.error?.message || 'Unable to delete biometric data right now.');
        return of(null);
      })
    ).subscribe((result) => {
      this.busyId.set(null);
      if (result === null) {
        return;
      }

      this.data.update((list) => list.map((item) => item.id === entry.id ? {
        ...item,
        status: 'Unregistered',
        lastSync: 'Pending enrollment'
      } : item));
      this.toastService.success('Biometric data removed successfully.');
    });
  }
}
