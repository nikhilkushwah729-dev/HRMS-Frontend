import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import * as XLSX from 'xlsx';
import { environment } from '../../../../../environments/environment';
import { EmployeeService } from '../../../../core/services/employee.service';

export interface ImportFieldDefinition {
  key: string;
  label: string;
  required?: boolean;
  type: 'text' | 'email' | 'date' | 'number' | 'currency';
  aliases?: string[];
  sampleValue?: string;
  helpText?: string;
}

export interface ImportProfileDefinition {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  fields: ImportFieldDefinition[];
  duplicateKeys: string[][];
}

export interface ParsedImportFile {
  fileName: string;
  fileSize: number;
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
}

export interface ImportValidationRow {
  rowNumber: number;
  record: Record<string, any>;
  issues: string[];
  valid: boolean;
  ignored: boolean;
}

export interface ImportExecutionFailure {
  rowNumber: number;
  message: string;
}

export interface ImportExecutionResult {
  persisted: boolean;
  importedCount: number;
  failedCount: number;
  skippedCount: number;
  failedRows: ImportExecutionFailure[];
  mode: 'employee-api' | 'bulk-api' | 'api-pending';
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImportWizardService {
  private readonly http = inject(HttpClient);
  private readonly employeeService = inject(EmployeeService);
  private readonly apiUrl = environment.apiUrl;

  readonly maxFileSizeBytes = 8 * 1024 * 1024;

  private readonly profiles: ImportProfileDefinition[] = [
    {
      id: 'employees',
      label: 'Bulk Employee Upload',
      shortLabel: 'Employees',
      description: 'Create multiple employee records from a single onboarding file.',
      duplicateKeys: [['email'], ['employeeCode']],
      fields: [
        { key: 'firstName', label: 'First Name', required: true, type: 'text', aliases: ['first name', 'fname', 'employee first name'], sampleValue: 'Ananya', helpText: 'Given name of the employee.' },
        { key: 'lastName', label: 'Last Name', required: true, type: 'text', aliases: ['last name', 'lname', 'employee last name'], sampleValue: 'Sharma', helpText: 'Family name of the employee.' },
        { key: 'email', label: 'Email', required: true, type: 'email', aliases: ['work email', 'email address'], sampleValue: 'ananya@company.com', helpText: 'Must be unique and valid.' },
        { key: 'employeeCode', label: 'Employee Code', required: true, type: 'text', aliases: ['employee id', 'emp code', 'code'], sampleValue: 'EMP-1001', helpText: 'Unique employee code in HRMS.' },
        { key: 'department', label: 'Department', type: 'text', aliases: ['dept'], sampleValue: 'Operations', helpText: 'Optional department name.' },
        { key: 'designation', label: 'Designation', type: 'text', aliases: ['title', 'job title'], sampleValue: 'Executive', helpText: 'Optional designation/job title.' },
        { key: 'phone', label: 'Phone', type: 'text', aliases: ['mobile', 'contact number'], sampleValue: '+91 9999999999', helpText: 'Employee contact number.' },
        { key: 'joinDate', label: 'Joining Date', type: 'date', aliases: ['join date', 'date of joining'], sampleValue: '2026-04-01', helpText: 'Prefer ISO format YYYY-MM-DD.' },
      ],
    },
    {
      id: 'attendance',
      label: 'Attendance Import',
      shortLabel: 'Attendance',
      description: 'Bring old punch records, daily work hours, or migration attendance into the system.',
      duplicateKeys: [['employeeCode', 'date']],
      fields: [
        { key: 'employeeCode', label: 'Employee Code', required: true, type: 'text', aliases: ['emp code', 'employee id'], sampleValue: 'EMP-1001', helpText: 'Used to match attendance to an employee.' },
        { key: 'date', label: 'Date', required: true, type: 'date', aliases: ['attendance date'], sampleValue: '2026-04-21', helpText: 'Attendance date.' },
        { key: 'checkIn', label: 'Check In', type: 'text', aliases: ['in time', 'clock in'], sampleValue: '09:05', helpText: 'Optional check-in time.' },
        { key: 'checkOut', label: 'Check Out', type: 'text', aliases: ['out time', 'clock out'], sampleValue: '18:10', helpText: 'Optional check-out time.' },
        { key: 'status', label: 'Status', type: 'text', aliases: ['attendance status'], sampleValue: 'present', helpText: 'Example: present, late, absent.' },
        { key: 'workHours', label: 'Work Hours', type: 'number', aliases: ['working hours', 'hours'], sampleValue: '8.5', helpText: 'Decimal work hours.' },
      ],
    },
    {
      id: 'payroll',
      label: 'Payroll Import',
      shortLabel: 'Payroll',
      description: 'Prepare monthly salary data, payroll migration, or bulk payslip generation inputs.',
      duplicateKeys: [['employeeCode', 'month', 'year']],
      fields: [
        { key: 'employeeCode', label: 'Employee Code', required: true, type: 'text', aliases: ['emp code'], sampleValue: 'EMP-1001', helpText: 'Employee reference.' },
        { key: 'month', label: 'Month', required: true, type: 'text', aliases: ['pay month'], sampleValue: 'April', helpText: 'Payroll month label.' },
        { key: 'year', label: 'Year', required: true, type: 'number', aliases: ['pay year'], sampleValue: '2026', helpText: 'Four digit year.' },
        { key: 'basicSalary', label: 'Basic Salary', required: true, type: 'currency', aliases: ['basic', 'basic pay'], sampleValue: '35000', helpText: 'Base salary value.' },
        { key: 'allowances', label: 'Allowances', type: 'currency', aliases: ['allowance'], sampleValue: '4500', helpText: 'Additional earnings.' },
        { key: 'deductions', label: 'Deductions', type: 'currency', aliases: ['deduction'], sampleValue: '1200', helpText: 'Total deductions.' },
        { key: 'netSalary', label: 'Net Salary', type: 'currency', aliases: ['take home'], sampleValue: '38300', helpText: 'Final net salary.' },
      ],
    },
    {
      id: 'leave-balances',
      label: 'Leave Balance Import',
      shortLabel: 'Leave',
      description: 'Upload opening leave balances, yearly leave carry-forward, or migration leave numbers.',
      duplicateKeys: [['employeeCode', 'leaveType', 'year']],
      fields: [
        { key: 'employeeCode', label: 'Employee Code', required: true, type: 'text', aliases: ['emp code'], sampleValue: 'EMP-1001', helpText: 'Employee reference.' },
        { key: 'leaveType', label: 'Leave Type', required: true, type: 'text', aliases: ['leave category'], sampleValue: 'Casual Leave', helpText: 'Leave policy name.' },
        { key: 'year', label: 'Year', required: true, type: 'number', aliases: ['balance year'], sampleValue: '2026', helpText: 'Balance year.' },
        { key: 'total', label: 'Total Balance', required: true, type: 'number', aliases: ['opening balance', 'total days'], sampleValue: '12', helpText: 'Total allocated balance.' },
        { key: 'used', label: 'Used Days', type: 'number', aliases: ['availed'], sampleValue: '3', helpText: 'Used leave days.' },
        { key: 'remaining', label: 'Remaining Days', type: 'number', aliases: ['balance'], sampleValue: '9', helpText: 'Remaining leave days.' },
      ],
    },
    {
      id: 'migration',
      label: 'Legacy Migration Import',
      shortLabel: 'Migration',
      description: 'Use this flexible profile when cleaning up or migrating broad HRMS records from an old system.',
      duplicateKeys: [['employeeCode']],
      fields: [
        { key: 'employeeCode', label: 'Employee Code', required: true, type: 'text', aliases: ['emp code'], sampleValue: 'EMP-1001', helpText: 'Primary migration key.' },
        { key: 'name', label: 'Full Name', required: true, type: 'text', aliases: ['employee name', 'name'], sampleValue: 'Ananya Sharma', helpText: 'Employee name from legacy system.' },
        { key: 'email', label: 'Email', type: 'email', aliases: ['email address'], sampleValue: 'ananya@company.com', helpText: 'Optional migration email.' },
        { key: 'module', label: 'Module', required: true, type: 'text', aliases: ['source module'], sampleValue: 'Employee', helpText: 'Legacy source module.' },
        { key: 'effectiveDate', label: 'Effective Date', type: 'date', aliases: ['migration date'], sampleValue: '2026-04-21', helpText: 'Date associated with the migrated row.' },
        { key: 'notes', label: 'Notes', type: 'text', aliases: ['remarks'], sampleValue: 'Legacy clean import', helpText: 'Optional notes.' },
      ],
    },
  ];

  getProfiles(): ImportProfileDefinition[] {
    return this.profiles;
  }

  getProfile(id: string): ImportProfileDefinition | undefined {
    return this.profiles.find((profile) => profile.id === id);
  }

  async parseFile(file: File): Promise<ParsedImportFile> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['csv', 'xlsx', 'xls'].includes(extension)) {
      throw new Error('Only CSV and Excel files are supported.');
    }
    if (file.size > this.maxFileSizeBytes) {
      throw new Error('File is too large. Please upload a file below 8 MB.');
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) {
      throw new Error('The selected file does not contain any readable sheet.');
    }

