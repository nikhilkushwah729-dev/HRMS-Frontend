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
    const activeModules = this.organizationService.activeModules();
    if (!activeModules.length) {
      return true;
    }
    return [slug, ...aliases].some((candidate) => activeModules.includes(candidate));
  }

  buildAccessUser(user: User | null | undefined): AccessUser | null {
    if (!user) return null;

    const role = typeof user.role === 'string' ? user.role : user.role?.name || 'employee';

    return {
      ...user,
      role,
      permissions: {
        'dashboard.view': this.canAccessRoute(user, '/dashboard'),
        'profile.view': this.canAccessRoute(user, '/profile'),
        'billing.view': this.canAccessRoute(user, '/billing'),
        'attendance.view': this.canAccessRoute(user, '/attendance'),
        'leave.apply': this.canAccessRoute(user, '/leaves'),
        'leave.view': this.canAccessRoute(user, '/leaves'),
        'payroll.view': this.canAccessRoute(user, '/payroll'),
        'timesheets.view': this.canAccessRoute(user, '/timesheets'),
        'expenses.view': this.canAccessRoute(user, '/expenses'),
        'projects.view': this.canAccessRoute(user, '/projects'),
        'reports.view': this.canAccessRoute(user, '/reports'),
        'employees.view': this.canAccessRoute(user, '/employees'),
        'employees.invite': this.canAccessRoute(user, '/employees/invitations'),
        'visitorManagement.view': this.canAccessRoute(user, '/visit-management'),
        'settings.view': this.canAccessRoute(user, '/settings') || this.canAccessRoute(user, '/admin/settings'),
        'addons.view': this.canAccessRoute(user, '/add-ons'),
        'audit.view': this.canAccessRoute(user, '/admin/audit'),
        'announcements.view': this.canAccessRoute(user, '/admin/announcements'),
        'roles.view': this.canAccessRoute(user, '/admin/roles'),
        'documents.view': this.canAccessRoute(user, '/admin/documents'),
        'geofence.view': this.canAccessRoute(user, '/admin/geofence'),
        'attendance.team.view': this.canAccessRoute(user, '/admin/team-attendance'),
        'attendance.regularization.view': this.canAccessRoute(user, '/admin/regularization'),
        'notifications.view': this.canAccessRoute(user, '/dashboard'),
        'search.employees': this.canAccessRoute(user, '/employees'),
        'search.projects': this.canAccessRoute(user, '/projects'),
      },
      addons: {
        attendance: this.hasAddon('attendance') || this.canAccessRoute(user, '/attendance'),
        leave: this.hasAddon('leave', ['leaves']) || this.canAccessRoute(user, '/leaves'),
        payroll: this.hasAddon('payroll') || this.canAccessRoute(user, '/payroll'),
        visitorManagement: this.hasAddon('visitorManagement', ['visitor-management', 'visit-management']) || this.canAccessRoute(user, '/visit-management'),
        projects: this.hasAddon('projects') || this.canAccessRoute(user, '/projects'),
        expenses: this.hasAddon('expenses') || this.canAccessRoute(user, '/expenses'),
        timesheets: this.hasAddon('timesheets') || this.canAccessRoute(user, '/timesheets'),
        reports: this.hasAddon('reports') || this.canAccessRoute(user, '/reports'),
        settings: this.hasAddon('settings') || this.canAccessRoute(user, '/settings') || this.canAccessRoute(user, '/admin/settings'),
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
      },
    };
  }
}
