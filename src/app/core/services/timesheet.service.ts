import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Timesheet {
    id: number;
    employee_id?: number;
    project_id?: number | null;
    projectId?: number | null;
    date?: string;
    workDate?: string;
    log_date?: string;
    hours?: number;
    hoursWorked?: number;
    hours_logged?: number;
    status?: 'pending' | 'approved' | 'rejected';
    description?: string;
    project?: {
        id: number;
        name: string;
    } | null;
}

@Injectable({
    providedIn: 'root'
})
export class TimesheetService {
    private http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl;

    getTimesheets(): Observable<Timesheet[]> {
        return this.http.get<any>(`${this.apiUrl}/timesheets`).pipe(
            map(res => res.data)
        );
    }

    createTimesheet(timesheet: Partial<Timesheet>): Observable<Timesheet> {
        return this.http.post<any>(`${this.apiUrl}/timesheets`, timesheet).pipe(
            map(res => res.data)
        );
    }
}
