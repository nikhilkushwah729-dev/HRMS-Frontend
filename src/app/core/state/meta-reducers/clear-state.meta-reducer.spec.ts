import { clearStateMetaReducer } from './clear-state.meta-reducer';
import { logout } from '../auth/auth.actions';
import { initialState } from '../auth/auth.reducer';

describe('ClearStateMetaReducer Spec', () => {
  it('resets entire state tree back to undefined when logout action is dispatched', () => {
    const dummyReducer = (state: any = { dummy: 'data' }, action: any) => state;
    const metaReducer = clearStateMetaReducer(dummyReducer);

    const currentState = { auth: { user: { id: 1, email: 'tenant.a@domain.com' }, token: 'xyz' } };

    // Dispatching a non-logout action preserves state
    const nextState = metaReducer(currentState, { type: '[Auth] Update User' });
    expect(nextState).toEqual(currentState);

    // Dispatching logout action purges state tree
    const resetState = metaReducer(currentState, logout());
    expect(resetState).toEqual({ dummy: 'data' });
  });
});
