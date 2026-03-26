import { createAction, props } from '@ngrx/store';
import { User } from '../../models/auth.model';

export const login = createAction(
    '[Auth] Login',
    props<{ credentials: any }>()
);

export const loginSuccess = createAction(
    '[Auth] Login Success',
    props<{ user: User; token: string }>()
);

export const loginFailure = createAction(
    '[Auth] Login Failure',
    props<{ error: string }>()
);

export const logout = createAction('[Auth] Logout');

export const restoreUser = createAction(
    '[Auth] Restore User',
    props<{ user: User; token: string }>()
);
