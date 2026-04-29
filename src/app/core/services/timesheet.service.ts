import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export type TimesheetStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'sent_back'
  | 'locked';

export interface TimesheetTimelineEntry {
  action: string;
  note: string | null;
  actorEmployeeId: number | null;
  actorName: string | null;
  createdAt: string | null;
}

export interface TimesheetRecord {
  id: number;
  employee_id?: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string | null;
  managerId: number | null;
  orgId: number;
  projectId: number | null;
  project_id?: number | null;
  taskId: number | null;
  task_id?: number | null;
  projectName: string | null;
  project?: { id: number; name: string } | null;
  taskName: string | null;
  clientName: string | null;
  department: string | null;
  designation: string | null;
  entryMode: 'daily' | 'weekly';
  date?: string;
  workDate: string;
  log_date?: string;
  weekStart: string | null;
  startTime: string | null;
  endTime: string | null;
  hours?: number;
  hoursWorked?: number;
  hours_logged?: number;
  totalHours: number;
  isBillable: boolean;
  status: TimesheetStatus;
  description: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  approvedBy: number | null;
  lockedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  timeline: TimesheetTimelineEntry[];
}

export type Timesheet = TimesheetRecord;

export interface TimesheetFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  employeeId?: number | string;
  projectId?: number | string;
  clientName?: string;
  department?: string;
}

export interface TimesheetPayload {
  projectId?: number | null;
  taskId?: number | null;
  clientName?: string | null;
  entryMode?: 'daily' | 'weekly';
  workDate: string;
  weekStart?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  totalHours?: number | null;
  hoursWorked?: number | null;
  isBillable?: boolean;
  description?: string;
  status?: 'draft' | 'pending';
}

export interface TimesheetReviewPayload {
  action: 'approve' | 'reject' | 'send_back' | 'lock';
  note?: string;
}

export interface TimesheetBulkReviewPayload {
  ids: number[];
  action: 'approve' | 'reject' | 'send_back';
  note?: string;
}

export interface TimesheetReportSummary {
  totalEntries: number;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  approvedEntries: number;
  pendingEntries: number;
}

export interface TimesheetReportBucket {
  projectName?: string;
  employeeName?: string;
  employeeCode?: string | null;
  hours: number;
  billableHours: number;
  nonBillableHours: number;
}

export interface TimesheetReportResponse {
  summary: TimesheetReportSummary;
  byProject: TimesheetReportBucket[];
  byEmployee: TimesheetReportBucket[];
  entries: TimesheetRecord[];
}

@Injectable({
  providedIn: 'root',
})
export class TimesheetService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private normalizeRecord(record: any): TimesheetRecord {
    const normalizedDate = record?.workDate ?? record?.log_date ?? record?.date ?? '';
    const normalizedHours = Number(
      record?.totalHours ?? record?.hoursWorked ?? record?.hours_logged ?? record?.hours ?? 0,
    );
    const projectId = record?.projectId ?? record?.project_id ?? record?.project?.id ?? null;
    const projectName = record?.projectName ?? record?.project?.name ?? null;
    const taskId = record?.taskId ?? record?.task_id ?? null;

