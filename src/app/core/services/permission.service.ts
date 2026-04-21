import { Injectable, inject } from '@angular/core';
import { User } from '../models/auth.model';
import {
  Observable,
  catchError,
  firstValueFrom,
  of,
  shareReplay,
  tap,
} from 'rxjs';
import { RoleService, Permission as RolePermission } from './role.service';

export type PermissionKey =
  | 'organization.create'
  | 'organization.read'
  | 'organization.update'
  | 'organization.delete'
  | 'organization.analytics'
  | 'admin.create'
  | 'admin.read'
  | 'admin.update'
  | 'admin.delete'
  | 'roles.assign'
  | 'roles.manage'
  | 'hierarchy.read'
  | 'hierarchy.update'
  | 'employee.read'
  | 'employee.create'
  | 'employee.update'
  | 'employee.delete'
  | 'attendance.read'
  | 'attendance.create'
  | 'attendance.update'
  | 'attendance.approve'
  | 'attendance.team.view'
  | 'attendance.regularization.view'
  | 'leave.read'
  | 'leave.view'
  | 'leave.apply'
  | 'leave.create'
  | 'leave.update'
  | 'leave.approve'
  | 'leave.reject'
  | 'leave.process'
  | 'wfh.read'
  | 'wfh.create'
  | 'wfh.approve'
  | 'payroll.read'
  | 'payroll.create'
  | 'payroll.update'
  | 'payroll.approve'
  | 'reports.read'
  | 'reports.export'
  | 'settings.read'
  | 'settings.manage'
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
  | 'rbac_manage'
  | string;

type RoleId = 1 | 2 | 3 | 4 | 5;
export type RbacRoleKey =
  | 'super_admin'
  | 'organization_admin'
  | 'hr_manager'
  | 'manager'
  | 'employee';
