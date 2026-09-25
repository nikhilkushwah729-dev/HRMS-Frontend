import {
  mapLeaveRequestDtoToModel,
  mapLeaveTypeDtoToModel,
  mapLeaveRequestList,
} from './leave.mapper';
import { registerMonitoringHook, ContractErrorDetails } from '../utils/contract-reporter';

describe('LeaveMapper (Contract Error Handling & DTO Transformation)', () => {
  it('should map backend camelCase LeaveRequestDTO to domain model', () => {
    const backendDto = {
      id: 101,
      employeeId: 5,
      orgId: 1,
      leaveTypeId: 2,
      startDate: '2026-10-01',
      endDate: '2026-10-03',
      totalDays: '3.0',
      reason: 'Vacation',
      status: 'approved',
      rejectionNote: null,
      createdAt: '2026-09-25T10:00:00Z',
    };

    const model = mapLeaveRequestDtoToModel(backendDto);
    expect(model).not.toBeNull();
    expect(model?.id).toBe(101);
    expect(model?.employeeId).toBe(5);
    expect(model?.startDate).toBe('2026-10-01');
    expect(model?.endDate).toBe('2026-10-03');
    expect(model?.totalDays).toBe(3);
    expect(model?.status).toBe('approved');
  });

  it('should report contract error when required fields are missing', () => {
    let capturedError: any = null;
    registerMonitoringHook((details: ContractErrorDetails) => {
      capturedError = details;
    });

    const brokenDto = {
      employeeId: 5,
      reason: 'No ID or startDate',
    };

    const model = mapLeaveRequestDtoToModel(brokenDto);
    expect(model).toBeNull();
    expect(capturedError).not.toBeNull();
    expect(capturedError?.serviceName).toBe('LeaveService');
    expect(capturedError?.missingField).toBe('id');

    registerMonitoringHook(null);
  });

  it('should process a list with mapLeaveRequestList and return warning state on invalid items', () => {
    const rawList = [
      { id: 1, startDate: '2026-10-01', endDate: '2026-10-02' },
      { brokenItem: true },
      { id: 2, startDate: '2026-10-05', endDate: '2026-10-06' },
    ];

    const result = mapLeaveRequestList(rawList);
    expect(result.items.length).toBe(2);
    expect(result.warningState.hasWarnings).toBeTrue();
    expect(result.warningState.unparseableCount).toBe(1);
  });
});
