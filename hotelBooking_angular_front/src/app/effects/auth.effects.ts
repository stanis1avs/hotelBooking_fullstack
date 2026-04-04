import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { catchError, concatMap, map, of, tap } from 'rxjs';
import { AuthActions } from '../actions/auth.actions';
import { Api } from '../core/api';
import { AuthToken } from '../core/auth-token';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthEffects {
  readonly login$;
  readonly register$;
  readonly logout$;
  readonly refreshToken$;

  constructor(
    private actions$: Actions,
    private api: Api,
    private authToken: AuthToken,
    private http: HttpClient,
  ) {
    this.login$ = createEffect(() =>
      this.actions$.pipe(
        ofType(AuthActions.login),
        concatMap(({ payload }) =>
          this.api.authLogin(payload).pipe(
            tap((res) => {
              this.authToken.setAccessToken(res.access_token);
              this.authToken.setRefreshToken(res.refresh_token);
            }),
            map((res) => AuthActions.loginSuccess({ payload: res })),
            catchError((error) => of(AuthActions.loginFailure({ error })))
          )
        )
      )
    );

    this.register$ = createEffect(() =>
      this.actions$.pipe(
        ofType(AuthActions.register),
        concatMap(({ payload }) =>
          this.api.register(payload).pipe(
            map((res) => AuthActions.registerSuccess({ payload: res })),
            catchError((error) => of(AuthActions.registerFailure({ error })))
          )
        )
      )
    );

    this.logout$ = createEffect(() =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        concatMap(() =>
          this.api.authLogout().pipe(
            tap(() => this.authToken.clear()),
            map(() => AuthActions.logoutSuccess()),
            catchError((error) => of(AuthActions.logoutFailure({ error })))
          )
        )
      )
    );

    this.refreshToken$ = createEffect(() =>
      this.actions$.pipe(
        ofType(AuthActions.refreshToken),
        concatMap(() => {
          const refreshToken = this.authToken.getRefreshToken();
          if (!refreshToken) {
            return of(AuthActions.refreshTokenFailure({ error: 'No refresh token' }));
          }

          return this.http
            .post<{ access_token: string }>(
              `${environment.api.host}/api/auth/refresh`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${refreshToken}`,
                },
              }
            )
            .pipe(
              tap((res) => this.authToken.setAccessToken(res.access_token)),
              map((res) => AuthActions.refreshTokenSuccess({ accessToken: res.access_token })),
              catchError((error) => of(AuthActions.refreshTokenFailure({ error })))
            );
        })
      )
    );
  }
}
