import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-attendance-route-redirect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mx-auto flex min-h-[40vh] max-w-3xl items-center justify-center px-6">
      <div class="rounded-lg border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
        <p class="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Attendance</p>
        <h1 class="mt-2 text-lg font-black text-slate-900">Opening the right workspace...</h1>
        <p class="mt-2 text-sm text-slate-500">We are routing you to your employee or management attendance experience.</p>
      </div>
    </div>
  `,
})
export class AttendanceRouteRedirectComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly permissionService = inject(PermissionService);

  ngOnInit(): void {
    const user = this.authService.getStoredUser();
    const isManagerial = this.permissionService.isManagerialUser(user);
    const redirectKind = String(this.route.snapshot.data['redirectKind'] || 'base');
    const currentQueryParams = this.route.snapshot.queryParams || {};
    const requestedView = String(currentQueryParams['view'] || '').trim();

    if (redirectKind === 'integrations') {
      void this.router.navigate([isManagerial ? '/admin/attendance/integrations' : '/self-service/attendance'], {
        replaceUrl: true,
      });
      return;
    }

    if (isManagerial) {
      if (requestedView) {
        void this.router.navigate(['/admin/attendance/workspace'], {
          queryParams: { view: requestedView },
          replaceUrl: true,
        });
        return;
      }

      void this.router.navigate(['/admin/attendance'], { replaceUrl: true });
      return;
    }

    const safeEmployeeViews = ['punch', 'calendar', 'stats'];
    const nextQueryParams = safeEmployeeViews.includes(requestedView)
      ? { view: requestedView }
      : undefined;

    void this.router.navigate(['/self-service/attendance'], {
      queryParams: nextQueryParams,
      replaceUrl: true,
    });
  }
}
