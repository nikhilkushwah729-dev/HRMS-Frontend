import { Injectable, inject } from '@angular/core';
import { User } from '../models/auth.model';
import { Observable, catchError, firstValueFrom, of, shareReplay, tap } from 'rxjs';
import { RoleService, Permission as RolePermission } from './role.service';

export type PermissionKey =
  | 'dashboard.view'
  | 'profile.view'
  | 'billing.view'
  | 'addons.view'
  | 'employees.view'
  | 'employees.invite'
  | 'visitorManagement.view'
  | 'attendance.view'
  | 'leaves.view'
  | 'leaves.approve'
  | 'reports.view'
  | 'payroll.view'
  | 'projects.view'
  | 'expenses.view'
  | 'timesheets.view'
  | 'audit.view'
  | 'settings.view'
  | 'notifications.view'
  | 'search.employees'
  | 'search.projects'
  | 'geofence.view'
  | 'regularization.view'
  | 'documents.view'
  | 'roles.view'
  | 'announcements.view'
  | 'employee_read'
  | 'employee_create'
  | 'employee_update'
  | 'employee_delete'
  | 'attendance_read'
  | 'attendance_create'
  | 'attendance_update'
  | 'attendance_approve'
  | 'leave_read'
  | 'leave_create'
  | 'leave_update'
  | 'leave_approve'
  | 'leave_reject'
  | 'leave_process'
  | 'payroll_read'
  | 'payroll_process'
  | 'reports_read'
  | 'reports_export'
  | 'settings_read'
  | 'settings_update'
  | 'rbac_manage';

type RoleId = 1 | 2 | 3 | 4 | 5;

