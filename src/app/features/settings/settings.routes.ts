import { Routes } from '@angular/router';
import { SettingsLayoutComponent } from './settings-layout.component';
import { AllSettingsComponent } from './all-settings.component';
import { SettingsGenericPageComponent } from './shared/settings-generic-page.component';
import { SETTINGS_PAGE_CONFIGS } from './shared/settings-page.config';

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
        component: SettingsGenericPageComponent,
        data: { config: SETTINGS_PAGE_CONFIGS['attendanceRegularization'] }
      },
      {
        path: 'attendance/attendance-mode',
        component: SettingsGenericPageComponent,
        data: { config: SETTINGS_PAGE_CONFIGS['attendanceMode'] }
      },
      {
        path: 'attendance/kiosk-manager',
        component: SettingsGenericPageComponent,
        data: { config: SETTINGS_PAGE_CONFIGS['kioskManager'] }
      },
      {
        path: 'attendance/kiosk-setup',
        component: SettingsGenericPageComponent,
        data: { config: SETTINGS_PAGE_CONFIGS['kioskSetup'] }
      },
      {
        path: 'attendance/device-restriction',
        component: SettingsGenericPageComponent,
        data: { config: SETTINGS_PAGE_CONFIGS['deviceRestriction'] }
      },
      {
        path: 'attendance/advance-settings',
        component: SettingsGenericPageComponent,
        data: { config: SETTINGS_PAGE_CONFIGS['advanceAttendance'] }
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
        component: SettingsGenericPageComponent,
        data: { config: SETTINGS_PAGE_CONFIGS['flexiHoliday'] }
      },
      {
        path: 'attendance/face-recognition',
        loadComponent: () => import('./attendance/face-recognition/face-recognition.component').then(m => m.FaceRecognitionComponent)
      },
      {
        path: 'organisation/penalty',
        component: SettingsGenericPageComponent,
        data: { config: SETTINGS_PAGE_CONFIGS['penalty'] }
      },
      {
        path: 'organisation/designation-hierarchy',
        component: SettingsGenericPageComponent,
        data: { config: SETTINGS_PAGE_CONFIGS['hierarchy'] }
      },
      {
        path: 'organisation/divisions',
        component: SettingsGenericPageComponent,
        data: { config: SETTINGS_PAGE_CONFIGS['divisions'] }
      },
      {
        path: 'organisation/policies',
        component: SettingsGenericPageComponent,
        data: { config: SETTINGS_PAGE_CONFIGS['policies'] }
      },
      {
        path: 'leave/short-day-leave',
        component: SettingsGenericPageComponent,
        data: { config: SETTINGS_PAGE_CONFIGS['shortDayLeave'] }
      },
      {
        path: 'leave/time-off',
        component: SettingsGenericPageComponent,
        data: { config: SETTINGS_PAGE_CONFIGS['timeOff'] }
      },
      {
        path: 'leave/comp-off',
        component: SettingsGenericPageComponent,
        data: { config: SETTINGS_PAGE_CONFIGS['compOff'] }
      },
      {
        path: 'leave/leave-types',
        loadComponent: () => import('./leave/leave-types/leave-types.component').then(m => m.LeaveTypesComponent)
      },
      {
        path: 'employee/onboarding',
        component: SettingsGenericPageComponent,
        data: { config: SETTINGS_PAGE_CONFIGS['onboarding'] }
      },
      {
        path: 'visit-management-settings',
        component: SettingsGenericPageComponent,
        data: { config: SETTINGS_PAGE_CONFIGS['visitManagementSettings'] }
      },
      {
        path: 'approval-flow',
        component: SettingsGenericPageComponent,
        data: { config: SETTINGS_PAGE_CONFIGS['approvalFlow'] }
      },
      {
        path: 'import-wizard',
        component: SettingsGenericPageComponent,
        data: { config: SETTINGS_PAGE_CONFIGS['importWizard'] }
      }
    ]
  }
];
