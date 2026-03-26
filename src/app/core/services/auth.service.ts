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
    private readonly AUTH_KEY = 'hrms_auth_token';
    private readonly USER_KEY = 'hrms_user_data';

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
        return raw?.user ?? raw?.employee ?? raw?.account;
    }

    private normalizeAuthResponse(res: any): AuthResponse {
        const root = res ?? {};
        const data = root?.data ?? {};
        const token = this.extractToken(root) ?? this.extractToken(data);
        const user = this.extractUser(root) ?? this.extractUser(data);

        return {
            ...root,
            token,
            user,
            requiresOtp: Boolean(root?.requiresOtp ?? data?.requiresOtp),
            requires2fa: Boolean(root?.requires2fa ?? data?.requires2fa),
            otpReference: root?.otpReference ?? data?.otpReference,
            emailDelivered: root?.emailDelivered ?? data?.emailDelivered,
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

    getMe(): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/auth/me`);
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