type AccessSnapshot = {
  modules: Set<string>;
  keys: Set<string>;
};

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private roleService = inject(RoleService);

  private readonly backendModuleAliases: Record<string, string[]> = {
    employee_management: ['employees'],
    leave_management: ['leaves'],
    reports_analytics: ['reports'],
    performance_management: ['reports'],
    recruitment: ['employees'],
    payroll: ['payroll'],
    attendance: ['attendance'],
    settings: ['settings', 'roles'],
  };

  private readonly legacyRolePermissions: Record<RoleId, PermissionKey[]> = {
    // Super Admin - Full Access
    1: [
      'dashboard.view',
      'profile.view',
      'billing.view',
      'addons.view',
      'employees.view',
      'employees.invite',
      'visitorManagement.view',
      'attendance.view',
      'leaves.view',
      'leaves.approve',
      'reports.view',
      'payroll.view',
      'projects.view',
      'expenses.view',
      'timesheets.view',
      'audit.view',
      'settings.view',
      'notifications.view',
      'search.employees',
      'search.projects',
      'geofence.view',
      'regularization.view',
      'documents.view',
      'roles.view',
      'announcements.view',
    ],
    // Admin - Full Access
    2: [
      'dashboard.view',
      'profile.view',
      'billing.view',
      'addons.view',
      'employees.view',
      'employees.invite',
      'visitorManagement.view',
      'attendance.view',
      'leaves.view',
      'leaves.approve',
      'reports.view',
      'payroll.view',
      'projects.view',
      'expenses.view',
      'timesheets.view',
      'audit.view',
      'settings.view',
      'notifications.view',
      'search.employees',
      'search.projects',
      'geofence.view',
      'regularization.view',
      'documents.view',
      'roles.view',
      'announcements.view',
    ],
    // HR Manager
    3: [
      'dashboard.view',
      'profile.view',
      'billing.view',
      'addons.view',
      'employees.view',
      'employees.invite',
      'visitorManagement.view',
      'attendance.view',
      'leaves.view',
      'leaves.approve',
      'reports.view',
      'projects.view',
      'expenses.view',
      'timesheets.view',
      'notifications.view',
      'search.employees',
      'search.projects',
      'geofence.view',
      'regularization.view',
      'documents.view',
      'roles.view',
      'announcements.view',
    ],
    // Manager
    4: [
      'dashboard.view',
      'profile.view',
      'billing.view',
      'addons.view',
      'employees.view',
      'visitorManagement.view',
      'attendance.view',
      'leaves.view',
      'leaves.approve',
      'reports.view',
      'projects.view',
      'expenses.view',
      'timesheets.view',
      'notifications.view',
      'search.employees',
      'search.projects',
      'geofence.view',
      'regularization.view',
      'documents.view',
      'announcements.view',
    ],
    // Employee - Limited Self Service Access Only
    5: [
      'dashboard.view',
      'profile.view',
      'billing.view',
      'addons.view',
      'visitorManagement.view',
      'attendance.view',
      'leaves.view',
      'projects.view',
      'expenses.view',
      'timesheets.view',
      'notifications.view',
      'search.projects',
    ],
  };

  private readonly routeRequirements: Record<
    string,
    { modules?: string[]; keys?: PermissionKey[] }
  > = {
    '/dashboard': { modules: ['dashboard'] },
    '/self-service': { modules: ['dashboard'] },
    '/ess': { modules: ['dashboard'] },
    '/billing': { modules: ['dashboard'] },
    '/add-ons': { modules: ['dashboard'], keys: ['addons.view'] },
    '/add-ons/guide': { modules: ['dashboard'], keys: ['addons.view'] },
    '/settings': { modules: ['settings'] },
    '/employees': { modules: ['employees'] },
    '/employees/add': { modules: ['employees'] },
    '/employees/edit': { modules: ['employees'] },
    '/employees/view': { modules: ['employees'] },
    '/attendance': { modules: ['attendance'] },
    '/attendance/integrations': { modules: ['attendance'] },
    '/face-registration': { modules: ['attendance'] },
    '/leaves': { modules: ['leaves'] },
    '/reports': { modules: ['reports'] },
    '/reports-center': { modules: ['reports'] },
    '/visit-management': { modules: ['visitorManagement'], keys: ['visitorManagement.view'] },
    '/payroll': { modules: ['payroll'] },
    '/projects': { modules: ['projects'] },
    '/expenses': { modules: ['expenses'] },
    '/timesheets': { modules: ['timesheets'] },
    '/admin/audit': { modules: ['audit'] },
    '/admin/settings': { modules: ['settings'] },
    '/admin/geofence': { modules: ['geofence'] },
    '/admin/team-attendance': { modules: ['attendance'] },
    '/admin/regularization': { modules: ['regularization'] },
    '/admin/documents': { modules: ['documents'] },
    '/admin/roles': { modules: ['roles'] },
    '/admin/announcements': { modules: ['settings'] },
    '/employees/invitations': { modules: ['employees'] },
  };

  private readonly permissionAliases: Record<
    PermissionKey,
    { modules?: string[]; keys?: string[] }
  > = {
    'dashboard.view': { modules: ['dashboard'] },
    'profile.view': { modules: ['dashboard', 'profile'] },
    'billing.view': { modules: ['dashboard'] },
    'addons.view': { modules: ['dashboard'] },
    'employees.view': { modules: ['employees'] },
    'employees.invite': { modules: ['employees'] },
    'visitorManagement.view': { modules: ['visitorManagement'] },
    'attendance.view': { modules: ['attendance'] },
    'leaves.view': { modules: ['leaves'] },
    'leaves.approve': { modules: ['leaves'] },
    'reports.view': { modules: ['reports'] },
    'payroll.view': { modules: ['payroll'] },
    'projects.view': { modules: ['projects'] },
    'expenses.view': { modules: ['expenses'] },
    'timesheets.view': { modules: ['timesheets'] },
    'audit.view': { modules: ['audit'] },
    'settings.view': { modules: ['settings'] },
    'notifications.view': { modules: ['notifications'] },
    'search.employees': { modules: ['employees'] },
    'search.projects': { modules: ['projects'] },
    'geofence.view': { modules: ['geofence'] },
    'regularization.view': { modules: ['regularization'] },
    'documents.view': { modules: ['documents'] },
    'roles.view': { modules: ['roles'] },
    'announcements.view': { modules: ['settings'] },
    employee_read: { modules: ['employees'], keys: ['employees.view'] },
    employee_create: { modules: ['employees'] },
    employee_update: { modules: ['employees'] },
    employee_delete: { modules: ['employees'] },
    attendance_read: { modules: ['attendance'], keys: ['attendance.view'] },
    attendance_create: { modules: ['attendance'] },
    attendance_update: { modules: ['attendance'] },
    attendance_approve: { modules: ['attendance'] },
    leave_read: { modules: ['leaves'], keys: ['leaves.view'] },
    leave_create: { modules: ['leaves'] },
    leave_update: { modules: ['leaves'] },
    leave_approve: { modules: ['leaves'], keys: ['leaves.approve'] },
    leave_reject: { modules: ['leaves'] },
    leave_process: { modules: ['leaves'] },
    payroll_read: { modules: ['payroll'], keys: ['payroll.view'] },
    payroll_process: { modules: ['payroll'] },
    reports_read: { modules: ['reports'], keys: ['reports.view'] },
    reports_export: { modules: ['reports'] },
    settings_read: { modules: ['settings'], keys: ['settings.view'] },
    settings_update: { modules: ['settings'] },
    rbac_manage: { modules: ['roles'], keys: ['roles.view'] },
  };

  private readonly moduleFallbackRoutes: Record<string, string[]> = {
    dashboard: ['/dashboard', '/self-service', '/ess', '/add-ons', '/billing'],
    employees: ['/employees', '/employees/invitations'],
    visitorManagement: ['/visit-management'],
    attendance: ['/attendance', '/admin/team-attendance'],
    leaves: ['/leaves'],
    reports: ['/reports', '/reports-center'],
    payroll: ['/payroll'],
    projects: ['/projects'],
    expenses: ['/expenses'],
    timesheets: ['/timesheets'],
    audit: ['/admin/audit'],
    settings: ['/settings', '/admin/settings', '/admin/announcements'],
    geofence: ['/admin/geofence'],
    regularization: ['/admin/regularization'],
    documents: ['/admin/documents'],
    roles: ['/admin/roles'],
    notifications: [],
    profile: ['/profile'],
  };

  private permissionCatalog: RolePermission[] = [];
  private permissionCatalogLoaded = false;
  private permissionCatalogLoading = false;
  private permissionCatalogRequest$: Observable<RolePermission[]> | null = null;
  private roleAccessCache = new Map<number, AccessSnapshot>();
  private roleAccessLoading = new Set<number>();

  private resolveRoleId(user: User | null | undefined): RoleId | null {
    const rawRole = (user as any)?.roleId;
    if (rawRole === null || rawRole === undefined) return null;
    const parsed = Number(rawRole);
    if (!Number.isFinite(parsed)) return null;
    return parsed as RoleId;
  }

  private normalizeRoute(route: string): string {
    const cleanRoute = (route || '').split('?')[0].split('#')[0].trim();
    if (!cleanRoute) return '';
    return cleanRoute === '/' ? '/' : cleanRoute.replace(/\/+$/, '');
  }

  private getRouteRequirement(route: string): { modules?: string[]; keys?: PermissionKey[] } | null {
    const normalizedRoute = this.normalizeRoute(route);
    if (!normalizedRoute) return null;

    if (this.routeRequirements[normalizedRoute]) {
      return this.routeRequirements[normalizedRoute];
    }

    const matchingRoute = Object.keys(this.routeRequirements)
      .filter((candidate) => normalizedRoute === candidate || normalizedRoute.startsWith(`${candidate}/`))
      .sort((a, b) => b.length - a.length)[0];

    return matchingRoute ? this.routeRequirements[matchingRoute] : null;
  }

  private setLoadedPermissions(permissions: RolePermission[]): void {
    this.permissionCatalog = permissions;
    this.permissionCatalogLoaded = true;
    this.permissionCatalogLoading = false;
  }

  private ensurePermissionCatalog() {
    if (this.permissionCatalogLoaded) {
      return of(this.permissionCatalog);
    }

    if (!this.permissionCatalogRequest$) {
      this.permissionCatalogLoading = true;
      this.permissionCatalogRequest$ = this.roleService.getPermissions().pipe(
        tap((permissions) => this.setLoadedPermissions(permissions)),
        catchError(() => {
          this.setLoadedPermissions([]);
          return of([] as RolePermission[]);
        }),
        shareReplay(1)
      );
    }

    return this.permissionCatalogRequest$;
  }

  private getPermissionCatalogSync(): RolePermission[] {
    return this.permissionCatalogLoaded ? this.permissionCatalog : [];
  }

  private buildAccessSnapshot(
    rolePermissions: Array<number | string>,
  ): AccessSnapshot {
    const catalog = this.getPermissionCatalogSync();
    const permissionById = new Map<number, RolePermission>();
    catalog.forEach((permission) => permissionById.set(permission.id, permission));

    const modules = new Set<string>();
    const keys = new Set<string>();

    rolePermissions.forEach((value) => {
      const id = Number(value);
      if (!Number.isFinite(id)) return;

      const permission = permissionById.get(id);
      if (!permission) return;

      const moduleName = String(permission.module ?? '').trim();
      const permissionKey = String(
        permission.permissionKey ?? permission.slug ?? ''
      ).trim();

      if (moduleName) {
        modules.add(moduleName);
        (this.backendModuleAliases[moduleName] || []).forEach((alias) =>
          modules.add(alias),
        );
      }
      if (permissionKey) {
        keys.add(permissionKey);
        const alias =
          this.permissionAliases[permissionKey as PermissionKey];
        alias?.keys?.forEach((key) => keys.add(key));
        alias?.modules?.forEach((module) => modules.add(module));
      }
    });

    return { modules, keys };
  }

  private buildExplicitPermissionSnapshot(
    permissions: string[],
  ): AccessSnapshot {
    const modules = new Set<string>();
    const keys = new Set<string>();

    permissions.forEach((permission) => {
      const key = String(permission || '').trim();
      if (!key) return;
      keys.add(key);

      const alias = this.permissionAliases[key as PermissionKey];
      alias?.keys?.forEach((mappedKey) => keys.add(mappedKey));
      alias?.modules?.forEach((module) => modules.add(module));
    });

    return { modules, keys };
  }

  private mergeSnapshots(
    primary: AccessSnapshot | null,
    secondary: AccessSnapshot | null,
  ): AccessSnapshot | null {
    if (!primary && !secondary) return null;
    const modules = new Set<string>();
    const keys = new Set<string>();

    [primary, secondary].forEach((snapshot) => {
      snapshot?.modules.forEach((module) => modules.add(module));
      snapshot?.keys.forEach((key) => keys.add(key));
    });

    return { modules, keys };
  }

  private buildLegacyAccessSnapshot(roleId: RoleId): AccessSnapshot {
    const modules = new Set<string>();
    const keys = new Set<string>();
    const legacyPermissions = this.legacyRolePermissions[roleId] ?? [];

    legacyPermissions.forEach((permission) => {
      keys.add(permission);
      const alias = this.permissionAliases[permission];
      alias?.modules?.forEach((module) => modules.add(module));
      alias?.keys?.forEach((key) => keys.add(key));
    });

    return { modules, keys };
  }

  private cacheAccessForRole(roleId: number, rolePermissions: Array<number | string>) {
    this.roleAccessCache.set(roleId, this.buildAccessSnapshot(rolePermissions));
  }

  syncForUser(user: User | null | undefined): void {
    const roleId = this.resolveRoleId(user);
    if (!roleId) return;

    if (this.roleAccessCache.has(roleId) || this.roleAccessLoading.has(roleId)) {
      return;
    }

    this.roleAccessLoading.add(roleId);
    firstValueFrom(this.ensurePermissionCatalog())
      .then((permissionsCatalog) => {
        if (!this.permissionCatalogLoaded && permissionsCatalog) {
          this.setLoadedPermissions(permissionsCatalog);
        }
        return firstValueFrom(this.roleService.getRoleById(roleId));
      })
      .then((role) => {
        const hasBackendPermissions =
          this.permissionCatalogLoaded &&
          this.permissionCatalog.length > 0 &&
          Array.isArray(role?.permissions) &&
          role.permissions.length > 0;

        this.roleAccessCache.set(
          roleId,
          hasBackendPermissions
            ? this.buildAccessSnapshot(role?.permissions ?? [])
            : this.buildLegacyAccessSnapshot(roleId),
        );
      })
      .catch(() => {
        // Keep the legacy role matrix as a safe fallback.
      })
      .finally(() => {
        this.roleAccessLoading.delete(roleId);
      });
  }

  private getAccessSnapshot(user: User | null | undefined): AccessSnapshot | null {
    const roleId = this.resolveRoleId(user);
    const explicitPermissions = Array.isArray((user as any)?.permissions)
      ? ((user as any).permissions as string[])
      : [];
    const explicitSnapshot = explicitPermissions.length
      ? this.buildExplicitPermissionSnapshot(explicitPermissions)
      : null;

    if (!roleId) return explicitSnapshot;

    const cached = this.roleAccessCache.get(roleId);
    if (cached || explicitSnapshot) {
      return this.mergeSnapshots(cached ?? null, explicitSnapshot);
    }

    return null;
  }

  hasPermission(
    user: User | null | undefined,
    permission: PermissionKey,
  ): boolean {
    const explicitUserPermissions = Array.isArray((user as any)?.permissions)
      ? ((user as any).permissions as string[])
      : []
    if (explicitUserPermissions.includes(permission)) return true

    const roleId = this.resolveRoleId(user);
    if (!roleId) return true;

    const cached = this.getAccessSnapshot(user);
    const alias = this.permissionAliases[permission];

    if (cached) {
      if (cached.keys.has(permission)) return true;
      if (alias?.keys?.some((key) => cached.keys.has(key))) return true;
      if (alias?.modules?.some((module) => cached.modules.has(module))) return true;
    }

    const legacy = this.legacyRolePermissions[roleId];
    if (!legacy) return true;
    return legacy.includes(permission);
  }

  canAccessRoute(user: User | null | undefined, route: string): boolean {
    const requirement = this.getRouteRequirement(route);
    if (!requirement) return true;

    const roleId = this.resolveRoleId(user);
    if (!roleId) return true;

    const cached = this.getAccessSnapshot(user);
    if (cached) {
      if (requirement.keys?.some((key) => cached.keys.has(key))) return true;
      if (requirement.modules?.some((module) => cached.modules.has(module)))
        return true;
      return false;
    }

    const legacySnapshot = this.buildLegacyAccessSnapshot(roleId);
    if (requirement.keys?.some((key) => legacySnapshot.keys.has(key))) return true;
    if (requirement.modules?.some((module) => legacySnapshot.modules.has(module))) return true;

    const fallbackKey = requirement.keys?.[0];
    return fallbackKey ? this.hasPermission(user, fallbackKey) : false;
  }

  canApproveLeaves(user: User | null | undefined): boolean {
    return this.hasPermission(user, 'leaves.approve');
  }

  // Get accessible modules based on user permissions
  getAccessibleModules(user: User | null | undefined): {
    key: string;
    name: string;
    icon: string;
    route: string;
    permission: PermissionKey | null;
  }[] {
    const allModules: {
      key: string;
      name: string;
      icon: string;
      route: string;
      permission: PermissionKey | null;
      module?: string;
    }[] = [
      {
        key: 'dashboard',
        name: 'Self-Service',
        icon: 'grid',
        route: '/dashboard',
        permission: null,
        module: 'dashboard',
      },
      {
        key: 'ess',
        name: 'ESS Center',
        icon: 'grid',
        route: '/ess',
        permission: null,
        module: 'dashboard',
      },
      {
        key: 'profile',
        name: 'Profile',
        icon: 'user-circle',
        route: '/profile',
        permission: null,
        module: 'profile',
      },
      {
        key: 'billing',
        name: 'Billing',
        icon: 'credit-card',
        route: '/billing',
        permission: 'billing.view',
        module: 'dashboard',
      },
      {
        key: 'employees',
        name: 'Employees',
        icon: 'users',
        route: '/employees',
        permission: 'employees.view',
        module: 'employees',
      },
      {
        key: 'visitor-management',
        name: 'Visit Management',
        icon: 'users',
        route: '/visit-management',
        permission: 'visitorManagement.view',
        module: 'visitorManagement',
      },
      {
        key: 'attendance',
        name: 'Attendance',
        icon: 'calendar',
        route: '/attendance',
        permission: 'attendance.view',
        module: 'attendance',
      },
      {
        key: 'leaves',
        name: 'Leaves',
        icon: 'clipboard',
        route: '/leaves',
        permission: 'leaves.view',
        module: 'leaves',
      },
      {
        key: 'reports',
        name: 'Reports',
        icon: 'bar-chart',
        route: '/reports',
        permission: 'reports.view',
        module: 'reports',
      },
      {
        key: 'projects',
        name: 'Projects',
        icon: 'folder',
        route: '/projects',
        permission: 'projects.view',
        module: 'projects',
      },
      {
        key: 'expenses',
        name: 'Expenses',
        icon: 'dollar-sign',
        route: '/expenses',
        permission: 'expenses.view',
        module: 'expenses',
      },
      {
        key: 'payroll',
        name: 'Payroll',
        icon: 'credit-card',
        route: '/payroll',
        permission: 'payroll.view',
        module: 'payroll',
      },
      {
        key: 'admin',
        name: 'Settings',
        icon: 'settings',
        route: '/admin/settings',
        permission: 'settings.view',
        module: 'settings',
      },
      {
        key: 'roles',
        name: 'Roles',
        icon: 'shield',
        route: '/admin/roles',
        permission: 'roles.view',
        module: 'roles',
      },
      {
        key: 'geofence',
        name: 'Geofence',
        icon: 'map-pin',
        route: '/admin/geofence',
        permission: 'geofence.view',
        module: 'geofence',
      },
      {
        key: 'audit',
        name: 'Audit Logs',
        icon: 'file-text',
        route: '/admin/audit',
        permission: 'audit.view',
        module: 'audit',
      },
      {
        key: 'documents',
        name: 'Documents',
        icon: 'file',
        route: '/admin/documents',
        permission: 'documents.view',
        module: 'documents',
      },
      {
        key: 'regularization',
        name: 'Regularization',
        icon: 'refresh-cw',
        route: '/admin/regularization',
        permission: 'regularization.view',
        module: 'regularization',
      },
      {
        key: 'team',
        name: 'Team',
        icon: 'user-check',
        route: '/admin/team-attendance',
        permission: 'attendance.view',
        module: 'attendance',
      },
      {
        key: 'announcements',
        name: 'Announcements',
        icon: 'megaphone',
        route: '/admin/announcements',
        permission: 'settings.view',
        module: 'settings',
      },
    ];

    return allModules.filter((module) => this.canAccessRoute(user, module.route));
  }

  // Get user role name
  getRoleName(user: User | null | undefined): string {
    const roleId = this.resolveRoleId(user);
    const roleNames: Record<RoleId, string> = {
      1: 'Super Admin',
      2: 'Admin',
      3: 'HR Manager',
      4: 'Manager',
      5: 'Employee',
    };
    return roleId ? roleNames[roleId] : 'User';
  }
}
