import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PublicInvitation {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    roleName: string;
    organizationName: string;
    invitedAt: string;
    expiresAt: string;
    status: 'pending' | 'accepted' | 'revoked' | 'expired';
}

export interface InvitationResponse {
    success: boolean;
    message: string;
    token?: string;
    employee?: any;
}

@Injectable({
    providedIn: 'root'
})
export class PublicInvitationService {
    private http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl;

    private normalizeInvitation(raw: any): PublicInvitation {
        return {
            id: Number(raw.id),
            email: raw.email,
            firstName: raw.firstName ?? raw.first_name ?? '',
            lastName: raw.lastName ?? raw.last_name ?? '',
            roleName: raw.roleName ?? raw.role_name ?? raw.role?.roleName ?? '',
            organizationName: raw.organizationName ?? raw.organization_name ?? raw.organization?.companyName ?? raw.organization?.company_name ?? '',
            invitedAt: raw.invitedAt ?? raw.invited_at ?? raw.createdAt ?? raw.created_at ?? '',
            expiresAt: raw.expiresAt ?? raw.expires_at ?? '',
            status: raw.status ?? 'pending'
        };
    }

    /**
     * Get invitation details by token (public endpoint)
     */
    getInvitationByToken(token: string): Observable<PublicInvitation> {
        return this.http.get<any>(`${this.apiUrl}/invitations/${token}`).pipe(
            map(res => this.normalizeInvitation(res.data))
        );
    }

    /**
     * Accept or decline an invitation (public endpoint)
     */
    respondToInvitation(token: string, action: 'accept' | 'reject', data?: {
        password?: string;
        firstName?: string;
        lastName?: string;
    }): Observable<InvitationResponse> {
        return this.http.post<any>(`${this.apiUrl}/invitations/${token}/respond`, {
            action,
            ...data
        });
    }

    /**
     * Accept invitation with registration
     */
    acceptInvitation(token: string, password: string, firstName?: string, lastName?: string): Observable<InvitationResponse> {
        return this.respondToInvitation(token, 'accept', {
            password,
            firstName,
            lastName
        });
    }

    /**
     * Decline an invitation
     */
    declineInvitation(token: string): Observable<InvitationResponse> {
        return this.respondToInvitation(token, 'reject');
    }

    /**
     * Check if invitation is valid
     */
    checkInvitationValidity(token: string): Observable<{ valid: boolean; message: string }> {
        return this.http.get<any>(`${this.apiUrl}/invitations/${token}/validate`).pipe(
            map(res => ({
                valid: res.valid ?? res.status === 'success',
                message: res.message ?? ''
            }))
        );
    }
}