export type RbacScope = 'global' | 'organization' | 'team' | 'self';

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
    attendance_management: ['attendance'],
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
      'settings.view',
      'notifications.view',
      'search.employees',
      'search.projects',
      'geofence.view',
      'regularization.view',
      'documents.view',
      'announcements.view',
    ],
    // Manager
    4: [
      'dashboard.view',
      'profile.view',
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
    '/my-team': { modules: ['dashboard'] },
    '/billing': { keys: ['billing.view'] },
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
    '/visit-management': {
      modules: ['visitorManagement'],
      keys: ['visitorManagement.view'],
    },
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
    'organization.create': { keys: ['rbac_manage'] },
    'organization.read': { keys: ['settings.view'] },
    'organization.update': { keys: ['settings.view', 'settings_update'] },
    'organization.delete': { keys: ['rbac_manage'] },
    'organization.analytics': {
      modules: ['reports', 'audit'],
      keys: ['reports.view', 'audit.view'],
    },
    'admin.create': { keys: ['rbac_manage', 'roles.assign'] },
    'admin.read': { keys: ['roles.view'] },
    'admin.update': { keys: ['rbac_manage', 'roles.manage'] },
    'admin.delete': { keys: ['rbac_manage', 'roles.manage'] },
    'roles.assign': { modules: ['roles'], keys: ['roles.view', 'rbac_manage'] },
    'roles.manage': { modules: ['roles'], keys: ['roles.view', 'rbac_manage'] },
    'hierarchy.read': {
      modules: ['employees'],
      keys: ['employees.view', 'employee.read'],
    },
    'hierarchy.update': {
      modules: ['employees', 'roles'],
      keys: ['employee.update', 'rbac_manage'],
    },
    'employee.read': {
      modules: ['employees'],
      keys: ['employees.view', 'employee_read'],
    },
    'employee.create': { modules: ['employees'], keys: ['employee_create'] },
    'employee.update': { modules: ['employees'], keys: ['employee_update'] },
    'employee.delete': { modules: ['employees'], keys: ['employee_delete'] },
    'attendance.read': {
      modules: ['attendance'],
      keys: ['attendance.view', 'attendance_read'],
    },
    'attendance.create': {
      modules: ['attendance'],
      keys: ['attendance_create'],
    },
    'attendance.update': {
      modules: ['attendance'],
      keys: ['attendance_update'],
    },
    'attendance.approve': {
      modules: ['attendance'],
      keys: ['attendance_approve'],
    },
    'attendance.team.view': {
      modules: ['attendance'],
      keys: ['attendance.view', 'attendance_approve'],
    },
    'attendance.regularization.view': {
      modules: ['regularization', 'attendance'],
      keys: ['regularization.view', 'attendance_approve'],
    },
    'leave.read': {
      modules: ['leaves'],
      keys: ['leave_read', 'leaves.view', 'leave.view'],
    },
    'leave.view': {
      modules: ['leaves'],
      keys: ['leaves.view', 'leave_read', 'leave.read'],
    },
    'leave.apply': {
      modules: ['leaves'],
      keys: ['leave_create', 'leave.create'],
    },
    'leave.create': {
      modules: ['leaves'],
      keys: ['leave_create', 'leave.apply'],
    },
    'leave.update': { modules: ['leaves'], keys: ['leave_update'] },
    'leave.approve': {
      modules: ['leaves'],
      keys: ['leave_approve', 'leaves.approve'],
    },
    'leave.reject': { modules: ['leaves'], keys: ['leave_reject'] },
    'leave.process': { modules: ['leaves'], keys: ['leave_process'] },
    'leave.balance.view': {
      modules: ['leaves'],
      keys: ['leave.view', 'leaves.view', 'leave_read'],
    },
    'leave.shortDay.view': {
      modules: ['leaves'],
      keys: ['leave.view', 'leaves.view', 'leave_read', 'leave_create'],
    },
    'leave.timeOff.view': {
      modules: ['leaves'],
      keys: ['leave.view', 'leaves.view', 'leave_read', 'leave_create'],
    },
    'leave.compOff.view': {
      modules: ['leaves'],
      keys: ['leave.view', 'leaves.view', 'leave_read'],
    },
    'wfh.read': { modules: ['attendance', 'leaves'] },
    'wfh.create': { modules: ['attendance', 'leaves'] },
    'wfh.approve': {
      modules: ['attendance', 'leaves'],
      keys: ['leave.approve', 'attendance.approve'],
    },
    'payroll.read': {
      modules: ['payroll'],
      keys: ['payroll.view', 'payroll_read'],
    },
    'payroll.create': { modules: ['payroll'], keys: ['payroll_process'] },
    'payroll.update': { modules: ['payroll'], keys: ['payroll_process'] },
    'payroll.approve': { modules: ['payroll'], keys: ['payroll_process'] },
    'reports.read': {
      modules: ['reports'],
      keys: ['reports.view', 'reports_read'],
    },
    'reports.export': { modules: ['reports'], keys: ['reports_export'] },
    'settings.read': {
      modules: ['settings'],
      keys: ['settings.view', 'settings_read'],
    },
    'settings.manage': {
      modules: ['settings'],
      keys: ['settings_update', 'settings.view'],
    },
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
    employee_read: {
      modules: ['employees'],
      keys: ['employees.view', 'employee.read'],
    },
    employee_create: { modules: ['employees'], keys: ['employee.create'] },
    employee_update: { modules: ['employees'], keys: ['employee.update'] },
    employee_delete: { modules: ['employees'], keys: ['employee.delete'] },
    attendance_read: {
      modules: ['attendance'],
      keys: ['attendance.view', 'attendance.read'],
    },
    attendance_create: { modules: ['attendance'], keys: ['attendance.create'] },
    attendance_update: { modules: ['attendance'], keys: ['attendance.update'] },
    attendance_approve: {
      modules: ['attendance'],
      keys: ['attendance.approve', 'attendance.team.view'],
    },
    leave_read: {
      modules: ['leaves'],
      keys: ['leaves.view', 'leave.read', 'leave.view'],
    },
    leave_create: {
      modules: ['leaves'],
      keys: ['leave.create', 'leave.apply'],
    },
    leave_update: { modules: ['leaves'], keys: ['leave.update'] },
    leave_approve: {
      modules: ['leaves'],
      keys: ['leaves.approve', 'leave.approve'],
    },
    leave_reject: { modules: ['leaves'], keys: ['leave.reject'] },
    leave_process: { modules: ['leaves'], keys: ['leave.process'] },
    payroll_read: {
      modules: ['payroll'],
      keys: ['payroll.view', 'payroll.read'],
    },
    payroll_process: {
      modules: ['payroll'],
      keys: ['payroll.update', 'payroll.approve'],
    },
    reports_read: {
      modules: ['reports'],
      keys: ['reports.view', 'reports.read'],
    },
    reports_export: { modules: ['reports'], keys: ['reports.export'] },
    settings_read: {
      modules: ['settings'],
      keys: ['settings.view', 'settings.read'],
    },
    settings_update: { modules: ['settings'], keys: ['settings.manage'] },
    rbac_manage: {
      modules: ['roles'],
      keys: ['roles.view', 'roles.assign', 'roles.manage'],
    },
    module5_view: {
      modules: ['attendance'],
      keys: ['attendance.view', 'attendance.read', 'attendance_read'],
    },
    module5_UserView: {
      modules: ['attendance'],
      keys: ['attendance.view', 'attendance.read', 'attendance_read'],
    },
    module445_view: {
      modules: ['attendance', 'regularization'],
      keys: [
        'attendance.view',
        'attendance.regularization.view',
        'regularization.view',
      ],
    },
    module445_UserView: {
      modules: ['attendance', 'regularization'],
      keys: [
        'attendance.view',
        'attendance.regularization.view',
        'regularization.view',
      ],
    },
    module488_view: {
      modules: ['attendance'],
      keys: ['attendance.view', 'attendance.read'],
    },
    module488_UserView: {
      modules: ['attendance'],
      keys: ['attendance.view', 'attendance.read'],
    },
    module508_view: {
      modules: ['attendance'],
      keys: ['attendance.view', 'attendance.read'],
    },
    module443_view: {
      modules: ['attendance'],
      keys: ['attendance.view', 'attendance.team.view'],
    },
    module443_UserView: {
      modules: ['attendance'],
      keys: ['attendance.view', 'attendance.team.view'],
    },
    module518_view: {
      modules: ['attendance'],
      keys: ['attendance.view', 'attendance.team.view'],
    },
    module518_UserView: {
      modules: ['attendance'],
      keys: ['attendance.view', 'attendance.team.view'],
    },
    module305_view: { modules: ['attendance'], keys: ['attendance.view'] },
    module517_view: { modules: ['attendance'], keys: ['attendance.view'] },
    module519_view: { modules: ['attendance'], keys: ['attendance.view'] },
    module516_view: { modules: ['attendance'], keys: ['attendance.view'] },
    module516_UserView: { modules: ['attendance'], keys: ['attendance.view'] },
    module318_view: {
      modules: ['attendance', 'geofence'],
      keys: ['attendance.view', 'geofence.view'],
    },
    module318_UserView: {
      modules: ['attendance', 'geofence'],
      keys: ['attendance.view', 'geofence.view'],
    },
    module42_view: { modules: ['attendance'], keys: ['attendance.view'] },
    module42_UserView: { modules: ['attendance'], keys: ['attendance.view'] },
    module502_view: {
      modules: ['attendance', 'regularization'],
      keys: ['attendance.view', 'regularization.view'],
    },
    module502_UserView: {
      modules: ['attendance', 'regularization'],
      keys: ['attendance.view', 'regularization.view'],
    },
    module507_view: { modules: ['attendance'], keys: ['attendance.view'] },
    module507_UserView: { modules: ['attendance'], keys: ['attendance.view'] },
    module511_view: { modules: ['attendance'], keys: ['attendance.view'] },
    module511_UserView: { modules: ['attendance'], keys: ['attendance.view'] },
    module512_view: { modules: ['attendance'], keys: ['attendance.view'] },
    module512_UserView: { modules: ['attendance'], keys: ['attendance.view'] },
    module546_view: { modules: ['attendance'], keys: ['attendance.view'] },
    module546_UserView: { modules: ['attendance'], keys: ['attendance.view'] },
    module18_view: {
      modules: ['leaves'],
      keys: ['leave.view', 'leave.read', 'leaves.view', 'leave_read'],
    },
    module18_UserView: {
      modules: ['leaves'],
      keys: ['leave.view', 'leave.read', 'leaves.view', 'leave_read'],
    },
    module18_add: {
      modules: ['leaves'],
      keys: ['leave.apply', 'leave.create', 'leave_create'],
    },
    module18_edit: {
      modules: ['leaves'],
      keys: ['leave.update', 'leave_update'],
    },
    module160_view: {
      modules: ['leaves'],
      keys: ['leave.view', 'leave.read', 'leaves.view'],
    },
    module160_UserView: {
      modules: ['leaves'],
      keys: ['leave.view', 'leave.read', 'leaves.view'],
    },
    module540_view: {
      modules: ['leaves'],
      keys: ['leave.view', 'leave.apply', 'leaves.view'],
    },
    module540_UserView: {
      modules: ['leaves'],
      keys: ['leave.view', 'leave.apply', 'leaves.view'],
    },
    module540_add: {
      modules: ['leaves'],
      keys: ['leave.create', 'leave.apply', 'leave_create'],
    },
    module540_edit: {
      modules: ['leaves'],
      keys: ['leave.update', 'leave_update'],
    },
    module179_view: {
      modules: ['leaves'],
      keys: ['leave.view', 'leave.apply', 'leaves.view'],
    },
    module179_UserView: {
      modules: ['leaves'],
      keys: ['leave.view', 'leave.apply', 'leaves.view'],
    },
    module179_add: {
      modules: ['leaves'],
      keys: ['leave.create', 'leave.apply', 'leave_create'],
    },
    module179_edit: {
      modules: ['leaves'],
      keys: ['leave.update', 'leave_update'],
    },
    module450_view: {
      modules: ['leaves'],
      keys: ['leave.view', 'leaves.view'],
    },
    module450_UserView: {
      modules: ['leaves'],
      keys: ['leave.view', 'leaves.view'],
    },
    module450_add: {
      modules: ['leaves'],
      keys: ['leave.create', 'leave.apply'],
    },
    module450_edit: { modules: ['leaves'], keys: ['leave.update'] },
    module31_view: {
      modules: ['leaves', 'settings'],
      keys: ['leave.view', 'settings.view'],
    },
    module31_UserView: {
      modules: ['leaves', 'settings'],
      keys: ['leave.view', 'settings.view'],
    },
    module458_view: {
      modules: ['payroll'],
      keys: ['payroll.view', 'payroll.read', 'payroll_read'],
    },
    module491_view: {
      modules: ['payroll'],
      keys: ['payroll.view', 'payroll.read', 'payroll_read'],
    },
    module500_view: {
      modules: ['payroll'],
      keys: ['payroll.view', 'payroll.read', 'payroll_read'],
    },
    module40_view: { modules: ['payroll'], keys: ['payroll.view'] },
    module40_UserView: { modules: ['payroll'], keys: ['payroll.view'] },
    module292_view: { modules: ['payroll'], keys: ['payroll.view'] },
    module292_UserView: { modules: ['payroll'], keys: ['payroll.view'] },
    module449_view: {
      modules: ['payroll', 'expenses'],
      keys: ['payroll.view', 'expenses.view'],
    },
    module449_UserView: {
      modules: ['payroll', 'expenses'],
      keys: ['payroll.view', 'expenses.view'],
    },
    module170_view: { modules: ['expenses'], keys: ['expenses.view'] },
    module170_UserView: { modules: ['expenses'], keys: ['expenses.view'] },
    module454_view: { modules: ['payroll'], keys: ['payroll.view'] },
    module454_UserView: { modules: ['payroll'], keys: ['payroll.view'] },
    module481_view: { modules: ['payroll'], keys: ['payroll.view'] },
    module481_UserView: { modules: ['payroll'], keys: ['payroll.view'] },
    module486_view: {
      modules: ['payroll', 'expenses'],
      keys: ['payroll.view', 'expenses.view'],
    },
    module486_UserView: {
      modules: ['payroll', 'expenses'],
      keys: ['payroll.view', 'expenses.view'],
    },
    module490_view: {
      modules: ['payroll', 'expenses'],
      keys: ['payroll.view', 'expenses.view'],
    },
    module490_UserView: {
      modules: ['payroll', 'expenses'],
      keys: ['payroll.view', 'expenses.view'],
    },
    module187_view: { modules: ['timesheets'], keys: ['timesheets.view'] },
    module68_view: {
      modules: ['reports'],
      keys: ['reports.view', 'reports.read', 'reports_read'],
    },
    module19_view: {
      modules: ['employees'],
      keys: ['employees.view', 'employee.read', 'employee_read'],
    },
    module19_add: {
      modules: ['employees'],
      keys: ['employees.invite', 'employee.create', 'employee_create'],
    },
    module64_view: {
      modules: ['employees'],
      keys: ['employees.view', 'employee.read'],
    },
    module114_UserView: {
      modules: ['employees'],
      keys: ['employees.view', 'employee.read'],
    },
    module115_UserView: {
      modules: ['employees'],
      keys: ['employees.view', 'employee.read'],
    },
    module10_view: {
      modules: ['documents', 'employees'],
      keys: ['documents.view', 'employee.read'],
    },
    module139_view: { modules: ['documents'], keys: ['documents.view'] },
    module146_view: { modules: ['documents'], keys: ['documents.view'] },
    module54_view: { modules: ['settings'], keys: ['settings.view'] },
    module49_view: {
      modules: ['settings'],
      keys: ['announcements.view', 'settings.view'],
    },
    module71_view: { modules: ['settings'], keys: ['settings.view'] },
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
    if (rawRole === null || rawRole === undefined) {
      return this.inferRoleIdFromName(user);
    }
    const parsed = Number(rawRole);
    if (!Number.isFinite(parsed)) return this.inferRoleIdFromName(user);
    if (parsed >= 1 && parsed <= 5) return parsed as RoleId;
    return this.inferRoleIdFromName(user);
  }

  private inferRoleIdFromName(user: User | null | undefined): RoleId | null {
    const roleName = this.normalizeRoleName(this.resolveRoleName(user));
    if (roleName.includes('super admin')) return 1;
    if (
      roleName.includes('organization admin') ||
      roleName.includes('org admin') ||
      roleName === 'admin'
    ) {
      return 2;
    }
    if (roleName.includes('hr manager') || roleName.includes('hr admin'))
      return 3;
    if (roleName.includes('manager')) return 4;
    if (roleName.includes('employee') || roleName.includes('staff')) return 5;
    return null;
  }

  private resolveRoleName(user: User | null | undefined): string {
    if (!user) return '';

    const rawRole =
      typeof user?.role === 'string'
        ? user.role
        : String(user?.role?.name || '').trim();

    if (rawRole) return rawRole;

    // Direct property check instead of calling resolveRoleId to avoid infinite recursion
    const rawRoleId = (user as any)?.roleId;
    const roleId = Number.isFinite(Number(rawRoleId))
      ? (Number(rawRoleId) as RoleId)
      : null;

    const roleNames: Record<RoleId, string> = {
      1: 'Super Admin',
      2: 'Admin',
      3: 'Admin',
      4: 'Manager',
      5: 'Employee',
    };

    return roleId ? roleNames[roleId] : 'User';
  }

  private normalizeRoleName(value: string | null | undefined): string {
    if (!value) return '';
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  getNormalizedRoleName(user: User | null | undefined): string {
    return this.normalizeRoleName(this.resolveRoleName(user));
  }

  getRoleDisplayName(user: User | null | undefined): string {
    const normalizedRole = this.getNormalizedRoleName(user);

    if (normalizedRole.includes('super admin')) return 'Super Admin';
    if (
      normalizedRole.includes('organization admin') ||
      normalizedRole.includes('org admin')
    ) {
      return 'Organization Admin';
    }
    if (
      normalizedRole.includes('hr manager') ||
      normalizedRole.includes('hr admin')
    ) {
      return 'HR Manager';
    }
    if (normalizedRole === 'admin' || normalizedRole.includes('(admin)')) {
      return 'Organization Admin';
    }
    if (normalizedRole.includes('manager')) return 'Manager';
    if (
      normalizedRole.includes('staff') ||
      normalizedRole.includes('employee')
    ) {
      return 'Employee';
    }

    const roleId = this.resolveRoleId(user);
    if (roleId === 1) return 'Super Admin';
    if (roleId === 2) return 'Organization Admin';
    if (roleId === 3) return 'HR Manager';
    if (roleId === 4) return 'Manager';
    if (roleId === 5) return 'Employee';

    return this.resolveRoleName(user);
  }

  getRoleKey(user: User | null | undefined): RbacRoleKey {
    const normalizedRole = this.getNormalizedRoleName(user);

    if (normalizedRole.includes('super admin')) return 'super_admin';
    if (
      normalizedRole.includes('hr admin') ||
      normalizedRole.includes('hr manager')
    ) {
      return 'hr_manager';
    }
    if (
      normalizedRole === 'admin' ||
      normalizedRole.includes('organization admin') ||
      normalizedRole.includes('org admin') ||
      normalizedRole.includes('(admin)')
    ) {
      return 'organization_admin';
    }
    if (normalizedRole.includes('manager')) return 'manager';

    const roleId = this.resolveRoleId(user);
    if (roleId === 1) return 'super_admin';
    if (roleId === 2) return 'organization_admin';
    if (roleId === 3) return 'hr_manager';
    if (roleId === 4) return 'manager';
    return 'employee';
  }

  getAccessScope(user: User | null | undefined): RbacScope {
    if (this.isSuperAdminUser(user)) return 'global';
    if (this.isAdminUser(user)) return 'organization';
    if (this.isManagerialUser(user)) return 'team';
    return 'self';
  }

  private normalizeRoute(route: string): string {
    const cleanRoute = (route || '').split('?')[0].split('#')[0].trim();
    if (!cleanRoute) return '';
    return cleanRoute === '/' ? '/' : cleanRoute.replace(/\/+$/, '');
  }

  private getRouteRequirement(
    route: string,
  ): { modules?: string[]; keys?: PermissionKey[] } | null {
    const normalizedRoute = this.normalizeRoute(route);
    if (!normalizedRoute) return null;

    if (this.routeRequirements[normalizedRoute]) {
      return this.routeRequirements[normalizedRoute];
    }

    const matchingRoute = Object.keys(this.routeRequirements)
      .filter(
        (candidate) =>
          normalizedRoute === candidate ||
          normalizedRoute.startsWith(`${candidate}/`),
      )
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
        shareReplay(1),
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
    catalog.forEach((permission) =>
      permissionById.set(permission.id, permission),
    );

    const modules = new Set<string>();
    const keys = new Set<string>();

    rolePermissions.forEach((value) => {
      const id = Number(value);
      if (!Number.isFinite(id)) return;

      const permission = permissionById.get(id);
      if (!permission) return;

      const moduleName = String(permission.module ?? '').trim();
      const permissionKey = String(
        permission.permissionKey ?? permission.slug ?? '',
      ).trim();

      if (moduleName) {
        modules.add(moduleName);
        (this.backendModuleAliases[moduleName] || []).forEach((alias) =>
          modules.add(alias),
        );
      }
      if (permissionKey) {
        keys.add(permissionKey);
        const alias = this.permissionAliases[permissionKey as PermissionKey];
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

  private cacheAccessForRole(
    roleId: number,
    rolePermissions: Array<number | string>,
  ) {
    this.roleAccessCache.set(roleId, this.buildAccessSnapshot(rolePermissions));
  }

  syncForUser(user: User | null | undefined): void {
    const roleId = this.resolveRoleId(user);
    if (!roleId) return;

    if (
      this.roleAccessCache.has(roleId) ||
      this.roleAccessLoading.has(roleId)
    ) {
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

  private getAccessSnapshot(
    user: User | null | undefined,
  ): AccessSnapshot | null {
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

  isSuperAdminUser(user: User | null | undefined): boolean {
    const roleName = this.getNormalizedRoleName(user);
    return roleName.includes('super admin');
  }

  isAdminUser(user: User | null | undefined): boolean {
    if (this.isSuperAdminUser(user)) return true;

    const roleId = this.resolveRoleId(user);
    const scope = user?.accessScope;

    return (
      roleId === 2 ||
      scope === 'all' ||
      this.getRoleKey(user) === 'organization_admin'
    );
  }

  isOrganizationAdminUser(user: User | null | undefined): boolean {
    return this.getRoleKey(user) === 'organization_admin';
  }

  isHrManagerUser(user: User | null | undefined): boolean {
    return this.getRoleKey(user) === 'hr_manager';
  }

  isManagerialUser(user: User | null | undefined): boolean {
    if (this.isAdminUser(user)) return true;

    return this.isHrManagerUser(user) || this.getRoleKey(user) === 'manager';
  }

  isEmployeeUser(user: User | null | undefined): boolean {
    return !this.isManagerialUser(user);
  }

  canAccessOrganization(
    user: User | null | undefined,
    organizationId: number | null | undefined,
  ): boolean {
    if (this.isSuperAdminUser(user)) return true;
    if (organizationId == null) return false;

    const userOrganizationId = Number(user?.organizationId ?? user?.orgId ?? 0);
    return (
      userOrganizationId > 0 && userOrganizationId === Number(organizationId)
    );
  }

  canAccessEmployee(
    user: User | null | undefined,
    targetEmployeeId: number | null | undefined,
    organizationId?: number | null,
  ): boolean {
    if (this.isSuperAdminUser(user)) return true;
    if (targetEmployeeId == null) return false;
    if (
      organizationId != null &&
      !this.canAccessOrganization(user, organizationId)
    )
      return false;

    if (this.isOrganizationAdminUser(user)) return true;

    const currentEmployeeId = Number(user?.employeeId ?? user?.id ?? 0);
    if (currentEmployeeId && currentEmployeeId === Number(targetEmployeeId))
      return true;

    const subordinateIds = Array.isArray(user?.subordinateIds)
      ? user!.subordinateIds!
      : [];
    return subordinateIds.map(Number).includes(Number(targetEmployeeId));
  }

  canApproveForEmployee(
    user: User | null | undefined,
    targetEmployeeId: number | null | undefined,
    permission: Extract<
      PermissionKey,
      'leave.approve' | 'attendance.approve' | 'wfh.approve'
    >,
    organizationId?: number | null,
  ): boolean {
    return (
      this.hasPermission(user, permission) &&
      this.canAccessEmployee(user, targetEmployeeId, organizationId)
    );
  }

  hasPermission(
    user: User | null | undefined,
    permission: PermissionKey,
  ): boolean {
    if (this.isSuperAdminUser(user)) return true;

    if (permission === 'billing.view' && this.isOrganizationAdminUser(user)) {
      return true;
    }

    if (
      (permission === 'attendance.view' || permission === 'attendance.read') &&
      Number((user as any)?.shiftChangePerm ?? 0) === 1
    ) {
      return true;
    }

    if (
      permission === 'addons.view' &&
      Number((user as any)?.profileType ?? 0) !== 0 &&
      Number((user as any)?.profileType ?? 0) !== 9
    ) {
      return true;
    }

    if (
      permission === 'visitorManagement.view' &&
      Number((user as any)?.visitorManagementAddOn ?? 0) === 1
    ) {
      return true;
    }

    if (
      (permission === 'settings.view' || permission === 'settings.read') &&
      (Number((user as any)?.settingPerm ?? 0) === 1 ||
        Number((user as any)?.hrSts ?? 0) === 1 ||
        Number((user as any)?.profileType ?? 0) === 1)
    ) {
      return true;
    }

    const explicitUserPermissions = Array.isArray((user as any)?.permissions)
      ? ((user as any).permissions as string[])
      : [];
    if (explicitUserPermissions.includes(permission)) return true;

    const roleId = this.resolveRoleId(user);
    const cached = this.getAccessSnapshot(user);
    const alias = this.permissionAliases[permission];

    if (cached) {
      if (cached.keys.has(permission)) return true;
      if (alias?.keys?.some((key) => cached.keys.has(key))) return true;
      if (alias?.modules?.some((module) => cached.modules.has(module)))
        return true;
    }

    if (!roleId) return false;

    const legacy = this.legacyRolePermissions[roleId];
    if (!legacy) return false;
    if (legacy.includes(permission)) return true;

    const legacySnapshot = this.buildLegacyAccessSnapshot(roleId);
    if (alias?.keys?.some((key) => legacySnapshot.keys.has(key))) return true;
    if (alias?.modules?.some((module) => legacySnapshot.modules.has(module)))
      return true;

    return false;
  }

  canAccessRoute(user: User | null | undefined, route: string): boolean {
    if (this.isSuperAdminUser(user)) return true;

    if (
      this.normalizeRoute(route) === '/billing' &&
      this.isOrganizationAdminUser(user)
    ) {
      return true;
    }

    const requirement = this.getRouteRequirement(route);
    if (!requirement) return true;

    const roleId = this.resolveRoleId(user);
    const cached = this.getAccessSnapshot(user);
    if (cached) {
      if (requirement.keys?.some((key) => cached.keys.has(key))) return true;
      if (requirement.modules?.some((module) => cached.modules.has(module)))
        return true;
      return false;
    }

    if (!roleId) return false;

    const legacySnapshot = this.buildLegacyAccessSnapshot(roleId);
    if (requirement.keys?.some((key) => legacySnapshot.keys.has(key)))
      return true;
    if (
      requirement.modules?.some((module) => legacySnapshot.modules.has(module))
    )
      return true;

    const fallbackKey = requirement.keys?.[0];
    return fallbackKey ? this.hasPermission(user, fallbackKey) : false;
  }

  canApproveLeaves(user: User | null | undefined): boolean {
    return this.hasPermission(user, 'leaves.approve');
  }

  canManageEmployees(user: User | null | undefined): boolean {
    if (this.isAdminUser(user)) return true;

    return (
      this.hasPermission(user, 'employee_create') ||
      this.hasPermission(user, 'employee_update') ||
      this.hasPermission(user, 'employee_delete')
    );
  }

  canManageSettings(user: User | null | undefined): boolean {
    if (this.isAdminUser(user)) return true;
    return (
      this.canAccessRoute(user, '/settings') ||
      this.canAccessRoute(user, '/admin/settings')
    );
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

    if (this.isSuperAdminUser(user)) {
      return allModules;
    }

    return allModules.filter((module) =>
      this.canAccessRoute(user, module.route),
    );
  }

  // Get user role name
  getRoleName(user: User | null | undefined): string {
    return this.getRoleDisplayName(user);
  }
}
