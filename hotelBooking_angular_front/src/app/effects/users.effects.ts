import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, concatMap, map, of } from 'rxjs';
import { UsersActions } from '../actions/users.actions';
import { ApolloService } from '../graphql/apollo.service';

@Injectable()
export class UsersEffects {
  readonly adminLoadUsers$;
  readonly adminCreateUser$;
  readonly managerLoadUsers$;

  constructor(
    private actions$: Actions,
    private apolloService: ApolloService,
  ) {
    this.adminLoadUsers$ = createEffect(() =>
      this.actions$.pipe(
        ofType(UsersActions.adminLoadUsers),
        concatMap(({ payload }: any) =>
          this.apolloService.adminGetUsers(payload).pipe(
            map((users) => UsersActions.adminLoadUsersSuccess({ payload: users })),
            catchError((error: any) => of(UsersActions.adminLoadUsersFailure({ error })))
          )
        )
      )
    );

    this.adminCreateUser$ = createEffect(() =>
      this.actions$.pipe(
        ofType(UsersActions.adminCreateUser),
        concatMap(({ payload }) =>
          this.apolloService.adminCreateUser(payload).pipe(
            map((user) => UsersActions.adminCreateUserSuccess({ payload: user })),
            catchError((error) => of(UsersActions.adminCreateUserFailure({ error })))
          )
        )
      )
    );

    this.managerLoadUsers$ = createEffect(() =>
      this.actions$.pipe(
        ofType(UsersActions.managerLoadUsers),
        concatMap(({ payload }) =>
          this.apolloService.managerGetUsers(payload).pipe(
            map((users) => UsersActions.managerLoadUsersSuccess({ payload: users })),
            catchError((error) => of(UsersActions.managerLoadUsersFailure({ error })))
          )
        )
      )
    );
  }
}
