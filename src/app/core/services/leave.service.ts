import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLogService, AuditAction, AuditModule } from './audit-log.service';

export interface LeaveRequest {
    id: number;
    employeeId: number;
    orgId: number;
    leaveTypeId: number;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    supportingDoc: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    approvedBy: number | null;
    approvedAt: string | null;
    rejectionNote: string | null;
    cancelledBy: number | null;
    cancelledAt: string | null;
    createdAt: string;
    leaveType?: LeaveTypeBalance;
    employee?: {
        id: number;
        fullName?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        manager?: {
            id: number;
            fullName?: string;
            firstName?: string;
            lastName?: string;
        };
    };
}

export type LeaveTypeBalance = {
    id: number;
    orgId: number;
    typeName: string;
    daysAllowed: number;
    carryForward: boolean;
    maxCarryDays: number;
    isPaid: boolean;
    requiresDoc: boolean;
    type: string;
    color: string;
    year: number;
    total: number;
    used: number;
    remaining: number;
};

export type LeavesTypesResponse = {
    status: 'success';
    data: LeaveTypeBalance[];
};

@Injectable({
    providedIn: 'root'
})
export class LeaveService {
    private http = inject(HttpClient);
    private auditLogService = inject(AuditLogService);
    private readonly apiUrl = environment.apiUrl;

    private getLeaveTypeColor(typeName: string): string {
        const key = typeName.toLowerCase();
        if (key.includes('casual')) return '#f59e0b';
        if (key.includes('sick')) return '#10b981';
        if (key.includes('earned')) return '#6366f1';
        if (key.includes('maternity')) return '#ef4444';
        return '#0ea5e9';
    }

