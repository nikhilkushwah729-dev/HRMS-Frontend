import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EmployeeService } from './employee.service';
import { User } from '../models/auth.model';

export interface Payslip {
  id: number;
  employee_id?: number;
  employee_name?: string;
  month: string;
  year: number;
  basic_salary: number;
  hra?: number;
  allowances: number;
  bonus?: number;
  overtime?: number;
  reimbursements?: number;
  deductions: number;
  pf?: number;
  esi?: number;
  professional_tax?: number;
  tds?: number;
  lop?: number;
  other_deductions?: number;
  gross_salary?: number;
  net_salary: number;
  ytd_earnings?: number;
  ytd_deductions?: number;
  tax_summary?: number;
  reimbursement_status?: 'pending' | 'approved' | 'paid' | 'rejected';
  status: 'published' | 'pending' | 'on_hold' | 'processed' | 'locked';
  pdf_url?: string | null;
  generated_at?: string | null;
}

export interface SalaryComponentItem {
  name: string;
  type: 'basic' | 'hra' | 'allowance' | 'bonus' | 'incentive' | 'deduction';
  mode: 'fixed' | 'percentage';
  value: number;
  taxable?: boolean;
}

export interface SalaryStructure {
  id: number;
  employeeId: number;
  employeeName: string;
  department?: string;
  designation?: string;
  basicSalary: number;
  hraType: 'fixed' | 'percentage';
  hraValue: number;
  allowances: SalaryComponentItem[];
  deductions: SalaryComponentItem[];
  ctc: number;
  monthlyGross: number;
  estimatedNet: number;
  pfEnabled: boolean;
  esiEnabled: boolean;
  professionalTaxEnabled: boolean;
  tdsEnabled: boolean;
  overtimeEnabled: boolean;
  policyName?: string;
  updatedAt: string;
}

export interface PayrollRunEmployee {
  employeeId: number;
  employeeName: string;
  department?: string;
  attendanceDays: number;
  absentDays: number;
  halfDays: number;
  unpaidLeaveDays: number;
  lopDays: number;
  overtimeHours: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  status: 'processed' | 'pending' | 'locked';
}

export interface PayrollRun {
  id: number;
  month: string;
  year: number;
  cycleLabel: string;
  department?: string;
  employeeCount: number;
  processedCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  locked: boolean;
  status: 'pending' | 'processed' | 'locked';
  createdAt: string;
  processedAt?: string | null;
  comment?: string | null;
  items: PayrollRunEmployee[];
}

export interface PayrollDashboard {
  month: string;
  year: number;
  payslips: Payslip[];
  latestPayslip: Payslip | null;
  ytdEarnings: number;
  ytdDeductions: number;
  taxSummary: number;
  reimbursementStatus: {
    pending: number;
    approved: number;
    paid: number;
  };
}

