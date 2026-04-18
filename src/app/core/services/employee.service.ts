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

    private normalizeEmployee(raw: any): User {
        const role = raw?.role;
        const department = raw?.department;
        const designation = raw?.designation;

        return {
            id: Number(raw?.id ?? 0) || undefined,
            email: raw?.email ?? '',
            firstName: raw?.firstName ?? raw?.first_name ?? '',
            lastName: raw?.lastName ?? raw?.last_name ?? '',
            phone: raw?.phone ?? '',
            role: typeof role === 'string' ? role : role?.name ?? raw?.roleName ?? raw?.role_name,
            roleId: Number(raw?.roleId ?? raw?.role_id ?? role?.id ?? 0) || undefined,
            avatar: this.resolveAssetUrl(raw?.avatar ?? raw?.profileImage ?? raw?.profile_image),
            organizationId: Number(raw?.organizationId ?? raw?.organization_id ?? 0) || undefined,
            orgId: Number(raw?.orgId ?? raw?.org_id ?? raw?.organizationId ?? raw?.organization_id ?? 0) || undefined,
            employeeCode: raw?.employeeCode ?? raw?.employee_code ?? '',
            status: raw?.status ?? 'active',
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
            companyLogo: this.resolveAssetUrl(raw?.companyLogo || raw?.company_logo || raw?.organizationLogo || raw?.organization_logo || raw?.logo || raw?.organization?.logo) || ''
        };
    }

    private mapEmployeeResponse(res: any): User {
        return this.normalizeEmployee(res?.data ?? res?.employee ?? res?.user ?? res);
    }

    private mapEmployeeListResponse(res: any): User[] {
        const records = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.employees)
                ? res.employees
                : Array.isArray(res)
                    ? res
                    : [];

        return records.map((item: any) => this.normalizeEmployee(item));
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
