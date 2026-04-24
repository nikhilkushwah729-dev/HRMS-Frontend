import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { LeaveDashboard, LeaveService } from '../../core/services/leave.service';
import {
  RegularizationRequest,
  RegularizationService,
} from '../../core/services/regularization.service';
import { Expense, ExpenseService } from '../../core/services/expense.service';

@Component({
  selector: 'app-approval-center-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-4 sm:p-5">
      <div class="mb-5">
        <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Overview</p>
        <h2 class="mt-1 text-xl font-black text-slate-900">Approval Center Overview</h2>
        <p class="mt-2 text-sm text-slate-500">Cross-module approval movement in the same left-nav and right-content pattern used by Angular_Web.</p>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        @for (card of cards(); track card.title) {
          <a [routerLink]="card.route" class="rounded-lg border border-slate-200 bg-slate-50/80 p-4 transition hover:border-sky-200 hover:bg-sky-50/60">
            <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{{ card.kicker }}</p>
            <p class="mt-3 text-2xl font-black text-slate-900">{{ card.count }}</p>
            <p class="mt-2 text-sm font-semibold text-slate-900">{{ card.title }}</p>
            <p class="mt-1 text-sm text-slate-500">{{ card.description }}</p>
          </a>
        }
      </div>
    </div>
  `,
})
export class ApprovalCenterOverviewComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly leaveService = inject(LeaveService);
  private readonly regularizationService = inject(RegularizationService);
  private readonly expenseService = inject(ExpenseService);

  private readonly currentEmployeeId = Number(
    this.authService.getStoredUser()?.employeeId ??
      this.authService.getStoredUser()?.id ??
      0,
  );

  readonly leaveDashboard = signal<LeaveDashboard | null>(null);
  readonly regularizations = signal<RegularizationRequest[]>([]);
  readonly expenses = signal<Expense[]>([]);

  readonly cards = computed(() => [
    {
      kicker: 'Leave',
      title: 'Leave Approvals',
      description: 'Leave applications waiting for action.',
      route: '/admin/approvals/leave',
      count: (this.leaveDashboard()?.requests ?? []).filter(
        (item) =>
          item.employeeId !== this.currentEmployeeId && item.status === 'pending',
      ).length,
    },
    {
      kicker: 'Attendance',
      title: 'Regularization Approvals',
      description: 'Attendance correction queue.',
      route: '/admin/approvals/regularization',
      count: this.regularizations().filter(
        (item) =>
          item.employeeId !== this.currentEmployeeId &&
          item.status === 'pending' &&
          item.type !== 'overtime',
      ).length,
    },
    {
      kicker: 'Attendance',
      title: 'Overtime Approvals',
      description: 'Overtime requests pending review.',
      route: '/admin/approvals/overtime',
      count: this.regularizations().filter(
        (item) =>
          item.employeeId !== this.currentEmployeeId &&
          item.status === 'pending' &&
          item.type === 'overtime',
      ).length,
    },
    {
      kicker: 'Expense',
      title: 'Expense Approvals',
      description: 'Claims waiting in finance workflow.',
      route: '/admin/approvals/expense',
      count: this.expenses().filter(
        (item) =>
          item.employeeId !== this.currentEmployeeId && item.status === 'pending',
      ).length,
    },
  ]);

  ngOnInit(): void {
    forkJoin({
      leaveDashboard: this.leaveService.getLeaveDashboard().pipe(catchError(() => of(null))),
      regularizations: this.regularizationService.getRegularizations().pipe(catchError(() => of([]))),
      expenses: this.expenseService.getExpenses().pipe(catchError(() => of([]))),
    }).subscribe((result) => {
      this.leaveDashboard.set(result.leaveDashboard);
      this.regularizations.set(result.regularizations);
      this.expenses.set(result.expenses);
    });
  }
}
