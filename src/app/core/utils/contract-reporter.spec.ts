import { reportContractError, registerMonitoringHook, mapListWithWarnings, ContractErrorDetails } from './contract-reporter';

describe('ContractReporter Utility', () => {
  it('should log contract error without throwing and invoke monitoring hook without logging values', () => {
    let capturedError: any = null;
    registerMonitoringHook((details: ContractErrorDetails) => {
      capturedError = details;
    });

    const mockDto = { email: 'test@example.com', sensitiveData: 'secret123', status: 'active' };
    reportContractError('EmployeeService', '/api/employees', mockDto, 'employee_code');

    expect(capturedError).not.toBeNull();
    expect(capturedError?.serviceName).toBe('EmployeeService');
    expect(capturedError?.endpoint).toBe('/api/employees');
    expect(capturedError?.missingField).toBe('employee_code');
    expect(capturedError?.dtoKeys).toEqual(['email', 'sensitiveData', 'status']);
    
    // Clear hook
    registerMonitoringHook(null);
  });

  it('should handle unparseable items in mapListWithWarnings and return warning state', () => {
    const rawItems = [{ name: 'Valid' }, { invalid: true }, { name: 'Also Valid' }];
    const mapper = (item: any) => {
      if (!item.name) throw new Error('Missing name');
      return { displayName: item.name };
    };

    const result = mapListWithWarnings(rawItems, mapper, 'TestService', '/api/test');
    expect(result.items.length).toBe(2);
    expect(result.warningState.hasWarnings).toBeTrue();
    expect(result.warningState.unparseableCount).toBe(1);
    expect(result.warningState.message).toBe('1 record could not be displayed due to invalid data format.');
  });
});
