import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthToken } from './auth-token';
import { AuthActions } from '../actions/auth.actions';
import { AuthSession } from './auth-session';

/** Эндпоинты, к которым токен не прикладывается и 401 не перехватывается. */
const PUBLIC_PATHS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout', '/api/client/register'];

const isPublic = (url: string) => PUBLIC_PATHS.some((p) => url.includes(p));

/** Общий на все параллельные запросы флаг обновления, чтобы не дёргать refresh N раз. */
let refreshing = false;
const refreshed$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authToken = inject(AuthToken);
  const session = inject(AuthSession);
  const store = inject(Store);
  const router = inject(Router);

  const withToken = (r: HttpRequest<unknown>, token: string | null) =>
    token ? r.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : r;

  if (isPublic(req.url)) {
    return next(req);
  }

  return next(withToken(req, authToken.getAccessToken())).pipe(
    catchError((error: unknown) => {
      // Раньше 401 никак не обрабатывался: после истечения токена приложение
      // молча получало ошибки на каждый запрос — пустые списки без объяснений.
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      if (refreshing) {
        return refreshed$.pipe(
          filter((t): t is string => t !== null),
          take(1),
          switchMap((token) => next(withToken(req, token)))
        );
      }

      refreshing = true;
      refreshed$.next(null);

      return session.refresh().pipe(
        switchMap((token) => {
          refreshing = false;
          refreshed$.next(token);
          return next(withToken(req, token));
        }),
        catchError((refreshError: unknown) => {
          refreshing = false;
          authToken.clear();
          store.dispatch(AuthActions.sessionExpired());
          router.navigateByUrl('/login');
          return throwError(() => refreshError);
        })
      ) as Observable<never>;
    })
  );
};
