import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { AuthService } from '../../../../core/services/auth.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  ImportExecutionResult,
  ImportProfileDefinition,
  ImportValidationRow,
  ImportWizardService,
  ParsedImportFile,
} from './import-wizard.service';

@Component({
  selector: 'app-import-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './import-wizard.component.html',
})
export class ImportWizardComponent {
  private readonly fb = inject(FormBuilder);
  private readonly wizardService = inject(ImportWizardService);
  private readonly toastService = inject(ToastService);
  private readonly permissionService = inject(PermissionService);
  private readonly authService = inject(AuthService);

  readonly steps = [
    { id: 1, kicker: 'Upload', label: 'File Upload' },
    { id: 2, kicker: 'Map', label: 'Field Mapping' },
    { id: 3, kicker: 'Validate', label: 'Data Validation' },
    { id: 4, kicker: 'Preview', label: 'Preview' },
    { id: 5, kicker: 'Import', label: 'Final Import' },
  ] as const;

  readonly previewFilters = [
    { id: 'all', label: 'All' },
    { id: 'valid', label: 'Valid' },
    { id: 'invalid', label: 'Invalid' },
  ] as const;

  readonly profiles = signal(this.wizardService.getProfiles());
  readonly selectedProfileId = signal<string>(this.profiles()[0]?.id || 'employees');
  readonly step = signal<1 | 2 | 3 | 4 | 5>(1);
  readonly dragActive = signal(false);
  readonly uploadError = signal('');
  readonly mappingIssue = signal('');
  readonly parsedFile = signal<ParsedImportFile | null>(null);
  readonly mappedRecords = signal<Record<string, any>[]>([]);
  readonly validationRows = signal<ImportValidationRow[]>([]);
  readonly previewFilter = signal<'all' | 'valid' | 'invalid'>('all');
  readonly importInProgress = signal(false);
  readonly importResult = signal<ImportExecutionResult | null>(null);

  mappingForm = this.fb.group({});

  readonly selectedProfile = computed<ImportProfileDefinition>(() => {
    return (
      this.wizardService.getProfile(this.selectedProfileId()) ||
      this.wizardService.getProfiles()[0]
    );
  });
  readonly requiredFields = computed(() =>
    this.selectedProfile().fields.filter((field) => field.required),
  );
  readonly duplicateMappings = computed(() => {
    const valueMap = Object.values(this.mappingForm.getRawValue() || {}).filter(
      (value) => value && value !== '__skip',
    ) as string[];
    return valueMap.filter((value, index) => valueMap.indexOf(value) !== index);
  });
  readonly mappedFieldCount = computed(() => {
    const values = Object.values(this.mappingForm.getRawValue() || {});
    return new Set(values.filter((value) => value && value !== '__skip')).size;
  });
  readonly invalidRows = computed(() =>
    this.validationRows().filter((row) => !row.valid),
  );
  readonly validRowCount = computed(
    () =>
      this.validationRows().filter((row) => row.valid && !row.ignored).length,
  );
  readonly invalidRowCount = computed(
    () => this.validationRows().filter((row) => !row.valid).length,
  );
  readonly ignoredRowCount = computed(
    () => this.validationRows().filter((row) => row.ignored).length,
  );
  readonly blockedRowCount = computed(
    () => this.validationRows().filter((row) => !row.valid && !row.ignored).length,
  );
  readonly importableRows = computed(() =>
    this.validationRows()
      .filter((row) => row.valid && !row.ignored)
      .map((row) => row.record),
  );
  readonly previewRows = computed(() => {
    const rows = this.validationRows();
    switch (this.previewFilter()) {
      case 'valid':
        return rows.filter((row) => row.valid && !row.ignored);
      case 'invalid':
        return rows.filter((row) => !row.valid || row.ignored);
      default:
        return rows;
    }
  });
  readonly previewColumns = computed(() =>
    this.selectedProfile().fields.slice(0, 6),
  );
  readonly editableFields = computed(() =>
    this.selectedProfile().fields.slice(0, 6),
  );
  readonly maxFileSizeLabel = computed(() =>
    this.formatBytes(this.wizardService.maxFileSizeBytes),
  );

  canManage(): boolean {
    return this.permissionService.canManageSettings(
      this.authService.getStoredUser(),
    );
  }

  canOpenStep(stepId: number): boolean {
    if (stepId === 1) return true;
    if (stepId === 2) return !!this.parsedFile();
    if (stepId === 3) return this.mappedRecords().length > 0;
    if (stepId === 4) return this.validationRows().length > 0;
    if (stepId === 5) return !!this.importResult();
    return false;
  }

