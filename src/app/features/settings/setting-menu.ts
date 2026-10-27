import { inject } from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';
import { AuthService } from '../../core/services/auth.service';
import { OrganizationService } from '../../core/services/organization.service';

export interface SettingRoute {
  route: string;
  per: boolean;
  label: string;
  category: string;
  path: string;
  isLocked?: boolean;
  lockReason?: string;
  addon?: string;
}

export interface SettingCategory {
  per: boolean;
  label: string;
  icon: string;
  colorClass: string;
  bgClass: string;
  routes: SettingRoute[];
}

export const getSettingMenu = (
  permissionService: PermissionService,
  authService: AuthService,
  orgService?: OrganizationService
): Record<string, SettingCategory> => {
  const user = authService.getStoredUser();
  const isSuper = permissionService.isSuperAdminUser(user);
  const hasAccess = isSuper || permissionService.canManageSettings(user);

  const isGeofenceActive = isSuper || (orgService ? orgService.isModuleEnabled('geofence') : false);
  const isFaceActive = isSuper || (orgService ? orgService.isModuleEnabled('facerecognition') : false);
  const isVisitActive = isSuper || (orgService ? orgService.isModuleEnabled('visitormanagement') : false);

  return {
    attendance: {
      per: true,
      label: 'Attendance',
      icon: 'assets/icons/calendar.svg',
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-100',
      routes: [
        {
          route: '/settings/attendance/shift',
          path: 'settings | attendance | shift',
          per: true,
          label: 'Shift',
          category: 'attendance',
          isLocked: !hasAccess,
          lockReason: !hasAccess ? 'Permission required to manage shifts.' : undefined,
        },
        {
          route: '/settings/attendance/geo-fence',
          path: 'settings | attendance | geo-fence',
          per: true,
          label: 'Geo-Fence',
          category: 'attendance',
          isLocked: !hasAccess || !isGeofenceActive,
          lockReason: !isGeofenceActive
            ? 'The Geo-Fence module is currently deactivated for your organization.'
            : (!hasAccess ? 'Permission required to manage geo-fence.' : undefined),
          addon: 'geofence',
        },
        {
          route: '/settings/attendance/face-recognition',
          path: 'settings | attendance | face-recognition',
          per: true,
          label: 'Face Recognition',
          category: 'attendance',
          isLocked: !hasAccess || !isFaceActive,
          lockReason: !isFaceActive
            ? 'The Face Recognition module is currently deactivated for your organization.'
            : (!hasAccess ? 'Permission required to manage face recognition.' : undefined),
          addon: 'facerecognition',
        },
        {
          route: '/settings/attendance/attendance-mode',
          path: 'settings | attendance | attendance-modes',
          per: true,
          label: 'Attendance Mode',
          category: 'attendance',
          isLocked: !hasAccess,
          lockReason: !hasAccess ? 'Permission required to manage attendance modes.' : undefined,
        },
        {
          route: '/settings/attendance/remote-work',
          path: 'settings | attendance | remote-work',
          per: true,
          label: 'Remote Work',
          category: 'attendance',
          isLocked: !hasAccess,
          lockReason: !hasAccess ? 'Permission required to manage remote work.' : undefined,
        },
        {
          route: '/settings/attendance/weekly-off',
          path: 'settings | attendance | weekly-off',
          per: true,
          label: 'Weekly Off',
          category: 'attendance',
          isLocked: !hasAccess,
          lockReason: !hasAccess ? 'Permission required to manage weekly off.' : undefined,
        },
      ],
    },
    organisation: {
      per: true,
      label: 'Organisation',
      icon: 'assets/icons/building.svg',
      colorClass: 'text-purple-600',
      bgClass: 'bg-purple-100',
      routes: [
        { route: '/settings/organisation/departments', path: 'settings | organisation | departments', per: true, label: 'Departments', category: 'organisation', isLocked: !hasAccess, lockReason: !hasAccess ? 'Permission required' : undefined },
        { route: '/settings/organisation/designation', path: 'settings | organisation | designation', per: true, label: 'Designations', category: 'organisation', isLocked: !hasAccess, lockReason: !hasAccess ? 'Permission required' : undefined },
        { route: '/settings/organisation/holiday', path: 'settings | organisation | holiday', per: true, label: 'Holiday', category: 'organisation', isLocked: !hasAccess, lockReason: !hasAccess ? 'Permission required' : undefined },
        { route: '/settings/organisation/grade', path: 'settings | organisation | grade', per: true, label: 'Grades', category: 'organisation', isLocked: !hasAccess, lockReason: !hasAccess ? 'Permission required' : undefined },
        { route: '/settings/organisation/client-zones', path: 'settings | organisation | client-zones', per: true, label: 'Client Zones', category: 'organisation', isLocked: !hasAccess, lockReason: !hasAccess ? 'Permission required' : undefined },
        { route: '/settings/organisation/location', path: 'settings | organisation | location', per: true, label: 'Locations', category: 'organisation', isLocked: !hasAccess, lockReason: !hasAccess ? 'Permission required' : undefined },
        { route: '/settings/organisation/zones', path: 'settings | organisation | zones', per: true, label: 'Zones', category: 'organisation', isLocked: !hasAccess, lockReason: !hasAccess ? 'Permission required' : undefined },
        { route: '/settings/organisation/organisation-profile', path: 'settings | organisation | profile', per: true, label: 'Organisation Profile', category: 'organisation', isLocked: !hasAccess, lockReason: !hasAccess ? 'Permission required' : undefined },
      ],
    },
    leave: {
      per: true,
      label: 'Leave',
      icon: 'assets/icons/leave-outline.svg',
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-100',
      routes: [
        { route: '/settings/leave/leave-types', path: 'settings | leave | leave-types', per: true, label: 'Leave Type', category: 'leave', isLocked: !hasAccess, lockReason: !hasAccess ? 'Permission required' : undefined },
      ],
    },
    employee: {
      per: true,
      label: 'Employee',
      icon: 'assets/icons/users.svg',
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-100',
      routes: [
        { route: '/employees/invitations', path: 'settings | employee | onboarding', per: true, label: 'Onboarding & Invitations', category: 'employee', isLocked: !hasAccess, lockReason: !hasAccess ? 'Permission required' : undefined },
      ],
    },
    visitManagement: {
      per: true,
      label: 'Advance Setting',
      icon: 'assets/icons/advance-settings.svg',
      colorClass: 'text-rose-600',
      bgClass: 'bg-rose-100',
      routes: [
        {
          route: '/visit-management',
          path: 'settings | visit-management | advance',
          per: true,
          label: 'Visit Management',
          category: 'visitManagement',
          isLocked: !hasAccess || !isVisitActive,
          lockReason: !isVisitActive
            ? 'The Visitor Management module is currently deactivated for your organization.'
            : (!hasAccess ? 'Permission required' : undefined),
          addon: 'visitormanagement',
        },
      ],
    },
    system: {
      per: true,
      label: 'System',
      icon: 'assets/icons/settings.svg',
      colorClass: 'text-slate-700',
      bgClass: 'bg-slate-100',
      routes: [
        { route: '/settings/import-wizard', path: 'settings | system | import-wizard', per: true, label: 'Import Wizard', category: 'system', isLocked: !hasAccess, lockReason: !hasAccess ? 'Permission required' : undefined },
      ],
    }
  };
};
