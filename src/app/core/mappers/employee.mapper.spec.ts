import { EmployeeMapper } from './employee.mapper';
import { registerMonitoringHook } from '../utils/contract-reporter';

describe('EmployeeMapper (Strict camelCase & PII Masking Spec)', () => {
  const mockLucidEmployeeDTO = {
    id: 1,
    orgId: 1001,
    employeeCode: 'EMP-101',
    firstName: 'Alex',
    lastName: 'Rivera',
    fullName: 'Alex Rivera',
    email: 'admin.a@tenanta.com',
    phone: '+919876543210',
    roleId: 2,
    departmentId: 10,
    designationId: 5,
    managerId: null,
    status: 'active',
    avatar: 'avatars/alex.png',
    gender: 'male',
    dateOfBirth: '1995-04-12',
    address: '123 Tech Park, Bengaluru',
    emergencyContact: 'Maria Rivera',
    emergencyPhone: '+919876543211',
    salary: '75000.00',
    bankAccount: '123456789012',
    bankName: 'HDFC Bank',
    ifscCode: 'HDFC0001234',
    panNumber: 'ABCDE1234F',
    aadhaarNumber: '123456789012',
    joinDate: '2022-01-15',
    exitDate: null,
    exitReason: null,
    createdAt: '2026-09-25T12:28:57.000+00:00',
    updatedAt: '2026-09-25T12:35:03.000+00:00',
    role: {
      id: 2,
      roleName: 'Organization Admin',
    },
    department: {
      id: 10,
      name: 'Engineering',
    },
    designation: {
      id: 5,
      title: 'Senior Software Engineer',
    },
  };

  it('should map authentic AdonisJS Lucid employee DTO into strict EmployeeModel', () => {
    const model = EmployeeMapper.fromDTO(mockLucidEmployeeDTO);

    expect(model.id).toBe(1);
    expect(model.orgId).toBe(1001);
    expect(model.employeeCode).toBe('EMP-101');
    expect(model.firstName).toBe('Alex');
    expect(model.lastName).toBe('Rivera');
    expect(model.fullName).toBe('Alex Rivera');
    expect(model.email).toBe('admin.a@tenanta.com');
    expect(model.roleName).toBe('Organization Admin');
    expect(model.departmentName).toBe('Engineering');
    expect(model.designationTitle).toBe('Senior Software Engineer');
    expect(model.salary).toBe(75000);
    expect(model.panNumber).toBe('ABCDE1234F');
    expect(model.bankAccount).toBe('123456789012');
  });

  it('should trigger contract monitoring hook when required keys are missing', () => {
    const hookSpy = jasmine.createSpy('monitoringHook');
    registerMonitoringHook(hookSpy);

    const brokenDTO = {
      email: 'broken@corp.com',
    };

    EmployeeMapper.fromDTO(brokenDTO);

    expect(hookSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        serviceName: 'EmployeeService',
        endpoint: '/api/employees',
        missingField: 'id',
      }),
    );

    registerMonitoringHook(null);
  });

  it('should mask PII fields correctly (Salary, PAN, Aadhaar, Bank Account)', () => {
    expect(EmployeeMapper.maskSalary(75000)).toBe('₹•••••');
    expect(EmployeeMapper.maskPAN('ABCDE1234F')).toBe('AB••••••4F');
    expect(EmployeeMapper.maskAadhaar('123456789012')).toBe('•••• •••• 9012');
    expect(EmployeeMapper.maskBankAccount('123456789012')).toBe('•••• •••• 9012');
  });
});
