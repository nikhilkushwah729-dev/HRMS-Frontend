import { AttendanceRecord } from '../services/attendance.service';
import { reportContractError, mapListWithWarnings, MapListResult } from '../utils/contract-reporter';

export interface AttendanceDTO {
  id?: number;
  attendance_id?: number;
  employee_id?: number;
  employeeId?: number;
  date?: string;
  check_in?: string | null;
  checkIn?: string | null;
  checkInTime?: string | null;
  check_out?: string | null;
  checkOut?: string | null;
  checkOutTime?: string | null;
  check_in_photo?: string | null;
  checkInPhoto?: string | null;
  check_out_photo?: string | null;
  checkOutPhoto?: string | null;
  work_hours?: number | string | null;
  workHours?: number | string | null;
  net_work_hours?: number | string | null;
  netWorkHours?: number | string | null;
  total_break_min?: number;
  status?: 'present' | 'absent' | 'half_day' | 'late' | 'on_leave' | 'holiday' | 'weekend';
  selfie_url?: string | null;
  is_late?: boolean;
  is_half_day?: boolean;
  shift_id?: number;
  shift_name?: string;
  source?: string;
  attendance_method?: string | null;
  kiosk_name?: string | null;
  device_info?: string | null;
  latitude?: number;
  longitude?: number;
  location_address?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  employee?: any;
}

export function mapAttendanceDtoToModel(dto: any): AttendanceRecord | null {
  if (!dto || typeof dto !== 'object') {
    reportContractError('AttendanceService', '/api/attendances', dto, 'non_object_dto');
    return null;
  }

  const id = Number(dto.id ?? dto.attendance_id);
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
    employee_id: Number(dto.employee_id ?? dto.employeeId ?? 0),
    employee_code: dto.employee_code ?? dto.employeeCode ?? undefined,
    date: String(date),
    check_in: dto.check_in ?? dto.checkIn ?? dto.checkInTime ?? null,
    check_out: dto.check_out ?? dto.checkOut ?? dto.checkOutTime ?? null,
    check_in_photo: dto.check_in_photo ?? dto.checkInPhoto ?? null,
    check_out_photo: dto.check_out_photo ?? dto.checkOutPhoto ?? null,
    work_hours: parseNumberOrNull(dto.work_hours ?? dto.workHours),
    net_work_hours: parseNumberOrNull(dto.net_work_hours ?? dto.netWorkHours),
    total_break_min: Number(dto.total_break_min ?? 0),
    status: dto.status ?? 'present',
    selfie_url: dto.selfie_url ?? dto.selfieUrl ?? null,
    is_late: Boolean(dto.is_late ?? dto.isLate ?? false),
    is_half_day: Boolean(dto.is_half_day ?? dto.isHalfDay ?? false),
    shift_id: dto.shift_id ? Number(dto.shift_id) : undefined,
    shift_name: dto.shift_name ?? dto.shiftName ?? undefined,
    source: dto.source ?? 'manual',
    attendance_method: dto.attendance_method ?? dto.attendanceMethod ?? null,
    kiosk_name: dto.kiosk_name ?? dto.kioskName ?? null,
    device_info: dto.device_info ?? dto.deviceInfo ?? null,
    latitude: parseNumberOrNull(dto.latitude) ?? undefined,
    longitude: parseNumberOrNull(dto.longitude) ?? undefined,
    location_address: dto.location_address ?? dto.locationAddress ?? undefined,
    notes: dto.notes ?? undefined,
    created_at: dto.created_at ?? dto.createdAt ?? undefined,
    updated_at: dto.updated_at ?? dto.updatedAt ?? undefined,
    employee: dto.employee
      ? {
          id: Number(dto.employee.id ?? 0),
          firstName: dto.employee.first_name ?? dto.employee.firstName ?? '',
          lastName: dto.employee.last_name ?? dto.employee.lastName ?? '',
          email: dto.employee.email ?? '',
          avatar: dto.employee.avatar ?? undefined,
        }
      : undefined,
  };
}

export function mapAttendanceList(rawList: any[]): MapListResult<AttendanceRecord> {
  return mapListWithWarnings(rawList, mapAttendanceDtoToModel, 'AttendanceService', '/api/attendances');
}
