import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('@features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./features/legal/terms/terms.component').then(
        (m) => m.TermsOfServiceComponent,
      ),
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./features/legal/privacy/privacy.component').then(
        (m) => m.PrivacyPolicyComponent,
      ),
  },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [permissionGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/self-service/self-service.component').then(
            (m) => m.SelfServiceComponent,
          ),
      },
      {
        path: 'self-service',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'self-service/requests',
        loadComponent: () =>
          import('./features/self-service/request-center.component').then(
            (m) => m.RequestCenterComponent,
          ),
        data: { permission: 'dashboard.view' },
        children: [
          {
            path: '',
            redirectTo: 'leave',
            pathMatch: 'full',
          },
          {
            path: 'overview',
            loadComponent: () =>
              import('./features/self-service/request-center-overview.component').then(
                (m) => m.RequestCenterOverviewComponent,
              ),
          },
          {
            path: 'leave',
            loadComponent: () =>
              import('./features/self-service/request-center-leave.component').then(
                (m) => m.RequestCenterLeaveComponent,
              ),
          },
          {
            path: 'regularization',
            loadComponent: () =>
              import('./features/self-service/my-regularization-requests.component').then(
                (m) => m.MyRegularizationRequestsComponent,
              ),
            data: {
              title: 'Regularization Requests',
              subtitle: 'Missed punch, late arrival, and correction requests you have raised.',
              ctaLabel: 'New Regularization',
              ctaRoute: '/self-service/attendance',
            },
          },
          {
            path: 'overtime',
            loadComponent: () =>
              import('./features/self-service/my-regularization-requests.component').then(
                (m) => m.MyRegularizationRequestsComponent,
              ),
            data: {
              title: 'Overtime Requests',
              subtitle: 'Extra hours you have submitted for approval.',
              ctaLabel: 'Request Overtime',
              ctaRoute: '/self-service/attendance',
              requestType: 'overtime',
            },
          },
          {
            path: 'expense',
            loadComponent: () =>
              import('./features/expenses/expenses.component').then(
                (m) => m.ExpensesComponent,
              ),
          },
        ],
      },
      {
        path: 'self-service/attendance',
        loadComponent: () =>
          import('@features/attendance/attendance.component').then(
            (m) => m.AttendanceComponent,
          ),
        data: {
          permission: 'attendance.view',
          attendanceMode: 'self',
        },
      },
      {
        path: 'employee/attendance',
        redirectTo: 'self-service/attendance',
        pathMatch: 'full',
      },
      {
        path: 'my-team',
        loadComponent: () =>
          import('@features/self-service/my-team.component').then(
            (m) => m.MyTeamComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('@features/self-service/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
      // Billing moved to top-level for full-screen experience

      {
        path: 'ess',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'employees',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('@features/employees/employee-list.component').then(
                (m) => m.EmployeeListComponent,
              ),
          },
          {
            path: 'add',
            loadComponent: () =>
              import('@features/employees/add-employee.component').then(
                (m) => m.AddEmployeeComponent,
              ),
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('@features/employees/edit-employee.component').then(
                (m) => m.EditEmployeeComponent,
              ),
          },
          {
            path: 'view/:id',
            loadComponent: () =>
              import('@features/employees/view-employee.component').then(
                (m) => m.ViewEmployeeComponent,
              ),
          },
          {
            path: 'invitations',
            loadComponent: () =>
              import('@features/employees/invitations.component').then(
                (m) => m.InvitationsComponent,
              ),
          },
        ],
      },
      {
        path: 'attendance/integrations',
        loadComponent: () =>
          import('@features/attendance/attendance-route-redirect.component').then(
            (m) => m.AttendanceRouteRedirectComponent,
          ),
        data: { redirectKind: 'integrations' },
      },
      {
        path: 'attendance',
        loadComponent: () =>
          import('@features/attendance/attendance-route-redirect.component').then(
            (m) => m.AttendanceRouteRedirectComponent,
          ),
      },
      {
        path: 'hr/attendance',
        redirectTo: 'admin/attendance',
        pathMatch: 'full',
      },
      {
        path: 'admin/approvals',
        loadComponent: () =>
          import('./features/admin/approval-center.component').then(
            (m) => m.ApprovalCenterComponent,
          ),
        children: [
          {
            path: '',
            redirectTo: 'leave',
            pathMatch: 'full',
          },
          {
            path: 'overview',
            loadComponent: () =>
              import('./features/admin/approval-center-overview.component').then(
                (m) => m.ApprovalCenterOverviewComponent,
              ),
          },
          {
            path: 'leave',
            loadComponent: () =>
              import('./features/admin/approval-center-leave.component').then(
                (m) => m.ApprovalCenterLeaveComponent,
              ),
            data: {
              title: 'Leave',
              searchPlaceholder: 'Search Leave Approvals',
              emptyMessage: 'No leave approvals found for the selected window.',
              filterKind: 'all',
            },
          },
          {
            path: 'short-day',
            loadComponent: () =>
              import('./features/admin/approval-center-leave.component').then(
                (m) => m.ApprovalCenterLeaveComponent,
              ),
            data: {
              title: 'Short Day Leave',
              searchPlaceholder: 'Search Short Day Leave Approvals',
              emptyMessage: 'No short day leave approvals found for the selected window.',
              filterKind: 'short-day',
            },
          },
          {
            path: 'time-off',
            loadComponent: () =>
              import('./features/admin/approval-center-leave.component').then(
                (m) => m.ApprovalCenterLeaveComponent,
              ),
            data: {
              title: 'Time Off',
              searchPlaceholder: 'Search Time Off Approvals',
              emptyMessage: 'No time off approvals found for the selected window.',
              filterKind: 'time-off',
            },
          },
          {
            path: 'regularization',
            loadComponent: () =>
              import('./features/admin/regularization.component').then(
                (m) => m.RegularizationComponent,
              ),
            data: { filterType: '' },
          },
          {
            path: 'overtime',
            loadComponent: () =>
              import('./features/admin/regularization.component').then(
                (m) => m.RegularizationComponent,
              ),
            data: { filterType: 'overtime' },
          },
          {
            path: 'expense',
            loadComponent: () =>
              import('./features/expenses/expenses.component').then(
                (m) => m.ExpensesComponent,
              ),
          },
          {
            path: 'shift-request',
            loadComponent: () =>
              import('./features/admin/approval-center-placeholder.component').then(
                (m) => m.ApprovalCenterPlaceholderComponent,
              ),
            data: {
              title: 'Shift Request',
              subtitle: 'Review employee shift change requests from a dedicated approval queue.',
            },
          },
          {
            path: 'remote-work',
            loadComponent: () =>
              import('./features/admin/approval-center-placeholder.component').then(
                (m) => m.ApprovalCenterPlaceholderComponent,
              ),
            data: {
              title: 'Remote Work',
              subtitle: 'Approve or reject remote work requests without mixing them into attendance or leave screens.',
            },
          },
          {
            path: 'flexi-holiday',
            loadComponent: () =>
              import('./features/admin/approval-center-placeholder.component').then(
                (m) => m.ApprovalCenterPlaceholderComponent,
              ),
            data: {
              title: 'Flexi Holiday',
              subtitle: 'Use this queue for flexi holiday approval movement when the module is enabled.',
            },
          },
          {
            path: 'weekly-off',
            loadComponent: () =>
              import('./features/admin/approval-center-placeholder.component').then(
                (m) => m.ApprovalCenterPlaceholderComponent,
              ),
            data: {
              title: 'Weekly Off',
              subtitle: 'This route is reserved for weekly off approval requests in the approval workspace.',
            },
          },
          {
            path: 'documents',
            loadComponent: () =>
              import('./features/admin/approval-center-placeholder.component').then(
                (m) => m.ApprovalCenterPlaceholderComponent,
              ),
            data: {
              title: 'Documents',
              subtitle: 'Handle organization document approvals in a dedicated route, just like Angular_Web.',
            },
          },
          {
            path: 'resignation',
            loadComponent: () =>
              import('./features/admin/approval-center-placeholder.component').then(
                (m) => m.ApprovalCenterPlaceholderComponent,
              ),
            data: {
              title: 'Resignation',
              subtitle: 'Separate resignation approvals from leave and attendance workflows so the experience stays clear.',
            },
          },
        ],
      },
      {
        path: 'admin/attendance',
        loadComponent: () =>
          import('./features/admin/admin-attendance-management.component').then(
            (m) => m.AdminAttendanceManagementComponent,
          ),
        data: { permission: 'attendance.team.view' },
      },
      {
        path: 'admin/attendance/workspace',
        loadComponent: () =>
          import('@features/attendance/attendance.component').then(
            (m) => m.AttendanceComponent,
          ),
        data: {
          permission: 'attendance.team.view',
          attendanceMode: 'admin',
        },
      },
      {
        path: 'admin/attendance/register',
        loadComponent: () =>
          import('./features/admin/team-attendance.component').then(
            (m) => m.TeamAttendanceComponent,
          ),
        data: { permission: 'attendance.team.view' },
      },
      {
        path: 'admin/attendance/regularizations',
        loadComponent: () =>
          import('./features/admin/regularization.component').then(
            (m) => m.RegularizationComponent,
          ),
        data: { permission: 'regularization.view' },
      },
      {
        path: 'admin/attendance/geofence',
        loadComponent: () =>
          import('./features/admin/geofence-settings.component').then(
            (m) => m.GeofenceSettingsComponent,
          ),
        data: { permission: 'geofence.view' },
      },
      {
        path: 'admin/attendance/integrations',
        loadComponent: () =>
          import('@features/attendance/integrations.component').then(
            (m) => m.AttendanceIntegrationsComponent,
          ),
        data: { permission: 'attendance.team.view' },
      },
      {
        path: 'admin/attendance/reports',
        loadComponent: () =>
          import('@features/reports/reports.component').then(
            (m) => m.ReportsComponent,
          ),
        data: { permission: 'reports.view' },
      },
      {
        path: 'face-registration',
        loadComponent: () =>
          import('@features/attendance/face-registration.component').then(
            (m) => m.FaceRegistrationComponent,
          ),
      },
      {
        path: 'leaves',
        loadComponent: () =>
          import('@features/leaves/leaves.component').then(
            (m) => m.LeavesComponent,
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('@features/reports/reports.component').then(
            (m) => m.ReportsComponent,
          ),
      },
      {
        path: 'reports-center',
        loadComponent: () =>
          import('./features/reports/reports-center.component').then(
            (m) => m.ReportsCenterComponent,
          ),
      },
      {
        path: 'visit-management',
        loadComponent: () =>
          import('./features/visit-management/visit-management.component').then(
            (m) => m.VisitManagementComponent,
          ),
      },
      {
        path: 'platform',
        loadComponent: () =>
          import('./features/platform/platform-control.component').then(
            (m) => m.PlatformControlComponent,
          ),
      },
      {
        path: 'add-ons',
        loadComponent: () =>
          import('./features/add-ons/add-ons.component').then(
            (m) => m.AddOnsComponent,
          ),
      },
      {
        path: 'add-ons/guide/:slug',
        loadComponent: () =>
          import('./features/add-ons/module-guide.component').then(
            (m) => m.ModuleGuideComponent,
          ),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./features/settings/settings.routes').then(
            (m) => m.SETTINGS_ROUTES,
          ),
      },
      {
        path: 'payroll',
        loadComponent: () =>
          import('@features/payroll/payroll.component').then(
            (m) => m.PayrollComponent,
          ),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('@features/projects/projects.component').then(
            (m) => m.ProjectsComponent,
          ),
      },
      {
        path: 'expenses',
        loadComponent: () =>
          import('@features/expenses/expenses.component').then(
            (m) => m.ExpensesComponent,
          ),
      },
      {
        path: 'timesheets',
        loadComponent: () =>
          import('@features/timesheets/timesheets.component').then(
            (m) => m.TimesheetsComponent,
          ),
      },
      {
        path: 'admin/audit',
        loadComponent: () =>
          import('./features/admin/audit-logs.component').then(
            (m) => m.AuditLogsComponent,
          ),
      },
      {
        path: 'admin/settings',
        loadComponent: () =>
          import('./features/admin/settings.component').then(
            (m) => m.SettingsComponent,
          ),
      },
      {
        path: 'admin/geofence',
        redirectTo: 'admin/attendance/geofence',
        pathMatch: 'full',
      },
      {
        path: 'admin/team-attendance',
        redirectTo: 'admin/attendance/register',
        pathMatch: 'full',
      },
      {
        path: 'admin/regularization',
        redirectTo: 'admin/attendance/regularizations',
        pathMatch: 'full',
      },
      {
        path: 'admin/documents',
        loadComponent: () =>
          import('./features/admin/documents.component').then(
            (m) => m.DocumentsComponent,
          ),
      },
      {
        path: 'admin/roles',
        loadComponent: () =>
          import('./features/admin/roles.component').then(
            (m) => m.RolesComponent,
          ),
      },
      {
        path: 'admin/announcements',
        loadComponent: () =>
          import('./features/admin/announcements.component').then(
            (m) => m.AnnouncementsComponent,
          ),
      },
      { path: '', redirectTo: '', pathMatch: 'full' },
    ],
  },
  {
    path: 'billing',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/billing/billing.component').then(
        (m) => m.BillingComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
