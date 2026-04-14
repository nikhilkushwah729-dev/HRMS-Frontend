import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLogService, AuditAction, AuditModule } from './audit-log.service';

export interface Role {
    id: number;
    name: string;
    roleName?: string;
    description?: string;
    isDefault?: boolean;
    permissions?: Array<number | string>;
    createdAt?: string;
    updatedAt?: string;
}

export interface Permission {
    id: number;
    name: string;
    slug: string;
    permissionKey?: string;
    module: string;
    description?: string;
}

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    private http = inject(HttpClient);
    private auditLogService = inject(AuditLogService);
    private readonly apiUrl = environment.apiUrl;

    private normalizeRole(raw: any): Role {
        const permissions = Array.isArray(raw.permissions)
            ? raw.permissions.map((permission: any) =>
                typeof permission === 'object'
                    ? Number(permission.id ?? permission.permissionId ?? 0)
                    : permission
            ).filter((permission: any) => permission !== 0 && permission !== '')
            : [];

        return {
            id: Number(raw.id),
            name: raw.name || raw.roleName || '',
            roleName: raw.roleName || raw.name,
            description: raw.description,
            isDefault: Boolean(raw.isDefault ?? raw.is_default),
            permissions,
            createdAt: raw.createdAt || raw.created_at,
            updatedAt: raw.updatedAt || raw.updated_at
        };
    }

    private normalizePermission(raw: any): Permission {
        const permissionKey = raw.permissionKey || raw.permission_key || raw.slug || raw.key || '';
        return {
            id: Number(raw.id),
            name: raw.name || permissionKey,
            slug: raw.slug || permissionKey,
            permissionKey,
            module: raw.module || 'general',
            description: raw.description
        };
    }

    /**
     * Get all roles
     */
    getRoles(): Observable<Role[]> {
        return this.http.get<any>(`${this.apiUrl}/roles`).pipe(
            map(res => (res.data || []).map((item: any) => this.normalizeRole(item)))
        );
    }

    /**
     * Get role by ID
     */
    getRoleById(id: number): Observable<Role> {
        return this.http.get<any>(`${this.apiUrl}/roles/${id}`).pipe(
            map(res => this.normalizeRole(res.data)),
            catchError((error) => throwError(() => error))
        );
    }

    /**
     * Create a new role
     */
    createRole(data: { name: string; description?: string; permissions?: number[] }): Observable<Role> {
        const payload = {
            roleName: data.name,
            permissions: data.permissions || []
        };

        return this.http.post<any>(`${this.apiUrl}/roles`, payload).pipe(
            map(res => this.normalizeRole(res.data)),
            tap((role) => {
                this.auditLogService.logAction(
                    AuditAction.CREATE,
                    AuditModule.SETTINGS,
                    {
                        entityName: 'Role',
                        entityId: role.id.toString(),
                        newValues: {
                            name: role.name,
                            description: role.description,
                            permissions: role.permissions
                        }
                    }
                ).subscribe();
            })
        );
    }

    /**
     * Update a role
     */
    updateRole(id: number, data: { name?: string; description?: string; permissions?: number[] }): Observable<Role> {
        const payload = {
            roleName: data.name,
            permissions: data.permissions
        };

        return this.http.put<any>(`${this.apiUrl}/roles/${id}`, payload).pipe(
            map(res => this.normalizeRole(res.data)),
            tap((role) => {
                this.auditLogService.logAction(
                    AuditAction.UPDATE,
                    AuditModule.SETTINGS,
                    {
                        entityName: 'Role',
                        entityId: id.toString(),
                        newValues: data
                    }
                ).subscribe();
            })
        );
    }

    /**
     * Delete a role
     */
    deleteRole(id: number): Observable<void> {
        return this.http.delete<any>(`${this.apiUrl}/roles/${id}`).pipe(
            tap(() => {
                this.auditLogService.logAction(
                    AuditAction.DELETE,
                    AuditModule.SETTINGS,
                    {
                        entityName: 'Role',
                        entityId: id.toString()
                    }
                ).subscribe();
            })
        );
    }

    /**
     * Get all available permissions
     */
    getPermissions(): Observable<Permission[]> {
        return this.http.get<any>(`${this.apiUrl}/roles/permissions`).pipe(
            map(res => (res.data || []).map((item: any) => this.normalizePermission(item))),
            catchError(() => of([]))
        );
    }

    /**
     * Get permissions grouped by module
     */
    getPermissionsByModule(): Observable<{ [module: string]: Permission[] }> {
        return this.http.get<any>(`${this.apiUrl}/roles/permissions`).pipe(
            map(res => {
                const permissions = (res.data || []).map((item: any) => this.normalizePermission(item));
                const grouped: { [module: string]: Permission[] } = {};
                
                permissions.forEach((perm: Permission) => {
                    if (!grouped[perm.module]) {
                        grouped[perm.module] = [];
                    }
                    grouped[perm.module].push(perm);
                });
                
                return grouped;
            })
        );
    }
}

