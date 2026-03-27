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
    user: (() => {
        try {
            const stored = localStorage.getItem('hrms_user_data');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    })(),
    token: localStorage.getItem('hrms_auth_token'),
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
    })),
    on(AuthActions.updateUser, (state, { user }) => ({
        ...state,
        user
    }))
);
