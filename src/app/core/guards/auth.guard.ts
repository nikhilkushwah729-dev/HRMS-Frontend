import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectIsAuthenticated } from '../state/auth/auth.selectors';
import { map, take } from 'rxjs';

export const authGuard: CanActivateFn = () => {
    const store = inject(Store);
    const router = inject(Router);

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
