import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-payroll-entry',
  standalone: true,
  template: `
    <div class="flex min-h-[40vh] items-center justify-center">
      <div class="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-500 shadow-sm">
        Loading payroll workspace...
      </div>
    </div>
  `,
})
export class PayrollEntryComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly permissionService = inject(PermissionService);

  constructor() {
    queueMicrotask(() => this.redirect());
  }

  private redirect(): void {
    const user = this.authService.getStoredUser();
    const role = this.permissionService.getRoleDisplayName(user).toLowerCase();
    const hasAdminAccess =
      this.permissionService.hasPermission(user, 'payroll.update') ||
      this.permissionService.hasPermission(user, 'payroll.approve') ||
      this.permissionService.hasPermission(user, 'payroll.create') ||
      role.includes('admin') ||
      role.includes('hr');

    this.router.navigate([hasAdminAccess ? '/payroll/manage' : '/self-service/payroll'], {
      replaceUrl: true,
    });
  }
}
