import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';
import { ToastService } from '../services/toast.service';

/**
 * Super Admin Guard — allows access ONLY to Super Admin users.
 * Blocks any regular organization/tenant user from accessing the Platform Control Plane.
 */
export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const permissionService = inject(PermissionService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  const user = authService.getStoredUser();
  if (permissionService.isSuperAdminUser(user)) {
    return true;
  }

  toastService.error('Access restricted. Only Super Admin can access the Platform Control Plane.');
  router.navigate(['/dashboard']);
  return false;
};
