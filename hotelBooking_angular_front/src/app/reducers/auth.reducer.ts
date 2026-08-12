import { createFeature, createReducer, on } from '@ngrx/store';
import { AuthActions } from '../actions/auth.actions';
import { UserDto } from '../core/api';

export const authFeatureKey = 'auth';

export interface State {
  user: UserDto | null;
  loading: boolean;
  error: unknown | null;
  /** Регистрация прошла — страница входа показывает подсказку. */
  registered: boolean;
}

export const initialState: State = {
  user: null,
  loading: false,
  error: null,
  registered: false,
};

export const reducer = createReducer(
  initialState,
  on(AuthActions.login, (state) => ({ ...state, loading: true, error: null })),
  on(AuthActions.loginSuccess, (state, { payload }) => ({
    ...state,
    loading: false,
    registered: false,
    user: {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      contactPhone: payload.contactPhone,
      role: payload.role,
    },
  })),
  on(AuthActions.loginFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(AuthActions.register, (state) => ({ ...state, loading: true, error: null })),
  // Регистрация НЕ логинит пользователя: раньше сюда клался user, из-за чего
  // страница входа считала его авторизованным и уводила на /hotels без токена.
  on(AuthActions.registerSuccess, (state) => ({ ...state, loading: false, registered: true, error: null })),
  on(AuthActions.registerFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(AuthActions.logout, (state) => ({ ...state, loading: true, error: null })),
  on(AuthActions.logoutSuccess, () => ({ ...initialState })),
  on(AuthActions.logoutFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(AuthActions.sessionExpired, () => ({ ...initialState })),

  on(AuthActions.loadCurrentUser, (state) => ({ ...state, loading: true, error: null })),
  on(AuthActions.loadCurrentUserSuccess, (state, { payload }) => ({ ...state, loading: false, user: payload })),
  on(AuthActions.loadCurrentUserFailure, (state, { error }) => ({ ...state, loading: false, user: null, error })),
);

export const authFeature = createFeature({
  name: authFeatureKey,
  reducer,
});
