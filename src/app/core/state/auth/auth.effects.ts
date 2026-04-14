import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import * as AuthActions from './auth.actions';
import { Router } from '@angular/router';

@Injectable()
export class AuthEffects {
    private actions$ = inject(Actions);
    private authService = inject(AuthService);
    private router = inject(Router);

    login$ = createEffect(() =>
        this.actions$.pipe(
            ofType(AuthActions.login),
            mergeMap(({ credentials }) =>
                this.authService.login(credentials).pipe(
                    map((res) => {
                        const otpRequired = Boolean((res as any)?.requires2fa || res?.requiresOtp);
                        if (otpRequired) {
                            return AuthActions.loginFailure({
                                error: (res as any)?.message || 'OTP verification required.'
                            });
                        }

                        if (res?.user && res?.token) {
                            return AuthActions.loginSuccess({ user: res.user, token: res.token });
                        }

                        return AuthActions.loginFailure({
                            error: 'Invalid login response. Please try again.'
                        });
                    }),
                    catchError((err) => of(AuthActions.loginFailure({ error: err?.error?.message || err?.message || 'Login failed. Please try again.' })))
                )
            )
        )
    );

    loginSuccess$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(AuthActions.loginSuccess),
                tap(() => this.router.navigateByUrl('/dashboard', { replaceUrl: true }))
            ),
        { dispatch: false }
    );

    logout$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(AuthActions.logout),
                switchMap(() => {
                    const token = this.authService.getStoredToken();
                    // Immediate local signout + redirect
                    this.authService.clearAuthStorage();
                    this.router.navigateByUrl('/auth/login', { replaceUrl: true });

                    // Best-effort server logout with explicit bearer token
                    return this.authService.logout(token).pipe(
                        catchError(() => of(null))
                    );
                }
                )
            ),
        { dispatch: false }
    );
}
