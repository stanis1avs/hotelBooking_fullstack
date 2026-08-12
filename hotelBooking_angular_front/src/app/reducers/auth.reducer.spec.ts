import { AuthActions } from '../actions/auth.actions';
import { initialState, reducer } from './auth.reducer';
import { LoginResponseDto, UserDto } from '../core/api';

const user: UserDto = {
  id: '1',
  email: 'a@mail.ru',
  name: 'Анна',
  contactPhone: '+7 900 000-00-00',
  role: 'client',
};

describe('auth reducer', () => {
  it('неизвестное действие не меняет состояние', () => {
    expect(reducer(initialState, {} as never)).toBe(initialState);
  });

  it('registerSuccess НЕ авторизует пользователя', () => {
    // Раньше сюда клался user, из-за чего страница входа считала пользователя
    // вошедшим и уводила на /hotels без токена.
    const state = reducer(initialState, AuthActions.registerSuccess({ payload: user }));
    expect(state.user).toBeNull();
    expect(state.registered).toBe(true);
  });

  it('loginSuccess заполняет пользователя и снимает флаг регистрации', () => {
    const payload: LoginResponseDto = { ...user, access_token: 'token' };
    const after = reducer(
      reducer(initialState, AuthActions.registerSuccess({ payload: user })),
      AuthActions.loginSuccess({ payload })
    );
    expect(after.user?.email).toBe('a@mail.ru');
    expect(after.registered).toBe(false);
  });

  it('sessionExpired полностью очищает состояние', () => {
    const logged = reducer(
      initialState,
      AuthActions.loginSuccess({ payload: { ...user, access_token: 'token' } })
    );
    expect(reducer(logged, AuthActions.sessionExpired())).toEqual(initialState);
  });

  it('loadCurrentUserFailure сбрасывает пользователя', () => {
    const logged = reducer(
      initialState,
      AuthActions.loginSuccess({ payload: { ...user, access_token: 'token' } })
    );
    const failed = reducer(logged, AuthActions.loadCurrentUserFailure({ error: 'e' }));
    expect(failed.user).toBeNull();
  });
});