    return {
      ...record,
      employee_id: record?.employee_id ?? record?.employeeId,
      projectId,
      project_id: projectId,
      taskId,
      task_id: taskId,
      projectName,
      project: projectId ? { id: Number(projectId), name: projectName || 'Project' } : null,
      date: normalizedDate,
      workDate: normalizedDate,
      log_date: normalizedDate,
      hours: normalizedHours,
      hoursWorked: normalizedHours,
      hours_logged: normalizedHours,
      totalHours: normalizedHours,
      timeline: Array.isArray(record?.timeline) ? record.timeline : [],
    } as TimesheetRecord;
  }

  private toParams(filters?: TimesheetFilters): HttpParams {
    let params = new HttpParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && `${value}`.trim() !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }

  getTimesheets(filters?: TimesheetFilters): Observable<TimesheetRecord[]> {
    return this.http
      .get<any>(`${this.apiUrl}/timesheets`, { params: this.toParams(filters) })
      .pipe(
        map((res) =>
          Array.isArray(res?.data)
            ? res.data.map((item: any) => this.normalizeRecord(item))
            : [],
        ),
        catchError(() => of([])),
      );
  }

  getTimesheet(id: number): Observable<TimesheetRecord | null> {
    return this.http.get<any>(`${this.apiUrl}/timesheets/${id}`).pipe(
      map((res) => (res?.data ? this.normalizeRecord(res.data) : null)),
      catchError(() => of(null)),
    );
  }

  createTimesheet(payload: TimesheetPayload): Observable<TimesheetRecord> {
    return this.http
      .post<any>(`${this.apiUrl}/timesheets`, payload)
      .pipe(map((res) => this.normalizeRecord(res.data)));
  }

  updateTimesheet(id: number, payload: TimesheetPayload): Observable<TimesheetRecord> {
    return this.http
      .put<any>(`${this.apiUrl}/timesheets/${id}`, payload)
      .pipe(map((res) => this.normalizeRecord(res.data)));
  }

  submitTimesheet(id: number): Observable<TimesheetRecord> {
    return this.http
      .post<any>(`${this.apiUrl}/timesheets/${id}/submit`, {})
      .pipe(map((res) => this.normalizeRecord(res.data)));
  }

  getApprovalQueue(filters?: TimesheetFilters): Observable<TimesheetRecord[]> {
    return this.http
      .get<any>(`${this.apiUrl}/timesheets/approvals`, {
        params: this.toParams(filters),
      })
      .pipe(
        map((res) =>
          Array.isArray(res?.data)
            ? res.data.map((item: any) => this.normalizeRecord(item))
            : [],
        ),
        catchError(() => of([])),
      );
  }

  getApprovalDetail(id: number): Observable<TimesheetRecord | null> {
    return this.http.get<any>(`${this.apiUrl}/timesheets/approvals/${id}`).pipe(
      map((res) => (res?.data ? this.normalizeRecord(res.data) : null)),
      catchError(() => of(null)),
    );
  }

  reviewTimesheet(id: number, payload: TimesheetReviewPayload): Observable<TimesheetRecord> {
    return this.http
      .post<any>(`${this.apiUrl}/timesheets/approvals/${id}/action`, payload)
      .pipe(map((res) => this.normalizeRecord(res.data)));
  }

  bulkReviewTimesheets(payload: TimesheetBulkReviewPayload): Observable<any[]> {
    return this.http
      .post<any>(`${this.apiUrl}/timesheets/approvals/bulk-action`, payload)
      .pipe(map((res) => (Array.isArray(res?.data) ? res.data : [])));
  }

  getReports(filters?: TimesheetFilters): Observable<TimesheetReportResponse> {
    return this.http
      .get<any>(`${this.apiUrl}/timesheets/reports`, {
        params: this.toParams(filters),
      })
      .pipe(
        map((res) => res?.data ?? {
          summary: {
            totalEntries: 0,
            totalHours: 0,
            billableHours: 0,
            nonBillableHours: 0,
            approvedEntries: 0,
            pendingEntries: 0,
          },
          byProject: [],
          byEmployee: [],
          entries: [],
        }),
        catchError(() =>
          of({
            summary: {
              totalEntries: 0,
              totalHours: 0,
              billableHours: 0,
              nonBillableHours: 0,
              approvedEntries: 0,
              pendingEntries: 0,
            },
            byProject: [],
            byEmployee: [],
            entries: [],
          }),
        ),
        map((report) => ({
          ...report,
          entries: Array.isArray(report?.entries)
            ? report.entries.map((item: any) => this.normalizeRecord(item))
            : [],
        })),
      );
  }
}
