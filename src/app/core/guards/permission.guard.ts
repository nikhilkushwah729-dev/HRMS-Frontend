import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { PermissionService, PermissionKey } from '../services/permission.service';
import { AuthService } from '../services/auth.service';
import { AccessContextService } from '../access/access-context.service';
import { AccessControlService } from '../access/access-control.service';
import { SAAS_MENU_SECTIONS } from '../access/menu.config';
import { MenuItemConfig } from '../access/access.models';

function normalizeRoute(route: string): string {
  const cleanRoute = (route || '').split('?')[0].split('#')[0].trim();
  if (!cleanRoute) return '';
  return cleanRoute === '/' ? '/' : cleanRoute.replace(/\/+$/, '');
}

function findMenuItemByRoute(
  route: string,
  items: MenuItemConfig[],
): MenuItemConfig | null {
  const normalizedRoute = normalizeRoute(route);

  for (const item of items) {
    const itemRoute = normalizeRoute(item.route);
    const matches = normalizedRoute === itemRoute || normalizedRoute.startsWith(`${itemRoute}/`);

    if (matches) {
      const nested = item.children?.length
        ? findMenuItemByRoute(route, item.children)
        : null;
      return nested ?? item;
    }

    const nested = item.children?.length ? findMenuItemByRoute(route, item.children) : null;
    if (nested) return nested;
  }

  return null;
}

export const permissionGuard: CanActivateChildFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const permissionService = inject(PermissionService);
  const accessContext = inject(AccessContextService);
  const accessControl = inject(AccessControlService);

  const user = authService.getStoredUser();
  const targetRoute = state.url || '/';
  const routePermission = route.data?.['permission'] as string | undefined;
  const accessUser = accessContext.buildAccessUser(user);

  permissionService.syncForUser(user);

  const menuItem = findMenuItemByRoute(
    targetRoute,
    SAAS_MENU_SECTIONS.flatMap((section) => section.items),
  );
  const canAccessRoute = menuItem
    ? accessControl.canAccessModule(accessUser, menuItem)
    : permissionService.canAccessRoute(user, targetRoute);
  const canAccessPermission = routePermission
    ? permissionService.hasPermission(user, routePermission as PermissionKey)
    : true;

  if (canAccessRoute && canAccessPermission) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
