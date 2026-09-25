import { LeaveRequest, LeaveTypeBalance } from '../services/leave.service';
import { reportContractError, mapListWithWarnings, MapListResult } from '../utils/contract-reporter';

export interface LeaveRequestDTO {
  id?: number;
  employeeId?: number;
  orgId?: number;
  leaveTypeId?: number;
  startDate?: string;
  endDate?: string;
  totalDays?: number | string;
  reason?: string | null;
  supportingDoc?: string | null;
  durationType?: 'full_day' | 'half_day';
  halfDaySession?: 'first_half' | 'second_half';
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: number | null;
  approvedAt?: string | null;
  rejectionNote?: string | null;
  cancelledBy?: number | null;
  cancelledAt?: string | null;
  createdAt?: string;
  leaveType?: LeaveTypeDTO;
  employee?: {
    id?: number;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export interface LeaveTypeDTO {
  id?: number;
  orgId?: number;
  typeName?: string;
  daysAllowed?: number;
  carryForward?: boolean | number;
  maxCarryDays?: number;
  isPaid?: boolean | number;
  requiresDoc?: boolean | number;
  total?: number;
  used?: number;
  remaining?: number;
}

export function mapLeaveRequestDtoToModel(dto: any): LeaveRequest | null {
  if (!dto || typeof dto !== 'object') {
    reportContractError('LeaveService', '/api/leaves', dto, 'non_object_dto');
    return null;
  }

  const id = Number(dto.id);
  if (!id || isNaN(id)) {
    reportContractError('LeaveService', '/api/leaves', dto, 'id');
    return null;
  }

  const startDate = dto.startDate;
  if (!startDate) {
    reportContractError('LeaveService', '/api/leaves', dto, 'startDate');
    return null;
  }

  const endDate = dto.endDate;
  if (!endDate) {
    reportContractError('LeaveService', '/api/leaves', dto, 'endDate');
    return null;
  }

  return {
    id,
    employeeId: Number(dto.employeeId ?? 0),
    orgId: Number(dto.orgId ?? 0),
    leaveTypeId: Number(dto.leaveTypeId ?? 0),
    startDate: String(startDate),
    endDate: String(endDate),
    totalDays: Number(dto.totalDays ?? 0),
    reason: String(dto.reason ?? ''),
    supportingDoc: dto.supportingDoc ?? null,
    status: dto.status ?? 'pending',
    approvedBy: dto.approvedBy ? Number(dto.approvedBy) : null,
    approvedAt: dto.approvedAt ?? null,
    rejectionNote: dto.rejectionNote ?? null,
    cancelledBy: dto.cancelledBy ? Number(dto.cancelledBy) : null,
    cancelledAt: dto.cancelledAt ?? null,
    createdAt: dto.createdAt ?? new Date().toISOString(),
    durationType: dto.durationType ?? 'full_day',
    halfDaySession: dto.halfDaySession ?? undefined,
    leaveType: dto.leaveType ? mapLeaveTypeDtoToModel(dto.leaveType) ?? undefined : undefined,
    employee: dto.employee
      ? {
          id: Number(dto.employee.id ?? 0),
          fullName: dto.employee.fullName ?? `${dto.employee.firstName ?? ''} ${dto.employee.lastName ?? ''}`.trim(),
          firstName: dto.employee.firstName,
          lastName: dto.employee.lastName,
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
  const typeName = dto.typeName;

  if (!id || isNaN(id) || !typeName) {
    reportContractError('LeaveService', '/api/leave-types', dto, !id ? 'id' : 'typeName');
    return null;
  }

  const daysAllowed = Number(dto.daysAllowed ?? dto.total ?? 0);
  const used = Number(dto.used ?? 0);
  const remaining = Number(dto.remaining ?? Math.max(0, daysAllowed - used));

  return {
    id,
    orgId: Number(dto.orgId ?? 0),
    typeName: String(typeName),
    daysAllowed,
    carryForward: Boolean(dto.carryForward ?? false),
    maxCarryDays: Number(dto.maxCarryDays ?? 0),
    isPaid: Boolean(dto.isPaid ?? true),
    requiresDoc: Boolean(dto.requiresDoc ?? false),
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
