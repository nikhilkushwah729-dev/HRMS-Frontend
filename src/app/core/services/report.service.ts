import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, finalize, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AttendanceReport {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  department: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | 'holiday';
  lateMinutes: number;
  overtimeMinutes: number;
  workHours: number;
  breakMinutes: number;
}

export interface DailyReport {
  date: string;
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  onLeave: number;
  holidays: number;
  weekend: number;
  attendancePercentage: number;
}

export interface MonthlyReport {
  month: number;
  year: number;
  totalDays: number;
  workingDays: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  onLeave: number;
  averageAttendance: number;
  totalOvertimeHours: number;
  employeeReports: EmployeeMonthlyReport[];
}

export interface EmployeeMonthlyReport {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  department: string;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  onLeave: number;
  totalWorkHours: number;
  overtimeHours: number;
  lateMinutes: number;
  attendancePercentage: number;
}

export interface LateArrivalReport {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  department: string;
  date: string;
  checkInTime: string;
  scheduledTime: string;
  lateMinutes: number;
}

export interface AbsentReport {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  department: string;
  date: string;
  status: string;
  reason?: string;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  departmentId?: number;
  employeeId?: number;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reports`;

  // Loading state
  loading = signal<boolean>(false);

  /**
   * Get daily attendance report
   */
  getDailyReport(date: string, filters?: ReportFilters): Observable<DailyReport> {
    this.loading.set(true);
    let url = `${this.apiUrl}/daily?date=${date}`;
    
    if (filters?.departmentId) {
      url += `&departmentId=${filters.departmentId}`;
    }
    
    return this.http.get<any>(url).pipe(
      map(res => this.normalizeDailyReport(res?.data || res)),
      catchError((error) => this.handleRequestError(error, this.emptyDailyReport(date))),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Get monthly attendance report
   */
  getMonthlyReport(year: number, month: number, filters?: ReportFilters): Observable<MonthlyReport> {
    this.loading.set(true);
    let url = `${this.apiUrl}/monthly?year=${year}&month=${month}`;
    
    if (filters?.departmentId) {
      url += `&departmentId=${filters.departmentId}`;
    }
    if (filters?.employeeId) {
      url += `&employeeId=${filters.employeeId}`;
    }
    
    return this.http.get<any>(url).pipe(
      map(res => this.normalizeMonthlyReport(res?.data || res)),
      catchError((error) => this.handleRequestError(error, this.emptyMonthlyReport(year, month))),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Get attendance report for a date range
   */
  getAttendanceReport(startDate: string, endDate: string, filters?: ReportFilters): Observable<AttendanceReport[]> {
    this.loading.set(true);
    let url = `${this.apiUrl}/attendance?startDate=${startDate}&endDate=${endDate}`;
    
    if (filters?.departmentId) {
      url += `&departmentId=${filters.departmentId}`;
    }
    if (filters?.employeeId) {
      url += `&employeeId=${filters.employeeId}`;
    }
    if (filters?.status) {
      url += `&status=${filters.status}`;
    }
    
    return this.http.get<any>(url).pipe(
      map(res => this.normalizeAttendanceReports(res?.data || res || [])),
      catchError((error) => this.handleRequestError(error, [])),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Get late arrival report
   */
  getLateArrivals(startDate: string, endDate: string, filters?: ReportFilters): Observable<LateArrivalReport[]> {
    this.loading.set(true);
    let url = `${this.apiUrl}/late?startDate=${startDate}&endDate=${endDate}`;
    
    if (filters?.departmentId) {
      url += `&departmentId=${filters.departmentId}`;
    }
    if (filters?.employeeId) {
      url += `&employeeId=${filters.employeeId}`;
    }
    
    return this.http.get<any>(url).pipe(
      map(res => this.normalizeLateReports(res?.data || res || [])),
      catchError((error) => this.handleRequestError(error, [])),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Get absent report
   */
  getAbsentReport(startDate: string, endDate: string, filters?: ReportFilters): Observable<AbsentReport[]> {
    this.loading.set(true);
    let url = `${this.apiUrl}/absent?startDate=${startDate}&endDate=${endDate}`;
    
    if (filters?.departmentId) {
      url += `&departmentId=${filters.departmentId}`;
    }
    if (filters?.employeeId) {
      url += `&employeeId=${filters.employeeId}`;
    }
    
    return this.http.get<any>(url).pipe(
      map(res => this.normalizeAbsentReports(res?.data || res || [])),
      catchError((error) => this.handleRequestError(error, [])),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Get attendance summary/statistics
   */
  getAttendanceSummary(year: number, month: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/summary?year=${year}&month=${month}`).pipe(
      map(res => res?.data || res)
    );
  }

  /**
   * Export attendance report to Excel
   */
  exportToExcel(filters: ReportFilters): Observable<Blob> {
    let url = `${this.apiUrl}/export/excel`;
    const params = new URLSearchParams();
    
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.departmentId) params.set('departmentId', filters.departmentId.toString());
    if (filters.employeeId) params.set('employeeId', filters.employeeId.toString());
    if (filters.status) params.set('status', filters.status);
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    
    return this.http.get(url, { responseType: 'blob' }).pipe(
      catchError((error) => this.handleRequestError(error, new Blob()))
    );
  }

  /**
   * Export attendance report to PDF
   */
  exportToPdf(filters: ReportFilters): Observable<Blob> {
    let url = `${this.apiUrl}/export/pdf`;
    const params = new URLSearchParams();
    
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.departmentId) params.set('departmentId', filters.departmentId.toString());
    if (filters.employeeId) params.set('employeeId', filters.employeeId.toString());
    if (filters.status) params.set('status', filters.status);
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    
    return this.http.get(url, { responseType: 'blob' }).pipe(
      catchError((error) => this.handleRequestError(error, new Blob()))
    );
  }

  /**
   * Get weekly attendance data for charts
   */
  getWeeklyAttendance(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/weekly`).pipe(
      map(res => res?.data || res)
    );
  }

  /**
   * Get department-wise attendance
   */
  getDepartmentWiseAttendance(year: number, month: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/by-department?year=${year}&month=${month}`).pipe(
      map(res => res?.data || res)
    );
  }

  // Normalization methods

  private normalizeAttendanceReports(items: any[]): AttendanceReport[] {
    if (!Array.isArray(items)) return [];
    return items.map(item => this.normalizeAttendanceReport(item));
  }

  private normalizeAttendanceReport(item: any): AttendanceReport {
    return {
      id: Number(item?.id || 0),
      employeeId: Number(item?.employeeId || item?.employee_id || 0),
      employeeName: item?.employeeName || item?.employee_name || item?.employee?.fullName || 'Unknown',
      employeeCode: item?.employeeCode || item?.employee_code || item?.employee?.employeeCode || 'N/A',
      department: item?.department || item?.departmentName || item?.employee?.department?.name || 'General',
      date: item?.date || item?.attendance_date || new Date().toISOString().split('T')[0],
      checkInTime: item?.checkInTime || item?.check_in_time || null,
      checkOutTime: item?.checkOutTime || item?.check_out_time || null,
      status: item?.status || 'absent',
      lateMinutes: Number(item?.lateMinutes || item?.late_minutes || 0),
      overtimeMinutes: Number(item?.overtimeMinutes || item?.overtime_minutes || 0),
      workHours: Number(item?.workHours || item?.work_hours || 0),
      breakMinutes: Number(item?.breakMinutes || item?.break_minutes || 0)
    };
  }

  private normalizeDailyReport(data: any): DailyReport {
    return {
      date: data?.date || new Date().toISOString().split('T')[0],
      totalEmployees: Number(data?.totalEmployees || data?.total_employees || 0),
      present: Number(data?.present || 0),
      absent: Number(data?.absent || 0),
      late: Number(data?.late || 0),
      halfDay: Number(data?.halfDay || data?.half_day || 0),
      onLeave: Number(data?.onLeave || data?.on_leave || 0),
      holidays: Number(data?.holidays || 0),
      weekend: Number(data?.weekend || 0),
      attendancePercentage: Number(data?.attendancePercentage || data?.attendance_percentage || 0)
    };
  }

  private normalizeMonthlyReport(data: any): MonthlyReport {
    return {
      month: Number(data?.month || 1),
      year: Number(data?.year || new Date().getFullYear()),
      totalDays: Number(data?.totalDays || data?.total_days || 0),
      workingDays: Number(data?.workingDays || data?.working_days || 0),
      present: Number(data?.present || 0),
      absent: Number(data?.absent || 0),
      late: Number(data?.late || 0),
      halfDay: Number(data?.halfDay || data?.half_day || 0),
      onLeave: Number(data?.onLeave || data?.on_leave || 0),
      averageAttendance: Number(data?.averageAttendance || data?.average_attendance || 0),
      totalOvertimeHours: Number(data?.totalOvertimeHours || data?.total_overtime_hours || 0),
      employeeReports: this.normalizeEmployeeMonthlyReports(data?.employeeReports || data?.employee_reports || [])
    };
  }

  private normalizeEmployeeMonthlyReports(items: any[]): EmployeeMonthlyReport[] {
    if (!Array.isArray(items)) return [];
    return items.map(item => ({
      employeeId: Number(item?.employeeId || item?.employee_id || 0),
      employeeName: item?.employeeName || item?.employee_name || 'Unknown',
      employeeCode: item?.employeeCode || item?.employee_code || 'N/A',
      department: item?.department || 'General',
      present: Number(item?.present || 0),
      absent: Number(item?.absent || 0),
      late: Number(item?.late || 0),
      halfDay: Number(item?.halfDay || item?.half_day || 0),
      onLeave: Number(item?.onLeave || item?.on_leave || 0),
      totalWorkHours: Number(item?.totalWorkHours || item?.total_work_hours || 0),
      overtimeHours: Number(item?.overtimeHours || item?.overtime_hours || 0),
      lateMinutes: Number(item?.lateMinutes || item?.late_minutes || 0),
      attendancePercentage: Number(item?.attendancePercentage || item?.attendance_percentage || 0)
    }));
  }

  private normalizeLateReports(items: any[]): LateArrivalReport[] {
    if (!Array.isArray(items)) return [];
    return items.map(item => ({
      employeeId: Number(item?.employeeId || item?.employee_id || 0),
      employeeName: item?.employeeName || item?.employee_name || 'Unknown',
      employeeCode: item?.employeeCode || item?.employee_code || 'N/A',
      department: item?.department || 'General',
      date: item?.date || new Date().toISOString().split('T')[0],
      checkInTime: item?.checkInTime || item?.check_in_time || '--:--:--',
      scheduledTime: item?.scheduledTime || item?.scheduled_time || '09:00:00',
      lateMinutes: Number(item?.lateMinutes || item?.late_minutes || 0)
    }));
  }

  private normalizeAbsentReports(items: any[]): AbsentReport[] {
    if (!Array.isArray(items)) return [];
    return items.map(item => ({
      employeeId: Number(item?.employeeId || item?.employee_id || 0),
      employeeName: item?.employeeName || item?.employee_name || 'Unknown',
      employeeCode: item?.employeeCode || item?.employee_code || 'N/A',
      department: item?.department || 'General',
      date: item?.date || new Date().toISOString().split('T')[0],
      status: item?.status || 'absent',
      reason: item?.reason || ''
    }));
  }

  private handleRequestError<T>(error: any, fallbackValue: T): Observable<T> {
    const status = Number(error?.status || 0);
    if (status === 404 || status === 0 || status >= 500) {
      return of(fallbackValue);
    }
    return throwError(() => error);
  }

  private emptyDailyReport(date: string): DailyReport {
    return {
      date,
      totalEmployees: 0,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      onLeave: 0,
      holidays: 0,
      weekend: 0,
      attendancePercentage: 0
    };
  }

  private emptyMonthlyReport(year: number, month: number): MonthlyReport {
    return {
      month,
      year,
      totalDays: 0,
      workingDays: 0,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      onLeave: 0,
      averageAttendance: 0,
      totalOvertimeHours: 0,
      employeeReports: []
    };
  }

  // Helper method to download blob as file
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Format hours helper
  formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  // Calculate percentage
  calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }
}

