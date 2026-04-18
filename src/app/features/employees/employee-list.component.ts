import {
  Component,
  OnInit,
  signal,
  inject,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../core/services/employee.service';
import { User } from '../../core/models/auth.model';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';
import { LiveRefreshService } from '../../core/services/live-refresh.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UiSelectAdvancedComponent } from '../../core/components/ui';
import { SelectOption } from '../../core/components/ui/ui-select-advanced.component';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, UiSelectAdvancedComponent],
  template: `
    <div class="flex flex-col gap-4 sm:gap-5 lg:gap-6">
      <section
        class="overflow-hidden rounded-md border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_38%),linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#eefbf5_100%)] shadow-sm"
      >
        <div
          class="grid gap-5 px-4 py-5 sm:px-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8 lg:py-8"
        >
          <div class="min-w-0 space-y-5">
            <div
              class="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
            >
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              {{ t('employee.workspace') }}
            </div>
            <div>
              <h1
                class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl xl:text-4xl"
              >
                {{ t('employee.directoryTitle') }}
              </h1>
              <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                {{ t('employee.directorySubtitle') }}
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div
                class="rounded-md border border-white/80 bg-white/90 px-4 py-4 shadow-sm"
              >
                <p
                  class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  {{ t('common.totalEmployees') }}
                </p>
                <p class="mt-2 text-2xl font-black text-slate-900">
                  {{ employeeStats().total }}
                </p>
                <p class="mt-1 text-xs text-slate-500">{{ t('common.allEmployeeRecords') }}</p>
              </div>
              <div
                class="rounded-md border border-white/80 bg-white/90 px-4 py-4 shadow-sm"
              >
                <p
                  class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  {{ t('common.active') }}
                </p>
                <p class="mt-2 text-2xl font-black text-emerald-600">
                  {{ employeeStats().active }}
                </p>
                <p class="mt-1 text-xs text-slate-500">{{ t('common.currentlyWorking') }}</p>
              </div>
              <div
                class="rounded-md border border-white/80 bg-white/90 px-4 py-4 shadow-sm"
              >
                <p
                  class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  {{ t('common.onLeave') }}
                </p>
                <p class="mt-2 text-2xl font-black text-amber-500">
                  {{ employeeStats().onLeave }}
                </p>
                <p class="mt-1 text-xs text-slate-500">{{ t('common.temporaryAbsences') }}</p>
              </div>
              <div
                class="rounded-md border border-white/80 bg-white/90 px-4 py-4 shadow-sm"
              >
                <p
                  class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  {{ t('common.terminated') }}
                </p>
                <p class="mt-2 text-2xl font-black text-rose-500">
                  {{ employeeStats().terminated }}
                </p>
                <p class="mt-1 text-xs text-slate-500">{{ t('common.historicalRecords') }}</p>
              </div>
            </div>
          </div>

          <div
            class="flex min-w-0 flex-col gap-4 rounded-md border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5"
          >
            <div>
              <p
                class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
              >
                {{ t('common.quickActions') }}
              </p>
              <h2 class="mt-1 text-lg font-black text-slate-900">
                {{ t('common.directoryControls') }}
              </h2>
              <p class="mt-1 text-sm text-slate-500">
                {{ t('common.directoryControlsDescription') }}
              </p>
            </div>

            <div
              class="rounded-md border border-slate-200 bg-slate-50 px-4 py-4"
            >
              <p
                class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
              >
                {{ t('common.directoryHealth') }}
              </p>
              <p class="mt-2 text-2xl font-black text-slate-900">
                {{ employeeStats().active }}
              </p>
              <p class="mt-1 text-xs leading-5 text-slate-500">
                {{ t('common.directoryHealthDescription') }}
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <button
                class="inline-flex items-center justify-center gap-2 rounded-md border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                (click)="exportEmployees()"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"
                  />
                  <path d="M12 12v9" />
                  <path d="m8 17 4 4 4-4" />
                </svg>
                {{ t('common.exportCsv') }}
              </button>
              <button
                class="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                (click)="addEmployee()"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
                {{ t('common.addEmployee') }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div
        class="flex overflow-x-auto no-scrollbar rounded-md border border-slate-200 bg-white px-1.5 sm:px-2"
      >
        @for (tab of tabs; track tab.id) {
          @let tId = tab.id;
          <button
            (click)="setTab(tId)"
            [class]="
              'px-6 py-4 text-sm font-bold whitespace-nowrap transition-all relative ' +
              (currentTab() === tId
                ? 'text-primary-600'
                : 'text-slate-400 hover:text-slate-600')
            "
          >
            <div class="flex items-center gap-2">
              {{ tabLabel(tab.id) }}
              <span
                [class]="
                  'px-1.5 py-0.5 rounded text-[10px] ' +
                  (currentTab() === tab.id
                    ? 'bg-primary-50 text-primary-600'
                    : 'bg-slate-50 text-slate-400')
                "
              >
                {{ tab.count }}
              </span>
            </div>
            @if (currentTab() === tab.id) {
              <div
                class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full animate-fade-in"
              ></div>
            }
          </button>
        }
      </div>

      <div class="card overflow-hidden rounded-md">
        <div
          class="flex flex-col items-start justify-between gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center"
        >
          <div class="relative w-full lg:max-w-[320px]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="onFilterChange()"
              [placeholder]="t('common.searchByNameEmailOrCode')"
              class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/10 transition-all"
            />
          </div>
          <div class="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:flex-wrap lg:justify-end">
            <app-ui-select-advanced
              [(ngModel)]="statusFilter"
              (ngModelChange)="onFilterChange()"
              [options]="statusFilterOptions"
              [placeholder]="statusPlaceholder()"
              [searchable]="false"
            ></app-ui-select-advanced>
            <button
              class="flex-1 md:flex-none px-3 py-2 border border-slate-200 rounded-md text-sm font-medium bg-white text-slate-600 hover:bg-slate-50 transition-colors"
              (click)="clearFilters()"
            >
              {{ t('common.clear') }}
            </button>
          </div>
        </div>

        <div class="md:hidden divide-y divide-slate-100">
          @if (loading()) {
            <div class="px-5 py-12 text-center text-slate-400 font-medium">
              {{ t('common.loadingEmployees') }}
            </div>
          } @else if (filteredEmployees().length === 0) {
            <div class="px-5 py-12 text-center">
              <div class="flex flex-col items-center gap-3">
                <div
                  class="w-14 h-14 rounded-md bg-slate-100 flex items-center justify-center text-slate-400"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
                <div>
                  <p class="text-slate-700 font-semibold">{{ t('common.noResults') }}</p>
                  <p class="text-slate-400 text-sm">
                    {{ t('common.tryAnotherSearch') }}
                  </p>
                </div>
                <button
                  class="px-4 py-2 rounded-md border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  (click)="clearFilters()"
                >
                  {{ t('common.resetFilters') }}
                </button>
              </div>
            </div>
          } @else {
            @for (emp of filteredEmployees(); track emp.id) {
              <article class="space-y-4 px-5 py-5">
                <div class="flex items-start gap-3">
                  <div
                    class="w-11 h-11 bg-primary-50 text-primary-700 rounded-md flex items-center justify-center font-bold text-sm shrink-0"
                  >
                    {{ emp.firstName[0] }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="font-semibold text-slate-900 break-words">
                      {{ emp.firstName }} {{ emp.lastName }}
                    </p>
                    <p class="text-xs text-slate-500 break-all mt-1">
                      {{ emp.email }}
                    </p>
                  </div>
                  <span
                    class="px-3 py-1 rounded-full text-[10px] font-bold capitalize whitespace-nowrap"
                    [ngClass]="{
                      'bg-green-50 text-success': emp.status === 'active',
                      'bg-orange-50 text-orange-600': emp.status === 'on_leave',
                      'bg-red-50 text-error': emp.status === 'terminated',
                      'bg-slate-50 text-slate-500': emp.status === 'inactive',
                    }"
                  >
                    {{ tabLabel(emp.status) }}
                  </span>
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="rounded-md bg-slate-50 px-4 py-3">
                    <p
                      class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400"
                    >
                      {{ t('common.employeeId') }}
                    </p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">
                      {{ emp.employeeCode || t('common.notAvailableShort') }}
                    </p>
                  </div>
                  <div class="rounded-md bg-slate-50 px-4 py-3">
                    <p
                      class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400"
                    >
                      Role
                    </p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">
                      {{ getRoleLabel(emp.roleId) }}
                    </p>
                  </div>
                  <div class="rounded-md bg-slate-50 px-4 py-3 sm:col-span-2">
                    <p
                      class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400"
                    >
                      {{ t('common.joinedDate') }}
                    </p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">
                      {{ (emp.createdAt | date: 'mediumDate') || t('common.recent') }}
                    </p>
                  </div>
                </div>

                <div class="grid gap-2 sm:grid-cols-3">
                  <button
                    (click)="viewEmployee(emp)"
                    class="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {{ t('common.view') }}
                  </button>
                  <button
                    (click)="editEmployee(emp)"
                    class="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {{ t('common.edit') }}
                  </button>
                  <button
                    (click)="deleteEmployee(emp.id)"
                    class="rounded-md border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    {{ t('common.delete') }}
                  </button>
                </div>
              </article>
            }
          }
        </div>

        <div class="hidden overflow-x-auto md:block">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50">
                <th
                  class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                >
                  {{ t('sidebar.employee') }}
                </th>
                <th
                  class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                >
                  {{ t('common.employeeId') }}
                </th>
                <th
                  class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                >
                  Role
                </th>
                <th
                  class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                >
                  Status
                </th>
                <th
                  class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap"
                >
                  {{ t('common.joinedDate') }}
                </th>
                <th
                  class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right"
                >
                  {{ t('common.actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @if (loading()) {
                <tr>
                  <td
                    colspan="6"
                    class="px-6 py-12 text-center text-slate-400 font-medium"
                  >
                    {{ t('common.loadingEmployees') }}
                  </td>
                </tr>
              } @else if (filteredEmployees().length === 0) {
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center gap-3">
                      <div
                        class="w-14 h-14 rounded-md bg-slate-100 flex items-center justify-center text-slate-400"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.3-4.3" />
                        </svg>
                      </div>
                      <div>
                        <p class="text-slate-700 font-semibold">
                          {{ t('common.noResults') }}
                        </p>
                        <p class="text-slate-400 text-sm">
                          {{ t('common.tryAnotherSearch') }}
                        </p>
                      </div>
                      <button
                        class="px-4 py-2 rounded-md border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        (click)="clearFilters()"
                      >
                        {{ t('common.reset') }}
                      </button>
                    </div>
                  </td>
                </tr>
              } @else {
                @for (emp of filteredEmployees(); track emp.id) {
                  <tr class="hover:bg-slate-50/50 transition-colors">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div
                          class="w-9 h-9 bg-primary-50 text-primary-700 rounded-md flex items-center justify-center font-bold text-sm"
                        >
                          {{ emp.firstName[0] }}
                        </div>
                        <div class="flex flex-col">
                          <span class="font-semibold text-slate-900"
                            >{{ emp.firstName }} {{ emp.lastName }}</span
                          >
                          <span
                            class="text-[11px] text-slate-500 font-medium"
                            >{{ emp.email }}</span
                          >
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span
                        class="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold"
                            >{{ emp.employeeCode || t('common.notAvailableShort') }}</span
                      >
                    </td>
                    <td class="px-6 py-4 text-slate-600 font-medium text-sm">
                      {{ getRoleLabel(emp.roleId) }}
                    </td>
                    <td class="px-6 py-4">
                      <span
                        class="px-3 py-1 rounded-full text-[10px] font-bold capitalize whitespace-nowrap"
                        [ngClass]="{
                          'bg-green-50 text-success': emp.status === 'active',
                          'bg-orange-50 text-orange-600':
                            emp.status === 'on_leave',
                          'bg-red-50 text-error': emp.status === 'terminated',
                          'bg-slate-50 text-slate-500':
                            emp.status === 'inactive',
                        }"
                      >
                        {{ tabLabel(emp.status) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-slate-500 text-sm italic">
                      {{ (emp.createdAt | date: 'mediumDate') || t('common.recent') }}
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-2">
                        <button
                          (click)="viewEmployee(emp)"
                          class="p-2 rounded-md text-slate-400 hover:bg-slate-100 hover:text-primary-600 transition-colors"
                          [title]="t('common.viewDetails')"
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
                              d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
                            />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        <button
                          (click)="editEmployee(emp)"
                          class="p-2 rounded-md text-slate-400 hover:bg-slate-100 hover:text-primary-600 transition-colors"
                          [title]="t('common.edit')"
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
                            <path d="M12 20h9" />
                            <path
                              d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
                            />
                          </svg>
                        </button>
                        <button
                          (click)="deleteEmployee(emp.id)"
                          class="p-2 rounded-md text-slate-400 hover:bg-red-50 hover:text-error transition-colors"
                          [title]="t('common.delete')"
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
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" x2="10" y1="11" y2="17" />
                            <line x1="14" x2="14" y1="11" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <div
          class="flex flex-col gap-3 border-t border-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
          <span class="text-sm text-slate-400 font-medium tracking-tight">
            {{ t('common.showingOfEntries', { shown: filteredEmployees().length, total: rawEmployees().length }) }}
          </span>
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {{ tabLabel(currentTab()) }} {{ t('common.roster') }}
            </span>
            <span class="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600">
              {{ employeeStats().active }} {{ t('common.active') }} / {{ employeeStats().total }} {{ t('common.totalEmployees').toLowerCase() }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private modalService = inject(ModalService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private liveRefreshService = inject(LiveRefreshService);
  private destroyRef = inject(DestroyRef);
  private languageService = inject(LanguageService);

  rawEmployees = signal<any[]>([]);
  loading = signal<boolean>(true);
  searchQuery = '';
  statusFilter = '';
  currentTab = signal<'active' | 'inactive' | 'on_leave' | 'terminated'>(
    'active',
  );
  filteredEmployees = computed(() => {
    let filtered = [...this.rawEmployees()];
    filtered = filtered.filter(
      (employee) => employee.status === this.currentTab(),
    );

    if (this.statusFilter) {
      filtered = filtered.filter(
        (employee) => employee.status === this.statusFilter,
      );
    }

    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (employee) =>
          employee.firstName?.toLowerCase().includes(q) ||
          employee.lastName?.toLowerCase().includes(q) ||
          employee.email?.toLowerCase().includes(q) ||
          employee.employeeCode?.toLowerCase().includes(q) ||
          employee.phone?.toLowerCase().includes(q),
      );
    }

    return filtered;
  });
  employeeStats = computed(() => {
    const employees = this.rawEmployees();
    return {
      total: employees.length,
      active: employees.filter((employee) => employee.status === 'active')
        .length,
      onLeave: employees.filter((employee) => employee.status === 'on_leave')
        .length,
      terminated: employees.filter(
        (employee) => employee.status === 'terminated',
      ).length,
    };
  });
  tabs: {
    id: 'active' | 'inactive' | 'on_leave' | 'terminated';
    count: number;
  }[] = [
    { id: 'active', count: 0 },
    { id: 'inactive', count: 0 },
    { id: 'on_leave', count: 0 },
    { id: 'terminated', count: 0 },
  ];

  get statusFilterOptions(): SelectOption[] {
    return [
      { label: `${this.t('common.status')}: All`, value: '' },
      { label: this.t('common.active'), value: 'active' },
      { label: this.t('common.inactive'), value: 'inactive' },
      { label: this.t('common.onLeave'), value: 'on_leave' },
      { label: this.t('common.terminated'), value: 'terminated' },
    ];
  }

  ngOnInit() {
    this.loadEmployees();
    this.liveRefreshService
      .createStream(15000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadEmployees(false));
  }

  loadEmployees(showLoader = true) {
    if (showLoader) {
      this.loading.set(true);
    }

    this.employeeService.getEmployees().subscribe({
      next: (data) => {
        // Update counts
        this.tabs[0].count = data.filter((e) => e.status === 'active').length;
        this.tabs[1].count = data.filter((e) => e.status === 'inactive').length;
        this.tabs[2].count = data.filter((e) => e.status === 'on_leave').length;
        this.tabs[3].count = data.filter(
          (e) => e.status === 'terminated',
        ).length;

        this.rawEmployees.set(data);
        this.loading.set(false);
      },
      error: () => {
        // MOCK DATA for perfect UI
        const mockEmployees: any[] = [
          {
            id: 1,
            firstName: 'Rohan',
            lastName: 'Sharma',
            email: 'rohan.s@company.com',
            employeeCode: 'EMP001',
            status: 'active',
            roleId: 1,
            createdAt: new Date('2024-01-15').toISOString(),
          },
          {
            id: 2,
            firstName: 'Priya',
            lastName: 'Verma',
            email: 'priya.v@company.com',
            employeeCode: 'EMP002',
            status: 'active',
            roleId: 3,
            createdAt: new Date('2024-02-10').toISOString(),
          },
          {
            id: 3,
            firstName: 'Amit',
            lastName: 'Patel',
            email: 'amit.p@company.com',
            employeeCode: 'EMP003',
            status: 'on_leave',
            roleId: 3,
            createdAt: new Date('2024-03-05').toISOString(),
          },
          {
            id: 4,
            firstName: 'Sneha',
            lastName: 'Reddy',
            email: 'sneha.r@company.com',
            employeeCode: 'EMP004',
            status: 'active',
            roleId: 2,
            createdAt: new Date('2024-04-20').toISOString(),
          },
          {
            id: 5,
            firstName: 'Vikram',
            lastName: 'Singh',
            email: 'vikram.s@company.com',
            employeeCode: 'EMP005',
            status: 'terminated',
            roleId: 3,
            createdAt: new Date('2023-11-12').toISOString(),
          },
        ];

        // Update counts for mocks
        this.tabs[0].count = mockEmployees.filter(
          (e) => e.status === 'active',
        ).length;
        this.tabs[1].count = mockEmployees.filter(
          (e) => e.status === 'inactive',
        ).length;
        this.tabs[2].count = mockEmployees.filter(
          (e) => e.status === 'on_leave',
        ).length;
        this.tabs[3].count = mockEmployees.filter(
          (e) => e.status === 'terminated',
        ).length;

        this.rawEmployees.set(mockEmployees);
        this.loading.set(false);
      },
    });
  }

  setTab(tabId: 'active' | 'inactive' | 'on_leave' | 'terminated') {
    this.currentTab.set(tabId);
    this.onFilterChange();
  }

  onFilterChange() {
    this.rawEmployees.update((employees) => [...employees]);
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.onFilterChange();
  }

  exportEmployees() {
    const rows = this.filteredEmployees();
    if (!rows.length) {
      this.toastService.error(this.t('common.noEmployeesToExport'));
      return;
    }

    const csv = [
      [
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Employee Code',
        'Status',
      ].join(','),
      ...rows.map((employee) =>
        [
          employee.firstName ?? '',
          employee.lastName ?? '',
          employee.email ?? '',
          employee.phone ?? '',
          employee.employeeCode ?? '',
          employee.status ?? '',
        ]
          .map((value: string) => `"${String(value).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employees-${this.currentTab()}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    this.toastService.success(this.t('common.employeeExportDownloaded'));
  }

  addEmployee() {
    this.router.navigate(['/employees/add']);
  }

  private resolveEmployeeId(value: unknown): number | null {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  getRoleLabel(roleId?: number | null): string {
    switch (Number(roleId ?? 0)) {
      case 1:
        return this.t('sidebar.superAdmin');
      case 2:
        return this.t('sidebar.admin');
      case 3:
        return this.t('sidebar.hrManager');
      case 4:
        return this.t('sidebar.manager');
      case 5:
        return this.t('sidebar.employee');
      default:
        return this.t('sidebar.employee');
    }
  }

  tabLabel(tabId: 'active' | 'inactive' | 'on_leave' | 'terminated' | string): string {
    switch (tabId) {
      case 'active':
        return this.t('common.active');
      case 'inactive':
        return this.t('common.inactive');
      case 'on_leave':
        return this.t('common.onLeave');
      case 'terminated':
        return this.t('common.terminated');
      default:
        return String(tabId);
    }
  }

  statusPlaceholder(): string {
    return `${this.t('common.status')}: All`;
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    this.languageService.currentLanguage();
    return this.languageService.t(key, params);
  }

  editEmployee(emp: any) {
    const id = this.resolveEmployeeId(emp?.id);
    if (!id) {
      this.toastService.error(this.t('common.recordUnavailable'));
      return;
    }

    this.router.navigate(['/employees/edit', id]);
  }

  viewEmployee(emp: any) {
    const id = this.resolveEmployeeId(emp?.id);
    if (!id) {
      this.toastService.error(this.t('common.recordUnavailable'));
      return;
    }

    this.router.navigate(['/employees/view', id]);
  }

  async deleteEmployee(id: number) {
    const employeeId = this.resolveEmployeeId(id);
    if (!employeeId) {
      this.toastService.error(this.t('common.recordUnavailable'));
      return;
    }

    const confirmed = await this.modalService.confirm({
      title: this.t('common.deleteEmployee'),
      message: this.t('common.deleteEmployeeConfirm'),
      confirmText: this.t('common.deleteNow'),
      cancelText: this.t('common.keepEmployee'),
      type: 'danger',
    });

    if (confirmed) {
      this.employeeService.deleteEmployee(employeeId).subscribe({
        next: () => {
          this.toastService.success(this.t('common.employeeDeletedSuccessfully'));
          this.loadEmployees();
        },
        error: (err) => {
          this.toastService.error(this.t('common.failedToDeleteEmployee'));
          console.error(err);
        },
      });
    }
  }
}
