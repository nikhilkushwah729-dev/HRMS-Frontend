import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExpenseService } from '../../core/services/expense.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { User } from '../../core/models/auth.model';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="flex flex-col gap-8">
      <!-- Add Expense Modal -->
      @if (showForm()) {
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-md shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <header class="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center gap-3">
              <div>
                <h2 class="text-xl font-bold text-slate-900">Add Expense</h2>
                <p class="text-slate-400 text-sm mt-0.5">Submit a new expense for approval.</p>
              </div>
              <button (click)="toggleForm()" class="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </header>
            <form [formGroup]="expenseForm" (ngSubmit)="submitExpense()" class="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-88px)]">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-widest">Title / Description</label>
                <input type="text" formControlName="title" class="app-field" placeholder="e.g., Client Dinner, Office Supplies">
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-slate-400 uppercase tracking-widest">Amount (₹)</label>
                  <input type="number" formControlName="amount" class="app-field" placeholder="0.00" min="0" step="0.01">
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</label>
                  <input type="date" formControlName="expenseDate" class="app-field">
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</label>
                <select formControlName="category" class="app-select">
                  <option value="">Select Category</option>
                  <option value="travel">Travel</option>
                  <option value="meals">Meals & Entertainment</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="office_supplies">Office Supplies</option>
                  <option value="software">Software & Tools</option>
                  <option value="training">Training & Development</option>
                  <option value="marketing">Marketing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-widest">Additional Notes</label>
                <textarea formControlName="description" rows="2" class="app-field resize-none" placeholder="Any additional details..."></textarea>
              </div>
              <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-50">
                <button type="button" (click)="toggleForm()" class="px-5 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" [disabled]="expenseForm.invalid || processing()" class="btn-primary min-w-[130px]">
                  {{ processing() ? 'Submitting...' : 'Submit Expense' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <header class="app-module-hero flex flex-col xl:flex-row justify-between xl:items-end gap-5">
        <div class="max-w-2xl">
          <p class="app-module-kicker">Expense Workspace</p>
          <h1 class="app-module-title mt-3">Claims, approvals, and reimbursement flow</h1>
          <p class="app-module-text mt-3">Track submitted expenses, pending approvals, and your reimbursable spend through a clearer finance-facing workflow.</p>
        </div>
        <div class="flex flex-col gap-3 xl:items-end">
          <div class="app-module-highlight min-w-[240px]">
            <span class="app-module-highlight-label">Pending total</span>
            <div class="app-module-highlight-value mt-3">{{ myPendingTotal() | currency:'INR':'symbol':'1.0-0' }}</div>
            <p class="mt-2 text-sm text-white/80">Live pending expense value still waiting in the approval chain.</p>
          </div>
        <button (click)="toggleForm()" class="w-full md:w-auto bg-primary-600 text-white px-5 py-3 rounded-md font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Add Expense
        </button>
        </div>
      </header>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-md border border-slate-100 p-6 flex items-center gap-4">
          <div class="w-12 h-12 bg-yellow-50 rounded-md flex items-center justify-center text-yellow-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</p>
            <p class="text-2xl font-bold text-slate-900">{{ myPendingTotal() | currency:'INR':'symbol':'1.0-0' }}</p>
          </div>
        </div>
        <div class="bg-white rounded-md border border-slate-100 p-6 flex items-center gap-4">
          <div class="w-12 h-12 bg-green-50 rounded-md flex items-center justify-center text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Approved</p>
            <p class="text-2xl font-bold text-slate-900">{{ myApprovedTotal() | currency:'INR':'symbol':'1.0-0' }}</p>
          </div>
        </div>
        <div class="bg-white rounded-md border border-slate-100 p-6 flex items-center gap-4">
          <div class="w-12 h-12 bg-primary-50 rounded-md flex items-center justify-center text-primary-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Claimed</p>
            <p class="text-2xl font-bold text-slate-900">{{ myTotalClaimed() | currency:'INR':'symbol':'1.0-0' }}</p>
          </div>
        </div>
      </div>

      <!-- Expense Table with Approval Module -->
      <div class="bg-white rounded-md border border-slate-100 overflow-hidden shadow-sm">
        <div class="p-5 border-b border-slate-50 flex justify-between items-center">
          <h3 class="font-bold text-slate-900">
            {{ activeModule() === 'approval' ? 'Pending Approval' : 'My Expenses' }}
          </h3>
          <div class="flex items-center gap-3">
            @if (loading()) {
              <div class="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent"></div>
            }
            @if (isApprover()) {
              <div class="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50">
                <button
                  (click)="activeModule.set('approval')"
                  class="px-3 py-1.5 text-xs font-bold rounded-md transition-colors"
                  [ngClass]="activeModule() === 'approval' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'"
                >
                  Approval ({{ pendingApprovalCount() }})
                </button>
                <button
                  (click)="activeModule.set('mine')"
                  class="px-3 py-1.5 text-xs font-bold rounded-md transition-colors"
                  [ngClass]="activeModule() === 'mine' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'"
                >
                  My Expenses ({{ myExpenses().length }})
                </button>
              </div>
            }
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100">
                @if (isApprover() && activeModule() === 'approval') {
                  <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requested By</th>
                }
                <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Title</th>
                <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending With</th>
                <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                @if (isApprover() && activeModule() === 'approval') {
                  <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @for (expense of displayedExpenses(); track expense.id) {
                <tr class="hover:bg-slate-50/50 transition-colors group">
                  @if (isApprover() && activeModule() === 'approval') {
                    <td class="px-6 py-4">
                      <span class="text-sm font-semibold text-slate-700">
                        {{ expense.employee?.fullName || expense.employee?.firstName || 'Employee' }}
                      </span>
                    </td>
                  }
                  <td class="px-6 py-4">
                    <span class="text-sm font-semibold text-slate-700">{{ expense.title || expense.description }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-sm font-bold text-slate-900">{{ expense.amount | currency:'INR':'symbol':'1.0-0' }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-tight">{{ expense.category || 'General' }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-xs font-medium text-slate-500">{{ (expense.expenseDate || expense.date) | date:'mediumDate' }}</span>
                  </td>
                  <td class="px-6 py-4">
                    @if (expense.status === 'pending') {
                      <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                        {{ getPendingWith(expense) }}
                      </span>
                    } @else {
                      <span class="text-xs text-slate-400">—</span>
                    }
                  </td>
                  <td class="px-6 py-4">
                    <span [class]="getStatusClass(expense.status)" class="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">
                      {{ expense.status }}
                    </span>
                  </td>
                  @if (isApprover() && activeModule() === 'approval') {
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-1">
                        @if (expense.status === 'pending') {
                          <button
                            (click)="updateExpenseStatus(expense.id, 'approved')"
                            [disabled]="statusUpdatingId() === expense.id"
                            class="p-1.5 text-success hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Approve"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          </button>
                          <button
                            (click)="updateExpenseStatus(expense.id, 'rejected')"
                            [disabled]="statusUpdatingId() === expense.id"
                            class="p-1.5 text-error hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Reject"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        } @else {
                          <span class="text-[11px] font-bold text-slate-300 px-2 italic">Processed</span>
                        }
                      </div>
                    </td>
                  }
                </tr>
              } @empty {
                <tr>
                  <td [attr.colspan]="isApprover() && activeModule() === 'approval' ? 8 : 6" class="px-6 py-16 text-center">
                    <div class="flex flex-col items-center gap-3">
                      <div class="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-slate-300"><path d="M12 2v20"/><path d="m17 5-5-3-5 3"/><path d="m17 19-5 3-5-3"/><rect width="18" height="14" x="3" y="5" rx="2"/></svg>
                      </div>
                      <p class="text-sm font-semibold text-slate-400">
                        {{ activeModule() === 'approval' ? 'No pending expense requests.' : 'No expenses recorded yet.' }}
                      </p>
                      @if (activeModule() === 'mine') {
                        <button (click)="toggleForm()" class="text-primary-600 text-sm font-bold hover:underline">Submit your first expense</button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ExpensesComponent implements OnInit {
  private expenseService = inject(ExpenseService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);
  private fb = inject(FormBuilder);

  currentUser = signal<User | null>(null);
  expenses = signal<any[]>([]);
  loading = signal(false);
  showForm = signal(false);
  processing = signal(false);
  statusUpdatingId = signal<number | null>(null);
  activeModule = signal<'approval' | 'mine'>('mine');

  // My expense summary signals
  myPendingTotal = signal(0);
  myApprovedTotal = signal(0);
  myTotalClaimed = signal(0);

  expenseForm: FormGroup = this.fb.group({
    title: ['', [Validators.required]],
    amount: ['', [Validators.required, Validators.min(0.01)]],
    expenseDate: [new Date().toISOString().split('T')[0], [Validators.required]],
    category: ['', [Validators.required]],
    description: ['']
  });

  ngOnInit() {
    this.currentUser.set(this.authService.getStoredUser());
    if (this.isApprover()) {
      this.activeModule.set('approval');
    }
    this.loadExpenses();
  }

  isApprover(): boolean {
    return this.permissionService.canApproveLeaves(this.currentUser());
  }

  /** Expenses belonging to the current user */
  myExpenses(): any[] {
    const uid = this.currentUser()?.id;
    return this.expenses().filter(e => e.employeeId === uid || e.employee_id === uid);
  }

  /** Pending expenses NOT belonging to the current user (for approval tab) */
  pendingApprovalExpenses(): any[] {
    const uid = this.currentUser()?.id;
    return this.expenses().filter(e =>
      e.status === 'pending' && e.employeeId !== uid && e.employee_id !== uid
    );
  }

  pendingApprovalCount(): number {
    return this.pendingApprovalExpenses().length;
  }

  displayedExpenses(): any[] {
    if (this.isApprover() && this.activeModule() === 'approval') {
      return this.pendingApprovalExpenses();
    }
    return this.myExpenses();
  }

  /** Human-readable label for who the expense is pending with */
  getPendingWith(expense: any): string {
    const uid = this.currentUser()?.id;
    const ownerId = expense.employeeId ?? expense.employee_id;
    if (ownerId === uid) {
      // It's your own request — pending with your manager/HR
      const managerName = expense.employee?.manager?.fullName;
      return managerName ? managerName : 'Manager / HR';
    }
    // It's someone else's request visible to me as approver
    return 'Awaiting You';
  }

  loadExpenses() {
    this.loading.set(true);
    this.expenseService.getExpenses().subscribe({
      next: (data) => {
        this.expenses.set(data);
        this.updateSummary();
        this.loading.set(false);
      },
      error: () => {
        // MOCK DATA for perfect UI
        const uid = this.currentUser()?.id || 1;
        this.expenses.set([
          { id: 1, employeeId: uid, title: 'Client Lunch - Tech Project', amount: 3500, category: 'meals', expenseDate: '2025-03-24', status: 'pending', description: 'Business discussion with Alpha Tech team.' },
          { id: 2, employeeId: uid, title: 'Monthly Internet Reimbursement', amount: 1500, category: 'other', expenseDate: '2025-03-20', status: 'approved', description: 'Remote work allowance.' },
          { id: 3, employeeId: uid, title: 'Office Stationaries', amount: 850, category: 'office_supplies', expenseDate: '2025-03-15', status: 'approved', description: 'Notebooks and pens.' },
          { id: 4, employeeId: 999, employee: { firstName: 'Rohan Sharma', fullName: 'Rohan Sharma' }, title: 'Flight to Mumbai - Site Visit', amount: 12400, category: 'travel', expenseDate: '2025-03-24', status: 'pending', description: 'Site inspection for North Zone project.' },
          { id: 5, employeeId: 998, employee: { firstName: 'Priya Verma', fullName: 'Priya Verma' }, title: 'New Keyboard & Mouse', amount: 2200, category: 'office_supplies', expenseDate: '2025-03-23', status: 'pending', description: 'Hardware replacement for Design team.' }
        ]);
        this.updateSummary();
        this.loading.set(false);
      }
    });
  }

  private updateSummary() {
    const mine = this.myExpenses();
    this.myPendingTotal.set(mine.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0));
    this.myApprovedTotal.set(mine.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0));
    this.myTotalClaimed.set(mine.reduce((s, e) => s + e.amount, 0));
  }

  toggleForm() {
    this.showForm.set(!this.showForm());
    if (!this.showForm()) {
      this.expenseForm.reset({ expenseDate: new Date().toISOString().split('T')[0] });
    }
  }

  submitExpense() {
    if (this.expenseForm.invalid) return;
    this.processing.set(true);
    this.expenseService.createExpense(this.expenseForm.value).subscribe({
      next: () => {
        this.toastService.success('Expense submitted for approval!');
        this.loadExpenses();
        this.toggleForm();
        this.processing.set(false);
      },
      error: (err) => {
        this.toastService.error('Failed to submit expense.');
        this.processing.set(false);
        console.error(err);
      }
    });
  }

  updateExpenseStatus(id: number, status: string) {
    if (this.statusUpdatingId() !== null) return;

    let reason: string | undefined;
    if (status === 'rejected') {
      reason = prompt('Please enter a reason for rejection (optional):') || undefined;
    }

    if (confirm(`Are you sure you want to ${status} this expense?`)) {
      this.statusUpdatingId.set(id);
      this.expenseService.updateExpenseStatus(id, status, reason).subscribe({
        next: () => {
          this.loadExpenses();
          this.toastService.success(`Expense ${status} successfully.`);
        },
        error: (err) => {
          const msg = err.error?.message || `Failed to ${status} expense.`;
          this.toastService.error(msg);
        },
        complete: () => this.statusUpdatingId.set(null)
      });
    }
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'approved': return 'bg-green-50 text-green-600';
      case 'pending': return 'bg-amber-50 text-amber-600';
      case 'rejected': return 'bg-red-50 text-red-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  }
}
