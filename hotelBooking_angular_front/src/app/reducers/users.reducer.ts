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
    role?: string;
  };
}

export const initialState: State = {
  users: [],
  loading: false,
  error: null,
  searchParams: { limit: 10, offset: 0, email: '', name: '', contactPhone: '' },
};

export const reducer = createReducer(
  initialState,

  on(UsersActions.adminLoadUsers, UsersActions.managerLoadUsers, (state) => ({ ...state, loading: true, error: null })),
  on(UsersActions.adminLoadUsersSuccess, UsersActions.managerLoadUsersSuccess, (state, { payload }) => ({
    ...state,
    loading: false,
    users: payload,
  })),
  on(UsersActions.adminLoadUsersFailure, UsersActions.managerLoadUsersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(UsersActions.adminCreateUser, (state) => ({ ...state, loading: true, error: null })),
  on(UsersActions.adminCreateUserSuccess, (state, { payload }) => ({
    ...state,
    loading: false,
    users: [payload, ...state.users],
  })),
  on(UsersActions.adminCreateUserFailure, (state, { error }) => ({ ...state, loading: false, error })),

  // Обновлённую запись подставляем на место прежней, не перезапрашивая страницу:
  // список отсортирован по дате создания, и порядок от правки не меняется.
  on(UsersActions.adminUpdateUser, (state) => ({ ...state, loading: true, error: null })),
  on(UsersActions.adminUpdateUserSuccess, (state, { payload }) => ({
    ...state,
    loading: false,
    users: state.users.map((u) => (u.id === payload.id ? { ...u, ...payload } : u)),
  })),
  on(UsersActions.adminUpdateUserFailure, (state, { error }) => ({ ...state, loading: false, error })),

  // Смена фильтра всегда сбрасывает страницу: иначе поиск открывался
  // на несуществующей странице и показывал пустой результат.
  on(UsersActions.setSearchParams, (state, { payload }) => ({
    ...state,
    searchParams: { ...state.searchParams, offset: 0, ...payload },
  })),
  on(UsersActions.clearSearchParams, (state) => ({ ...state, searchParams: initialState.searchParams })),

  // Смещение считает редьюсер. Раньше это делал компонент внутри подписки
  // на те же параметры, что приводило к самозапускающемуся циклу диспатчей.
  on(UsersActions.nextPage, (state) => ({
    ...state,
    searchParams: { ...state.searchParams, offset: state.searchParams.offset + state.searchParams.limit },
  })),
  on(UsersActions.prevPage, (state) => ({
    ...state,
    searchParams: {
      ...state.searchParams,
      offset: Math.max(0, state.searchParams.offset - state.searchParams.limit),
    },
  })),
  on(UsersActions.setPageSize, (state, { limit }) => ({
    ...state,
    searchParams: { ...state.searchParams, limit, offset: 0 },
  })),
);

export const usersFeature = createFeature({ name: usersFeatureKey, reducer });
