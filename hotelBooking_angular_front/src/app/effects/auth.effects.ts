import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { catchError, concatMap, map, of, tap } from 'rxjs';
import { AuthActions } from '../actions/auth.actions';
import { Api } from '../core/api';
import { AuthToken } from '../core/auth-token';
import { ApolloService } from '../graphql/apollo.service';

@Injectable()
export class AuthEffects {
  readonly login$;
  readonly register$;
  readonly logout$;
  readonly logoutSuccess$;
  readonly loadCurrentUser$;
  readonly refreshToken$;

  constructor(
    private actions$: Actions,
    private api: Api,
    private authToken: AuthToken,
    private apolloService: ApolloService,
    private router: Router,
  ) {
    this.login$ = createEffect(() =>
      this.actions$.pipe(
        ofType(AuthActions.login),
        concatMap(({ payload }) =>
          this.apolloService.login(payload.email, payload.password).pipe(
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
          this.apolloService.register(payload).pipe(
            map((res) => AuthActions.registerSuccess({ payload: res })),
            catchError((error) => of(AuthActions.registerFailure({ error })))
          )
        )
      )
    );

    // Logout stays on Api — backend endpoint is a no-op, just clear tokens locally
    this.logout$ = createEffect(() =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        concatMap(() =>
          this.api.authLogout().pipe(
            tap(() => this.authToken.clear()),
            map(() => AuthActions.logoutSuccess()),
            catchError(() => {
              this.authToken.clear();
              return of(AuthActions.logoutSuccess());
            })
          )
        )
      )
    );

    this.logoutSuccess$ = createEffect(
      () =>
        this.actions$.pipe(
          ofType(AuthActions.logoutSuccess),
          tap(() => this.router.navigateByUrl('/login'))
        ),
      { dispatch: false }
    );

    this.loadCurrentUser$ = createEffect(() =>
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

    this.refreshToken$ = createEffect(() =>
      this.actions$.pipe(
        ofType(AuthActions.refreshToken),
        concatMap(() => {
          const refreshToken = this.authToken.getRefreshToken();
          if (!refreshToken) {
            return of(AuthActions.refreshTokenFailure({ error: 'No refresh token' }));
          }

          return this.apolloService.refreshToken(refreshToken).pipe(
            tap((res) => {
              this.authToken.setAccessToken(res.access_token);
              this.authToken.setRefreshToken(res.refresh_token);
            }),
            map((res) => AuthActions.refreshTokenSuccess({ accessToken: res.access_token })),
            catchError((error) => of(AuthActions.refreshTokenFailure({ error })))
          );
        })
      )
    );
  }
}
