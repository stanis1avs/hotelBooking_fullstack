import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { selectAuthUser } from '../selectors/auth.selectors';

export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return () => {
    const store = inject(Store);
    const router = inject(Router);

    return store.select(selectAuthUser).pipe(
      take(1),
      map((user) => {
        if (!user) return router.createUrlTree(['/login']);
        if (allowedRoles.includes(user.role ?? '')) return true;
        return router.createUrlTree(['/hotels']);
      })
    );
  };
}
