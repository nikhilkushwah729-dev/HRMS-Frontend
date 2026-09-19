import { inject } from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';
import { AuthService } from '../../core/services/auth.service';

export interface SettingRoute {
  route: string;
  per: boolean;
  label: string;
  category: string;
  path: string;
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
  authService: AuthService
): Record<string, SettingCategory> => {
  const user = authService.getStoredUser();
  
  const hasAccess = permissionService.canManageSettings(user);

  return {
    attendance: {
      per: hasAccess,
      label: 'Attendance',
      icon: 'assets/icons/calendar.svg',
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-100',
      routes: [
        { route: '/settings/attendance/shift', path: 'settings | attendance | shift', per: hasAccess, label: 'Shift', category: 'attendance' },
        { route: '/settings/attendance/geo-fence', path: 'settings | attendance | geo-fence', per: hasAccess, label: 'Geo-Fence', category: 'attendance' },
        { route: '/settings/attendance/face-recognition', path: 'settings | attendance | face-recognition', per: hasAccess, label: 'Face Recognition', category: 'attendance' },
        { route: '/settings/attendance/attendance-mode', path: 'settings | attendance | attendance-modes', per: hasAccess, label: 'Attendance Mode', category: 'attendance' },
        { route: '/settings/attendance/remote-work', path: 'settings | attendance | remote-work', per: hasAccess, label: 'Remote Work', category: 'attendance' },
        { route: '/settings/attendance/weekly-off', path: 'settings | attendance | weekly-off', per: hasAccess, label: 'Weekly Off', category: 'attendance' },
      ],
    },
    organisation: {
      per: hasAccess,
      label: 'Organisation',
      icon: 'assets/icons/building.svg', // Assuming this exists or will use a fallback
      colorClass: 'text-purple-600',
      bgClass: 'bg-purple-100',
      routes: [
        { route: '/settings/organisation/departments', path: 'settings | organisation | departments', per: hasAccess, label: 'Departments', category: 'organisation' },
        { route: '/settings/organisation/designation', path: 'settings | organisation | designation', per: hasAccess, label: 'Designations', category: 'organisation' },
        { route: '/settings/organisation/holiday', path: 'settings | organisation | holiday', per: hasAccess, label: 'Holiday', category: 'organisation' },
        { route: '/settings/organisation/grade', path: 'settings | organisation | grade', per: hasAccess, label: 'Grades', category: 'organisation' },
        { route: '/settings/organisation/client-zones', path: 'settings | organisation | client-zones', per: hasAccess, label: 'Client Zones', category: 'organisation' },
        { route: '/settings/organisation/location', path: 'settings | organisation | location', per: hasAccess, label: 'Locations', category: 'organisation' },
        { route: '/settings/organisation/zones', path: 'settings | organisation | zones', per: hasAccess, label: 'Zones', category: 'organisation' },
        { route: '/settings/organisation/organisation-profile', path: 'settings | organisation | profile', per: hasAccess, label: 'Organisation Profile', category: 'organisation' },
      ],
    },
    leave: {
      per: hasAccess,
      label: 'Leave',
      icon: 'assets/icons/leave-outline.svg',
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-100',
      routes: [
        { route: '/settings/leave/leave-types', path: 'settings | leave | leave-types', per: hasAccess, label: 'Leave Type', category: 'leave' },
      ],
    },
    employee: {
      per: hasAccess,
      label: 'Employee',
      icon: 'assets/icons/users.svg',
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-100',
      routes: [
        { route: '/employees/invitations', path: 'settings | employee | onboarding', per: hasAccess, label: 'Onboarding & Invitations', category: 'employee' },
      ],
    },
    visitManagement: {
      per: hasAccess,
      label: 'Advance Setting',
      icon: 'assets/icons/advance-settings.svg',
      colorClass: 'text-rose-600',
      bgClass: 'bg-rose-100',
      routes: [
        { route: '/visit-management', path: 'settings | visit-management | advance', per: hasAccess, label: 'Visit Management', category: 'visitManagement' },
      ],
    },
    system: {
      per: hasAccess,
      label: 'System',
      icon: 'assets/icons/settings.svg',
      colorClass: 'text-slate-700',
      bgClass: 'bg-slate-100',
      routes: [
        { route: '/settings/import-wizard', path: 'settings | system | import-wizard', per: hasAccess, label: 'Import Wizard', category: 'system' },
      ],
    }
  };
};
