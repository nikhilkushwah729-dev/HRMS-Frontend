import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectIsAuthenticated } from '../state/auth/auth.selectors';
import { map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import * as AuthActions from '../state/auth/auth.actions';

export const authGuard: CanActivateFn = () => {
    const store = inject(Store);
    const router = inject(Router);
    const authService = inject(AuthService);

    const storedToken = authService.getStoredToken();
    const storedUser = authService.getStoredUser();

    // Support hard refresh / direct deep links before NgRx hydration completes.
    if (storedToken && storedUser) {
        store.dispatch(AuthActions.restoreUser({ user: storedUser, token: storedToken }));
        return true;
    }

    return store.select(selectIsAuthenticated).pipe(
        take(1),
        map(isAuthenticated => {
            if (isAuthenticated) {
                return true;
            } else {
                router.navigate(['/auth/login']);
                return false;
            }
        })
    );
};
