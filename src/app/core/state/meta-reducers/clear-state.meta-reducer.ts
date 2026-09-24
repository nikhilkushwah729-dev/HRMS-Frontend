import { ActionReducer } from '@ngrx/store';
import { logout } from '../auth/auth.actions';

export function clearStateMetaReducer(reducer: ActionReducer<any>): ActionReducer<any> {
  return function (state, action) {
    if (action.type === logout().type || action.type === '[Auth] Logout') {
      state = undefined;
    }
    return reducer(state, action);
  };
}
