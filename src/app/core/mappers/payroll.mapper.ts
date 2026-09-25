import { Payslip } from '../services/payroll.service';
import { reportContractError, mapListWithWarnings, MapListResult } from '../utils/contract-reporter';

export interface PayslipDTO {
  id?: number;
  payslip_id?: number;
  employee_id?: number;
  employeeId?: number;
  employee_name?: string;
  employeeName?: string;
  month?: string | number;
  year?: number;
  basic_salary?: number | string;
  basicSalary?: number | string;
  hra?: number | string;
  allowances?: number | string;
  bonus?: number | string;
  overtime?: number | string;
  reimbursements?: number | string;
  deductions?: number | string;
  pf?: number | string;
  esi?: number | string;
  professional_tax?: number | string;
  professionalTax?: number | string;
  tds?: number | string;
  lop?: number | string;
  other_deductions?: number | string;
  otherDeductions?: number | string;
  gross_salary?: number | string;
  grossSalary?: number | string;
  net_salary?: number | string;
  netSalary?: number | string;
  ytd_earnings?: number | string;
  ytdEarnings?: number | string;
  ytd_deductions?: number | string;
  ytdDeductions?: number | string;
  tax_summary?: number | string;
  taxSummary?: number | string;
  reimbursement_status?: 'pending' | 'approved' | 'paid' | 'rejected';
  reimbursementStatus?: 'pending' | 'approved' | 'paid' | 'rejected';
  status?: 'published' | 'pending' | 'on_hold' | 'processed' | 'locked';
  pdf_url?: string | null;
  pdfUrl?: string | null;
  generated_at?: string | null;
  generatedAt?: string | null;
}

export function mapPayslipDtoToModel(dto: any): Payslip | null {
  if (!dto || typeof dto !== 'object') {
    reportContractError('PayrollService', '/api/payroll', dto, 'non_object_dto');
    return null;
  }

  const id = Number(dto.id ?? dto.payslip_id);
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
    employee_id: Number(dto.employee_id ?? dto.employeeId ?? 0) || undefined,
    employee_name: dto.employee_name ?? dto.employeeName ?? dto.employee?.fullName ?? dto.employee?.name ?? undefined,
    month: String(dto.month ?? ''),
    year: Number(dto.year ?? new Date().getFullYear()),
    basic_salary: parseMoney(dto.basic_salary ?? dto.basicSalary),
    hra: parseMoney(dto.hra),
    allowances: parseMoney(dto.allowances),
    bonus: parseMoney(dto.bonus),
    overtime: parseMoney(dto.overtime),
    reimbursements: parseMoney(dto.reimbursements),
    deductions: parseMoney(dto.deductions),
    pf: parseMoney(dto.pf),
    esi: parseMoney(dto.esi),
    professional_tax: parseMoney(dto.professional_tax ?? dto.professionalTax),
    tds: parseMoney(dto.tds),
    lop: parseMoney(dto.lop),
    other_deductions: parseMoney(dto.other_deductions ?? dto.otherDeductions),
    gross_salary: parseMoney(dto.gross_salary ?? dto.grossSalary),
    net_salary: parseMoney(dto.net_salary ?? dto.netSalary),
    ytd_earnings: parseMoney(dto.ytd_earnings ?? dto.ytdEarnings),
    ytd_deductions: parseMoney(dto.ytd_deductions ?? dto.ytdDeductions),
    tax_summary: parseMoney(dto.tax_summary ?? dto.taxSummary),
    reimbursement_status: dto.reimbursement_status ?? dto.reimbursementStatus ?? 'pending',
    status: dto.status ?? 'published',
    pdf_url: dto.pdf_url ?? dto.pdfUrl ?? null,
    generated_at: dto.generated_at ?? dto.generatedAt ?? null,
  };
}

export function mapPayslipList(rawList: any[]): MapListResult<Payslip> {
  return mapListWithWarnings(rawList, mapPayslipDtoToModel, 'PayrollService', '/api/payroll');
}
