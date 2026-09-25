import { reportContractError } from '../utils/contract-reporter';

export interface EmployeeDTO {
  id: number;
  orgId: number;
  employeeCode: string | null;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone: string | null;
  roleId: number;
  departmentId: number | null;
  designationId: number | null;
  geofenceId: number | null;
  managerId: number | null;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  avatar: string | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  dateOfBirth: string | null;
  address: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  salary: number | string | null;
  bankAccount: string | null;
  bankName: string | null;
  ifscCode: string | null;
  panNumber: string | null;
  aadhaarNumber?: string | null;
  aadharLast4?: string | null;
  joinDate: string | null;
  exitDate: string | null;
  exitReason: string | null;
  createdAt: string;
  updatedAt: string;
  role?: {
    id: number;
    roleName: string;
    description?: string;
  };
  department?: {
    id: number;
    name: string;
  };
  designation?: {
    id: number;
    title: string;
  };
}

export interface EmployeeModel {
  id: number;
  orgId: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  roleId: number;
  roleName: string;
  departmentId: number | null;
  departmentName: string;
  designationId: number | null;
  designationTitle: string;
  managerId: number | null;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  avatar: string | null;
  gender: string;
  dateOfBirth: string | null;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  salary: number | string;
  bankAccount: string | null;
  bankName: string;
  ifscCode: string | null;
  panNumber: string | null;
  aadhaarNumber: string | null;
  joinDate: string | null;
  exitDate: string | null;
  exitReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export class EmployeeMapper {
  private static readonly SERVICE_NAME = 'EmployeeService';
  private static readonly ENDPOINT = '/api/employees';

  static fromDTO(dto: any): EmployeeModel {
    const raw = dto || {};

    const requiredKeys = ['id', 'email', 'firstName', 'status'];
    const missing = requiredKeys.filter((key) => !(key in raw));
    for (const key of missing) {
      reportContractError(this.SERVICE_NAME, this.ENDPOINT, raw, key);
    }

    const firstName = String(raw.firstName ?? '').trim();
    const lastName = String(raw.lastName ?? '').trim();
    const computedFullName = raw.fullName || [firstName, lastName].filter(Boolean).join(' ') || 'Employee';

    const parsedSalary = (typeof raw.salary === 'string' && raw.salary.includes('•'))
      ? raw.salary
      : (isNaN(Number(raw.salary)) ? 0 : Number(raw.salary ?? 0));

    return {
      id: Number(raw.id ?? 0),
      orgId: Number(raw.orgId ?? 0),
      employeeCode: String(raw.employeeCode ?? raw.code ?? ''),
      firstName,
      lastName,
      fullName: computedFullName,
      email: String(raw.email ?? ''),
      phone: String(raw.phone ?? ''),
      roleId: Number(raw.roleId ?? raw.role?.id ?? 0),
      roleName: String(raw.role?.roleName ?? raw.role?.name ?? 'Employee'),
      departmentId: raw.departmentId ? Number(raw.departmentId) : null,
      departmentName: String(raw.department?.name ?? 'Unassigned'),
      designationId: raw.designationId ? Number(raw.designationId) : null,
      designationTitle: String(raw.designation?.title ?? raw.designation?.name ?? 'Staff'),
      managerId: raw.managerId ? Number(raw.managerId) : null,
      status: (['active', 'inactive', 'on_leave', 'terminated'].includes(raw.status)
        ? raw.status
        : 'active') as EmployeeModel['status'],
      avatar: raw.avatar ? String(raw.avatar) : null,
      gender: String(raw.gender ?? 'not_specified'),
      dateOfBirth: raw.dateOfBirth ? String(raw.dateOfBirth) : null,
      address: String(raw.address ?? ''),
      emergencyContact: String(raw.emergencyContact ?? ''),
      emergencyPhone: String(raw.emergencyPhone ?? ''),
      salary: parsedSalary,
      bankAccount: raw.bankAccount ? String(raw.bankAccount) : null,
      bankName: String(raw.bankName ?? ''),
      ifscCode: raw.ifscCode ? String(raw.ifscCode) : null,
      panNumber: raw.panNumber ? String(raw.panNumber) : null,
      aadhaarNumber: raw.aadhaarNumber ? String(raw.aadhaarNumber) : raw.aadharLast4 ? `•••• •••• ${raw.aadharLast4}` : null,
      joinDate: raw.joinDate ? String(raw.joinDate) : null,
      exitDate: raw.exitDate ? String(raw.exitDate) : null,
      exitReason: raw.exitReason ? String(raw.exitReason) : null,
      createdAt: String(raw.createdAt ?? ''),
      updatedAt: String(raw.updatedAt ?? ''),
    };
  }

  static fromDTOList(dtos: any[]): EmployeeModel[] {
    if (!Array.isArray(dtos)) return [];
    return dtos.map((item) => this.fromDTO(item));
  }

  // PII Masking Utilities
  static maskSalary(salary: number): string {
    if (!salary || salary <= 0) return '₹••••••';
    return `₹${'•'.repeat(String(Math.round(salary)).length)}`;
  }

  static maskPAN(pan: string | null): string {
    if (!pan || pan.length < 5) return '••••••••••';
    const clean = pan.trim();
    if (clean.length === 10) {
      return `${clean.slice(0, 2)}••••••${clean.slice(8)}`;
    }
    return '••••••••••';
  }

  static maskAadhaar(aadhaar: string | null): string {
    if (!aadhaar) return '•••• •••• ••••';
    const digits = aadhaar.replace(/\D/g, '');
    if (digits.length >= 4) {
      return `•••• •••• ${digits.slice(-4)}`;
    }
    return '•••• •••• ••••';
  }

  static maskBankAccount(account: string | null): string {
    if (!account) return '••••••••••••';
    const clean = account.trim();
    if (clean.length > 4) {
      return `•••• •••• ${clean.slice(-4)}`;
    }
    return '••••••••••••';
  }
}
