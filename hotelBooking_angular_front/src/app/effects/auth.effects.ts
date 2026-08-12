import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { MatSnackBar } from '@angular/material/snack-bar';

import { catchError, concatMap, map, of, tap } from 'rxjs';
import { AuthActions } from '../actions/auth.actions';
import { AuthToken } from '../core/auth-token';
import { AuthSession } from '../core/auth-session';
import { ApolloService } from '../graphql/apollo.service';
import { errorMessage } from '../core/error-message';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly authToken = inject(AuthToken);
  private readonly session = inject(AuthSession);
  private readonly apolloService = inject(ApolloService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      concatMap(({ payload }) =>
        this.apolloService.login(payload.email, payload.password).pipe(
          // В стор кладём только access-токен; refresh пришёл в httpOnly-cookie.
          tap((res) => this.authToken.setAccessToken(res.access_token)),
          map((res) => AuthActions.loginSuccess({ payload: res })),
          catchError((error) => of(AuthActions.loginFailure({ error })))
        )
      )
    )
  );

  readonly loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ payload }) => {
          const home =
            payload.role === 'admin' ? '/admin/hotels' : payload.role === 'manager' ? '/manager/reservations' : '/hotels';
          this.router.navigateByUrl(home);
        })
      ),
    { dispatch: false }
  );

  readonly loginFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginFailure),
        tap(({ error }) => this.snackBar.open(errorMessage(error, 'Не удалось войти'), 'Понятно', { duration: 5000 }))
      ),
    { dispatch: false }
  );

  readonly register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      concatMap(({ payload }) =>
        this.apolloService.register(payload).pipe(
          map((res) => AuthActions.registerSuccess({ payload: res })),
          catchError((error) => of(AuthActions.registerFailure({ error })))
        )
      )
    )
  );

  /**
   * Переход на страницу входа выполняется здесь, а не в компоненте.
   * Раньше редирект шёл сразу после dispatch — пользователь попадал на /login
   * даже при ошибке и не видел причины.
   */
  readonly registerSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerSuccess),
        tap(() => {
          this.router.navigateByUrl('/login');
          this.snackBar.open('Аккаунт создан. Теперь войдите под своей почтой', 'OK', { duration: 5000 });
        })
      ),
    { dispatch: false }
  );

  readonly registerFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerFailure),
        tap(({ error }) =>
          this.snackBar.open(errorMessage(error, 'Не удалось создать аккаунт'), 'Понятно', { duration: 6000 })
        )
      ),
    { dispatch: false }
  );

  readonly logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      concatMap(() =>
        // Сервер отзывает refresh и чистит cookie; локально в любом случае забываем токен.
        this.session.logout().pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(() => of(AuthActions.logoutSuccess()))
        )
      )
    )
  );

  readonly logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => this.router.navigateByUrl('/login'))
      ),
    { dispatch: false }
  );

  readonly sessionExpired$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.sessionExpired),
        tap(() => {
          this.authToken.clear();
          this.snackBar.open('Сессия истекла — войдите снова', 'OK', { duration: 5000 });
        })
      ),
    { dispatch: false }
  );

  readonly loadCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadCurrentUser),
      concatMap(() =>
        this.apolloService.getCurrentUser().pipe(
          map((payload) => AuthActions.loadCurrentUserSuccess({ payload })),
          catchError((error) => of(AuthActions.loadCurrentUserFailure({ error })))
        )
      )
    )
  );
}
