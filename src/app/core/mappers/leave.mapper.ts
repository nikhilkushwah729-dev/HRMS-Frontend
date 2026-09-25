import { LeaveRequest, LeaveTypeBalance } from '../services/leave.service';
import { reportContractError, mapListWithWarnings, MapListResult } from '../utils/contract-reporter';

export interface LeaveRequestDTO {
  id?: number;
  leave_id?: number;
  employee_id?: number;
  employeeId?: number;
  org_id?: number;
  orgId?: number;
  leave_type_id?: number;
  leaveTypeId?: number;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  total_days?: number | string;
  totalDays?: number | string;
  reason?: string | null;
  supporting_doc?: string | null;
  supportingDoc?: string | null;
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: number | null;
  approved_at?: string | null;
  rejection_note?: string | null;
  rejectionNote?: string | null;
  cancelled_by?: number | null;
  cancelled_at?: string | null;
  created_at?: string;
  leave_type?: any;
  employee?: any;
}

export interface LeaveTypeDTO {
  id?: number;
  org_id?: number;
  orgId?: number;
  type_name?: string;
  typeName?: string;
  days_allowed?: number;
  daysAllowed?: number;
  carry_forward?: boolean;
  carryForward?: boolean;
  max_carry_days?: number;
  maxCarryDays?: number;
  is_paid?: boolean;
  isPaid?: boolean;
  requires_doc?: boolean;
  requiresDoc?: boolean;
  total?: number;
  used?: number;
  remaining?: number;
}

export function mapLeaveRequestDtoToModel(dto: any): LeaveRequest | null {
  if (!dto || typeof dto !== 'object') {
    reportContractError('LeaveService', '/api/leaves', dto, 'non_object_dto');
    return null;
  }

  const id = Number(dto.id ?? dto.leave_id);
  if (!id || isNaN(id)) {
    reportContractError('LeaveService', '/api/leaves', dto, 'id');
    return null;
  }

  const startDate = dto.start_date ?? dto.startDate;
  if (!startDate) {
    reportContractError('LeaveService', '/api/leaves', dto, 'start_date');
    return null;
  }

  const endDate = dto.end_date ?? dto.endDate;
  if (!endDate) {
    reportContractError('LeaveService', '/api/leaves', dto, 'end_date');
    return null;
  }

  return {
    id,
    employeeId: Number(dto.employee_id ?? dto.employeeId ?? 0),
    orgId: Number(dto.org_id ?? dto.orgId ?? 0),
    leaveTypeId: Number(dto.leave_type_id ?? dto.leaveTypeId ?? 0),
    startDate: String(startDate),
    endDate: String(endDate),
    totalDays: Number(dto.total_days ?? dto.totalDays ?? 0),
    reason: String(dto.reason ?? ''),
    supportingDoc: dto.supporting_doc ?? dto.supportingDoc ?? null,
    status: dto.status ?? 'pending',
    approvedBy: dto.approved_by ? Number(dto.approved_by) : null,
    approvedAt: dto.approved_at ?? null,
    rejectionNote: dto.rejection_note ?? dto.rejectionNote ?? null,
    cancelledBy: dto.cancelled_by ? Number(dto.cancelled_by) : null,
    cancelledAt: dto.cancelled_at ?? null,
    createdAt: dto.created_at ?? dto.createdAt ?? new Date().toISOString(),
    leaveType: dto.leave_type ? mapLeaveTypeDtoToModel(dto.leave_type) ?? undefined : undefined,
    employee: dto.employee
      ? {
          id: Number(dto.employee.id ?? 0),
          fullName: dto.employee.full_name ?? dto.employee.fullName ?? `${dto.employee.first_name ?? ''} ${dto.employee.last_name ?? ''}`.trim(),
          firstName: dto.employee.first_name ?? dto.employee.firstName,
          lastName: dto.employee.last_name ?? dto.employee.lastName,
          email: dto.employee.email,
        }
      : undefined,
  };
}

export function mapLeaveTypeDtoToModel(dto: any): LeaveTypeBalance | null {
  if (!dto || typeof dto !== 'object') {
    reportContractError('LeaveService', '/api/leave-types', dto, 'non_object_dto');
    return null;
  }

  const id = Number(dto.id);
  const typeName = dto.type_name ?? dto.typeName;

  if (!id || isNaN(id) || !typeName) {
    reportContractError('LeaveService', '/api/leave-types', dto, !id ? 'id' : 'type_name');
    return null;
  }

  const daysAllowed = Number(dto.days_allowed ?? dto.daysAllowed ?? dto.total ?? 0);
  const used = Number(dto.used ?? 0);
  const remaining = Number(dto.remaining ?? Math.max(0, daysAllowed - used));

  return {
    id,
    orgId: Number(dto.org_id ?? dto.orgId ?? 0),
    typeName: String(typeName),
    daysAllowed,
    carryForward: Boolean(dto.carry_forward ?? dto.carryForward ?? false),
    maxCarryDays: Number(dto.max_carry_days ?? dto.maxCarryDays ?? 0),
    isPaid: Boolean(dto.is_paid ?? dto.isPaid ?? true),
    requiresDoc: Boolean(dto.requires_doc ?? dto.requiresDoc ?? false),
    type: String(typeName),
    color: dto.color ?? '#3b82f6',
    year: Number(dto.year ?? new Date().getFullYear()),
    total: daysAllowed,
    used,
    remaining,
  };
}

export function mapLeaveRequestList(rawList: any[]): MapListResult<LeaveRequest> {
  return mapListWithWarnings(rawList, mapLeaveRequestDtoToModel, 'LeaveService', '/api/leaves');
}

export function mapLeaveTypeList(rawList: any[]): MapListResult<LeaveTypeBalance> {
  return mapListWithWarnings(rawList, mapLeaveTypeDtoToModel, 'LeaveService', '/api/leave-types');
}
