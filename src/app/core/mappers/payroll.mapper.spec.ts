import { mapPayslipDtoToModel, mapPayslipList } from './payroll.mapper';
import { registerMonitoringHook, ContractErrorDetails } from '../utils/contract-reporter';

describe('PayrollMapper (DECIMAL Parsing & Contract Validation)', () => {
  it('should safely parse MySQL string DECIMAL outputs into numeric domain properties', () => {
    const backendDto = {
      id: 501,
      employee_id: 10,
      month: '09',
      year: 2026,
      basic_salary: '45000.50',
      gross_salary: '62000.00',
      net_salary: '54000.25',
      deductions: '8000.00',
      status: 'published',
    };

    const model = mapPayslipDtoToModel(backendDto);
    expect(model).not.toBeNull();
    expect(model?.id).toBe(501);
    expect(model?.basic_salary).toBe(45000.5);
    expect(model?.gross_salary).toBe(62000);
    expect(model?.net_salary).toBe(54000.25);
    expect(model?.deductions).toBe(8000);
  });

  it('should report contract error when required payslip ID is missing', () => {
    let capturedError: ContractErrorDetails | null = null;
    registerMonitoringHook((details) => {
      capturedError = details;
    });

    const invalidDto = {
      month: '09',
      basic_salary: '1000',
    };

    const model = mapPayslipDtoToModel(invalidDto);
    expect(model).toBeNull();
    expect(capturedError?.serviceName).toBe('PayrollService');
    expect(capturedError?.missingField).toBe('id');

    registerMonitoringHook(null);
  });

  it('should safely filter invalid items in mapPayslipList', () => {
    const rawList = [
      { id: 1, basic_salary: '100' },
      { brokenItem: true },
      { id: 2, basic_salary: '200' },
    ];

    const result = mapPayslipList(rawList);
    expect(result.items.length).toBe(2);
    expect(result.warningState.hasWarnings).toBeTrue();
    expect(result.warningState.unparseableCount).toBe(1);
  });
});
