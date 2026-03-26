import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Payslip {
    id: number;
    month: string;
    year: number;
    basic_salary: number;
    allowances: number;
    deductions: number;
    net_salary: number;
    status: 'published' | 'pending' | 'on_hold';
}

@Injectable({
    providedIn: 'root'
})
export class PayrollService {
    private http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl;

    getPayslips(): Observable<Payslip[]> {
        return this.http.get<any>(`${this.apiUrl}/payroll`).pipe(
            map(res => res.data)
        );
    }

    generatePayslip(data: any): Observable<Payslip> {
        return this.http.post<any>(`${this.apiUrl}/payroll`, data).pipe(
            map(res => res.data)
        );
    }
}
