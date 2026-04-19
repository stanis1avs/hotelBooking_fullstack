import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, filter, map, of, take, timeout } from 'rxjs';
import { AuthActions } from '../actions/auth.actions';
import { selectAuthUser } from '../selectors/auth.selectors';
import { AuthToken } from './auth-token';

export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);
  const authToken = inject(AuthToken);

  if (!authToken.getAccessToken()) {
    return router.createUrlTree(['/login']);
  }

  store.select(selectAuthUser).pipe(take(1)).subscribe((user) => {
    if (!user) store.dispatch(AuthActions.loadCurrentUser());
  });

  return store.select(selectAuthUser).pipe(
    filter((user) => user !== null),
    take(1),
    map(() => true),
    timeout(5000),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
