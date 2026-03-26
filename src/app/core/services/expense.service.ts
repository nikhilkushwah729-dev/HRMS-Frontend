import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Expense {
    id: number;
    employeeId: number;
    orgId: number;
    category: string;
    amount: number;
    expenseDate: string;
    description: string | null;
    receiptUrl: string | null;
    status: 'pending' | 'approved' | 'rejected';
    approvedBy: number | null;
    approvedAt: string | null;
    createdAt: string;
    employee?: {
        id: number;
        fullName?: string;
        firstName?: string;
        lastName?: string;
        manager?: {
            id: number;
            fullName?: string;
            firstName?: string;
            lastName?: string;
        };
    };
}

@Injectable({
    providedIn: 'root'
})
export class ExpenseService {
    private http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl;

    private normalizeExpense(raw: any): Expense {
        return {
            id: Number(raw.id),
            employeeId: Number(raw.employeeId ?? raw.employee_id ?? 0),
            orgId: Number(raw.orgId ?? raw.org_id ?? 0),
            category: raw.category,
            amount: Number(raw.amount),
            expenseDate: raw.expenseDate ?? raw.expense_date,
            description: raw.description,
            receiptUrl: raw.receiptUrl ?? raw.receipt_url,
            status: raw.status,
            approvedBy: raw.approvedBy ?? raw.approved_by,
            approvedAt: raw.approvedAt ?? raw.approved_at,
            createdAt: raw.createdAt ?? raw.created_at,
            employee: raw.employee ? {
                id: Number(raw.employee.id),
                fullName: raw.employee.fullName ?? raw.employee.full_name,
                firstName: raw.employee.firstName ?? raw.employee.first_name,
                lastName: raw.employee.lastName ?? raw.employee.last_name,
                manager: raw.employee.manager ? {
                    id: Number(raw.employee.manager.id),
                    fullName: raw.employee.manager.fullName ?? raw.employee.manager.full_name,
                    firstName: raw.employee.manager.firstName ?? raw.employee.manager.first_name,
                    lastName: raw.employee.manager.lastName ?? raw.employee.manager.last_name,
                } : undefined
            } : undefined
        };
    }

    getExpenses(): Observable<Expense[]> {
        return this.http.get<any>(`${this.apiUrl}/expenses`).pipe(
            map(res => (res.data || []).map((e: any) => this.normalizeExpense(e)))
        );
    }

    createExpense(expense: Partial<Expense>): Observable<Expense> {
        return this.http.post<any>(`${this.apiUrl}/expenses`, expense).pipe(
            map(res => this.normalizeExpense(res.data))
        );
    }

    updateExpenseStatus(id: number, status: string, rejectionNote?: string): Observable<Expense> {
        return this.http.put<any>(`${this.apiUrl}/expenses/${id}/status`, { status, rejectionNote }).pipe(
            map(res => this.normalizeExpense(res.data))
        );
    }
}
