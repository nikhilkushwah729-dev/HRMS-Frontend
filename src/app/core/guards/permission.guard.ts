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

  const user = authService.getStoredUser();
  const targetRoute = state.url || '/';
  const routePermission = route.data?.['permission'] as string | undefined;
  const accessUser = accessContext.buildAccessUser(user);

  permissionService.syncForUser(user);

  const menuItems = findMenuItemsByRoute(
    targetRoute,
    SAAS_MENU_SECTIONS.flatMap((section) => section.items),
  );
  const canAccessRoute = menuItems.length
    ? menuItems.some((menuItem) => accessControl.canAccessModule(accessUser, menuItem))
    : permissionService.canAccessRoute(user, targetRoute);
  const canAccessPermission = routePermission
    ? permissionService.hasPermission(user, routePermission as PermissionKey)
    : true;

  if (canAccessRoute && canAccessPermission) {
    return true;
  }

  // Never redirect /dashboard back to itself on an access miss.
  // That creates an infinite navigation loop and leaves the global loader active.
  if (normalizeRoute(targetRoute) === '/dashboard') {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
