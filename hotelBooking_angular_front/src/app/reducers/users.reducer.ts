import { createFeature, createReducer, on } from '@ngrx/store';
import { UsersActions } from '../actions/users.actions';
import { UserDto } from '../core/api';

export const usersFeatureKey = 'users';

export interface State {
  users: UserDto[];
  loading: boolean;
  error: unknown | null;
  searchParams: {
    limit: number;
    offset: number;
    email?: string;
    name?: string;
    contactPhone?: string;
  };
}

export const initialState: State = {
  users: [],
  loading: false,
  error: null,
  searchParams: {
    limit: 50,
    offset: 0,
    email: '',
    name: '',
    contactPhone: '',
  },
};

export const reducer = createReducer(
  initialState,

  on(UsersActions.adminLoadUsers, (state) => ({ ...state, loading: true, error: null })),
  on(UsersActions.adminLoadUsersSuccess, (state, { payload }) => ({
    ...state,
    loading: false,
    users: payload,
  })),
  on(UsersActions.adminLoadUsersFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(UsersActions.adminCreateUser, (state) => ({ ...state, loading: true, error: null })),
  on(UsersActions.adminCreateUserSuccess, (state, { payload }) => ({
    ...state,
    loading: false,
    users: [payload, ...state.users],
  })),
  on(UsersActions.adminCreateUserFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(UsersActions.managerLoadUsers, (state) => ({ ...state, loading: true, error: null })),
  on(UsersActions.managerLoadUsersSuccess, (state, { payload }) => ({
    ...state,
    loading: false,
    users: payload,
  })),
  on(UsersActions.managerLoadUsersFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(UsersActions.setSearchParams, (state, { payload }) => ({
    ...state,
    searchParams: { ...state.searchParams, ...payload },
  })),
  on(UsersActions.clearSearchParams, (state) => ({
    ...state,
    searchParams: initialState.searchParams,
  })),
);

export const usersFeature = createFeature({
  name: usersFeatureKey,
  reducer,
});
