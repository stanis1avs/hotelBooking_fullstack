import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { UserDto } from '../core/api';

export interface UserSearchParams {
  limit: number;
  offset: number;
  email?: string;
  name?: string;
  contactPhone?: string;
  role?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  contactPhone: string;
  role?: string;
}

/** Почты и пароля нет: адрес меняется с подтверждением, пароль — отдельно. */
export interface UpdateUserRequest {
  name?: string;
  contactPhone?: string;
  role?: string;
}

export const UsersActions = createActionGroup({
  source: 'Users',
  events: {
    'Admin Load Users': props<{ payload: UserSearchParams }>(),
    // total приходит с сервера: по нему считается номер последней страницы
    'Admin Load Users Success': props<{ payload: UserDto[]; total: number }>(),
    'Admin Load Users Failure': props<{ error: unknown }>(),

    'Admin Create User': props<{ payload: CreateUserRequest }>(),
    'Admin Create User Success': props<{ payload: UserDto }>(),
    'Admin Create User Failure': props<{ error: unknown }>(),

    'Admin Update User': props<{ id: string; payload: UpdateUserRequest }>(),
    'Admin Update User Success': props<{ payload: UserDto }>(),
    'Admin Update User Failure': props<{ error: unknown }>(),

    'Manager Load Users': props<{ payload: UserSearchParams }>(),
    'Manager Load Users Success': props<{ payload: UserDto[]; total: number }>(),
    'Manager Load Users Failure': props<{ error: unknown }>(),

    'Set Search Params': props<{ payload: Partial<UserSearchParams> }>(),
    'Clear Search Params': emptyProps(),

    // Одно событие на всю пагинацию: mat-paginator сообщает номер страницы
    // и её размер, смещение из них вычисляет редьюсер.
    'Set Page': props<{ pageIndex: number; pageSize: number }>(),
  },
});
