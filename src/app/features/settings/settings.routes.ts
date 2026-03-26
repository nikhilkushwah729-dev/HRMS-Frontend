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
        path: 'attendance/face-recognition',
        loadComponent: () => import('./attendance/face-recognition/face-recognition.component').then(m => m.FaceRecognitionComponent)
      }
    ]
  }
];
