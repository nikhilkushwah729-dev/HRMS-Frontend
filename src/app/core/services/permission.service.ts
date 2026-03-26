import { Injectable } from '@angular/core';
import { User } from '../models/auth.model';

export type PermissionKey =
  | 'dashboard.view'
  | 'employees.view'
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
  | 'roles.view';

type RoleId = 1 | 2 | 3 | 4 | 5;

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly rolePermissions: Record<RoleId, PermissionKey[]> = {
    // Super Admin - Full Access
    1: [
      'dashboard.view',
      'employees.view',
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
      'roles.view'
    ],
    // Admin - Full Access
    2: [
      'dashboard.view',
      'employees.view',
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
      'roles.view'
    ],
    // HR Manager
    3: [
      'dashboard.view',
      'employees.view',
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
      'roles.view'
    ],
    // Manager
    4: [
      'dashboard.view',
      'employees.view',
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
      'documents.view'
    ],
    // Employee - Limited Self Service Access Only
    5: [
      'dashboard.view',
      'attendance.view',
      'leaves.view',
      'projects.view',
      'expenses.view',
      'timesheets.view',
      'notifications.view',
      'search.projects'
    ]
  };

  private readonly routePermissionMap: Record<string, PermissionKey> = {
    '/dashboard': 'dashboard.view',
    '/self-service': 'dashboard.view',
    '/add-ons': 'dashboard.view',
    '/settings': 'dashboard.view',
    '/employees': 'employees.view',
    '/attendance': 'attendance.view',
    '/leaves': 'leaves.view',
    '/reports': 'reports.view',
    '/reports-center': 'reports.view',
    '/visit-management': 'employees.view',
    '/payroll': 'payroll.view',
    '/projects': 'projects.view',
    '/expenses': 'expenses.view',
    '/timesheets': 'timesheets.view',
    '/admin/audit': 'audit.view',
    '/admin/settings': 'settings.view',
    '/admin/geofence': 'geofence.view',
    '/admin/team-attendance': 'attendance.view',
    '/admin/regularization': 'regularization.view',
    '/admin/documents': 'documents.view',
    '/admin/roles': 'roles.view',
    '/employees/invitations': 'employees.view'
  };

  private resolveRoleId(user: User | null | undefined): RoleId | null {
    const rawRole = (user as any)?.roleId;
    if (rawRole === null || rawRole === undefined) return null;
    const parsed = Number(rawRole);
    if (!Number.isFinite(parsed)) return null;
    return parsed as RoleId;
  }

  hasPermission(user: User | null | undefined, permission: PermissionKey): boolean {
    const roleId = this.resolveRoleId(user);
    // Fail-safe: if role is missing/unknown, do not hide the UI completely.
    if (!roleId || !this.rolePermissions[roleId]) return true;
    return this.rolePermissions[roleId].includes(permission);
  }

  canAccessRoute(user: User | null | undefined, route: string): boolean {
    const key = this.routePermissionMap[route];
    if (!key) return true;
    return this.hasPermission(user, key);
  }

  canApproveLeaves(user: User | null | undefined): boolean {
    return this.hasPermission(user, 'leaves.approve');
  }

  // Get accessible modules based on user permissions
  getAccessibleModules(user: User | null | undefined): { key: string; name: string; icon: string; route: string; permission: PermissionKey | null }[] {
    const roleId = this.resolveRoleId(user);
    
    const allModules: { key: string; name: string; icon: string; route: string; permission: PermissionKey | null }[] = [
      { key: 'dashboard', name: 'Dashboard', icon: 'grid', route: '/self-service', permission: null },
      { key: 'employees', name: 'Employees', icon: 'users', route: '/employees', permission: 'employees.view' },
      { key: 'attendance', name: 'Attendance', icon: 'calendar', route: '/attendance', permission: 'attendance.view' },
      { key: 'leaves', name: 'Leaves', icon: 'clipboard', route: '/leaves', permission: 'leaves.view' },
      { key: 'reports', name: 'Reports', icon: 'bar-chart', route: '/reports', permission: 'reports.view' },
      { key: 'projects', name: 'Projects', icon: 'folder', route: '/projects', permission: 'projects.view' },
      { key: 'expenses', name: 'Expenses', icon: 'dollar-sign', route: '/expenses', permission: 'expenses.view' },
      { key: 'payroll', name: 'Payroll', icon: 'credit-card', route: '/payroll', permission: 'payroll.view' },
      { key: 'admin', name: 'Settings', icon: 'settings', route: '/admin/settings', permission: 'settings.view' },
      { key: 'roles', name: 'Roles', icon: 'shield', route: '/admin/roles', permission: 'roles.view' },
      { key: 'geofence', name: 'Geofence', icon: 'map-pin', route: '/admin/geofence', permission: 'geofence.view' },
      { key: 'audit', name: 'Audit Logs', icon: 'file-text', route: '/admin/audit', permission: 'audit.view' },
      { key: 'documents', name: 'Documents', icon: 'file', route: '/admin/documents', permission: 'documents.view' },
      { key: 'regularization', name: 'Regularization', icon: 'refresh-cw', route: '/admin/regularization', permission: 'regularization.view' },
      { key: 'team', name: 'Team', icon: 'user-check', route: '/admin/team-attendance', permission: 'attendance.view' },
    ];

    // If role is unknown, show all modules
    if (!roleId) return allModules;

    return allModules.filter(module => {
      if (!module.permission) return true;
      return this.hasPermission(user, module.permission);
    });
  }

  // Get user role name
  getRoleName(user: User | null | undefined): string {
    const roleId = this.resolveRoleId(user);
    const roleNames: Record<RoleId, string> = {
      1: 'Super Admin',
      2: 'Admin',
      3: 'HR Manager',
      4: 'Manager',
      5: 'Employee'
    };
    return roleId ? roleNames[roleId] : 'User';
  }
}
