import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { LeaveDashboard, LeaveService } from '../../core/services/leave.service';
import {
  RegularizationRequest,
  RegularizationService,
} from '../../core/services/regularization.service';
import { Expense, ExpenseService } from '../../core/services/expense.service';

type RequestMenuItem = {
  label: string;
  route: string;
  description: string;
  count: number;
  applyBtn?: { name: string; route: string; queryParams?: any };
  children?: RequestMenuItem[];
};

@Component({
  selector: 'app-request-center',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  template: `
    <div class="mx-auto px-4 py-4">
      <div class="grid grid-cols-12 gap-4">
        <!-- Header -->
        <div class="col-span-12 sticky top-0 z-20 shadow-lg p-6 rounded-2xl border border-slate-100 bg-white/95 backdrop-blur-md">
          <div>
            <div class="text-2xl max-sm:text-lg font-semibold text-slate-900">
              Request Center
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-2 col-span-12">
          <div class="mx-auto shadow-sm rounded-xl border border-slate-100 p-4 text-sm bg-white">
            <h1 class="text-lg font-semibold mb-4 text-slate-900">Request Category</h1>
            <hr class="border-slate-200" />
            <div class="mt-4">
              <ul class="flex flex-col lg:space-y-1 lg:h-[605px] overflow-y-auto overflow-x-hidden hidescrollbar">
                @for (item of menuItems(); track item.label) {
                  <li class="w-full">
                    <button
                      type="button"
                      class="flex items-center justify-between p-2.5 w-full max-lg:whitespace-nowrap text-left rounded-xl font-normal hover:bg-slate-50 text-sm lg:text-base transition"
                      (click)="toggleMenu(item)"
                    >
                      <span class="flex items-center text-sm text-slate-700 gap-3">
                        <span class="text-slate-500" [innerHTML]="itemIcon(item.label)"></span>
                        <span>{{ item.label }}</span>
                      </span>

                      <span class="ml-2 flex items-center gap-2">
                        @if (item.count > 0 && !isExpanded(item)) {
                          <span class="inline-flex min-w-5 justify-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            {{ item.count }}
                          </span>
                        }

                      @if (item.children?.length) {
                        <span class="flex justify-end">
                          <svg class="h-5 w-5 text-slate-400 transition-transform duration-300" 
                               [class.rotate-90]="isExpanded(item)" 
                               viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7.41 8.58L12 13.17l4.59-4.59L18 10l-6 6-6-6z" />
                          </svg>
                        </span>
                      }
                      </span>
                    </button>

                    @if (item.children?.length && isExpanded(item)) {
                      <ul class="pl-4 lg:flex-col lg:space-y-1 space-y-0 max-lg:flex max-lg:flex-row max-lg:space-x-2 text-sm overflow-y-auto lg:max-h-[200px] max-h-[300px] lg:w-full w-auto lg:overflow-x-hidden overflow-x-auto text-slate-700 hidescrollbar">
                        @for (child of item.children; track child.route) {
                          <li class="lg:w-full w-auto">
                            <a
                              [routerLink]="child.route"
                              class="block p-2.5 w-full max-lg:w-auto text-left rounded-xl font-normal hover:bg-slate-50 text-sm lg:text-base transition"
                              [class.bg-emerald-50]="isRouteActive(child.route)"
                              [class.text-emerald-700]="isRouteActive(child.route)"
                              [class.font-semibold]="isRouteActive(child.route)"
                              (click)="selectChild(child)"
                            >
                              <span class="flex items-center text-sm w-full justify-between gap-2">
                                <span>{{ child.label }}</span>
                                @if (child.count > 0) {
                                  <span class="inline-flex min-w-5 justify-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                    {{ child.count }}
                                  </span>
                                }
                              </span>
                            </a>
                          </li>
                        }
                      </ul>
                    } @else if (!item.children?.length) {
                      <a [routerLink]="item.route" class="hidden" (click)="selectChild(item)"></a>
                    }
                  </li>
                }
              </ul>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="lg:col-span-10 col-span-12">
          <div class="mx-auto bg-white shadow-sm rounded-2xl border border-slate-100 pt-6 pb-2 text-sm">
            <div class="flex justify-between items-center px-4 mb-4">
              <h1 class="text-lg font-semibold text-slate-900">{{ activeCategory() }}</h1>
              @if (applyBtnSub()) {
                <a
                  [routerLink]="applyBtnSub()!.route"
                  [queryParams]="applyBtnSub()!.queryParams || {}"
                  class="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 hover:-translate-y-0.5"
                >
                  {{ applyBtnSub()!.name }}
                </a>
              }
            </div>
            <hr class="mx-4 border-slate-200" />
            <router-outlet></router-outlet>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RequestCenterComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly leaveService = inject(LeaveService);
  private readonly regularizationService = inject(RegularizationService);
  private readonly expenseService = inject(ExpenseService);
  private readonly router = inject(Router);

  private readonly currentEmployeeId = Number(
    this.authService.getStoredUser()?.employeeId ??
      this.authService.getStoredUser()?.id ??
      0,
  );

  readonly leaveDashboard = signal<LeaveDashboard | null>(null);
  readonly regularizations = signal<RegularizationRequest[]>([]);
  readonly expenses = signal<Expense[]>([]);

  readonly leavePendingCount = computed(
    () =>
      (this.leaveDashboard()?.requests ?? []).filter(
        (item) =>
          item.employeeId === this.currentEmployeeId && item.status === 'pending',
      ).length,
  );

  readonly regularizationPendingCount = computed(
    () =>
      this.regularizations().filter(
        (item) =>
          item.employeeId === this.currentEmployeeId &&
          item.status === 'pending' &&
          item.type !== 'overtime',
      ).length,
  );

  readonly overtimePendingCount = computed(
    () =>
      this.regularizations().filter(
        (item) =>
          item.employeeId === this.currentEmployeeId &&
          item.status === 'pending' &&
          item.type === 'overtime',
      ).length,
  );

  readonly expensePendingCount = computed(
    () =>
      this.expenses().filter(
        (item) =>
          item.employeeId === this.currentEmployeeId && item.status === 'pending',
      ).length,
  );

  readonly totalPending = computed(
    () =>
      this.leavePendingCount() +
      this.regularizationPendingCount() +
      this.expensePendingCount(),
  );

  readonly menuItems = computed<RequestMenuItem[]>(() => [
    {
      label: 'Leave',
      route: '/self-service/requests/leave',
      description: '',
      count: this.leavePendingCount(),
      applyBtn: {
        name: 'Apply Leave',
        route: '/leaves',
        queryParams: { view: 'request' }
      }
    },
    {
      label: 'Attendance',
      route: '/self-service/requests/regularization',
      description: '',
      count: this.regularizationPendingCount() + this.overtimePendingCount(),
      children: [
        {
          label: 'Overtime',
          route: '/self-service/requests/overtime',
          description: '',
          count: this.overtimePendingCount(),
        },
        {
          label: 'Regularization',
          route: '/self-service/requests/regularization',
          description: '',
          count: this.regularizationPendingCount(),
          applyBtn: {
            name: 'Apply Regularization',
            route: '/self-service/attendance'
          }
        },
      ],
    },
    {
      label: 'Expense',
      route: '/self-service/requests/expense',
      description: '',
      count: this.expensePendingCount(),
    },
  ]);

  readonly activeCategory = signal<string>('Request Center');
  readonly expandedItems = signal<Set<string>>(new Set());
  readonly applyBtnSub = signal<{ name: string; route: string; queryParams?: any } | null>(null);

  ngOnInit(): void {
    forkJoin({
      leaveDashboard: this.leaveService
        .getLeaveDashboard()
        .pipe(catchError(() => of(null))),
      regularizations: this.regularizationService
        .getRegularizations()
        .pipe(catchError(() => of([]))),
      expenses: this.expenseService.getExpenses().pipe(catchError(() => of([]))),
    }).subscribe((result) => {
      this.leaveDashboard.set(result.leaveDashboard);
      this.regularizations.set(result.regularizations);
      this.expenses.set(result.expenses);
      this.syncActiveState();
    });

    this.syncActiveState();
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.syncActiveState());
  }

  isRouteActive(route: string): boolean {
    const currentUrl = this.router.url.split('?')[0];
    return currentUrl === route || currentUrl.startsWith(`${route}/`);
  }

  toggleMenu(item: RequestMenuItem) {
    if (!item.children?.length) {
      this.router.navigateByUrl(item.route);
      this.activeCategory.set(item.label);
      this.applyBtnSub.set(item.applyBtn || null);
      return;
    }
    
    this.expandedItems.update(set => {
      const newSet = new Set(set);
      if (newSet.has(item.label)) {
        newSet.delete(item.label);
      } else {
        newSet.add(item.label);
      }
      return newSet;
    });
  }

  selectChild(child: RequestMenuItem) {
    this.activeCategory.set(child.label);
    this.applyBtnSub.set(child.applyBtn || null);
  }

  isExpanded(item: RequestMenuItem): boolean {
    return this.expandedItems().has(item.label) || !!item.children?.some((child) => this.isRouteActive(child.route));
  }

  isDirectActive(item: RequestMenuItem): boolean {
    if (item.children?.length) {
      return this.isExpanded(item);
    }
    return this.isRouteActive(item.route);
  }

  private syncActiveState(): void {
    const activeMenu = this.menuItems().find(
      (item) =>
        this.isDirectActive(item) ||
        item.children?.some((child) => this.isRouteActive(child.route)),
    );

    if (!activeMenu) {
      this.activeCategory.set('Request Center');
      this.applyBtnSub.set(null);
      return;
    }

    if (activeMenu.children?.length) {
      const activeChild = activeMenu.children.find((child) =>
        this.isRouteActive(child.route),
      );
      if (activeChild) {
        this.activeCategory.set(activeChild.label);
        this.applyBtnSub.set(activeChild.applyBtn || null);
        this.expandedItems.update((set) => {
          const next = new Set(set);
          next.add(activeMenu.label);
          return next;
        });
        return;
      }
    }

    this.activeCategory.set(activeMenu.label);
    this.applyBtnSub.set(activeMenu.applyBtn || null);
  }

  itemIcon(label: string): string {
    const icons: Record<string, string> = {
      Leave:
        '<svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 3h8l2 2v12H5z"></path><path d="M7 8h6M7 11h6M7 14h4"></path></svg>',
      Attendance:
        '<svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 3h10v14H5z"></path><path d="M7 7h6M7 10h6M7 13h4"></path></svg>',
      Expense:
        '<svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="14" height="10" rx="2"></rect><path d="M6 10h8"></path></svg>',
    };
    return icons[label] || icons['Leave'];
  }
}
