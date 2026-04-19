import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * GuestGuard - Prevents authenticated users from accessing auth pages
 * (login, signup, forgot-password, etc.)
 * Use this guard on auth routes to redirect already logged-in users to dashboard
 */
export const guestGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const token = authService.getStoredToken();
    const user = authService.getStoredUser();

    if (!token && !user) {
        return true;
    }

    if (!token || !user) {
        authService.clearAuthStorage();
        return true;
    }

    return router.createUrlTree(['/dashboard']);
};

