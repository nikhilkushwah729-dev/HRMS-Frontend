import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { User } from '../models/auth.model';
import { environment } from '../../../environments/environment';
import { AuditLogService, AuditAction, AuditModule } from './audit-log.service';

export interface EmployeeInvitation {
    id: number;
    email: string;
    roleId: number;
    roleName?: string;
    status: 'pending' | 'accepted' | 'revoked' | 'expired';
    invitedBy: number;
    invitedByName?: string;
    invitedAt: string;
    expiresAt: string;
    acceptedAt?: string;
}

export interface MyTeamResponse {
    currentUser?: User;
    manager?: User | null;
    peers: User[];
    reportees: User[];
    members: User[];
}

@Injectable({
    providedIn: 'root'
})
export class EmployeeService {
    private http = inject(HttpClient);
    private auditLogService = inject(AuditLogService);
    private readonly apiUrl = environment.apiUrl;
    private readonly assetBaseUrl = environment.apiUrl.replace(/\/api$/, '');

    private resolveAssetUrl(value: any): string | null | undefined {
        if (!value || typeof value !== 'string') {
            return value;
        }

        if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:image')) {
            return value;
        }

        if (value.startsWith('/')) {
            return `${this.assetBaseUrl}${value}`;
        }

        return `${this.assetBaseUrl}/${value}`;
    }

    private normalizeEmployeeStatus(value: any): 'active' | 'inactive' | 'on_leave' | 'terminated' {
        const normalized = String(value ?? '')
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, '_');

        if (!normalized) return 'active';
        if (['active', 'accepted', 'approved', 'enabled', 'working', 'on_job', 'onboarded'].includes(normalized)) return 'active';
        if (['inactive', 'disabled', 'paused', 'pending', 'invited', 'expired'].includes(normalized)) return 'inactive';
        if (['on_leave', 'leave', 'onleave', 'leave_pending'].includes(normalized)) return 'on_leave';
        if (['terminated', 'offboarded', 'resigned', 'ex_employee', 'exit'].includes(normalized)) return 'terminated';
        return 'active';
    }

    private normalizeEmployee(raw: any): User {
        const role = raw?.role;
        const department = raw?.department;
        const designation = raw?.designation;
        const displayName = raw?.name ?? raw?.fullName ?? raw?.full_name ?? raw?.employeeName ?? raw?.employee_name ?? '';
        const [fallbackFirstName = '', ...fallbackLastNameParts] = String(displayName).trim().split(/\s+/).filter(Boolean);

        const primaryId = Number(raw?.id ?? raw?.employeeId ?? raw?.employee_id ?? raw?.userId ?? raw?.user_id ?? 0) || undefined;

        return {
            id: primaryId,
            employeeId: Number(raw?.employeeId ?? raw?.employee_id ?? primaryId ?? 0) || undefined,
            email: raw?.email ?? raw?.workEmail ?? raw?.work_email ?? raw?.personalEmail ?? raw?.personal_email ?? '',
            firstName: raw?.firstName ?? raw?.first_name ?? raw?.firstname ?? raw?.first ?? fallbackFirstName,
            lastName: raw?.lastName ?? raw?.last_name ?? raw?.lastname ?? raw?.last ?? fallbackLastNameParts.join(' '),
            phone: raw?.phone ?? raw?.mobile ?? raw?.mobileNo ?? raw?.mobile_no ?? raw?.contactNo ?? raw?.contact_no ?? '',
            role: typeof role === 'string' ? role : role?.roleName ?? role?.name ?? raw?.roleName ?? raw?.role_name,
            roleId: Number(raw?.roleId ?? raw?.role_id ?? role?.id ?? 0) || undefined,
            avatar: this.resolveAssetUrl(raw?.avatar ?? raw?.profileImage ?? raw?.profile_image),
            organizationId: Number(raw?.organizationId ?? raw?.organization_id ?? 0) || undefined,
            orgId: Number(raw?.orgId ?? raw?.org_id ?? raw?.organizationId ?? raw?.organization_id ?? 0) || undefined,
            employeeCode: raw?.employeeCode ?? raw?.employee_code ?? raw?.empCode ?? raw?.emp_code ?? raw?.code ?? '',
            status: this.normalizeEmployeeStatus(raw?.status),
            designationId: Number(raw?.designationId ?? raw?.designation_id ?? designation?.id ?? 0) || undefined,
            departmentId: Number(raw?.departmentId ?? raw?.department_id ?? department?.id ?? 0) || undefined,
            managerId: Number(raw?.managerId ?? raw?.manager_id ?? raw?.manager?.id ?? 0) || undefined,
            countryCode: raw?.countryCode ?? raw?.country_code,
            countryName: raw?.countryName ?? raw?.country_name,
            joinDate: raw?.joinDate ?? raw?.join_date,
            dateOfBirth: raw?.dateOfBirth ?? raw?.date_of_birth,
            gender: raw?.gender,
            address: raw?.address,
            emergencyContact: raw?.emergencyContact ?? raw?.emergency_contact,
            emergencyPhone: raw?.emergencyPhone ?? raw?.emergency_phone,
            salary: raw?.salary,
            bankAccount: raw?.bankAccount ?? raw?.bank_account,
            bankName: raw?.bankName ?? raw?.bank_name,
            ifscCode: raw?.ifscCode ?? raw?.ifsc_code,
            panNumber: raw?.panNumber ?? raw?.pan_number,
            loginType: raw?.loginType ?? raw?.login_type,
            phoneAuthEnabled: Boolean(raw?.phoneAuthEnabled ?? raw?.phone_auth_enabled ?? false),
            phoneVerified: Boolean(raw?.phoneVerified ?? raw?.phone_verified ?? false),
            emailVerified: Boolean(raw?.emailVerified ?? raw?.email_verified ?? false),
            isLocked: Boolean(raw?.isLocked ?? raw?.is_locked ?? false),
            department: department ? { id: Number(department.id), name: department.name } : undefined,
            designation: designation ? { id: Number(designation.id), name: designation.name } : undefined,
            organizationName: raw?.organizationName || raw?.organization_name || raw?.companyName || raw?.company_name || raw?.organization?.name || '',
            organizationLogo: this.resolveAssetUrl(raw?.organizationLogo || raw?.organization_logo || raw?.companyLogo || raw?.company_logo || raw?.logo || raw?.organization?.logo) || '',
            companyName: raw?.companyName || raw?.company_name || raw?.organizationName || raw?.organization_name || raw?.organization?.name || '',
            companyLogo: this.resolveAssetUrl(raw?.companyLogo || raw?.company_logo || raw?.organizationLogo || raw?.organization_logo || raw?.logo || raw?.organization?.logo) || '',
            createdAt: raw?.createdAt ?? raw?.created_at ?? raw?.joinDate ?? raw?.join_date
        };
    }

    private mapEmployeeResponse(res: any): User {
        return this.normalizeEmployee(res?.data ?? res?.employee ?? res?.user ?? res);
    }

    private extractEmployeeRecords(res: any): any[] {
        const candidates = [
            res,
            res?.data,
            res?.employees,
            res?.data?.data,
            res?.data?.employees,
            res?.data?.employees?.data,
            res?.result,
            res?.result?.data,
            res?.result?.employees,
            res?.result?.employees?.data,
            res?.payload,
            res?.payload?.data,
            res?.payload?.employees,
            res?.payload?.employees?.data,
            res?.items,
            res?.records,
            res?.rows,
            res?.data?.rows,
        ];

        const records = candidates.find((candidate) => Array.isArray(candidate));
        return records ?? [];
    }

    private mapEmployeeListResponse(res: any): User[] {
        return this.extractEmployeeRecords(res).map((item: any) => this.normalizeEmployee(item));
    }

    private mapMyTeamResponse(res: any): MyTeamResponse {
        const payload = res?.data ?? res ?? {};
        const normalizeList = (value: any) =>
            Array.isArray(value) ? value.map((item: any) => this.normalizeEmployee(item)) : [];

        const currentUser = payload?.currentUser ? this.normalizeEmployee(payload.currentUser) : undefined;
        const manager = payload?.manager ? this.normalizeEmployee(payload.manager) : null;
        const peers = normalizeList(payload?.peers);
        const reportees = normalizeList(payload?.reportees);
        const members = normalizeList(payload?.members);

        return {
            currentUser,
            manager,
            peers,
            reportees,
            members: members.length ? members : [currentUser, manager, ...peers, ...reportees].filter(Boolean) as User[],
        };
    }

    private buildEmployeePayload(employee: Partial<User>): Record<string, any> {
        const payload: Record<string, any> = { ...employee };

        ['departmentId', 'designationId', 'roleId', 'organizationId', 'orgId'].forEach((key) => {
            const value = payload[key];
            if (value === '' || value === undefined) {
                payload[key] = null;
                return;
            }

            if (value !== null) {
                const numericValue = Number(value);
                payload[key] = Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
            }
        });

        Object.keys(payload).forEach((key) => {
            if (payload[key] === '') {
                payload[key] = null;
            }
        });

        return payload;
    }

    private normalizeInvitation(raw: any): EmployeeInvitation {
        return {
            id: Number(raw?.id ?? 0),
            email: raw?.email ?? '',
            roleId: Number(raw?.roleId ?? raw?.role_id ?? 0),
            roleName: raw?.roleName ?? raw?.role_name,
            status: raw?.status ?? 'pending',
            invitedBy: Number(raw?.invitedBy ?? raw?.invited_by ?? 0),
            invitedByName: raw?.invitedByName ?? raw?.invited_by_name,
            invitedAt: raw?.invitedAt ?? raw?.invited_at ?? raw?.createdAt ?? raw?.created_at ?? '',
            expiresAt: raw?.expiresAt ?? raw?.expires_at ?? '',
            acceptedAt: raw?.acceptedAt ?? raw?.accepted_at
        };
    }

    private mapInvitationResponse(res: any): EmployeeInvitation {
        return this.normalizeInvitation(res?.data ?? res);
    }

    private mapInvitationListResponse(res: any): EmployeeInvitation[] {
        const records = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
                ? res
                : [];

        return records.map((item: any) => this.normalizeInvitation(item));
    }

    private isValidEmployeeId(id: unknown): id is number {
        return Number.isInteger(id) && Number(id) > 0;
    }

    getEmployees(): Observable<User[]> {
        return this.http.get<any>(`${this.apiUrl}/employees`).pipe(
            map(res => this.mapEmployeeListResponse(res))
        );
    }

    getMyTeam(): Observable<MyTeamResponse> {
        return this.http.get<any>(`${this.apiUrl}/employees/my-team`).pipe(
            map(res => this.mapMyTeamResponse(res)),
            catchError(() =>
                this.getEmployees().pipe(
                    map((employees) => {
                        let storedUser: any = null;
                        try {
                            storedUser = JSON.parse(localStorage.getItem('hrms_user_data') || 'null');
                        } catch {
                            storedUser = null;
                        }
                        const currentUserId = Number(storedUser?.id ?? storedUser?.employeeId ?? 0);
                        const currentUser = employees.find((employee) => employee.id === currentUserId);
                        const manager = currentUser?.managerId
                            ? employees.find((employee) => employee.id === currentUser.managerId) ?? null
                            : null;
                        const peers = currentUser?.managerId
                            ? employees.filter((employee) => employee.id !== currentUser.id && employee.managerId === currentUser.managerId)
                            : [];
                        const reportees = currentUser?.id
                            ? employees.filter((employee) => employee.managerId === currentUser.id)
                            : [];
                        return {
                            currentUser,
                            manager,
                            peers,
                            reportees,
                            members: [currentUser, manager, ...peers, ...reportees].filter(Boolean) as User[],
                        };
                    })
                )
            )
        );
    }

    getEmployeeById(id: number): Observable<User> {
        if (!this.isValidEmployeeId(id)) {
            return throwError(() => new Error('Invalid employee id.'));
        }

        return this.http.get<any>(`${this.apiUrl}/employees/${id}`).pipe(
            map(res => this.mapEmployeeResponse(res))
        );
    }

    createEmployee(employee: Partial<User>): Observable<User> {
        const payload = this.buildEmployeePayload(employee);
        return this.http.post<any>(`${this.apiUrl}/employees`, payload).pipe(
            map(res => this.mapEmployeeResponse(res)),
            tap((createdEmployee) => {
                this.auditLogService.logAction(
                    AuditAction.CREATE,
                    AuditModule.EMPLOYEES,
                    {
                        entityName: 'Employee',
                        entityId: createdEmployee.id?.toString(),
                        newValues: {
                            firstName: createdEmployee.firstName,
                            lastName: createdEmployee.lastName,
                            email: createdEmployee.email,
                            employeeCode: createdEmployee.employeeCode
                        }
                    }
                ).subscribe();
            })
        );
    }

    updateEmployee(id: number, employee: Partial<User>): Observable<User> {
        if (!this.isValidEmployeeId(id)) {
            return throwError(() => new Error('Invalid employee id.'));
        }

        const payload = this.buildEmployeePayload(employee);
        return this.http.put<any>(`${this.apiUrl}/employees/${id}`, payload).pipe(
            map(res => this.mapEmployeeResponse(res)),
            tap((updatedEmployee) => {
                this.auditLogService.logAction(
                    AuditAction.UPDATE,
                    AuditModule.EMPLOYEES,
                    {
                        entityName: 'Employee',
                        entityId: id.toString(),
                        newValues: {
                            ...payload,
                            updatedId: updatedEmployee.id
                        }
                    }
                ).subscribe();
            })
        );
    }

    deleteEmployee(id: number): Observable<void> {
        if (!this.isValidEmployeeId(id)) {
            return throwError(() => new Error('Invalid employee id.'));
        }

        return this.http.delete<any>(`${this.apiUrl}/employees/${id}`).pipe(
            tap(() => {
                this.auditLogService.logAction(
                    AuditAction.DELETE,
                    AuditModule.EMPLOYEES,
                    {
                        entityName: 'Employee',
                        entityId: id.toString()
                    }
                ).subscribe();
            })
        );
    }

    // ============ INVITATION METHODS ============

    /**
     * Invite an employee to join the organization
     */
    inviteEmployee(data: { email: string; roleId: number }): Observable<EmployeeInvitation> {
        return this.http.post<any>(`${this.apiUrl}/employees/invite`, data).pipe(
            map((res) => this.mapInvitationResponse(res)),
            tap((invitation) => {
                this.auditLogService.logAction(
                    AuditAction.CREATE,
                    AuditModule.EMPLOYEES,
                    {
                        entityName: 'Employee Invitation',
                        entityId: invitation.id?.toString(),
                        newValues: {
                            email: invitation.email,
                            roleId: invitation.roleId
                        }
                    }
                ).subscribe();
            })
        );
    }

    /**
     * Get list of all invitations
     */
    getInvitations(): Observable<EmployeeInvitation[]> {
        return this.http.get<any>(`${this.apiUrl}/employees/invitations`).pipe(
            map((res) => this.mapInvitationListResponse(res))
        );
    }

    /**
     * Revoke an invitation
     */
    revokeInvitation(invitationId: number): Observable<void> {
        return this.http.post<any>(`${this.apiUrl}/employees/invitations/${invitationId}/revoke`, {}).pipe(
            map(res => res.data),
            tap(() => {
                this.auditLogService.logAction(
                    AuditAction.DELETE,
                    AuditModule.EMPLOYEES,
                    {
                        entityName: 'Employee Invitation',
                        entityId: invitationId.toString(),
                        newValues: { status: 'revoked' }
                    }
                ).subscribe();
            })
        );
    }

    /**
     * Resend an invitation
     */
    resendInvitation(invitationId: number): Observable<EmployeeInvitation> {
        return this.http.post<any>(`${this.apiUrl}/employees/invitations/${invitationId}/resend`, {}).pipe(
            map((res) => this.mapInvitationResponse(res)),
            tap((invitation) => {
                this.auditLogService.logAction(
                    AuditAction.UPDATE,
                    AuditModule.EMPLOYEES,
                    {
                        entityName: 'Employee Invitation',
                        entityId: invitationId.toString(),
                        newValues: { action: 'resend', email: invitation.email }
                    }
                ).subscribe();
            })
        );
    }

    // ============ DOCUMENTS METHODS ============
    getDocuments(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/documents`).pipe(
            map(res => res.data || [])
        );
    }

    uploadDocument(data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/documents`, data).pipe(
            map(res => res.data)
        );
    }

    deleteDocument(id: number): Observable<void> {
        return this.http.delete<any>(`${this.apiUrl}/documents/${id}`);
    }

    // ============ EXPERIENCE METHODS ============
    getExperiences(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/experiences`).pipe(
            map(res => res.data || [])
        );
    }

    addExperience(data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/experiences`, data);
    }

    updateExperience(id: number, data: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/experiences/${id}`, data);
    }

    deleteExperience(id: number): Observable<void> {
        return this.http.delete<any>(`${this.apiUrl}/experiences/${id}`);
    }

    // ============ EDUCATION METHODS ============
    getEducation(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/education`).pipe(
            map(res => res.data || [])
        );
    }

    addEducation(data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/education`, data);
    }

    updateEducation(id: number, data: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/education/${id}`, data);
    }

    deleteEducation(id: number): Observable<void> {
        return this.http.delete<any>(`${this.apiUrl}/education/${id}`);
    }

    /**
     * Get birthdays and anniversaries for the organization
     */
    getOccasions(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/employees/occasions`).pipe(
            map(res => res.data || []),
            catchError(() => of([]))
        );
    }
}
