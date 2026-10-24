import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { PermissionService, PermissionKey } from '../services/permission.service';
import { AuthService } from '../services/auth.service';
import { AccessContextService } from '../access/access-context.service';
import { AccessControlService } from '../access/access-control.service';
import { OrganizationService } from '../services/organization.service';
import { ToastService } from '../services/toast.service';
import { SAAS_MENU_SECTIONS } from '../access/menu.config';
import { MenuItemConfig } from '../access/access.models';

function normalizeRoute(route: string): string {
  const cleanRoute = (route || '').split('?')[0].split('#')[0].trim();
  if (!cleanRoute) return '';
  return cleanRoute === '/' ? '/' : cleanRoute.replace(/\/+$/, '');
}

interface AddonRequirement {
  prefix: string;
  addon: string;
  name: string;
}

const SPECIALIZED_ADDON_ROUTES: AddonRequirement[] = [
  { prefix: '/settings/attendance/face-recognition', addon: 'facerecognition', name: 'Face Recognition' },
  { prefix: '/face-registration', addon: 'facerecognition', name: 'Face Recognition' },
  { prefix: '/admin/kiosks/face-profiles', addon: 'facerecognition', name: 'Face Recognition' },
  { prefix: '/attendance/geofence', addon: 'geofence', name: 'Geo-Fence' },
  { prefix: '/admin/attendance/geofence', addon: 'geofence', name: 'Geo-Fence' },
  { prefix: '/admin/geofence', addon: 'geofence', name: 'Geo-Fence' },
  { prefix: '/settings/attendance/geo-fence', addon: 'geofence', name: 'Geo-Fence' },
  { prefix: '/visit-management', addon: 'visitormanagement', name: 'Visitor Management' },
  { prefix: '/visit-management-settings', addon: 'visitormanagement', name: 'Visitor Management' },
];

function findMenuItemsByRoute(
  route: string,
  items: MenuItemConfig[],
): MenuItemConfig[] {
  const normalizedRoute = normalizeRoute(route);
  const matches: MenuItemConfig[] = [];

  for (const item of items) {
    const itemRoute = normalizeRoute(item.route);
    const isMatch = normalizedRoute === itemRoute || normalizedRoute.startsWith(`${itemRoute}/`);

    if (isMatch) {
      matches.push(item);
    }

    if (item.children?.length) {
      matches.push(...findMenuItemsByRoute(route, item.children));
    }
  }

  return matches;
}

export const permissionGuard: CanActivateChildFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const permissionService = inject(PermissionService);
  const accessContext = inject(AccessContextService);
  const accessControl = inject(AccessControlService);
  const orgService = inject(OrganizationService);
  const toastService = inject(ToastService);

  const user = authService.getStoredUser();
  const targetRoute = state.url || '/';
  const normalizedTarget = normalizeRoute(targetRoute);

  // Never redirect /dashboard back to itself on an access miss.
  if (normalizedTarget === '/dashboard') {
    return true;
  }

  // 1. Strict Add-on Pre-check for specialized feature routes
  for (const req of SPECIALIZED_ADDON_ROUTES) {
    if (normalizedTarget === req.prefix || normalizedTarget.startsWith(`${req.prefix}/`)) {
      if (!orgService.isModuleEnabled(req.addon)) {
        toastService.warning(`🔒 ${req.name} module is currently deactivated for your organization.`);
        return router.createUrlTree(['/dashboard']);
      }
    }
  }

  const routePermission = route.data?.['permission'] as string | undefined;
  const accessUser = accessContext.buildAccessUser(user);
  permissionService.syncForUser(user);

  // 2. Menu Item Catalog Evaluation
  const menuItems = findMenuItemsByRoute(
    targetRoute,
    SAAS_MENU_SECTIONS.flatMap((section) => section.items),
  );

  if (menuItems.length > 0) {
    for (const menuItem of menuItems) {
      const evaluation = accessControl.evaluateModuleAccess(accessUser, menuItem);
      if (!evaluation.allowed) {
        const reason = evaluation.lockedByAddon || evaluation.blockedBy?.includes('addon')
          ? `🔒 ${menuItem.label} is deactivated for your organization.`
          : `🔒 Access Restricted: You do not have permission to view ${menuItem.label}.`;
        toastService.warning(reason);
        return router.createUrlTree(['/dashboard']);
      }
    }
  } else {
    // If not in catalog, check route permission via permissionService
    const canAccess = permissionService.canAccessRoute(user, targetRoute);
    if (!canAccess) {
      toastService.warning('🔒 Access Restricted: You do not have permission for this section.');
      return router.createUrlTree(['/dashboard']);
    }
  }

  // 3. Route Data Permission Check
  if (routePermission) {
    const hasPerm = permissionService.hasPermission(user, routePermission as PermissionKey);
    if (!hasPerm) {
      toastService.warning(`🔒 Access Restricted: Missing required permission (${routePermission}).`);
      return router.createUrlTree(['/dashboard']);
    }
  }

  return true;
};
