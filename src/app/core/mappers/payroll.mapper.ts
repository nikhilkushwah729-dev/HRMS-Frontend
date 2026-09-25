import { Payslip } from '../services/payroll.service';
import { reportContractError, mapListWithWarnings, MapListResult } from '../utils/contract-reporter';

export interface PayslipDTO {
  id?: number;
  employeeId?: number;
  employeeName?: string;
  month?: string | number;
  year?: number;
  basicSalary?: number | string;
  hra?: number | string;
  allowances?: number | string;
  bonus?: number | string;
  overtime?: number | string;
  reimbursements?: number | string;
  deductions?: number | string;
  pfDeduction?: number | string;
  esiDeduction?: number | string;
  professionalTax?: number | string;
  tdsDeduction?: number | string;
  lop?: number | string;
  otherDeductions?: number | string;
  grossSalary?: number | string;
  netSalary?: number | string;
  ytdEarnings?: number | string;
  ytdDeductions?: number | string;
  taxSummary?: number | string;
  reimbursementStatus?: 'pending' | 'approved' | 'paid' | 'rejected';
  status?: 'published' | 'pending' | 'on_hold' | 'processed' | 'locked';
  pdfUrl?: string | null;
  generatedAt?: string | null;
  employee?: {
    id?: number;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export function mapPayslipDtoToModel(dto: any): Payslip | null {
  if (!dto || typeof dto !== 'object') {
    reportContractError('PayrollService', '/api/payroll', dto, 'non_object_dto');
    return null;
  }

  const id = Number(dto.id);
  if (!id || isNaN(id)) {
    reportContractError('PayrollService', '/api/payroll', dto, 'id');
    return null;
  }

  const parseMoney = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    const num = Number(val);
    return Number.isFinite(num) ? num : 0;
  };

  return {
    id,
    employee_id: Number(dto.employeeId ?? dto.employee?.id ?? 0) || undefined,
    employee_name: dto.employeeName ?? dto.employee?.fullName ?? (dto.employee ? `${dto.employee.firstName ?? ''} ${dto.employee.lastName ?? ''}`.trim() : undefined),
    month: String(dto.month ?? ''),
    year: Number(dto.year ?? new Date().getFullYear()),
    basic_salary: parseMoney(dto.basicSalary),
    hra: parseMoney(dto.hra),
    allowances: parseMoney(dto.allowances),
    bonus: parseMoney(dto.bonus),
    overtime: parseMoney(dto.overtime),
    reimbursements: parseMoney(dto.reimbursements),
    deductions: parseMoney(dto.deductions),
    pf: parseMoney(dto.pfDeduction ?? dto.pf),
    esi: parseMoney(dto.esiDeduction ?? dto.esi),
    professional_tax: parseMoney(dto.professionalTax),
    tds: parseMoney(dto.tdsDeduction ?? dto.tds),
    lop: parseMoney(dto.lop),
    other_deductions: parseMoney(dto.otherDeductions),
    gross_salary: parseMoney(dto.grossSalary),
    net_salary: parseMoney(dto.netSalary),
    ytd_earnings: parseMoney(dto.ytdEarnings),
    ytd_deductions: parseMoney(dto.ytdDeductions),
    tax_summary: parseMoney(dto.taxSummary),
    reimbursement_status: dto.reimbursementStatus ?? 'pending',
    status: dto.status ?? 'published',
    pdf_url: dto.pdfUrl ?? null,
    generated_at: dto.generatedAt ?? null,
  };
}

export function mapPayslipList(rawList: any[]): MapListResult<Payslip> {
  return mapListWithWarnings(rawList, mapPayslipDtoToModel, 'PayrollService', '/api/payroll');
}
