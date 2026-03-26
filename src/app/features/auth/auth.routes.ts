import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/guest.guard';

export const AUTH_ROUTES: Routes = [
    {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'signup',
        canActivate: [guestGuard],
        loadComponent: () => import('./signup/signup.component').then(m => m.SignupComponent)
    },
    {
        path: 'forgot-password',
        canActivate: [guestGuard],
        loadComponent: () => import('./forgot-password.component').then(m => m.ForgotPasswordComponent)
    },
    {
        path: 'reset-password',
        canActivate: [guestGuard],
        loadComponent: () => import('./reset-password.component').then(m => m.ResetPasswordComponent)
    },
    {
        path: 'verify-email',
        canActivate: [guestGuard],
        loadComponent: () => import('./verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
    },
    {
        path: 'invitation/:token',
        loadComponent: () => import('./invitation/invitation.component').then(m => m.InvitationComponent)
    },
    {
        path: 'callback',
        loadComponent: () => import('./callback/oauth-callback.component').then(m => m.OAuthCallbackComponent)
    },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
];