export interface PayrollProcessPayload {
  month: string;
  year: number;
  departmentId?: number | null;
  employeeIds?: number[];
  includeAttendance?: boolean;
  includeLeave?: boolean;
  includeOvertime?: boolean;
  includeBonus?: boolean;
  comment?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PayrollService {
  private http = inject(HttpClient);
  private employeeService = inject(EmployeeService);
  private readonly apiUrl = environment.apiUrl;
  private readonly structureKey = 'hrms_payroll_structures_v1';
  private readonly runsKey = 'hrms_payroll_runs_v1';

  private normalizePayslip(raw: any): Payslip {
    return {
      id: Number(raw?.id ?? Date.now()),
      employee_id: Number(raw?.employee_id ?? raw?.employeeId ?? 0) || undefined,
      employee_name: raw?.employee_name ?? raw?.employeeName ?? raw?.employee?.fullName ?? raw?.employee?.name,
      month: String(raw?.month ?? ''),
      year: Number(raw?.year ?? new Date().getFullYear()),
      basic_salary: Number(raw?.basic_salary ?? raw?.basicSalary ?? 0),
      hra: Number(raw?.hra ?? 0),
      allowances: Number(raw?.allowances ?? 0),
      bonus: Number(raw?.bonus ?? 0),
      overtime: Number(raw?.overtime ?? 0),
      reimbursements: Number(raw?.reimbursements ?? 0),
      deductions: Number(raw?.deductions ?? 0),
      pf: Number(raw?.pf ?? 0),
      esi: Number(raw?.esi ?? 0),
      professional_tax: Number(raw?.professional_tax ?? raw?.professionalTax ?? 0),
      tds: Number(raw?.tds ?? 0),
      lop: Number(raw?.lop ?? 0),
      other_deductions: Number(raw?.other_deductions ?? raw?.otherDeductions ?? 0),
      gross_salary: Number(raw?.gross_salary ?? raw?.grossSalary ?? 0),
      net_salary: Number(raw?.net_salary ?? raw?.netSalary ?? 0),
      ytd_earnings: Number(raw?.ytd_earnings ?? raw?.ytdEarnings ?? 0),
      ytd_deductions: Number(raw?.ytd_deductions ?? raw?.ytdDeductions ?? 0),
      tax_summary: Number(raw?.tax_summary ?? raw?.taxSummary ?? 0),
      reimbursement_status: raw?.reimbursement_status ?? raw?.reimbursementStatus ?? 'pending',
      status: raw?.status ?? 'published',
      pdf_url: raw?.pdf_url ?? raw?.pdfUrl ?? null,
      generated_at: raw?.generated_at ?? raw?.generatedAt ?? null,
    };
  }

  private normalizeStructure(raw: any): SalaryStructure {
    return {
      id: Number(raw?.id ?? Date.now()),
      employeeId: Number(raw?.employeeId ?? raw?.employee_id ?? 0),
      employeeName: String(raw?.employeeName ?? raw?.employee_name ?? 'Employee'),
      department: raw?.department,
      designation: raw?.designation,
      basicSalary: Number(raw?.basicSalary ?? raw?.basic_salary ?? 0),
      hraType: raw?.hraType ?? raw?.hra_type ?? 'percentage',
      hraValue: Number(raw?.hraValue ?? raw?.hra_value ?? 40),
      allowances: Array.isArray(raw?.allowances) ? raw.allowances : [],
      deductions: Array.isArray(raw?.deductions) ? raw.deductions : [],
      ctc: Number(raw?.ctc ?? 0),
      monthlyGross: Number(raw?.monthlyGross ?? raw?.monthly_gross ?? 0),
      estimatedNet: Number(raw?.estimatedNet ?? raw?.estimated_net ?? 0),
      pfEnabled: Boolean(raw?.pfEnabled ?? raw?.pf_enabled ?? true),
      esiEnabled: Boolean(raw?.esiEnabled ?? raw?.esi_enabled ?? false),
      professionalTaxEnabled: Boolean(raw?.professionalTaxEnabled ?? raw?.professional_tax_enabled ?? true),
      tdsEnabled: Boolean(raw?.tdsEnabled ?? raw?.tds_enabled ?? true),
      overtimeEnabled: Boolean(raw?.overtimeEnabled ?? raw?.overtime_enabled ?? false),
      policyName: raw?.policyName ?? raw?.policy_name ?? 'Standard Payroll Policy',
      updatedAt: raw?.updatedAt ?? raw?.updated_at ?? new Date().toISOString(),
    };
  }

  private normalizeRun(raw: any): PayrollRun {
    return {
      id: Number(raw?.id ?? Date.now()),
      month: String(raw?.month ?? ''),
      year: Number(raw?.year ?? new Date().getFullYear()),
      cycleLabel: raw?.cycleLabel ?? raw?.cycle_label ?? `${raw?.month ?? ''} ${raw?.year ?? ''}`.trim(),
      department: raw?.department,
      employeeCount: Number(raw?.employeeCount ?? raw?.employee_count ?? 0),
      processedCount: Number(raw?.processedCount ?? raw?.processed_count ?? 0),
      totalGross: Number(raw?.totalGross ?? raw?.total_gross ?? 0),
      totalDeductions: Number(raw?.totalDeductions ?? raw?.total_deductions ?? 0),
      totalNet: Number(raw?.totalNet ?? raw?.total_net ?? 0),
      locked: Boolean(raw?.locked ?? false),
      status: raw?.status ?? (raw?.locked ? 'locked' : 'processed'),
      createdAt: raw?.createdAt ?? raw?.created_at ?? new Date().toISOString(),
      processedAt: raw?.processedAt ?? raw?.processed_at ?? null,
      comment: raw?.comment ?? null,
      items: Array.isArray(raw?.items) ? raw.items : [],
    };
  }

  private readStorage<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private writeStorage<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  getPayslips(): Observable<Payslip[]> {
    return this.http.get<any>(`${this.apiUrl}/payroll`).pipe(
      map((res) => (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []).map((item: any) => this.normalizePayslip(item))),
      catchError(() => of(this.readStorage<Payslip[]>('hrms_payroll_payslips_v1', []))),
    );
  }

  getMyPayrollDashboard(): Observable<PayrollDashboard> {
    return this.getPayslips().pipe(
      map((payslips) => {
        const latestPayslip = payslips[0] ?? null;
        return {
          month: latestPayslip?.month ?? '',
          year: latestPayslip?.year ?? new Date().getFullYear(),
          payslips,
          latestPayslip,
          ytdEarnings: payslips.reduce((sum, item) => sum + Number(item.ytd_earnings ?? item.net_salary ?? 0), 0),
          ytdDeductions: payslips.reduce((sum, item) => sum + Number(item.ytd_deductions ?? item.deductions ?? 0), 0),
          taxSummary: payslips.reduce((sum, item) => sum + Number(item.tax_summary ?? item.tds ?? 0), 0),
          reimbursementStatus: {
            pending: payslips.filter((item) => item.reimbursement_status === 'pending').length,
            approved: payslips.filter((item) => item.reimbursement_status === 'approved').length,
            paid: payslips.filter((item) => item.reimbursement_status === 'paid').length,
          },
        };
      }),
    );
  }

  getPayslipByPeriod(period: string): Observable<Payslip | null> {
    return this.getPayslips().pipe(
      map((items) => items.find((item) => `${item.year}-${String(item.month).padStart(2, '0')}` === period || `${item.month}-${item.year}` === period) ?? null),
    );
  }

  downloadPayslipPdf(payslip: Payslip): Observable<string | null> {
    if (payslip.pdf_url) return of(payslip.pdf_url);
    return this.http.get<any>(`${this.apiUrl}/payroll/${payslip.id}/pdf`).pipe(
      map((res) => res?.data?.url ?? res?.url ?? null),
      catchError(() => of(null)),
    );
  }

  getSalaryStructures(): Observable<SalaryStructure[]> {
    return this.http.get<any>(`${this.apiUrl}/payroll/structures`).pipe(
      map((res) => (Array.isArray(res?.data) ? res.data : []).map((item: any) => this.normalizeStructure(item))),
      catchError(() => of(this.readStorage<SalaryStructure[]>(this.structureKey, []))),
    );
  }

  saveSalaryStructure(payload: SalaryStructure): Observable<SalaryStructure> {
    return this.http.post<any>(`${this.apiUrl}/payroll/structures`, payload).pipe(
      map((res) => this.normalizeStructure(res?.data ?? res)),
      catchError(() => {
        const current = this.readStorage<SalaryStructure[]>(this.structureKey, []);
        const normalized = this.normalizeStructure(payload);
        const next = [normalized, ...current.filter((item) => item.employeeId !== normalized.employeeId)];
        this.writeStorage(this.structureKey, next);
        return of(normalized);
      }),
    );
  }

  getPayrollRuns(): Observable<PayrollRun[]> {
    return this.http.get<any>(`${this.apiUrl}/payroll/runs`).pipe(
      map((res) => (Array.isArray(res?.data) ? res.data : []).map((item: any) => this.normalizeRun(item))),
      catchError(() => of(this.readStorage<PayrollRun[]>(this.runsKey, []))),
    );
  }

  processPayroll(payload: PayrollProcessPayload): Observable<PayrollRun> {
    return this.http.post<any>(`${this.apiUrl}/payroll/process`, payload).pipe(
      map((res) => this.normalizeRun(res?.data ?? res)),
      catchError(() =>
        this.employeeService.getEmployees().pipe(
          map((employees) => {
            const selectedEmployees = payload.employeeIds?.length
              ? employees.filter((employee) => payload.employeeIds?.includes(Number(employee.id)))
              : employees;
            const items: PayrollRunEmployee[] = selectedEmployees.map((employee) => ({
              employeeId: Number(employee.id ?? employee.employeeId ?? 0),
              employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.email,
              department: employee.department?.name,
              attendanceDays: 0,
              absentDays: 0,
              halfDays: 0,
              unpaidLeaveDays: 0,
              lopDays: 0,
              overtimeHours: 0,
              grossSalary: Number(employee.salary ?? 0),
              totalDeductions: 0,
              netSalary: Number(employee.salary ?? 0),
              status: 'processed',
            }));
            const run = this.normalizeRun({
              id: Date.now(),
              month: payload.month,
              year: payload.year,
              cycleLabel: `${payload.month} ${payload.year}`,
              employeeCount: items.length,
              processedCount: items.length,
              totalGross: items.reduce((sum, item) => sum + item.grossSalary, 0),
              totalDeductions: items.reduce((sum, item) => sum + item.totalDeductions, 0),
              totalNet: items.reduce((sum, item) => sum + item.netSalary, 0),
              locked: false,
              status: 'processed',
              comment: payload.comment ?? 'Frontend fallback run',
              processedAt: new Date().toISOString(),
              items,
            });
            const current = this.readStorage<PayrollRun[]>(this.runsKey, []);
            this.writeStorage(this.runsKey, [run, ...current]);
            return run;
          }),
        ),
      ),
    );
  }

  lockPayroll(runId: number): Observable<PayrollRun | null> {
    return this.http.post<any>(`${this.apiUrl}/payroll/runs/${runId}/lock`, {}).pipe(
      map((res) => this.normalizeRun(res?.data ?? res)),
      catchError(() => {
        const current = this.readStorage<PayrollRun[]>(this.runsKey, []);
        const next = current.map((run) =>
          run.id === runId ? { ...run, locked: true, status: 'locked' as const } : run,
        );
        this.writeStorage(this.runsKey, next);
        return of(next.find((run) => run.id === runId) ?? null);
      }),
    );
  }

  rerunPayroll(runId: number): Observable<PayrollRun | null> {
    return this.http.post<any>(`${this.apiUrl}/payroll/runs/${runId}/rerun`, {}).pipe(
      map((res) => this.normalizeRun(res?.data ?? res)),
      catchError(() => {
        const current = this.readStorage<PayrollRun[]>(this.runsKey, []);
        const target = current.find((run) => run.id === runId);
        if (!target || target.locked) return of(null);
        const rerun = {
          ...target,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          processedAt: new Date().toISOString(),
          comment: 'Rerun generated from previous cycle',
        };
        this.writeStorage(this.runsKey, [rerun, ...current]);
        return of(rerun);
      }),
    );
  }

  exportPayrollReport(filters: {
    month?: string;
    year?: number;
    period?: string;
    departmentId?: string | number | null;
    employeeId?: string | number | null;
  }): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/payroll/export`, {
      params: {
        month: filters.month ?? filters.period?.split('-')[1] ?? '',
        year: String(filters.year ?? filters.period?.split('-')[0] ?? ''),
        departmentId: String(filters.departmentId ?? ''),
        employeeId: String(filters.employeeId ?? ''),
      },
      responseType: 'blob',
    }).pipe(
      catchError(() => of(new Blob(['Payroll export unavailable'], { type: 'text/plain' }))),
    );
  }
}
