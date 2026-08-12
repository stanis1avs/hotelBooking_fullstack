import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, take, timeout, catchError, of } from 'rxjs';
import { selectAuthState } from '../selectors/auth.selectors';

/**
 * Проверка роли. В отличие от прежней версии не полагается на то, что authGuard
 * уже успел загрузить пользователя, — сама дожидается окончания загрузки,
 * поэтому корректно работает и в одиночку.
 */
export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return () => {
    const store = inject(Store);
    const router = inject(Router);

    return store.select(selectAuthState).pipe(
      filter((state) => !state.loading),
      take(1),
      map((state) => {
        if (!state.user) return router.createUrlTree(['/login']);
        if (allowedRoles.includes(state.user.role ?? '')) return true;
        // Показываем страницу «нет доступа» вместо молчаливого возврата на главную.
        return router.createUrlTree(['/forbidden']);
      }),
      timeout(8000),
      catchError(() => of(router.createUrlTree(['/login'])))
    );
  };
}
