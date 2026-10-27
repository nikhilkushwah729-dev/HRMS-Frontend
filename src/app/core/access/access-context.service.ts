import { Injectable, inject } from '@angular/core';
import { User } from '../models/auth.model';
import { PermissionService } from '../services/permission.service';
import { OrganizationService } from '../services/organization.service';
import { AccessUser } from './access.models';

@Injectable({
  providedIn: 'root',
})
export class AccessContextService {
  private readonly permissionService = inject(PermissionService);
  private readonly organizationService = inject(OrganizationService);

  private normalizeBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === '1' || normalized === 'true' || normalized === 'yes';
    }
    return Boolean(value);
  }

  private canAccessRoute(user: User | null | undefined, route: string): boolean {
    return this.permissionService.canAccessRoute(user, route);
  }

  private hasAddon(slug: string, aliases: string[] = []): boolean {
    return [slug, ...aliases].some((candidate) => this.organizationService.isModuleEnabled(candidate));
  }

  buildAccessUser(user: User | null | undefined): AccessUser | null {
    if (!user) return null;

    const role = this.permissionService.getRoleKey(user);
    const roleScope = this.permissionService.getAccessScope(user);
    const organizationId = user.organizationId ?? user.orgId ?? undefined;
    const employeeId = user.employeeId ?? user.id ?? undefined;
    const reportingManagerId = user.reportingManagerId ?? user.managerId ?? undefined;
    const subordinateIds = Array.isArray(user.subordinateIds) ? user.subordinateIds : [];

    const isSuperAdmin = this.permissionService.isSuperAdminUser(user);

    return {
      ...user,
      role,
      roleScope: isSuperAdmin ? 'global' : roleScope,
      organizationId,
      employeeId,
      reportingManagerId,
      subordinateIds,
      permissions: {
        'dashboard.view': isSuperAdmin || this.permissionService.hasPermission(user, 'dashboard.view'),
        'profile.view': isSuperAdmin || this.permissionService.hasPermission(user, 'profile.view'),
        'billing.view': isSuperAdmin || this.permissionService.hasPermission(user, 'billing.view'),
        'attendance.view': isSuperAdmin || this.permissionService.hasPermission(user, 'attendance.view'),
        'attendance.read': isSuperAdmin || this.permissionService.hasPermission(user, 'attendance.read'),
        'attendance.team.view': isSuperAdmin || this.permissionService.hasPermission(user, 'attendance.team.view'),
        'attendance.regularization.view': isSuperAdmin || this.permissionService.hasPermission(user, 'attendance.regularization.view'),
        'attendance.approve': isSuperAdmin || this.permissionService.hasPermission(user, 'attendance.approve'),
        'leave.view': isSuperAdmin || this.permissionService.hasPermission(user, 'leave.view'),
        'leave.read': isSuperAdmin || this.permissionService.hasPermission(user, 'leave.read'),
        'leave.apply': isSuperAdmin || this.permissionService.hasPermission(user, 'leave.apply'),
        'leave.create': isSuperAdmin || this.permissionService.hasPermission(user, 'leave.create'),
        'leave.approve': isSuperAdmin || this.permissionService.hasPermission(user, 'leave.approve'),
        'leave.balance.view': isSuperAdmin || this.permissionService.hasPermission(user, 'leave.balance.view'),
        'leave.shortDay.view': isSuperAdmin || this.permissionService.hasPermission(user, 'leave.shortDay.view'),
        'leave.timeOff.view': isSuperAdmin || this.permissionService.hasPermission(user, 'leave.timeOff.view'),
        'leave.compOff.view': isSuperAdmin || this.permissionService.hasPermission(user, 'leave.compOff.view'),
        'wfh.approve': isSuperAdmin || this.permissionService.hasPermission(user, 'wfh.approve'),
        'payroll.view': isSuperAdmin || this.permissionService.hasPermission(user, 'payroll.view'),
        'payroll.read': isSuperAdmin || this.permissionService.hasPermission(user, 'payroll.read'),
        'timesheets.view': isSuperAdmin || this.permissionService.hasPermission(user, 'timesheets.view'),
        'expenses.view': isSuperAdmin || this.permissionService.hasPermission(user, 'expenses.view'),
        'projects.view': isSuperAdmin || this.permissionService.hasPermission(user, 'projects.view'),
        'reports.view': isSuperAdmin || this.permissionService.hasPermission(user, 'reports.view'),
        'reports.read': isSuperAdmin || this.permissionService.hasPermission(user, 'reports.read'),
        'employees.view': isSuperAdmin || this.permissionService.hasPermission(user, 'employees.view'),
        'employee.read': isSuperAdmin || this.permissionService.hasPermission(user, 'employee.read'),
        'employee.create': isSuperAdmin || this.permissionService.hasPermission(user, 'employee.create'),
        'employee.update': isSuperAdmin || this.permissionService.hasPermission(user, 'employee.update'),
        'employee.delete': isSuperAdmin || this.permissionService.hasPermission(user, 'employee.delete'),
        'employees.invite': isSuperAdmin || this.permissionService.hasPermission(user, 'employees.invite'),
        'visitorManagement.view': isSuperAdmin || this.permissionService.hasPermission(user, 'visitorManagement.view'),
        'settings.view': isSuperAdmin || this.permissionService.hasPermission(user, 'settings.view'),
        'settings.manage': isSuperAdmin || this.permissionService.hasPermission(user, 'settings.manage'),
        'addons.view': isSuperAdmin || this.permissionService.hasPermission(user, 'addons.view'),
        'audit.view': isSuperAdmin || this.permissionService.hasPermission(user, 'audit.view'),
        'announcements.view': isSuperAdmin || this.permissionService.hasPermission(user, 'announcements.view'),
        'roles.view': isSuperAdmin || this.permissionService.hasPermission(user, 'roles.view'),
        'roles.assign': isSuperAdmin || this.permissionService.hasPermission(user, 'roles.assign'),
        'roles.manage': isSuperAdmin || this.permissionService.hasPermission(user, 'roles.manage'),
        'documents.view': isSuperAdmin || this.permissionService.hasPermission(user, 'documents.view'),
        'geofence.view': isSuperAdmin || this.permissionService.hasPermission(user, 'geofence.view'),
        'notifications.view': isSuperAdmin || this.permissionService.hasPermission(user, 'notifications.view'),
        'search.employees': isSuperAdmin || this.permissionService.hasPermission(user, 'search.employees'),
        'search.projects': isSuperAdmin || this.permissionService.hasPermission(user, 'search.projects'),
      },
      addons: {
        attendance: isSuperAdmin || this.hasAddon('attendance'),
        leave: isSuperAdmin || this.hasAddon('leave', ['leaves', 'leaveandtimeoff']),
        payroll: isSuperAdmin || this.hasAddon('payroll'),
        visitorManagement: isSuperAdmin || this.hasAddon('visitormanagement', ['visitor-management', 'visit-management', 'trackvisits']),
        projects: isSuperAdmin || this.hasAddon('projects'),
        expenses: isSuperAdmin || this.hasAddon('expenses'),
        timesheets: isSuperAdmin || this.hasAddon('timesheets'),
        reports: isSuperAdmin || this.hasAddon('reports'),
        settings: isSuperAdmin || this.hasAddon('settings'),
        faceRecognition: isSuperAdmin || (this.hasAddon('attendance') && this.hasAddon('facerecognition', ['face_recognition', 'face-recognition', 'face', 'faceid'])),
        geofence: isSuperAdmin || (this.hasAddon('attendance') && this.hasAddon('geofence', ['geo-fence', 'geofencing'])),
        shiftPlanner: isSuperAdmin || (this.hasAddon('attendance') && this.hasAddon('shiftplanner', ['shift_planner', 'shift'])),
      },
      tabs: {
        selfService: true,
        attendance: isSuperAdmin || (this.hasAddon('attendance') && this.canAccessRoute(user, '/attendance')),
        leave: isSuperAdmin || (this.hasAddon('leave', ['leaves', 'leaveandtimeoff']) && this.canAccessRoute(user, '/leaves')),
        payroll: isSuperAdmin || (this.hasAddon('payroll') && this.canAccessRoute(user, '/payroll')),
        reports: isSuperAdmin || (this.hasAddon('reports') && this.canAccessRoute(user, '/reports')),
        employee: isSuperAdmin || this.canAccessRoute(user, '/employees'),
        admin: isSuperAdmin || this.canAccessRoute(user, '/settings') || this.canAccessRoute(user, '/admin/settings'),
      },
      userInfo: {
        paySlip: user.paySlip ?? 0,
        salarySlip: user.salarySlip ?? 0,
        shiftChangePerm: this.normalizeBoolean(user.shiftChangePerm) ? 1 : 0,
        profileType: (user as any).profileType ?? 0,
        hrSts: (user as any).hrSts ?? 0,
        setupConfig: (user as any).setupConfig ?? 0,
        esslSetupConfig: (user as any).esslSetupConfig ?? 0,
        biometricMachinePermission: (user as any).biometricMachinePermission ?? 0,
        addonDeviceVerification: (user as any).addonDeviceVerification ?? 0,
        visitorManagementAddOn: (user as any).visitorManagementAddOn ?? 0,
        settingPerm: (user as any).settingPerm ?? 0,
      },
    };
  }
}
