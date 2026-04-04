import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { LoginRequestDto, LoginResponseDto, RegisterRequestDto, UserDto } from '../core/api';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Login': props<{ payload: LoginRequestDto }>(),
    'Login Success': props<{ payload: LoginResponseDto }>(),
    'Login Failure': props<{ error: unknown }>(),

    'Register': props<{ payload: RegisterRequestDto }>(),
    'Register Success': props<{ payload: UserDto }>(),
    'Register Failure': props<{ error: unknown }>(),

    'Logout': emptyProps(),
    'Logout Success': emptyProps(),
    'Logout Failure': props<{ error: unknown }>(),

    'Load Current User': emptyProps(),
    'Load Current User Success': props<{ payload: UserDto }>(),
    'Load Current User Failure': props<{ error: unknown }>(),

    'Refresh Token': emptyProps(),
    'Refresh Token Success': props<{ accessToken: string }>(),
    'Refresh Token Failure': props<{ error: unknown }>(),
  },
});
