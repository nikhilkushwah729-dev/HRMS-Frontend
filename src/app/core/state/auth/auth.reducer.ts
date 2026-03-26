import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { User } from '../../models/auth.model';

export interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
}

export const initialState: AuthState = {
    user: null,
    token: null,
    loading: false,
    error: null
};

export const authReducer = createReducer(
    initialState,
    on(AuthActions.login, (state) => ({
        ...state,
        loading: true,
        error: null
    })),
    on(AuthActions.loginSuccess, (state, { user, token }) => ({
        ...state,
        user,
        token,
        loading: false,
        error: null
    })),
    on(AuthActions.loginFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),
    on(AuthActions.logout, () => initialState),
    on(AuthActions.restoreUser, (state, { user, token }) => ({
        ...state,
        user,
        token
    }))
);