  goToStep(stepId: number): void {
    if (!this.canOpenStep(stepId)) return;
    this.step.set(stepId as 1 | 2 | 3 | 4 | 5);
  }

  selectProfile(profileId: string): void {
    if (this.selectedProfileId() === profileId) return;
    this.selectedProfileId.set(profileId);
    this.resetWizard(false);
  }

  async onFileInput(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    await this.loadFile(file);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.dragActive.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    await this.loadFile(file);
  }

  async loadFile(file: File): Promise<void> {
    this.uploadError.set('');
    this.importResult.set(null);
    try {
      const parsed = await this.wizardService.parseFile(file);
      this.parsedFile.set(parsed);
      this.mappingForm = this.fb.group(
        Object.fromEntries(
          parsed.headers.map((header) => [
            header,
            this.wizardService.suggestMapping(header, this.selectedProfile()),
          ]),
        ),
      );
      this.step.set(2);
      this.toastService.success('File uploaded successfully.');
    } catch (error: any) {
      const message = error?.message || 'Failed to read the selected file.';
      this.uploadError.set(message);
      this.toastService.error(message);
    }
  }

  canPrepareValidation(): boolean {
    return !!this.parsedFile() && this.duplicateMappings().length === 0;
  }

  prepareValidation(): void {
    const parsedFile = this.parsedFile();
    if (!parsedFile) return;

    const mapping = this.mappingForm.getRawValue() as Record<string, string>;
    const issue = this.wizardService.getMappingIssue(
      this.selectedProfile(),
      mapping,
    );
    if (issue) {
      this.mappingIssue.set(issue);
      this.toastService.error(issue);
      return;
    }

    this.mappingIssue.set('');
    this.mappedRecords.set(
      this.wizardService.mapRows(this.selectedProfile(), parsedFile.rows, mapping),
    );
    this.runValidation();
    this.step.set(3);
  }

  runValidation(): void {
    this.validationRows.set(
      this.wizardService.validateRecords(
        this.selectedProfile(),
        this.mappedRecords(),
      ),
    );
  }

  updateRowValue(rowNumber: number, fieldKey: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.mappedRecords.update((records) =>
      records.map((record, index) =>
        index + 2 === rowNumber ? { ...record, [fieldKey]: value } : record,
      ),
    );
    this.runValidation();
  }

  toggleIgnoreRow(rowNumber: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.validationRows.update((rows) =>
      rows.map((row) =>
        row.rowNumber === rowNumber ? { ...row, ignored: checked } : row,
      ),
    );
  }

  displayFieldValue(row: ImportValidationRow, fieldKey: string): string {
    const value = row.record[fieldKey];
    return value === undefined || value === null ? '' : String(value);
  }

  async executeImport(): Promise<void> {
    this.importInProgress.set(true);
    try {
      const result = await firstValueFrom(
        this.wizardService.executeImport(
          this.selectedProfile(),
          this.importableRows(),
          this.validationRows().filter((row) => row.ignored).length,
        ),
      );
      this.importResult.set(result);
      this.step.set(5);
      this.toastService.success('Import execution completed.');
    } catch (error: any) {
      this.toastService.error(error?.message || 'Import failed.');
    } finally {
      this.importInProgress.set(false);
    }
  }

  downloadErrorReport(): void {
    const failures =
      this.importResult()?.failedRows?.map((failure) => ({
        rowNumber: failure.rowNumber,
        issues: [failure.message],
        record: {},
        valid: false,
        ignored: false,
      })) || [];

    const rows =
      this.invalidRows().length > 0
        ? this.invalidRows()
        : (failures as ImportValidationRow[]);

    if (!rows.length) return;
    this.wizardService.downloadErrorReport(
      rows,
      `import-errors-${this.selectedProfile().id}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
    );
  }

  downloadTemplate(): void {
    const worksheet = XLSX.utils.json_to_sheet([
      Object.fromEntries(
        this.selectedProfile().fields.map((field) => [
          field.label,
          field.sampleValue || '',
        ]),
      ),
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(
      workbook,
      `${this.selectedProfile().id}-import-template.xlsx`,
    );
  }

  startNewImport(): void {
    this.resetWizard(true);
    this.toastService.success('Import wizard reset.');
  }

  private resetWizard(clearFile: boolean): void {
    if (clearFile) {
      this.parsedFile.set(null);
    }
    this.mappingForm = this.fb.group({});
    this.mappedRecords.set([]);
    this.validationRows.set([]);
    this.previewFilter.set('all');
    this.importResult.set(null);
    this.mappingIssue.set('');
    this.uploadError.set('');
    this.step.set(1);
  }

  formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let index = 0;
    while (size >= 1024 && index < units.length - 1) {
      size /= 1024;
      index += 1;
    }
    return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
  }
}
