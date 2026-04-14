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
        path: 'profile',
        loadComponent: () =>
          import('@features/self-service/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
      {
        path: 'billing',
        loadComponent: () =>
          import('./features/billing/billing.component').then(
            (m) => m.BillingComponent,
          ),
      },
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
        path: 'attendance',
        loadComponent: () =>
          import('@features/attendance/attendance.component').then(
            (m) => m.AttendanceComponent,
          ),
      },
      {
        path: 'attendance/integrations',
        loadComponent: () =>
          import('@features/attendance/integrations.component').then(
            (m) => m.AttendanceIntegrationsComponent,
          ),
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
        loadComponent: () =>
          import('./features/admin/geofence-settings.component').then(
            (m) => m.GeofenceSettingsComponent,
          ),
      },
      {
        path: 'admin/team-attendance',
        loadComponent: () =>
          import('./features/admin/team-attendance.component').then(
            (m) => m.TeamAttendanceComponent,
          ),
      },
      {
        path: 'admin/regularization',
        loadComponent: () =>
          import('./features/admin/regularization.component').then(
            (m) => m.RegularizationComponent,
          ),
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
  { path: '**', redirectTo: '' },
];
