import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLogService, AuditAction, AuditModule } from './audit-log.service';

export interface RegularizationRequest {
    id: number;
    employeeId: number;
    regularizationDate: string;
    type: 'late_arrival' | 'early_departure' | 'missed_punch' | 'overtime' | 'other';
    checkIn?: string;
    checkOut?: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: number;
    approvedAt?: string;
    rejectionNote?: string;
    createdAt: string;
    employee?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class RegularizationService {
    private http = inject(HttpClient);
    private auditLogService = inject(AuditLogService);
    private readonly apiUrl = environment.apiUrl;

    private normalizeRegularization(raw: any): RegularizationRequest {
        return {
            id: Number(raw.id),
            employeeId: Number(raw.employeeId ?? raw.employee_id ?? 0),
            regularizationDate: raw.regularizationDate ?? raw.regularization_date,
            type: raw.type,
            checkIn: raw.checkIn ?? raw.check_in,
            checkOut: raw.checkOut ?? raw.check_out,
            reason: raw.reason ?? '',
            status: raw.status,
            approvedBy: raw.approvedBy ?? raw.approved_by,
            approvedAt: raw.approvedAt ?? raw.approved_at,
            rejectionNote: raw.rejectionNote ?? raw.rejection_note,
            createdAt: raw.createdAt ?? raw.created_at,
            employee: raw.employee ? {
                id: Number(raw.employee.id),
                firstName: raw.employee.firstName ?? raw.employee.first_name,
                lastName: raw.employee.lastName ?? raw.employee.last_name,
                email: raw.employee.email
            } : undefined
        };
    }

    /**
     * Get list of regularization requests
     */
    getRegularizations(): Observable<RegularizationRequest[]> {
        return this.http.get<any>(`${this.apiUrl}/regularizations`).pipe(
            map(res => (res.data || []).map((item: any) => this.normalizeRegularization(item)))
        );
    }

    /**
     * Create a new regularization request
     */
    createRegularization(data: {
        regularizationDate: string;
        type: string;
        checkIn?: string;
        checkOut?: string;
        reason: string;
    }): Observable<RegularizationRequest> {
        return this.http.post<any>(`${this.apiUrl}/regularizations`, data).pipe(
            map(res => this.normalizeRegularization(res.data)),
            tap((request) => {
                this.auditLogService.logAction(
                    AuditAction.CREATE,
                    AuditModule.ATTENDANCE,
                    {
                        entityName: 'Regularization Request',
                        entityId: request.id?.toString(),
                        newValues: {
                            regularizationDate: request.regularizationDate,
                            type: request.type,
                            reason: request.reason,
                            status: request.status
                        }
                    }
                ).subscribe();
            })
        );
    }

    /**
     * Update a regularization request
     */
    updateRegularization(id: number, data: {
        regularizationDate?: string;
        type?: string;
        checkIn?: string;
        checkOut?: string;
        reason?: string;
    }): Observable<RegularizationRequest> {
        return this.http.put<any>(`${this.apiUrl}/regularizations/${id}`, data).pipe(
            map(res => this.normalizeRegularization(res.data)),
            tap((request) => {
                this.auditLogService.logAction(
                    AuditAction.UPDATE,
                    AuditModule.ATTENDANCE,
                    {
                        entityName: 'Regularization Request',
                        entityId: id.toString(),
                        newValues: data
                    }
                ).subscribe();
            })
        );
    }

    /**
     * Approve or reject a regularization request (Admin)
     */
    processRegularization(id: number, action: 'approved' | 'rejected', rejectionNote?: string): Observable<RegularizationRequest> {
        return this.http.put<any>(`${this.apiUrl}/regularizations/${id}/status`, {
            status: action,
            rejectionNote
        }).pipe(
            map(res => this.normalizeRegularization(res.data)),
            tap((request) => {
                const auditAction = action === 'approved' ? AuditAction.APPROVE : AuditAction.REJECT;
                this.auditLogService.logAction(
                    auditAction,
                    AuditModule.ATTENDANCE,
                    {
                        entityName: 'Regularization Request',
                        entityId: id.toString(),
                        oldValues: { status: 'pending' },
                        newValues: {
                            status: request.status,
                            rejectionNote: rejectionNote
                        }
                    }
                ).subscribe();
            })
        );
    }
}

