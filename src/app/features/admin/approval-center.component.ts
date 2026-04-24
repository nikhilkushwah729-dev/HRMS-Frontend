import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { LeaveDashboard, LeaveService, LeaveRequest } from '../../core/services/leave.service';
import {
  RegularizationRequest,
  RegularizationService,
} from '../../core/services/regularization.service';
import { Expense, ExpenseService } from '../../core/services/expense.service';
import { PermissionService } from '../../core/services/permission.service';

type ApprovalMenuItem = {
  label: string;
  route: string;
  count: number;
  children?: ApprovalMenuItem[];
};

@Component({
  selector: 'app-approval-center',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  template: `
    <div class="mx-auto px-4 py-4">
      <div class="grid grid-cols-12 gap-4">
        <!-- Header -->
        <div class="col-span-12 sticky top-0 z-20 shadow-sm p-4 rounded-lg bg-white">
          <div>
            <div class="text-2xl max-sm:text-lg font-semibold text-slate-900">
              Approval Center
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-2 col-span-12">
          <div class="mx-auto shadow-sm rounded-lg p-4 text-sm bg-white">
            <h1 class="text-lg font-semibold mb-4 text-slate-900">Approval Category</h1>
            <hr class="border-slate-200" />
            <div class="mt-4">
              <ul class="flex flex-col lg:space-y-1 lg:h-[605px] overflow-y-auto overflow-x-hidden hidescrollbar">
                @for (item of menuItems(); track item.label) {
                  <li class="w-full">
                    <button
                      type="button"
                      class="flex items-center justify-between p-2 w-full max-lg:whitespace-nowrap text-left rounded-md font-normal hover:bg-slate-50 text-sm lg:text-base transition"
                      (click)="toggleMenu(item)"
                    >
                      <span class="flex items-center text-sm text-slate-700 gap-3">
                        <span class="text-slate-500" [innerHTML]="itemIcon(item.label)"></span>
                        <span>{{ item.label }}</span>
                      </span>

                      <span class="flex justify-end ml-2 items-center gap-2">
                        @if (item.count > 0 && !isExpanded(item)) {
                          <span class="relative flex h-1.5 w-1.5">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-800 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                          </span>
                        }

                        @if (item.children?.length) {
                          <svg class="h-5 w-5 text-slate-400 transition-transform duration-300" 
                               [class.rotate-90]="isExpanded(item)" 
                               viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7.41 8.58L12 13.17l4.59-4.59L18 10l-6 6-6-6z" />
                          </svg>
                        }
                      </span>
                    </button>

                    @if (item.children?.length && isExpanded(item)) {
                      <ul class="pl-4 lg:flex-col lg:space-y-1 space-y-0 max-lg:flex max-lg:flex-row max-lg:space-x-2 text-sm overflow-y-auto lg:max-h-[200px] max-h-[300px] lg:w-full w-auto lg:overflow-x-hidden overflow-x-auto text-slate-700 hidescrollbar">
                        @for (child of item.children; track child.route) {
                          <li class="lg:w-full w-auto">
                            <a
                              [routerLink]="child.route"
                              class="block p-2 w-full max-lg:w-auto text-left rounded-md font-normal hover:bg-slate-50 text-sm lg:text-base transition flex items-center justify-between gap-2"
                              [class.bg-emerald-50]="isRouteActive(child.route)"
                              [class.text-emerald-700]="isRouteActive(child.route)"
                              [class.font-semibold]="isRouteActive(child.route)"
                              (click)="activeCategory.set(child.label)"
                            >
                              <span>{{ child.label }}</span>
                              @if (child.count > 0) {
                                <span class="relative flex h-1.5 w-1.5">
                                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-800 opacity-75"></span>
                                  <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                                </span>
                              }
                            </a>
                          </li>
                        }
                      </ul>
                    } @else if (!item.children?.length) {
                      <a [routerLink]="item.route" class="hidden" (click)="activeCategory.set(item.label)"></a>
                    }
                  </li>
                }
              </ul>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="lg:col-span-10 col-span-12">
          <div class="mx-auto bg-white shadow-sm rounded-lg pt-4 text-sm">
            <div class="flex justify-between items-center px-4 mb-4">
              <h1 class="text-lg font-semibold text-slate-900">{{ activeCategory() }}</h1>
            </div>
            <hr class="mx-4 border-slate-200" />
            <router-outlet></router-outlet>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ApprovalCenterComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly permissionService = inject(PermissionService);
  private readonly leaveService = inject(LeaveService);
  private readonly regularizationService = inject(RegularizationService);
  private readonly expenseService = inject(ExpenseService);
  private readonly router = inject(Router);
  private readonly currentUser = this.authService.getStoredUser();

  private readonly currentEmployeeId = Number(
    this.currentUser?.employeeId ?? this.currentUser?.id ?? 0,
  );

  readonly leaveDashboard = signal<LeaveDashboard | null>(null);
  readonly regularizations = signal<RegularizationRequest[]>([]);
  readonly expenses = signal<Expense[]>([]);

  readonly pendingLeaveRequests = computed(() =>
    (this.leaveDashboard()?.requests ?? []).filter(
      (item) =>
        item.employeeId !== this.currentEmployeeId && item.status === 'pending',
    ),
  );

  readonly leaveApprovalCount = computed(
    () =>
      this.pendingLeaveRequests().filter(
        (item) =>
          !this.matchesLeaveSubtype(item, 'short-day') &&
          !this.matchesLeaveSubtype(item, 'time-off'),
      ).length,
  );

  readonly shortDayApprovalCount = computed(
    () =>
      this.pendingLeaveRequests().filter((item) =>
        this.matchesLeaveSubtype(item, 'short-day'),
      ).length,
  );

  readonly timeOffApprovalCount = computed(
    () =>
      this.pendingLeaveRequests().filter((item) =>
        this.matchesLeaveSubtype(item, 'time-off'),
      ).length,
  );

  readonly regularizationApprovalCount = computed(
    () =>
      this.regularizations().filter(
        (item) =>
          item.employeeId !== this.currentEmployeeId &&
          item.status === 'pending' &&
          item.type !== 'overtime',
      ).length,
  );

  readonly overtimeApprovalCount = computed(
    () =>
      this.regularizations().filter(
        (item) =>
          item.employeeId !== this.currentEmployeeId &&
          item.status === 'pending' &&
          item.type === 'overtime',
      ).length,
  );

  readonly expenseApprovalCount = computed(
    () =>
      this.expenses().filter(
        (item) =>
          item.employeeId !== this.currentEmployeeId && item.status === 'pending',
      ).length,
  );

  readonly visiblePending = computed(
    () =>
      this.leaveApprovalCount() +
      this.shortDayApprovalCount() +
      this.timeOffApprovalCount() +
      this.regularizationApprovalCount() +
      this.overtimeApprovalCount() +
      this.expenseApprovalCount(),
  );

  readonly menuItems = computed<ApprovalMenuItem[]>(() => {
    const groups: ApprovalMenuItem[] = [
      {
        label: 'Leave',
        route: '/admin/approvals/leave',
        count:
          this.leaveApprovalCount() +
          this.shortDayApprovalCount() +
          this.timeOffApprovalCount(),
        children: [
          {
            label: 'Leave',
            route: '/admin/approvals/leave',
            count: this.leaveApprovalCount(),
          },
          {
            label: 'Short Day Leave',
            route: '/admin/approvals/short-day',
            count: this.shortDayApprovalCount(),
          },
          {
            label: 'Time Off',
            route: '/admin/approvals/time-off',
            count: this.timeOffApprovalCount(),
          },
        ].filter((item) => this.canSeeLeaveChild(item.label)),
      },
      {
        label: 'Attendance',
        route: '/admin/approvals/regularization',
        count: this.regularizationApprovalCount() + this.overtimeApprovalCount(),
        children: [
          {
            label: 'Regularization',
            route: '/admin/approvals/regularization',
            count: this.regularizationApprovalCount(),
          },
          {
            label: 'Overtime',
            route: '/admin/approvals/overtime',
            count: this.overtimeApprovalCount(),
          },
          {
            label: 'Shift Request',
            route: '/admin/approvals/shift-request',
            count: 0,
          },
          {
            label: 'Remote Work',
            route: '/admin/approvals/remote-work',
            count: 0,
          },
          {
            label: 'Flexi Holiday',
            route: '/admin/approvals/flexi-holiday',
            count: 0,
          },
          {
            label: 'Weekly Off',
            route: '/admin/approvals/weekly-off',
            count: 0,
          },
        ].filter((item) => this.canSeeAttendanceChild(item.label)),
      },
      {
        label: 'Payroll',
        route: '/admin/approvals/expense',
        count: this.expenseApprovalCount(),
        children: [
          {
            label: 'Expense Claims',
            route: '/admin/approvals/expense',
            count: this.expenseApprovalCount(),
          },
        ].filter(() =>
          this.hasAnyPermission('expenses.view', 'payroll.view', 'payroll.approve'),
        ),
      },
      {
        label: 'Organizations',
        route: '/admin/approvals/documents',
        count: 0,
        children: [
          {
            label: 'Documents',
            route: '/admin/approvals/documents',
            count: 0,
          },
          {
            label: 'Resignation',
            route: '/admin/approvals/resignation',
            count: 0,
          },
        ].filter((item) =>
          item.label === 'Documents'
            ? this.hasAnyPermission('documents.view')
            : this.hasAnyPermission('employees.view', 'employee.read'),
        ),
      },
    ];

    return groups.filter((group) => (group.children?.length ?? 0) > 0);
  });

  readonly activeCategory = signal<string>('Approval Center');
  readonly expandedItems = signal<Set<string>>(new Set());

  ngOnInit(): void {
    if (!this.permissionService.isManagerialUser(this.currentUser)) {
      return;
    }

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

  toggleMenu(item: ApprovalMenuItem) {
    if (!item.children?.length) {
      this.router.navigateByUrl(item.route);
      this.activeCategory.set(item.label);
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

  isExpanded(item: ApprovalMenuItem): boolean {
    return this.expandedItems().has(item.label) || !!item.children?.some((child) => this.isRouteActive(child.route));
  }

  isDirectActive(item: ApprovalMenuItem): boolean {
    if (item.children?.length) {
      return this.isExpanded(item);
    }
    return this.isRouteActive(item.route);
  }

  itemIcon(label: string): string {
    const icons: Record<string, string> = {
      Leave:
        '<svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 3h8l2 2v12H5z"></path><path d="M7 8h6M7 11h6M7 14h4"></path></svg>',
      Attendance:
        '<svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 3h10v14H5z"></path><path d="M7 7h6M7 10h6M7 13h4"></path></svg>',
      Payroll:
        '<svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="14" height="10" rx="2"></rect><path d="M6 10h8"></path></svg>',
      Organizations:
        '<svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 17V3h8v14"></path><path d="M12 7h4v10"></path><path d="M7 7h2M7 10h2M7 13h2"></path></svg>',
    };
    return icons[label] || icons['Leave'];
  }

  private hasAnyPermission(...permissions: string[]): boolean {
    return permissions.some((permission) =>
      this.permissionService.hasPermission(this.currentUser, permission),
    );
  }

  private canSeeLeaveChild(label: string): boolean {
    if (label === 'Short Day Leave') {
      return this.hasAnyPermission(
        'leave.shortDay.view',
        'leave.approve',
        'leaves.approve',
      );
    }
    if (label === 'Time Off') {
      return this.hasAnyPermission(
        'leave.timeOff.view',
        'leave.approve',
        'leaves.approve',
      );
    }
    return this.hasAnyPermission('leave.approve', 'leaves.approve');
  }

  private canSeeAttendanceChild(label: string): boolean {
    if (label === 'Regularization' || label === 'Overtime') {
      return this.hasAnyPermission(
        'regularization.view',
        'attendance.regularization.view',
      );
    }
    if (label === 'Shift Request') {
      return Number((this.currentUser as any)?.shiftChangePerm ?? 0) === 1;
    }
    if (label === 'Remote Work') {
      return this.hasAnyPermission('wfh.approve');
    }
    return this.hasAnyPermission('leave.approve', 'leaves.approve', 'leave.view');
  }

  private matchesLeaveSubtype(
    item: LeaveRequest,
    subtype: 'short-day' | 'time-off',
  ): boolean {
    const label = String(item.leaveType?.typeName || '')
      .trim()
      .toLowerCase();

    if (subtype === 'short-day') {
      return label.includes('short day') || label.includes('short-day');
    }

    return (
      label.includes('time off') ||
      label.includes('time-off') ||
      label.includes('timeoff')
    );
  }

  private syncActiveState(): void {
    const activeMenu = this.menuItems().find(
      (item) =>
        this.isDirectActive(item) ||
        item.children?.some((child) => this.isRouteActive(child.route)),
    );

    if (!activeMenu) {
      this.activeCategory.set('Approval Center');
      return;
    }

    if (activeMenu.children?.length) {
      const activeChild = activeMenu.children.find((child) =>
        this.isRouteActive(child.route),
      );
      if (activeChild) {
        this.activeCategory.set(activeChild.label);
        this.expandedItems.update((set) => {
          const next = new Set(set);
          next.add(activeMenu.label);
          return next;
        });
        return;
      }
    }

    this.activeCategory.set(activeMenu.label);
  }
}
