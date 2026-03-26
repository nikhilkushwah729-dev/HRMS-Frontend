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
  
  // Note: Replace with actual fine-grained permission checks as needed.
  // Using basic dashboard.view for the initial port to ensure visibility.
  const hasAccess = permissionService.hasPermission(user, 'dashboard.view');

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
        { route: '/settings/attendance/regularization', path: 'settings | attendance | regularization', per: hasAccess, label: 'Regularization', category: 'attendance' },
        { route: '/settings/attendance/face-recognition', path: 'settings | attendance | face-recognition', per: hasAccess, label: 'Face Recognition', category: 'attendance' },
        { route: '/settings/attendance/attendance-mode', path: 'settings | attendance | attendance-modes', per: hasAccess, label: 'Attendance Mode', category: 'attendance' },
        { route: '/settings/attendance/kiosk-manager', path: 'settings | attendance | kiosk-manager', per: hasAccess, label: 'Kiosk Manager', category: 'attendance' },
        { route: '/settings/attendance/kiosk-setup', path: 'settings | attendance | kiosk-setup', per: hasAccess, label: 'Kiosk Setup', category: 'attendance' },
        { route: '/settings/attendance/device-restriction', path: 'settings | attendance | device-restriction', per: hasAccess, label: 'Device Restriction', category: 'attendance' },
        { route: '/settings/attendance/advance-settings', path: 'settings | attendance | advance-settings', per: hasAccess, label: 'Advance Settings', category: 'attendance' },
        { route: '/settings/attendance/remote-work', path: 'settings | attendance | remote-work', per: hasAccess, label: 'Remote Work', category: 'attendance' },
        { route: '/settings/attendance/weekly-off', path: 'settings | attendance | weekly-off', per: hasAccess, label: 'Weekly Off', category: 'attendance' },
        { route: '/settings/attendance/flexi-holiday', path: 'settings | attendance | flexi-holiday', per: hasAccess, label: 'Flexi Holiday', category: 'attendance' },
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
        { route: '/settings/organisation/penalty', path: 'settings | organisation | penalty', per: hasAccess, label: 'Penalty', category: 'organisation' },
        { route: '/settings/organisation/designation-hierarchy', path: 'settings | organisation | hierarchy', per: hasAccess, label: 'Hierarchy', category: 'organisation' },
        { route: '/settings/organisation/divisions', path: 'settings | organisation | divisions', per: hasAccess, label: 'Division', category: 'organisation' },
        { route: '/settings/organisation/policies', path: 'settings | organisation | policies', per: hasAccess, label: 'Policies', category: 'organisation' },
      ],
    },
    leave: {
      per: hasAccess,
      label: 'Leave',
      icon: 'assets/icons/leave-outline.svg',
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-100',
      routes: [
        { route: '/settings/leave/short-day-leave', path: 'settings | leave | short-day-leave', per: hasAccess, label: 'Short Day Leave', category: 'leave' },
        { route: '/settings/leave/time-off', path: 'settings | leave | time-off', per: hasAccess, label: 'Time Off', category: 'leave' },
        { route: '/settings/leave/comp-off', path: 'settings | leave | comp-off', per: hasAccess, label: 'Comp Off', category: 'leave' },
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
        { route: '/settings/employee/onboarding', path: 'settings | employee | onboarding', per: hasAccess, label: 'Onboarding', category: 'employee' },
      ],
    },
    visitManagement: {
      per: hasAccess,
      label: 'Advance Setting',
      icon: 'assets/icons/advance-settings.svg',
      colorClass: 'text-rose-600',
      bgClass: 'bg-rose-100',
      routes: [
        { route: '/settings/visit-management-settings', path: 'settings | visit-management | advance', per: hasAccess, label: 'Advance Setting', category: 'visitManagement' },
      ],
    }
  };
};
