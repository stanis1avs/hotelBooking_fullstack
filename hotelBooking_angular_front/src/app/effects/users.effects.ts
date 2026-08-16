import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { UsersActions } from '../actions/users.actions';
import { ApolloService } from '../graphql/apollo.service';

@Injectable()
export class UsersEffects {
  private readonly actions$ = inject(Actions);
  private readonly apolloService = inject(ApolloService);

  // switchMap, а не concatMap: при быстром вводе в поиск нужен результат
  // последнего запроса, промежуточные можно отбросить.
  readonly adminLoadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.adminLoadUsers),
      switchMap(({ payload }) =>
        this.apolloService.adminGetUsers(payload).pipe(
          map((users) => UsersActions.adminLoadUsersSuccess({ payload: users })),
          catchError((error) => of(UsersActions.adminLoadUsersFailure({ error })))
        )
      )
    )
  );

  readonly managerLoadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.managerLoadUsers),
      switchMap(({ payload }) =>
        this.apolloService.managerGetUsers(payload).pipe(
          map((users) => UsersActions.managerLoadUsersSuccess({ payload: users })),
          catchError((error) => of(UsersActions.managerLoadUsersFailure({ error })))
        )
      )
    )
  );

  readonly adminUpdateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.adminUpdateUser),
      switchMap(({ id, payload }) =>
        this.apolloService.adminUpdateUser(id, payload).pipe(
          map((user) => UsersActions.adminUpdateUserSuccess({ payload: user })),
          catchError((error) => of(UsersActions.adminUpdateUserFailure({ error })))
        )
      )
    )
  );

  readonly adminCreateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.adminCreateUser),
      switchMap(({ payload }) =>
        this.apolloService.adminCreateUser(payload).pipe(
          map((user) => UsersActions.adminCreateUserSuccess({ payload: user })),
          catchError((error) => of(UsersActions.adminCreateUserFailure({ error })))
        )
      )
    )
  );
}