    const rows = XLSX.utils.sheet_to_json<string[]>(firstSheet, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    });

    if (!rows.length) {
      throw new Error('The uploaded file is empty.');
    }

    const rawHeaders = (rows[0] || []).map((value, index) =>
      String(value || `Column ${index + 1}`).trim(),
    );

    const headers = rawHeaders.map((header, index, array) => {
      const normalized = header || `Column ${index + 1}`;
      const duplicates = array
        .slice(0, index)
        .filter((item) => item === normalized).length;
      return duplicates > 0 ? `${normalized} (${duplicates + 1})` : normalized;
    });

    const bodyRows = rows
      .slice(1)
      .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
      .map((row) =>
        Object.fromEntries(
          headers.map((header, index) => [header, String(row[index] ?? '').trim()]),
        ),
      );

    return {
      fileName: file.name,
      fileSize: file.size,
      headers,
      rows: bodyRows,
      rowCount: bodyRows.length,
    };
  }

  suggestMapping(header: string, profile: ImportProfileDefinition): string {
    const normalizedHeader = this.normalize(header);
    const field = profile.fields.find((item) => {
      const aliases = [item.label, ...(item.aliases || [])];
      return aliases.some((alias) => this.normalize(alias) === normalizedHeader);
    });

    return field?.key || '__skip';
  }

  getMappingIssue(
    profile: ImportProfileDefinition,
    mapping: Record<string, string>,
  ): string | null {
    const selectedTargets = Object.values(mapping).filter(
      (value) => value && value !== '__skip',
    );
    const duplicateTarget = selectedTargets.find(
      (value, index) => selectedTargets.indexOf(value) !== index,
    );
    if (duplicateTarget) {
      const label =
        profile.fields.find((field) => field.key === duplicateTarget)?.label ||
        duplicateTarget;
      return `${label} is mapped more than once. Keep one source column per target field.`;
    }

    const missingRequired = profile.fields.filter(
      (field) =>
        field.required &&
        !Object.values(mapping).some((value) => value === field.key),
    );
    if (missingRequired.length) {
      return `Map required fields before continuing: ${missingRequired
        .map((field) => field.label)
        .join(', ')}.`;
    }

    return null;
  }

  mapRows(
    profile: ImportProfileDefinition,
    rawRows: Record<string, string>[],
    mapping: Record<string, string>,
  ): Record<string, any>[] {
    return rawRows.map((row) => {
      const record: Record<string, any> = {};
      for (const [header, value] of Object.entries(row)) {
        const target = mapping[header];
        if (!target || target === '__skip') continue;
        const existingValue = record[target];
        if (!existingValue) {
          record[target] = value;
        } else if (String(value).trim()) {
          record[target] = `${existingValue} ${value}`.trim();
        }
      }

      for (const field of profile.fields) {
        if (!(field.key in record)) {
          record[field.key] = '';
        }
      }

      return record;
    });
  }

  validateRecords(
    profile: ImportProfileDefinition,
    records: Record<string, any>[],
  ): ImportValidationRow[] {
    const rows: ImportValidationRow[] = records.map((record, index) => ({
      rowNumber: index + 2,
      record: { ...record },
      issues: this.validateRow(profile, record),
      valid: false,
      ignored: false,
    }));

    for (const keys of profile.duplicateKeys) {
      const tracker = new Map<string, number[]>();
      rows.forEach((row, index) => {
        const signature = keys
          .map((key) => this.normalizeCell(row.record[key]))
          .join('|');
        if (
          !signature ||
          signature
            .split('|')
            .some((part) => !part)
        ) {
          return;
        }
        const existing = tracker.get(signature) || [];
        existing.push(index);
        tracker.set(signature, existing);
      });

      tracker.forEach((indexes) => {
        if (indexes.length < 2) return;
        indexes.forEach((index) => {
          const duplicateLabel = keys
            .map(
              (key) =>
                profile.fields.find((field) => field.key === key)?.label || key,
            )
            .join(' + ');
          rows[index].issues.push(`Duplicate ${duplicateLabel} found in upload file.`);
        });
      });
    }

    return rows.map((row) => ({
      ...row,
      issues: Array.from(new Set(row.issues)),
      valid: row.issues.length === 0,
    }));
  }

  executeImport(
    profile: ImportProfileDefinition,
    records: Record<string, any>[],
    skippedCount: number,
  ): Observable<ImportExecutionResult> {
    if (!records.length) {
      return of({
        persisted: false,
        importedCount: 0,
        failedCount: 0,
        skippedCount,
        failedRows: [],
        mode: 'api-pending',
        message: 'There are no valid rows available for import.',
      });
    }

    if (profile.id === 'employees') {
      return this.importEmployees(records, skippedCount);
    }

    return this.http
      .post<any>(`${this.apiUrl}/imports/wizard`, {
        module: profile.id,
        rows: records,
      })
      .pipe(
        map((res) => ({
          persisted: true,
          importedCount: Number(res?.importedCount ?? records.length),
          failedCount: Number(res?.failedCount ?? 0),
          skippedCount,
          failedRows: Array.isArray(res?.failedRows) ? res.failedRows : [],
          mode: 'bulk-api' as const,
          message:
            res?.message ||
            `${records.length} ${profile.label.toLowerCase()} record(s) imported successfully.`,
        })),
        catchError(() =>
          of({
            persisted: false,
            importedCount: 0,
            failedCount: records.length,
            skippedCount,
            failedRows: records.map((_, index) => ({
              rowNumber: index + 2,
              message:
                'Bulk import API is not configured on the backend yet for this module.',
            })),
            mode: 'api-pending' as const,
            message:
              'Frontend validation is ready, but this module still needs a backend bulk-import endpoint for final persistence.',
          }),
        ),
      );
  }

  downloadErrorReport(rows: ImportValidationRow[], fileName: string): void {
    const headers = ['Row Number', 'Issues', 'Data'];
    const csv = [
      headers.join(','),
      ...rows.map((row) => {
        const payload = JSON.stringify(row.record).replace(/"/g, '""');
        return [
          row.rowNumber,
          `"${row.issues.join(' | ').replace(/"/g, '""')}"`,
          `"${payload}"`,
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  private validateRow(
    profile: ImportProfileDefinition,
    record: Record<string, any>,
  ): string[] {
    const issues: string[] = [];
    const allValues = Object.values(record).map((value) =>
      String(value ?? '').trim(),
    );
    if (allValues.every((value) => !value)) {
      issues.push('Row is empty after mapping.');
      return issues;
    }

    for (const field of profile.fields) {
      const rawValue = String(record[field.key] ?? '').trim();
      if (field.required && !rawValue) {
        issues.push(`${field.label} is required.`);
        continue;
      }
      if (!rawValue) continue;

      if (
        field.type === 'email' &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawValue)
      ) {
        issues.push(`${field.label} must be a valid email address.`);
      }

      if (
        (field.type === 'number' || field.type === 'currency') &&
        Number.isNaN(Number(rawValue))
      ) {
        issues.push(`${field.label} must be a valid number.`);
      }

      if (field.type === 'date' && Number.isNaN(Date.parse(rawValue))) {
        issues.push(`${field.label} must be a valid date.`);
      }
    }

    return issues;
  }

  private importEmployees(
    records: Record<string, any>[],
    skippedCount: number,
  ): Observable<ImportExecutionResult> {
    const requests = records.map((record, index) =>
      this.employeeService.createEmployee(this.buildEmployeePayload(record)).pipe(
        map(() => ({ ok: true, rowNumber: index + 2 })),
        catchError((error) =>
          of({
            ok: false,
            rowNumber: index + 2,
            message:
              error?.error?.message ||
              error?.message ||
              'Failed to create employee.',
          }),
        ),
      ),
    );

    return forkJoin(requests).pipe(
      map((results) => {
        const failedRows = results
          .filter((result) => !result.ok)
          .map((result) => ({
            rowNumber: result.rowNumber,
            message: (result as any).message,
          }));

        return {
          persisted: failedRows.length < results.length,
          importedCount: results.length - failedRows.length,
          failedCount: failedRows.length,
          skippedCount,
          failedRows,
          mode: 'employee-api' as const,
          message:
            failedRows.length === 0
              ? 'All valid employee rows were imported successfully.'
              : 'Some employee rows could not be created. Download the error report and retry those rows.',
        };
      }),
    );
  }

  private buildEmployeePayload(record: Record<string, any>): Record<string, any> {
    return {
      firstName: record['firstName'] || '',
      lastName: record['lastName'] || '',
      email: record['email'] || '',
      employeeCode: record['employeeCode'] || '',
      phone: record['phone'] || '',
      joinDate: record['joinDate'] || null,
      department: record['department'] || null,
      designation: record['designation'] || null,
    };
  }

  private normalize(value: string): string {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  }

  private normalizeCell(value: unknown): string {
    return String(value ?? '').trim().toLowerCase();
  }
}
