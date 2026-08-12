import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, catchError, filter, map, of, switchMap, take, timeout } from 'rxjs';
import { AuthActions } from '../actions/auth.actions';
import { selectAuthState } from '../selectors/auth.selectors';

/**
 * Пускает дальше только когда пользователь загружен.
 * Сессия к этому моменту уже восстановлена в APP_INITIALIZER, поэтому здесь
 * достаточно дождаться данных пользователя или уйти на страницу входа.
 */
export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectAuthState).pipe(
    take(1),
    switchMap((state): Observable<boolean | ReturnType<Router['createUrlTree']>> => {
      if (state.user) return of(true);

      store.dispatch(AuthActions.loadCurrentUser());

      return store.select(selectAuthState).pipe(
        filter((s) => !s.loading),
        take(1),
        map((s) => (s.user ? true : router.createUrlTree(['/login']))),
        timeout(8000),
        catchError(() => of(router.createUrlTree(['/login'])))
      );
    })
  );
};