    private extractList<T>(res: any): T[] {
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.leaveTypes)) return res.leaveTypes;
        if (Array.isArray(res?.data?.leaveTypes)) return res.data.leaveTypes;
        return [];
    }

    private normalizeLeaveType(raw: any): LeaveTypeBalance {
        const typeName = raw.typeName || raw.type_name || raw.name || 'Unknown';
        const daysAllowed = Number(raw.daysAllowed ?? raw.days_allowed ?? 0);
        const used = Number(raw.used ?? 0);
        const remaining = Math.max(daysAllowed - used, 0);

        return {
            id: Number(raw.id),
            orgId: Number(raw.orgId ?? raw.org_id ?? 0),
            typeName,
            daysAllowed,
            carryForward: Boolean(raw.carryForward ?? raw.carry_forward),
            maxCarryDays: Number(raw.maxCarryDays ?? raw.max_carry_days ?? 0),
            isPaid: Boolean(raw.isPaid ?? raw.is_paid),
            requiresDoc: Boolean(raw.requiresDoc ?? raw.requires_doc),
            type: typeName,
            color: this.getLeaveTypeColor(typeName),
            year: new Date().getFullYear(),
            total: daysAllowed,
            used,
            remaining
        };
    }

    private normalizeLeaveRequest(raw: any): LeaveRequest {
        return {
            id: Number(raw.id),
            employeeId: Number(raw.employeeId ?? raw.employee_id ?? 0),
            orgId: Number(raw.orgId ?? raw.org_id ?? 0),
            leaveTypeId: Number(raw.leaveTypeId ?? raw.leave_type_id ?? 0),
            startDate: raw.startDate ?? raw.start_date,
            endDate: raw.endDate ?? raw.end_date,
            totalDays: Number(raw.totalDays ?? raw.total_days ?? 0),
            reason: raw.reason ?? '',
            supportingDoc: raw.supportingDoc ?? raw.supporting_doc ?? null,
            status: raw.status,
            approvedBy: raw.approvedBy ?? raw.approved_by ?? null,
            approvedAt: raw.approvedAt ?? raw.approved_at ?? null,
            rejectionNote: raw.rejectionNote ?? raw.rejection_note ?? null,
            cancelledBy: raw.cancelledBy ?? raw.cancelled_by ?? null,
            cancelledAt: raw.cancelledAt ?? raw.cancelled_at ?? null,
            createdAt: raw.createdAt ?? raw.created_at,
            leaveType: raw.leaveType ? this.normalizeLeaveType(raw.leaveType) : undefined,
            employee: raw.employee
                ? {
                    id: Number(raw.employee.id),
                    fullName: raw.employee.fullName ?? raw.employee.full_name,
                    firstName: raw.employee.firstName ?? raw.employee.first_name,
                    lastName: raw.employee.lastName ?? raw.employee.last_name,
                    email: raw.employee.email,
                    manager: raw.employee.manager ? {
                        id: Number(raw.employee.manager.id),
                        fullName: raw.employee.manager.fullName ?? raw.employee.manager.full_name,
                        firstName: raw.employee.manager.firstName ?? raw.employee.manager.first_name,
                        lastName: raw.employee.manager.lastName ?? raw.employee.manager.last_name,
                    } : undefined
                }
                : undefined
        };
    }

    getLeaveTypes(): Observable<LeavesTypesResponse> {
        return this.http.get<any>(`${this.apiUrl}/leaves/types`).pipe(
            map((res) => ({
                status: 'success' as const,
                data: this.extractList<any>(res).map((t) => this.normalizeLeaveType(t))
            })),
            catchError(() =>
                this.http.get<any>(`${this.apiUrl}/leave-types`).pipe(
                    map((res) => ({
                        status: 'success' as const,
                        data: this.extractList<any>(res).map((t) => this.normalizeLeaveType(t))
                    }))
                )
            )
        );
    }

    getLeaveHistory(): Observable<LeaveRequest[]> {
        return this.http.get<any>(`${this.apiUrl}/leaves`).pipe(
            map((res) => this.extractList<any>(res).map((item) => this.normalizeLeaveRequest(item)))
        );
    }

    applyLeave(request: { leaveTypeId: number; startDate: string; endDate: string; reason: string }): Observable<LeaveRequest> {
        return this.http.post<any>(`${this.apiUrl}/leaves`, request).pipe(
            map((res) => this.normalizeLeaveRequest(res?.data ?? res)),
            tap((createdLeave) => {
                this.auditLogService.logAction(
                    AuditAction.CREATE,
                    AuditModule.LEAVES,
                    {
                        entityName: 'Leave Request',
                        entityId: createdLeave.id?.toString(),
                        newValues: {
                            leaveTypeId: request.leaveTypeId,
                            startDate: request.startDate,
                            endDate: request.endDate,
                            totalDays: createdLeave.totalDays,
                            reason: request.reason,
                            status: createdLeave.status
                        }
                    }
                ).subscribe();
            })
        );
    }

    updateLeave(id: number, request: { leaveTypeId: number; startDate: string; endDate: string; reason: string }): Observable<LeaveRequest> {
        return this.http.put<any>(`${this.apiUrl}/leaves/${id}`, request).pipe(
            map((res) => this.normalizeLeaveRequest(res?.data ?? res)),
            tap((updatedLeave) => {
                this.auditLogService.logAction(
                    AuditAction.UPDATE,
                    AuditModule.LEAVES,
                    {
                        entityName: 'Leave Request',
                        entityId: id.toString(),
                        newValues: {
                            leaveTypeId: request.leaveTypeId,
                            startDate: request.startDate,
                            endDate: request.endDate,
                            reason: request.reason,
                            status: updatedLeave.status
                        }
                    }
                ).subscribe();
            })
        );
    }

    updateLeaveStatus(id: number, status: string, rejectionNote?: string): Observable<LeaveRequest> {
        return this.http.put<any>(`${this.apiUrl}/leaves/${id}/status`, { status, rejectionNote }).pipe(
            map((res) => this.normalizeLeaveRequest(res?.data ?? res)),
            tap((updatedLeave) => {
                const action = status === 'approved' ? AuditAction.APPROVE : 
                               status === 'rejected' ? AuditAction.REJECT : 
                               AuditAction.UPDATE;
                
                this.auditLogService.logAction(
                    action,
                    AuditModule.LEAVES,
                    {
                        entityName: 'Leave Request',
                        entityId: id.toString(),
                        oldValues: { status: 'pending' },
                        newValues: {
                            status: updatedLeave.status,
                            rejectionNote: rejectionNote,
                            approvedBy: updatedLeave.approvedBy,
                            approvedAt: updatedLeave.approvedAt
                        }
                    }
                ).subscribe();
            })
        );
    }

    withdrawLeave(id: number): Observable<LeaveRequest> {
        return this.updateLeaveStatus(id, 'cancelled');
    }

    // ============ LEAVE BALANCES ============

    /**
     * Get leave balances for the current user or a specific employee
     */
    getLeaveBalances(year?: number): Observable<LeaveTypeBalance[]> {
        let params = '';
        if (year) {
            params = `?year=${year}`;
        }
        return this.http.get<any>(`${this.apiUrl}/leaves/balances${params}`).pipe(
            map(res => (res.data || []).map((item: any) => this.normalizeLeaveType(item)))
        );
    }

    /**
     * Adjust leave balance (Admin only)
     */
    adjustLeaveBalance(data: {
        leaveTypeId: number;
        employeeId: number;
        year: number;
        adjustment: number;
        reason: string;
    }): Observable<LeaveTypeBalance> {
        return this.http.post<any>(`${this.apiUrl}/leaves/balances/adjust`, data).pipe(
            map(res => this.normalizeLeaveType(res.data)),
            tap((balance) => {
                this.auditLogService.logAction(
                    AuditAction.UPDATE,
                    AuditModule.LEAVES,
                    {
                        entityName: 'Leave Balance Adjustment',
                        entityId: `${data.employeeId}-${data.leaveTypeId}`,
                        newValues: {
                            leaveTypeId: data.leaveTypeId,
                            employeeId: data.employeeId,
                            year: data.year,
                            adjustment: data.adjustment,
                            reason: data.reason,
                            newBalance: balance.remaining
                        }
                    }
                ).subscribe();
            })
        );
    }
}

