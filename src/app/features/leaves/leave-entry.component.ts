import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-leave-entry',
  standalone: true,
  template: `
    <div class="flex min-h-[40vh] items-center justify-center">
      <div class="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-500 shadow-sm">
        Loading leave workspace...
      </div>
    </div>
  `,
})
export class LeaveEntryComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly permissionService = inject(PermissionService);

  constructor() {
    queueMicrotask(() => this.redirect());
  }

  private redirect(): void {
    const user = this.authService.getStoredUser();
    const roleLabel = this.permissionService.getRoleDisplayName(user).toLowerCase();
    const hasAdminScope =
      this.permissionService.hasPermission(user, 'leaves.approve') ||
      this.permissionService.hasPermission(user, 'leave.approve') ||
      roleLabel.includes('admin') ||
      roleLabel.includes('hr') ||
      roleLabel.includes('manager');

    const target = hasAdminScope ? '/leave' : '/self-service/leave';
    this.router.navigate([target], {
      queryParams: this.route.snapshot.queryParams,
      replaceUrl: true,
    });
  }
}
