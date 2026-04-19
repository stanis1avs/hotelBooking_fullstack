import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { UserDto } from '../core/api';

export interface UserSearchParams {
  limit: number;
  offset: number;
  email?: string;
  name?: string;
  contactPhone?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  contactPhone: string;
  role?: string;
}

export const UsersActions = createActionGroup({
  source: 'Users',
  events: {
    'Admin Load Users': props<{ payload: UserSearchParams }>(),
    'Admin Load Users Success': props<{ payload: UserDto[] }>(),
    'Admin Load Users Failure': props<{ error: unknown }>(),

    'Admin Create User': props<{ payload: CreateUserRequest }>(),
    'Admin Create User Success': props<{ payload: UserDto }>(),
    'Admin Create User Failure': props<{ error: unknown }>(),

    'Manager Load Users': props<{ payload: UserSearchParams }>(),
    'Manager Load Users Success': props<{ payload: UserDto[] }>(),
    'Manager Load Users Failure': props<{ error: unknown }>(),

    'Set Search Params': props<{ payload: Partial<UserSearchParams> }>(),
    'Clear Search Params': emptyProps(),
  },
});
