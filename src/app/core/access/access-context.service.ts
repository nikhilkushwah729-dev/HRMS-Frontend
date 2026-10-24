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

    return {
      ...user,
      role,
      roleScope,
      organizationId,
      employeeId,
      reportingManagerId,
      subordinateIds,
      permissions: {
        'dashboard.view': this.permissionService.hasPermission(user, 'dashboard.view'),
        'profile.view': this.permissionService.hasPermission(user, 'profile.view'),
        'billing.view': this.permissionService.hasPermission(user, 'billing.view'),
        'attendance.view': this.permissionService.hasPermission(user, 'attendance.view'),
        'attendance.read': this.permissionService.hasPermission(user, 'attendance.read'),
        'attendance.team.view': this.permissionService.hasPermission(user, 'attendance.team.view'),
        'attendance.regularization.view': this.permissionService.hasPermission(user, 'attendance.regularization.view'),
        'attendance.approve': this.permissionService.hasPermission(user, 'attendance.approve'),
        'leave.view': this.permissionService.hasPermission(user, 'leave.view'),
        'leave.read': this.permissionService.hasPermission(user, 'leave.read'),
        'leave.apply': this.permissionService.hasPermission(user, 'leave.apply'),
        'leave.create': this.permissionService.hasPermission(user, 'leave.create'),
        'leave.approve': this.permissionService.hasPermission(user, 'leave.approve'),
        'leave.balance.view': this.permissionService.hasPermission(user, 'leave.balance.view'),
        'leave.shortDay.view': this.permissionService.hasPermission(user, 'leave.shortDay.view'),
        'leave.timeOff.view': this.permissionService.hasPermission(user, 'leave.timeOff.view'),
        'leave.compOff.view': this.permissionService.hasPermission(user, 'leave.compOff.view'),
        'wfh.approve': this.permissionService.hasPermission(user, 'wfh.approve'),
        'payroll.view': this.permissionService.hasPermission(user, 'payroll.view'),
        'payroll.read': this.permissionService.hasPermission(user, 'payroll.read'),
        'timesheets.view': this.permissionService.hasPermission(user, 'timesheets.view'),
        'expenses.view': this.permissionService.hasPermission(user, 'expenses.view'),
        'projects.view': this.permissionService.hasPermission(user, 'projects.view'),
        'reports.view': this.permissionService.hasPermission(user, 'reports.view'),
        'reports.read': this.permissionService.hasPermission(user, 'reports.read'),
        'employees.view': this.permissionService.hasPermission(user, 'employees.view'),
        'employee.read': this.permissionService.hasPermission(user, 'employee.read'),
        'employee.create': this.permissionService.hasPermission(user, 'employee.create'),
        'employee.update': this.permissionService.hasPermission(user, 'employee.update'),
        'employee.delete': this.permissionService.hasPermission(user, 'employee.delete'),
        'employees.invite': this.permissionService.hasPermission(user, 'employees.invite'),
        'visitorManagement.view': this.permissionService.hasPermission(user, 'visitorManagement.view'),
        'settings.view': this.permissionService.hasPermission(user, 'settings.view'),
        'settings.manage': this.permissionService.hasPermission(user, 'settings.manage'),
        'addons.view': this.permissionService.hasPermission(user, 'addons.view'),
        'audit.view': this.permissionService.hasPermission(user, 'audit.view'),
        'announcements.view': this.permissionService.hasPermission(user, 'announcements.view'),
        'roles.view': this.permissionService.hasPermission(user, 'roles.view'),
        'roles.assign': this.permissionService.hasPermission(user, 'roles.assign'),
        'roles.manage': this.permissionService.hasPermission(user, 'roles.manage'),
        'documents.view': this.permissionService.hasPermission(user, 'documents.view'),
        'geofence.view': this.permissionService.hasPermission(user, 'geofence.view'),
        'notifications.view': this.permissionService.hasPermission(user, 'notifications.view'),
        'search.employees': this.permissionService.hasPermission(user, 'search.employees'),
        'search.projects': this.permissionService.hasPermission(user, 'search.projects'),
      },
      addons: {
        attendance: this.hasAddon('attendance'),
        leave: this.hasAddon('leave', ['leaves']),
        payroll: this.hasAddon('payroll'),
        visitorManagement: this.hasAddon('visitormanagement', ['visitor-management', 'visit-management', 'trackvisits']),
        projects: this.hasAddon('projects'),
        expenses: this.hasAddon('expenses'),
        timesheets: this.hasAddon('timesheets'),
        reports: this.hasAddon('reports'),
        settings: this.hasAddon('settings'),
        faceRecognition: this.hasAddon('facerecognition', ['face_recognition', 'face-recognition', 'face', 'faceid']),
        geofence: this.hasAddon('geofence', ['geo-fence', 'geofencing']),
        shiftPlanner: this.hasAddon('shiftplanner', ['shift_planner', 'shift']),
      },
      tabs: {
        selfService: true,
        attendance: this.canAccessRoute(user, '/attendance'),
        leave: this.canAccessRoute(user, '/leaves'),
        payroll: this.canAccessRoute(user, '/payroll'),
        reports: this.canAccessRoute(user, '/reports'),
        employee: this.canAccessRoute(user, '/employees'),
        admin: this.canAccessRoute(user, '/settings') || this.canAccessRoute(user, '/admin/settings'),
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
