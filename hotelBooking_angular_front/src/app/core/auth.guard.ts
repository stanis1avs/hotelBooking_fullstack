import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { selectAuthUser } from '../selectors/auth.selectors';
import { AuthToken } from './auth-token';

export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);
  const authToken = inject(AuthToken);

  if (!authToken.getAccessToken()) {
    return router.createUrlTree(['/login']);
  }

  return store.select(selectAuthUser).pipe(
    take(1),
    map((user) => user ? true : router.createUrlTree(['/login']))
  );
};
