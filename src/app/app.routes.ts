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
    path: 'kiosk',
    loadComponent: () =>
      import('./features/kiosk/kiosk-home/kiosk-home.component').then(
        (m) => m.KioskHomeComponent,
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
      },
      {
        path: 'self-service/requests/time-off',
        loadComponent: () =>
          import('./features/self-service/request-time-off.component').then(
            (m) => m.RequestTimeOffComponent,
          ),
        data: { permission: 'dashboard.view' },
      },
      {
        path: 'self-service/requests/time-off/apply',
        loadComponent: () =>
          import('./features/self-service/request-time-off-apply.component').then(
            (m) => m.RequestTimeOffApplyComponent,
          ),
        data: { permission: 'dashboard.view' },
      },
      {
        path: 'self-service/requests/create',
        loadComponent: () =>
          import('./features/self-service/request-center-create.component').then(
            (m) => m.RequestCenterCreateComponent,
          ),
        data: { permission: 'dashboard.view' },
      },
      {
        path: 'self-service/requests/:id',
        loadComponent: () =>
          import('./features/self-service/request-center-detail.component').then(
            (m) => m.RequestCenterDetailComponent,
          ),
        data: { permission: 'dashboard.view' },
      },
      {
        path: 'requests',
        redirectTo: 'self-service/requests',
        pathMatch: 'full',
      },
      {
        path: 'approval-center',
        loadComponent: () =>
          import('./features/admin/approval-center.component').then(
            (m) => m.ApprovalCenterComponent,
          ),
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('./features/admin/approval-center-pending.component').then(
                (m) => m.ApprovalCenterPendingComponent,
              ),
          },
          {
            path: 'pending',
            loadComponent: () =>
              import('./features/admin/approval-center-pending.component').then(
                (m) => m.ApprovalCenterPendingComponent,
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/admin/approval-center-detail.component').then(
                (m) => m.ApprovalCenterDetailComponent,
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
        path: 'self-service/attendance-qr',
        loadComponent: () =>
          import('./features/self-service/attendance-qr.component').then(
            (m) => m.AttendanceQrComponent,
          ),
        data: {
          permission: 'attendance.view',
        },
      },
      {
        path: 'self-service/leave',
        loadComponent: () =>
          import('./features/leaves/self-service-leave.component').then(
            (m) => m.SelfServiceLeaveComponent,
          ),
        data: {
          permission: 'leave.view',
        },
      },
      {
        path: 'self-service/leave/apply',
        loadComponent: () =>
          import('./features/leaves/self-service-leave-apply.component').then(
            (m) => m.SelfServiceLeaveApplyComponent,
          ),
        data: {
          permission: 'leave.view',
        },
      },
      {
        path: 'self-service/payroll',
        loadComponent: () =>
          import('./features/payroll/self-service-payroll.component').then(
            (m) => m.SelfServicePayrollComponent,
          ),
        data: {
          permission: 'payroll.view',
        },
      },
      {
        path: 'self-service/timesheet',
        loadComponent: () =>
          import('./features/timesheets/self-service-timesheet.component').then(
            (m) => m.SelfServiceTimesheetComponent,
          ),
        data: {
          permission: 'timesheets.view',
        },
      },
      {
        path: 'self-service/timesheet/create',
        loadComponent: () =>
          import('./features/timesheets/self-service-timesheet-create.component').then(
            (m) => m.SelfServiceTimesheetCreateComponent,
          ),
        data: {
          permission: 'timesheets.view',
        },
      },
      {
        path: 'self-service/timesheet/:id',
        loadComponent: () =>
          import('./features/timesheets/self-service-timesheet-detail.component').then(
            (m) => m.SelfServiceTimesheetDetailComponent,
          ),
        data: {
          permission: 'timesheets.view',
        },
      },
      {
        path: 'self-service/payslip/:month',
        loadComponent: () =>
          import('./features/payroll/self-service-payslip.component').then(
            (m) => m.SelfServicePayslipComponent,
          ),
        data: {
          permission: 'payroll.view',
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
          import('./features/admin/admin-attendance-management.component').then(
            (m) => m.AdminAttendanceManagementComponent,
          ),
        data: { permission: 'attendance.team.view' },
      },
      {
        path: 'hr/attendance',
        redirectTo: 'admin/attendance',
        pathMatch: 'full',
      },
      {
        path: 'admin/approvals',
        redirectTo: 'approval-center',
        pathMatch: 'full',
      },
      {
        path: 'admin/attendance',
        redirectTo: 'attendance',
        pathMatch: 'full',
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
        path: 'attendance/workspace',
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
        path: 'attendance/register',
        loadComponent: () =>
          import('./features/admin/team-attendance.component').then(
            (m) => m.TeamAttendanceComponent,
          ),
        data: { permission: 'attendance.team.view' },
      },
      {
        path: 'attendance/regularizations',
        loadComponent: () =>
          import('./features/admin/regularization.component').then(
            (m) => m.RegularizationComponent,
          ),
        data: { permission: 'regularization.view' },
      },
      {
        path: 'attendance/geofence',
        loadComponent: () =>
          import('./features/admin/geofence-settings.component').then(
            (m) => m.GeofenceSettingsComponent,
          ),
        data: { permission: 'geofence.view' },
      },
      {
        path: 'attendance/integrations',
        loadComponent: () =>
          import('@features/attendance/integrations.component').then(
            (m) => m.AttendanceIntegrationsComponent,
          ),
        data: { permission: 'attendance.team.view' },
      },
      {
        path: 'attendance/reports',
        loadComponent: () =>
          import('@features/reports/reports.component').then(
            (m) => m.ReportsComponent,
          ),
        data: { permission: 'reports.view' },
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
        path: 'leave',
        loadComponent: () =>
          import('./features/leaves/leave-management.component').then(
            (m) => m.LeaveManagementComponent,
          ),
        data: {
          permission: 'leave.view',
        },
      },
      {
        path: 'leave/settings',
        loadComponent: () =>
          import('./features/leaves/leave-settings.component').then(
            (m) => m.LeaveSettingsComponent,
          ),
        data: {
          permission: 'settings.view',
        },
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
          import('./features/leaves/leave-entry.component').then(
            (m) => m.LeaveEntryComponent,
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
          import('./features/payroll/payroll-entry.component').then(
            (m) => m.PayrollEntryComponent,
          ),
      },
      {
        path: 'payroll/manage',
        loadComponent: () =>
          import('./features/payroll/payroll-management.component').then(
            (m) => m.PayrollManagementComponent,
          ),
        data: {
          permission: 'payroll.view',
        },
      },
      {
        path: 'payroll/structure',
        loadComponent: () =>
          import('./features/payroll/payroll-structure.component').then(
            (m) => m.PayrollStructureComponent,
          ),
        data: {
          permission: 'payroll.update',
        },
      },
      {
        path: 'payroll/process',
        loadComponent: () =>
          import('./features/payroll/payroll-process.component').then(
            (m) => m.PayrollProcessComponent,
          ),
        data: {
          permission: 'payroll.update',
        },
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
        redirectTo: 'self-service/timesheet',
        pathMatch: 'full',
      },
      {
        path: 'timesheet',
        loadComponent: () =>
          import('./features/timesheets/timesheet-management.component').then(
            (m) => m.TimesheetManagementComponent,
          ),
        data: {
          permission: 'timesheets.view',
        },
      },
      {
        path: 'timesheet/pending',
        loadComponent: () =>
          import('./features/timesheets/timesheet-pending.component').then(
            (m) => m.TimesheetPendingComponent,
          ),
        data: {
          permission: 'timesheets.view',
        },
      },
      {
        path: 'timesheet/reports',
        loadComponent: () =>
          import('./features/timesheets/timesheet-reports.component').then(
            (m) => m.TimesheetReportsComponent,
          ),
        data: {
          permission: 'timesheets.view',
        },
      },
      {
        path: 'timesheet/:id',
        loadComponent: () =>
          import('./features/timesheets/timesheet-detail.component').then(
            (m) => m.TimesheetDetailComponent,
          ),
        data: {
          permission: 'timesheets.view',
        },
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
      {
        path: 'admin/kiosks',
        loadComponent: () =>
          import('./features/admin/kiosk-management/kiosk-list/kiosk-list.component').then(
            (m) => m.KioskListComponent,
          ),
      },
      {
        path: 'admin/kiosks/approvals',
        loadComponent: () =>
          import('./features/admin/kiosk-management/kiosk-approvals/kiosk-approvals.component').then(
            (m) => m.KioskApprovalsComponent,
          ),
      },
      {
        path: 'admin/kiosks/logs',
        loadComponent: () =>
          import('./features/admin/kiosk-management/attendance-logs/attendance-logs.component').then(
            (m) => m.KioskAttendanceLogsComponent,
          ),
      },
      {
        path: 'admin/kiosks/face-profiles',
        loadComponent: () =>
          import('./features/admin/kiosk-management/face-profile-approvals/face-profile-approvals.component').then(
            (m) => m.FaceProfileApprovalsComponent,
          ),
      },
      {
        path: 'admin/kiosks/pins',
        loadComponent: () =>
          import('./features/admin/kiosk-management/kiosk-pin-management/kiosk-pin-management.component').then(
            (m) => m.KioskPinManagementComponent,
          ),
      },
      {
        path: 'admin/kiosks/settings',
        loadComponent: () =>
          import('./features/admin/kiosk-management/kiosk-settings/kiosk-settings.component').then(
            (m) => m.KioskSettingsComponent,
          ),
      },
      {
        path: 'admin/kiosks/:id',
        loadComponent: () =>
          import('./features/admin/kiosk-management/kiosk-detail/kiosk-detail.component').then(
            (m) => m.KioskDetailComponent,
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
