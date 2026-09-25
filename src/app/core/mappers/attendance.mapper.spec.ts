import { mapAttendanceDtoToModel, mapAttendanceList } from './attendance.mapper';
import { registerMonitoringHook, ContractErrorDetails } from '../utils/contract-reporter';

describe('AttendanceMapper (Contract Validation & DTO Mapping)', () => {
  it('should map backend AttendanceDTO to domain AttendanceRecord', () => {
    const backendDto = {
      id: 301,
      employee_id: 12,
      date: '2026-09-25',
      check_in: '09:00:00',
      check_out: '17:30:00',
      work_hours: '8.5',
      net_work_hours: '8.0',
      status: 'present',
      is_late: false,
    };

    const model = mapAttendanceDtoToModel(backendDto);
    expect(model).not.toBeNull();
    expect(model?.id).toBe(301);
    expect(model?.employee_id).toBe(12);
    expect(model?.date).toBe('2026-09-25');
    expect(model?.work_hours).toBe(8.5);
    expect(model?.net_work_hours).toBe(8.0);
    expect(model?.status).toBe('present');
  });

  it('should report contract error when required date is missing', () => {
    let capturedError: any = null;
    registerMonitoringHook((details: ContractErrorDetails) => {
      capturedError = details;
    });

    const brokenDto = {
      id: 302,
      check_in: '09:00:00',
    };

    const model = mapAttendanceDtoToModel(brokenDto);
    expect(model).toBeNull();
    expect(capturedError?.serviceName).toBe('AttendanceService');
    expect(capturedError?.missingField).toBe('date');

    registerMonitoringHook(null);
  });

  it('should return warning state for invalid list items', () => {
    const rawList = [
      { id: 1, date: '2026-09-25' },
      { brokenItem: true },
      { id: 2, date: '2026-09-26' },
    ];

    const result = mapAttendanceList(rawList);
    expect(result.items.length).toBe(2);
    expect(result.warningState.hasWarnings).toBeTrue();
    expect(result.warningState.unparseableCount).toBe(1);
  });
});
