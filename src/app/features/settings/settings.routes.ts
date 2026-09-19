import { Routes } from '@angular/router';
import { SettingsLayoutComponent } from './settings-layout.component';
import { AllSettingsComponent } from './all-settings.component';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    component: SettingsLayoutComponent,
    children: [
      {
        path: '',
        component: AllSettingsComponent
      },
      {
        path: 'organisation/organisation-profile',
        loadComponent: () => import('./organisation/organisation-profile/organisation-profile.component').then(m => m.OrganisationProfileComponent)
      },
      {
        path: 'organisation/holiday',
        loadComponent: () => import('./organisation/holiday/holiday.component').then(m => m.HolidayComponent)
      },
      {
        path: 'organisation/departments',
        loadComponent: () => import('./organisation/departments/departments.component').then(m => m.DepartmentsComponent)
      },
      {
        path: 'organisation/designation',
        loadComponent: () => import('./organisation/designation/designation.component').then(m => m.DesignationComponent)
      },
      {
        path: 'organisation/grade',
        loadComponent: () => import('./organisation/grade/grade.component').then(m => m.GradeComponent)
      },
      {
        path: 'organisation/zones',
        loadComponent: () => import('./organisation/zones/zones.component').then(m => m.ZonesComponent)
      },
      {
        path: 'organisation/client-zones',
        loadComponent: () => import('./organisation/client-zones/client-zones.component').then(m => m.ClientZonesComponent)
      },
      {
        path: 'organisation/location',
        loadComponent: () => import('./organisation/location/location.component').then(m => m.LocationComponent)
      },
      {
        path: 'attendance/shift',
        loadComponent: () => import('./attendance/shift/shift.component').then(m => m.ShiftComponent)
      },
      {
        path: 'attendance/regularization',
        redirectTo: '/attendance/regularizations',
        pathMatch: 'full'
      },
      {
        path: 'attendance/attendance-mode',
        loadComponent: () => import('./attendance/attendance-mode/attendance-mode.component').then(m => m.AttendanceModeComponent)
      },
      {
        path: 'attendance/kiosk-manager',
        redirectTo: '/admin/kiosks',
        pathMatch: 'full'
      },
      {
        path: 'attendance/kiosk-setup',
        redirectTo: '/admin/kiosks/settings',
        pathMatch: 'full'
      },
      {
        path: 'attendance/device-restriction',
        redirectTo: '/admin/kiosks/settings',
        pathMatch: 'full'
      },
      {
        path: 'attendance/advance-settings',
        redirectTo: '/attendance/workspace',
        pathMatch: 'full'
      },
      {
        path: 'attendance/geo-fence',
        loadComponent: () => import('./attendance/geo-fence/geo-fence.component').then(m => m.GeoFenceComponent)
      },
      {
        path: 'attendance/remote-work',
        loadComponent: () => import('./attendance/remote-work/remote-work.component').then(m => m.RemoteWorkComponent)
      },
      {
        path: 'attendance/weekly-off',
        loadComponent: () => import('./attendance/weekly-off/weekly-off.component').then(m => m.WeeklyOffComponent)
      },
      {
        path: 'attendance/flexi-holiday',
        redirectTo: '/settings/organisation/holiday',
        pathMatch: 'full'
      },
      {
        path: 'attendance/face-recognition',
        loadComponent: () => import('./attendance/face-recognition/face-recognition.component').then(m => m.FaceRecognitionComponent)
      },
      {
        path: 'organisation/penalty',
        redirectTo: '/settings/organisation/organisation-profile',
        pathMatch: 'full'
      },
      {
        path: 'organisation/designation-hierarchy',
        redirectTo: '/settings/organisation/designation',
        pathMatch: 'full'
      },
      {
        path: 'organisation/divisions',
        redirectTo: '/settings/organisation/departments',
        pathMatch: 'full'
      },
      {
        path: 'organisation/policies',
        redirectTo: '/settings/organisation/holiday',
        pathMatch: 'full'
      },
      {
        path: 'leave/short-day-leave',
        redirectTo: '/leave/settings',
        pathMatch: 'full'
      },
      {
        path: 'leave/time-off',
        redirectTo: '/self-service/requests/time-off',
        pathMatch: 'full'
      },
      {
        path: 'leave/comp-off',
        redirectTo: '/leave/settings',
        pathMatch: 'full'
      },
      {
        path: 'leave/leave-types',
        loadComponent: () => import('./leave/leave-types/leave-types.component').then(m => m.LeaveTypesComponent)
      },
      {
        path: 'employee/onboarding',
        redirectTo: '/employees/invitations',
        pathMatch: 'full'
      },
      {
        path: 'visit-management-settings',
        redirectTo: '/visit-management',
        pathMatch: 'full'
      },
      {
        path: 'approval-flow',
        redirectTo: '/approval-center',
        pathMatch: 'full'
      },
      {
        path: 'import-wizard',
        loadComponent: () =>
          import('./system/import-wizard/import-wizard.component').then(
            (m) => m.ImportWizardComponent,
          ),
      }
    ]
  }
];
