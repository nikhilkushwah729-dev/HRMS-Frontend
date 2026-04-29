import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
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

export interface LeaveApplyPayload {
    leaveTypeId: number;
    startDate: string;
    endDate: string;
    reason: string;
    supportingDoc?: string | null;
    durationType?: 'full_day' | 'half_day';
    halfDaySession?: 'first_half' | 'second_half' | null;
    requestKind?: 'leave' | 'short-day' | 'under-time' | 'wfh' | 'outdoor-duty';
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

export type MonthlyLeaveUsage = {
    month: string;
    monthIndex: number;
    paid: number;
    unpaid: number;
    pending: number;
    approved: number;
};

export type LeaveDashboardSummary = {
    entitlement: number;
    used: number;
    remaining: number;
    totalEmployees: number;
    onLeave: number;
    totalRequests: number;
    ownRequests: number;
    approvalQueue: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
};

export type LeaveTypeUsage = {
    leaveName: string;
    leaveShortName: string;
    totalLeaveCount: number;
    color?: string;
};

export type PaidUnpaidSummary = {
    paidCount: number;
    unPaidCount: number;
};

export type DepartmentLeaveAnnual = {
    department: string;
    leaveCount: number;
};

export type UpcomingHoliday = {
    id?: number;
    name: string;
    date: string;
    type?: string;
};

export type LeaveDashboard = {
    year: number;
    canApprove: boolean;
    balances: LeaveTypeBalance[];
    leaveTypes: LeaveTypeBalance[];
    requests: LeaveRequest[];
    monthlyUsage: MonthlyLeaveUsage[];
    leaveTypeUsage: LeaveTypeUsage[];
    paidUnpaidSummary: PaidUnpaidSummary;
    departmentAnnual: DepartmentLeaveAnnual[];
    upcomingHolidays: UpcomingHoliday[];
    summary: LeaveDashboardSummary;
    range?: {
        from: string;
        to: string;
    };
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
        const total = Number(raw.total ?? raw.totalDays ?? raw.total_days ?? daysAllowed);
        const used = Number(raw.used ?? raw.usedDays ?? raw.used_days ?? 0);
        const remaining = Number(raw.remaining ?? raw.remainingDays ?? raw.remaining_days ?? Math.max(total - used, 0));
        const paidValue = raw.isPaid ?? raw.is_paid ?? true;

        return {
            id: Number(raw.id),
            orgId: Number(raw.orgId ?? raw.org_id ?? 0),
            typeName,
            daysAllowed,
            carryForward: Boolean(raw.carryForward ?? raw.carry_forward),
            maxCarryDays: Number(raw.maxCarryDays ?? raw.max_carry_days ?? 0),
            isPaid: paidValue === true || paidValue === 1 || paidValue === '1' || paidValue === 'true',
            requiresDoc: Boolean(raw.requiresDoc ?? raw.requires_doc),
            type: typeName,
            color: raw.color || this.getLeaveTypeColor(typeName),
            year: Number(raw.year ?? new Date().getFullYear()),
            total,
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

    createLeaveType(payload: {
        typeName: string;
        daysAllowed: number;
        carryForward?: boolean;
        maxCarryDays?: number;
        isPaid?: boolean;
        requiresDoc?: boolean;
    }): Observable<LeaveTypeBalance> {
        return this.http.post<any>(`${this.apiUrl}/leaves/types`, payload).pipe(
            map((res) => this.normalizeLeaveType(res?.data ?? res))
        );
    }

    updateLeaveType(id: number, payload: {
        typeName: string;
        daysAllowed: number;
        carryForward?: boolean;
        maxCarryDays?: number;
        isPaid?: boolean;
        requiresDoc?: boolean;
    }): Observable<LeaveTypeBalance> {
        return this.http.put<any>(`${this.apiUrl}/leaves/types/${id}`, payload).pipe(
            map((res) => this.normalizeLeaveType(res?.data ?? res))
        );
    }

    deleteLeaveType(id: number): Observable<boolean> {
        return this.http.delete<any>(`${this.apiUrl}/leaves/types/${id}`).pipe(
            map(() => true)
        );
    }

    getLeaveHistory(): Observable<LeaveRequest[]> {
        return this.http.get<any>(`${this.apiUrl}/leaves`).pipe(
            map((res) => this.extractList<any>(res).map((item) => this.normalizeLeaveRequest(item)))
        );
    }

    getLeaveDashboard(year?: number, from?: string, to?: string): Observable<LeaveDashboard> {
        const params = new URLSearchParams();
        if (year) params.set('year', String(year));
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        const query = params.toString() ? `?${params.toString()}` : '';
        return this.http.get<any>(`${this.apiUrl}/leaves/dashboard${query}`).pipe(
            map((res) => {
                const data = res?.data ?? res ?? {};
                const balances = this.extractList<any>(data.balances ?? data.leaveTypes ?? []).map((item) => this.normalizeLeaveType(item));
                const requests = this.extractList<any>(data.requests ?? []).map((item) => this.normalizeLeaveRequest(item));
                const summary = data.summary ?? {};

                return {
                    year: Number(data.year ?? year ?? new Date().getFullYear()),
                    canApprove: Boolean(data.canApprove),
                    range: data.range,
                    balances,
                    leaveTypes: balances,
                    requests,
                    monthlyUsage: this.normalizeMonthlyUsage(data.monthlyUsage),
                    leaveTypeUsage: this.extractList<any>(data.leaveTypeUsage).map((item) => ({
                        leaveName: String(item.leaveName ?? item.leave_name ?? 'Unknown'),
                        leaveShortName: String(item.leaveShortName ?? item.leave_short_name ?? ''),
                        totalLeaveCount: Number(item.totalLeaveCount ?? item.total_leave_count ?? 0),
                        color: item.color,
                    })),
                    paidUnpaidSummary: {
                        paidCount: Number(data.paidUnpaidSummary?.paidCount ?? data.paidUnpaidSummary?.paid_count ?? 0),
                        unPaidCount: Number(data.paidUnpaidSummary?.unPaidCount ?? data.paidUnpaidSummary?.un_paid_count ?? 0),
                    },
                    departmentAnnual: this.extractList<any>(data.departmentAnnual).map((item) => ({
                        department: String(item.department ?? 'Unassigned'),
                        leaveCount: Number(item.leaveCount ?? item.leave_count ?? 0),
                    })),
                    upcomingHolidays: this.extractList<any>(data.upcomingHolidays).map((holiday) => ({
                        id: holiday.id ? Number(holiday.id) : undefined,
                        name: String(holiday.name ?? 'Holiday'),
                        date: holiday.date ?? holiday.holidayDate ?? holiday.holiday_date,
                        type: holiday.type,
                    })),
                    summary: {
                        entitlement: Number(summary.entitlement ?? balances.reduce((sum, item) => sum + item.total, 0)),
                        used: Number(summary.used ?? balances.reduce((sum, item) => sum + item.used, 0)),
                        remaining: Number(summary.remaining ?? balances.reduce((sum, item) => sum + item.remaining, 0)),
                        totalEmployees: Number(summary.totalEmployees ?? summary.total_employees ?? 0),
                        onLeave: Number(summary.onLeave ?? summary.on_leave ?? 0),
                        totalRequests: Number(summary.totalRequests ?? requests.length),
                        ownRequests: Number(summary.ownRequests ?? 0),
                        approvalQueue: Number(summary.approvalQueue ?? 0),
                        pending: Number(summary.pending ?? requests.filter((item) => item.status === 'pending').length),
                        approved: Number(summary.approved ?? requests.filter((item) => item.status === 'approved').length),
                        rejected: Number(summary.rejected ?? requests.filter((item) => item.status === 'rejected').length),
                        cancelled: Number(summary.cancelled ?? requests.filter((item) => item.status === 'cancelled').length),
                    }
                };
            })
        );
    }

    private normalizeMonthlyUsage(raw: any): MonthlyLeaveUsage[] {
        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const source = Array.isArray(raw) ? raw : [];

        return monthLabels.map((month, index) => {
            const item = source.find((entry: any) => Number(entry.monthIndex ?? entry.month_index) === index + 1) ?? source[index] ?? {};
            return {
                month: String(item.month ?? month),
                monthIndex: index + 1,
                paid: Number(item.paid ?? 0),
                unpaid: Number(item.unpaid ?? 0),
                pending: Number(item.pending ?? 0),
                approved: Number(item.approved ?? 0),
            };
        });
    }

    applyLeave(request: LeaveApplyPayload): Observable<LeaveRequest> {
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

    updateLeave(id: number, request: LeaveApplyPayload): Observable<LeaveRequest> {
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
            map(res => (res.data || []).map((item: any) => this.normalizeLeaveType(item))),
            catchError(() => of([]))
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
