import { AttendanceRecord } from '../services/attendance.service';
import { reportContractError, mapListWithWarnings, MapListResult } from '../utils/contract-reporter';

export interface AttendanceDTO {
  id?: number;
  employeeId?: number;
  employeeCode?: string;
  date?: string;
  checkIn?: string | null;
  checkInTime?: string | null;
  checkOut?: string | null;
  checkOutTime?: string | null;
  checkInPhoto?: string | null;
  checkOutPhoto?: string | null;
  workHours?: number | string | null;
  netWorkHours?: number | string | null;
  totalBreakMin?: number;
  status?: 'present' | 'absent' | 'half_day' | 'late' | 'on_leave' | 'holiday' | 'weekend';
  selfieUrl?: string | null;
  isLate?: boolean;
  isHalfDay?: boolean;
  shiftId?: number;
  shiftName?: string;
  source?: string;
  attendanceMethod?: string | null;
  kioskName?: string | null;
  deviceInfo?: string | null;
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  employee?: {
    id?: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string;
  };
}

export function mapAttendanceDtoToModel(dto: any): AttendanceRecord | null {
  if (!dto || typeof dto !== 'object') {
    reportContractError('AttendanceService', '/api/attendances', dto, 'non_object_dto');
    return null;
  }

  const id = Number(dto.id);
  if (!id || isNaN(id)) {
    reportContractError('AttendanceService', '/api/attendances', dto, 'id');
    return null;
  }

  const date = dto.date;
  if (!date) {
    reportContractError('AttendanceService', '/api/attendances', dto, 'date');
    return null;
  }

  const parseNumberOrNull = (val: any): number | null => {
    if (val === undefined || val === null || val === '') return null;
    const parsed = Number(val);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return {
    id,
    employee_id: Number(dto.employeeId ?? 0),
    employee_code: dto.employeeCode ?? undefined,
    date: String(date),
    check_in: dto.checkIn ?? dto.checkInTime ?? null,
    check_out: dto.checkOut ?? dto.checkOutTime ?? null,
    check_in_photo: dto.checkInPhoto ?? null,
    check_out_photo: dto.checkOutPhoto ?? null,
    work_hours: parseNumberOrNull(dto.workHours),
    net_work_hours: parseNumberOrNull(dto.netWorkHours),
    total_break_min: Number(dto.totalBreakMin ?? 0),
    status: dto.status ?? 'present',
    selfie_url: dto.selfieUrl ?? null,
    is_late: Boolean(dto.isLate ?? false),
    is_half_day: Boolean(dto.isHalfDay ?? false),
    shift_id: dto.shiftId ? Number(dto.shiftId) : undefined,
    shift_name: dto.shiftName ?? undefined,
    source: dto.source ?? 'manual',
    attendance_method: dto.attendanceMethod ?? null,
    kiosk_name: dto.kioskName ?? null,
    device_info: dto.deviceInfo ?? null,
    latitude: parseNumberOrNull(dto.latitude) ?? undefined,
    longitude: parseNumberOrNull(dto.longitude) ?? undefined,
    location_address: dto.locationAddress ?? undefined,
    notes: dto.notes ?? undefined,
    created_at: dto.createdAt ?? undefined,
    updated_at: dto.updatedAt ?? undefined,
    employee: dto.employee
      ? {
          id: Number(dto.employee.id ?? 0),
          firstName: dto.employee.firstName ?? '',
          lastName: dto.employee.lastName ?? '',
          email: dto.employee.email ?? '',
          avatar: dto.employee.avatar ?? undefined,
        }
      : undefined,
  };
}

export function mapAttendanceList(rawList: any[]): MapListResult<AttendanceRecord> {
  return mapListWithWarnings(rawList, mapAttendanceDtoToModel, 'AttendanceService', '/api/attendances');
}
