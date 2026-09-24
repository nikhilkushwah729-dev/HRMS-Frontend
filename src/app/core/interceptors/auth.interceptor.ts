import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

let isRedirecting = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const token = authService.getStoredToken();

    let authReq = req;
    if (token && !req.headers.has('Authorization')) {
        authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                const isAuthEndpoint =
                    req.url.includes('/auth/login') ||
                    req.url.includes('/auth/verify-otp') ||
                    req.url.includes('/auth/phone/') ||
                    req.url.includes('/auth/register') ||
                    req.url.includes('/auth/login-with-verified-email');

                if (!isAuthEndpoint && !isRedirecting) {
                    isRedirecting = true;
                    authService.clearAuthStorage();
                    router.navigate(['/login']).finally(() => {
                        setTimeout(() => {
                            isRedirecting = false;
                        }, 1000);
                    });
                }
            } else if (error.status === 403) {
                // DO NOT clear token or auth storage on 403. Show inline Access Denied status.
                console.warn('[403 Forbidden] Access Denied for endpoint:', req.url);
            }

            return throwError(() => error);
        })
    );
};
