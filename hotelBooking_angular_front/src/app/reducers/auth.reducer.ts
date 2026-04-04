import { createFeature, createReducer, on } from '@ngrx/store';
import { AuthActions } from '../actions/auth.actions';
import { UserDto } from '../core/api';

export const authFeatureKey = 'auth';

export interface State {
  user: UserDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: unknown | null;
}

export const initialState: State = {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
};

export const reducer = createReducer(
  initialState,
  on(AuthActions.login, (state) => ({ ...state, loading: true, error: null })),
  on(AuthActions.loginSuccess, (state, { payload }) => ({
    ...state,
    loading: false,
    user: {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      contactPhone: payload.contactPhone,
      role: payload.role,
    },
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
  })),
  on(AuthActions.loginFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(AuthActions.register, (state) => ({ ...state, loading: true, error: null })),
  on(AuthActions.registerSuccess, (state, { payload }) => ({ ...state, loading: false, user: payload })),
  on(AuthActions.registerFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(AuthActions.logout, (state) => ({ ...state, loading: true, error: null })),
  on(AuthActions.logoutSuccess, (state) => ({ ...state, loading: false, user: null, accessToken: null, refreshToken: null })),
  on(AuthActions.logoutFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(AuthActions.loadCurrentUser, (state) => ({ ...state, loading: true, error: null })),
  on(AuthActions.loadCurrentUserSuccess, (state, { payload }) => ({ ...state, loading: false, user: payload })),
  on(AuthActions.loadCurrentUserFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(AuthActions.refreshToken, (state) => ({ ...state, loading: true, error: null })),
  on(AuthActions.refreshTokenSuccess, (state, { accessToken }) => ({ ...state, loading: false, accessToken })),
  on(AuthActions.refreshTokenFailure, (state, { error }) => ({ ...state, loading: false, error })),
);

export const authFeature = createFeature({
  name: authFeatureKey,
  reducer,
});
