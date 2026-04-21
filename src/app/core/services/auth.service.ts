import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { User, AuthResponse } from '../models/auth.model';
import { environment } from '../../../environments/environment';
import { AuditLogService, AuditAction, AuditModule } from './audit-log.service';

export type LoginType = 'email' | 'google' | 'microsoft' | 'phone';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private auditLogService = inject(AuditLogService);
    private readonly apiUrl = environment.apiUrl;
    private readonly assetBaseUrl = environment.apiUrl.replace(/\/api$/, '');
    private readonly AUTH_KEY = 'hrms_auth_token';
    private readonly USER_KEY = 'hrms_user_data';

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

    register(payload: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/register`, payload).pipe(
            tap(() => {
                this.auditLogService.logAction(
                    AuditAction.REGISTER,
                    AuditModule.AUTH,
                    {
                        entityName: 'User Registration',
                        newValues: { email: payload.email }
                    }
                ).subscribe();
            })
        );
    }

    verifyEmail(token: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/auth/verify-email?token=${token}`);
    }

    forgotPassword(email: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email }).pipe(
            tap(() => {
                this.auditLogService.logAction(
                    AuditAction.FORGOT_PASSWORD,
                    AuditModule.AUTH,
                    {
                        entityName: 'Password Reset Request',
                        newValues: { email }
                    }
                ).subscribe();
            }),
            catchError((error) => {
                this.auditLogService.logAction(
                    AuditAction.FORGOT_PASSWORD,
                    AuditModule.AUTH,
                    {
                        entityName: 'Password Reset Request',
                        newValues: { email, status: 'failed', error: error.message }
                    }
                ).subscribe();
                throw error;
            })
        );
    }

    resetPassword(data: { token: string; new_password: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/reset-password`, data).pipe(
            tap(() => {
                this.auditLogService.logAction(
                    AuditAction.PASSWORD_RESET,
                    AuditModule.AUTH,
                    {
                        entityName: 'Password Reset'
                    }
                ).subscribe();
            })
        );
    }

    private extractToken(raw: any): string | undefined {
        const candidate = raw?.token ?? raw?.accessToken ?? raw?.authToken;
        if (!candidate) return undefined;
        if (typeof candidate === 'string') return candidate;
        if (typeof candidate === 'object') {
            return candidate.value ?? candidate.token ?? candidate.accessToken;
        }
        return undefined;
    }

    private extractUser(raw: any): User | undefined {
        const candidate = raw?.user ?? raw?.employee ?? raw?.account;
        if (!candidate) return undefined;

        return this.normalizeUser({
            ...raw?.organization,
            ...raw?.company,
            ...candidate,
            allUserPermissions: raw?.allUserPermissions ?? candidate?.allUserPermissions,
            userPermissions: raw?.userPermissions ?? candidate?.userPermissions,
            tabsPermission: raw?.tabsPermission ?? candidate?.tabsPermission,
            anonymousPermission: raw?.anonymousPermission ?? candidate?.anonymousPermission,
            organization: raw?.organization ?? candidate?.organization,
            company: raw?.company ?? candidate?.company
        });
    }

    private normalizePermissions(raw: any): string[] {
        const source = raw?.permissions ?? raw?.permission ?? raw?.allUserPermissions?.permission;
        const nestedSources = [
            raw?.allUserPermissions?.permission,
            raw?.userPermissions?.permission,
            raw?.tabsPermission?.permission,
            raw?.anonymousPermission?.permission,
        ];

        const fromObject = (value: any): string[] => {
            if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
            return Object.entries(value)
                .filter(([, allowed]) => allowed === true || allowed === 1 || allowed === '1' || allowed === 'true')
                .map(([key]) => key);
        };

        if (Array.isArray(source)) {
            return [
                ...source.map((item: any) => String(item)),
                ...nestedSources.flatMap(fromObject),
            ];
        }

        if (source && typeof source === 'object') {
            return [...fromObject(source), ...nestedSources.flatMap(fromObject)];
        }

        return nestedSources.flatMap(fromObject);
    }

    private normalizeNumberFlag(value: any): number | undefined {
        if (value === undefined || value === null || value === '') return undefined;
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
        if (value === true || value === 'true') return 1;
        if (value === false || value === 'false') return 0;
        return undefined;
    }

    private normalizeUser(raw: any): User {
        return {
            id: Number(raw?.id ?? 0) || undefined,
            email: raw?.email ?? '',
            firstName: raw?.firstName ?? raw?.first_name ?? '',
            lastName: raw?.lastName ?? raw?.last_name ?? '',
            companyName: raw?.companyName ?? raw?.company_name ?? raw?.organizationName ?? raw?.organization_name ?? raw?.organization?.name ?? raw?.organization?.companyName ?? '',
            companyLogo: this.resolveAssetUrl(raw?.companyLogo ?? raw?.company_logo ?? raw?.organizationLogo ?? raw?.organization_logo ?? raw?.logo ?? raw?.organization?.logo) ?? '',
            organizationName: raw?.organizationName ?? raw?.organization_name ?? raw?.companyName ?? raw?.company_name ?? raw?.organization?.name ?? raw?.organization?.companyName ?? '',
            organizationLogo: this.resolveAssetUrl(raw?.organizationLogo ?? raw?.organization_logo ?? raw?.companyLogo ?? raw?.company_logo ?? raw?.logo ?? raw?.organization?.logo) ?? '',
            phone: raw?.phone ?? '',
            role: typeof raw?.role === 'string' ? raw.role : raw?.role?.name ?? raw?.roleName ?? raw?.role_name,
            roleId: Number(raw?.roleId ?? raw?.role_id ?? raw?.role?.id ?? 0) || undefined,
            avatar: this.resolveAssetUrl(raw?.avatar ?? raw?.profileImage ?? raw?.profile_image),
            organizationId: Number(raw?.organizationId ?? raw?.organization_id ?? raw?.orgId ?? raw?.org_id ?? raw?.organization?.id ?? 0) || undefined,
            orgId: Number(raw?.orgId ?? raw?.org_id ?? raw?.organizationId ?? raw?.organization_id ?? raw?.organization?.id ?? 0) || undefined,
            employeeCode: raw?.employeeCode ?? raw?.employee_code ?? '',
            status: raw?.status ?? 'active',
            designationId: Number(raw?.designationId ?? raw?.designation_id ?? raw?.designation?.id ?? 0) || undefined,
            departmentId: Number(raw?.departmentId ?? raw?.department_id ?? raw?.department?.id ?? 0) || undefined,
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
            employeeId: Number(raw?.employeeId ?? raw?.employee_id ?? raw?.empId ?? raw?.emp_id ?? raw?.id ?? 0) || undefined,
            reportingManagerId: Number(raw?.reportingManagerId ?? raw?.reporting_manager_id ?? raw?.managerId ?? raw?.manager_id ?? 0) || undefined,
            paySlip: this.normalizeNumberFlag(raw?.paySlip ?? raw?.pay_slip),
            salarySlip: this.normalizeNumberFlag(raw?.salarySlip ?? raw?.salary_slip),
            shiftChangePerm: this.normalizeNumberFlag(raw?.shiftChangePerm ?? raw?.shift_change_perm),
            profileType: this.normalizeNumberFlag(raw?.profileType ?? raw?.profile_type),
            hrSts: this.normalizeNumberFlag(raw?.hrSts ?? raw?.hr_sts),
            setupConfig: this.normalizeNumberFlag(raw?.setupConfig ?? raw?.setup_config),
            esslSetupConfig: this.normalizeNumberFlag(raw?.esslSetupConfig ?? raw?.essl_setup_config),
            biometricMachinePermission: this.normalizeNumberFlag(raw?.biometricMachinePermission ?? raw?.biometric_machine_permission),
            addonDeviceVerification: this.normalizeNumberFlag(raw?.addonDeviceVerification ?? raw?.addon_device_verification),
            visitorManagementAddOn: this.normalizeNumberFlag(
                raw?.visitorManagementAddOn ??
                raw?.visitor_management_add_on ??
                raw?.anonymousPermission?.permission?.visitorManagementAddOn
            ),
            settingPerm: this.normalizeNumberFlag(raw?.settingPerm ?? raw?.setting_perm ?? raw?.anonymousPermission?.permission?.settingPerm),
            department: raw?.department ? { id: Number(raw.department.id), name: raw.department.name } : undefined,
            designation: raw?.designation ? { id: Number(raw.designation.id), name: raw.designation.name } : undefined,
            permissions: this.normalizePermissions(raw),
            accessScope: raw?.accessScope ?? raw?.access_scope
        };
    }

    private normalizeAuthResponse(res: any): AuthResponse {
        const root = res ?? {};
        const data = root?.data ?? {};
        const token = this.extractToken(root) ?? this.extractToken(data);
        const user = this.extractUser({
            ...data,
            organization: data?.organization ?? root?.organization,
            company: data?.company ?? root?.company,
            user: data?.user ?? root?.user,
            employee: data?.employee ?? root?.employee,
            account: data?.account ?? root?.account
        }) ?? this.extractUser(root) ?? this.extractUser(data);
        const normalizeBoolean = (value: any): boolean | undefined => {
            if (typeof value === 'boolean') return value;
            if (typeof value === 'number') return value !== 0;
            if (typeof value === 'string') {
                const normalized = value.trim().toLowerCase();
                if (['true', '1', 'yes', 'sent', 'delivered'].includes(normalized)) return true;
                if (['false', '0', 'no', 'failed', 'not_sent', 'undelivered'].includes(normalized)) return false;
            }
            return undefined;
        };
        const otpReference =
            root?.otpReference ??
            data?.otpReference ??
            root?.otp_reference ??
            data?.otp_reference ??
            root?.reference ??
            data?.reference ??
            root?.otpId ??
            data?.otpId;
        const emailDelivered = normalizeBoolean(
            root?.emailDelivered ??
            data?.emailDelivered ??
            root?.email_delivered ??
            data?.email_delivered ??
            root?.delivered ??
            data?.delivered
        );
        const requiresOtp = normalizeBoolean(
            root?.requiresOtp ??
            data?.requiresOtp ??
            root?.requires_otp ??
            data?.requires_otp
        );
        const requires2fa = normalizeBoolean(
            root?.requires2fa ??
            data?.requires2fa ??
            root?.requires_2fa ??
            data?.requires_2fa
        );

        return {
            ...root,
            token,
            user,
            requiresOtp: requiresOtp ?? false,
            requires2fa: requires2fa ?? false,
            otpReference,
            emailDelivered,
            message: root?.message ?? data?.message
        };
    }

    login(credentials: any): Observable<AuthResponse> {
        return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials).pipe(
            map(res => this.normalizeAuthResponse(res)),
            tap(res => {
                this.saveToStorage(res);

                if (res.user) {
                    this.auditLogService.logAction(
                        AuditAction.LOGIN,
                        AuditModule.AUTH,
                        {
                            entityName: res.user.firstName + ' ' + res.user.lastName,
                            entityId: res.user.id?.toString(),
                            newValues: {
                                email: res.user.email
                            }
                        }
                    ).subscribe();
                }
            }),
            catchError((error) => {
                this.auditLogService.logAction(
                    AuditAction.LOGIN_FAILED,
                    AuditModule.AUTH,
                    {
                        entityName: 'Authentication',
                        newValues: {
                            email: credentials.email,
                            reason: error.error?.message || 'Invalid credentials',
                            status: error.status
                        }
                    }
                ).subscribe();
                throw error;
            })
        );
    }

    verifyOtp(data: { otpReference: number; code: string }): Observable<AuthResponse> {
        return this.http.post<any>(`${this.apiUrl}/auth/verify-otp`, data).pipe(
            map(res => this.normalizeAuthResponse(res)),
            tap(res => {
                this.saveToStorage(res);

                if (res.user) {
                    this.auditLogService.logAction(
                        AuditAction.VERIFY_OTP,
                        AuditModule.AUTH,
                        {
                            entityName: res.user.firstName + ' ' + res.user.lastName,
                            entityId: res.user.id?.toString(),
                            newValues: {
                                email: res.user.email,
                                method: 'OTP'
                            }
                        }
                    ).subscribe();
                }
            }),
            catchError((error) => {
                this.auditLogService.logAction(
                    AuditAction.LOGIN_FAILED,
                    AuditModule.AUTH,
                    {
                        entityName: 'OTP Verification',
                        newValues: {
                            otpReference: data.otpReference,
                            reason: 'Invalid OTP'
                        }
                    }
                ).subscribe();
                throw error;
            })
        );
    }

    /**
     * Login with Google OAuth
     */
    loginWithGoogle(idToken: string): Observable<AuthResponse> {
        return this.http.post<any>(`${this.apiUrl}/auth/google`, { idToken }).pipe(
            map(res => this.normalizeAuthResponse(res)),
            tap(res => {
                this.saveToStorage(res);
                if (res.user) {
                    this.auditLogService.logAction(
                        AuditAction.LOGIN,
                        AuditModule.AUTH,
                        {
                            entityName: res.user.firstName + ' ' + res.user.lastName,
                            entityId: res.user.id?.toString(),
                            newValues: { method: 'google_oauth' }
                        }
                    ).subscribe();
                }
            }),
            catchError((error) => {
                this.auditLogService.logAction(
                    AuditAction.LOGIN_FAILED,
                    AuditModule.AUTH,
                    {
                        entityName: 'Google OAuth',
                        newValues: { reason: error.error?.message || 'Google login failed', status: error.status }
                    }
                ).subscribe();
                throw error;
            })
        );
    }

    /**
     * Login with Microsoft OAuth
     */
    loginWithMicrosoft(accessToken: string): Observable<AuthResponse> {
        return this.http.post<any>(`${this.apiUrl}/auth/microsoft`, { accessToken }).pipe(
            map(res => this.normalizeAuthResponse(res)),
            tap(res => {
                this.saveToStorage(res);
                if (res.user) {
                    this.auditLogService.logAction(
                        AuditAction.LOGIN,
                        AuditModule.AUTH,
                        {
                            entityName: res.user.firstName + ' ' + res.user.lastName,
                            entityId: res.user.id?.toString(),
                            newValues: { method: 'microsoft_oauth' }
                        }
                    ).subscribe();
                }
            }),
            catchError((error) => {
                this.auditLogService.logAction(
                    AuditAction.LOGIN_FAILED,
                    AuditModule.AUTH,
                    {
                        entityName: 'Microsoft OAuth',
                        newValues: { reason: error.error?.message || 'Microsoft login failed', status: error.status }
                    }
                ).subscribe();
                throw error;
            })
        );
    }

    /**
     * Request OTP for phone login
     */
    requestPhoneOtp(phone: string, isInternational: boolean = false): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/auth/phone/request-otp`, { phone, isInternational }).pipe(
            tap(() => {
                this.auditLogService.logAction(
                    AuditAction.OTP_REQUESTED,
                    AuditModule.AUTH,
                    {
                        entityName: 'Phone OTP Request',
                        newValues: { phone: this.maskPhone(phone) }
                    }
                ).subscribe();
            })
        );
    }

    /**
     * Verify Firebase ID token and login with phone
     */
    verifyPhoneOtp(phone: string, otp: string, firebaseToken?: string): Observable<AuthResponse> {
        const payload: any = { phone, otp };
        // firebaseToken is the Firebase ID Token; send it as 'firebaseToken' to the backend
        if (firebaseToken) payload.firebaseToken = firebaseToken;

        return this.http.post<any>(`${this.apiUrl}/auth/phone/verify`, payload).pipe(
            map(res => this.normalizeAuthResponse(res)),
            tap(res => {
                this.saveToStorage(res);
                if (res.user) {
                    this.auditLogService.logAction(
                        AuditAction.LOGIN,
                        AuditModule.AUTH,
                        {
                            entityName: res.user.firstName + ' ' + res.user.lastName,
                            entityId: res.user.id?.toString(),
                            newValues: { method: 'phone_firebase', phone: this.maskPhone(phone) }
                        }
                    ).subscribe();
                }
            }),
            catchError((error) => {
                this.auditLogService.logAction(
                    AuditAction.LOGIN_FAILED,
                    AuditModule.AUTH,
                    {
                        entityName: 'Phone Firebase Verification',
                        newValues: { phone: this.maskPhone(phone), reason: error.error?.message || 'Invalid OTP' }
                    }
                ).subscribe();
                throw error;
            })
        );
    }

    /**
     * Resend OTP for phone login
     */
    resendPhoneOtp(otpReference: string): Observable<{ success: boolean; message: string }> {
        return this.http.post<any>(`${this.apiUrl}/auth/phone/resend`, { otpReference });
    }

    checkIdentifier(identifier: string): Observable<{ exists: boolean; type: 'email' | 'phone' | 'unknown' }> {
        return this.http.post<any>(`${this.apiUrl}/auth/check-identifier`, { identifier });
    }

    /**
     * Request OTP for email login (2FA)
     */
    requestEmailOtp(email: string): Observable<{ otpReference: string; message: string }> {
        return this.http.post<any>(`${this.apiUrl}/auth/request-email-otp`, { email }).pipe(
            map(res => this.normalizeAuthResponse(res) as any),
            tap(() => {
                this.auditLogService.logAction(
                    AuditAction.OTP_REQUESTED,
                    AuditModule.AUTH,
                    {
                        entityName: 'Email OTP Request',
                        newValues: { email }
                    }
                ).subscribe();
            })
        );
    }

    /**
     * Request OTP for email verification (new flow - Step 1)
     */
    requestEmailVerificationOtp(email: string): Observable<{ otpReference: number; emailDelivered: boolean; message: string }> {
        return this.http.post<any>(`${this.apiUrl}/auth/request-email-otp`, { email }).pipe(
            map(res => this.normalizeAuthResponse(res) as any),
            tap(() => {
                this.auditLogService.logAction(
                    AuditAction.OTP_REQUESTED,
                    AuditModule.AUTH,
                    {
                        entityName: 'Email Verification Request',
                        newValues: { email }
                    }
                ).subscribe();
            })
        );
    }

    /**
     * Verify email OTP and get session token (new flow - Step 2)
     */
    verifyEmailVerificationOtp(otpReference: number, code: string): Observable<{ verified: boolean; sessionToken: string; message: string }> {
        return this.http.post<any>(`${this.apiUrl}/auth/verify-email-otp`, { otpReference, code }).pipe(
            tap((res) => {
                if (res.verified) {
                    this.auditLogService.logAction(
                        AuditAction.VERIFY_OTP,
                        AuditModule.AUTH,
                        {
                            entityName: 'Email Verified',
                            newValues: { method: 'email_verification' }
                        }
                    ).subscribe();
                }
            })
        );
    }

    /**
     * Complete login with verified email and password (new flow - Step 3)
     */
    loginWithVerifiedEmail(sessionToken: string, password: string): Observable<AuthResponse> {
        return this.http.post<any>(`${this.apiUrl}/auth/login-with-verified-email`, { sessionToken, password }).pipe(
            map(res => this.normalizeAuthResponse(res)),
            tap(res => {
                this.saveToStorage(res);
                if (res.user) {
                    this.auditLogService.logAction(
                        AuditAction.LOGIN,
                        AuditModule.AUTH,
                        {
                            entityName: res.user.firstName + ' ' + res.user.lastName,
                            entityId: res.user.id?.toString(),
                            newValues: {
                                email: res.user.email,
                                method: 'email_verified'
                            }
                        }
                    ).subscribe();
                }
            }),
            catchError((error) => {
                this.auditLogService.logAction(
                    AuditAction.LOGIN_FAILED,
                    AuditModule.AUTH,
                    {
                        entityName: 'Login with Verified Email',
                        newValues: { reason: error.error?.message || 'Login failed', status: error.status }
                    }
                ).subscribe();
                throw error;
            })
        );
    }

    /**
     * Get organization allowed login methods
     */
    getAllowedLoginMethods(orgId: number): Observable<string[]> {
        return this.http.get<any>(`${this.apiUrl}/auth/login-methods?orgId=${orgId}`).pipe(
            map(res => res.methods || ['email']),
            catchError(() => of(['email']))
        );
    }

    /**
     * Mask phone number for privacy in logs
     */
    private maskPhone(phone: string): string {
        if (!phone || phone.length < 4) return '***';
        return '*'.repeat(phone.length - 4) + phone.slice(-4);
    }

    private saveToStorage(authResult: AuthResponse) {
        if (authResult.token) {
            localStorage.setItem(this.AUTH_KEY, authResult.token);
        }
        if (authResult.user) {
            localStorage.setItem(this.USER_KEY, JSON.stringify(authResult.user));
        }
    }

    clearAuthStorage() {
        localStorage.removeItem(this.AUTH_KEY);
        localStorage.removeItem(this.USER_KEY);
    }

    setStoredUser(user: User) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    logout(token?: string | null) {
        const user = this.getStoredUser();

        const headers = token
            ? new HttpHeaders({ Authorization: `Bearer ${token}` })
            : undefined;

        return this.http.post(`${this.apiUrl}/auth/logout`, {}, { headers }).pipe(
            tap(() => {
                this.auditLogService.logAction(
                    AuditAction.LOGOUT,
                    AuditModule.AUTH,
                    {
                        entityName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
                        entityId: user?.id?.toString(),
                        newValues: { email: user?.email }
                    }
                ).subscribe();

                this.clearAuthStorage();
            }),
            catchError((error) => {
                this.auditLogService.logAction(
                    AuditAction.LOGOUT,
                    AuditModule.AUTH,
                    {
                        entityName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
                        entityId: user?.id?.toString(),
                        newValues: {
                            email: user?.email,
                            status: 'failed',
                            error: error.message
                        }
                    }
                ).subscribe();

                this.clearAuthStorage();
                throw error;
            })
        );
    }

    getMe(options?: { skipLoading?: boolean }): Observable<User> {
        let headers = undefined;
        if (options?.skipLoading) {
            headers = { 'X-Skip-Loading': 'true' };
        }

        return this.http.get<any>(`${this.apiUrl}/auth/me`, { headers }).pipe(
            map((res) => this.normalizeUser({
                ...(res?.data ?? res?.user ?? res),
                organization: res?.data?.organization ?? res?.organization,
                company: res?.data?.company ?? res?.company
            }))
        );
    }

    /**
     * Get user's country code via IP
     */
    getUserCountry(): Observable<{ country_code: string }> {
        return this.http.get<any>('https://ipapi.co/json/').pipe(
            map(res => ({ country_code: res.country_code })),
            catchError(() => {
                // Fallback to India if IP detection fails
                return [{ country_code: 'IN' }];
            })
        );
    }

    /**
     * Get list of countries from backend
     */
    getCountries(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/auth/countries`);
    }

    getStoredToken(): string | null {
        const token = localStorage.getItem(this.AUTH_KEY);
        if (token === '[object Object]') {
            localStorage.removeItem(this.AUTH_KEY);
            return null;
        }
        return token;
    }

    getStoredUser(): User | null {
        const userJson = localStorage.getItem(this.USER_KEY);
        try {
            return userJson ? JSON.parse(userJson) : null;
        } catch (e) {
            return null;
        }
    }
}
