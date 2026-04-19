import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, concatMap, map, of } from 'rxjs';
import { UserDto } from '../core/api';
import { UsersActions } from '../actions/users.actions';
import { Api } from '../core/api';

@Injectable()
export class UsersEffects {
  readonly adminLoadUsers$;
  readonly adminCreateUser$;
  readonly managerLoadUsers$;

  constructor(
    private actions$: Actions,
    private api: Api,
  ) {
    this.adminLoadUsers$ = createEffect(() =>
      this.actions$.pipe(
        ofType(UsersActions.adminLoadUsers),
        concatMap(({ payload }: any) =>
          this.api.adminGetUsers(payload).pipe(
            map((users: UserDto[]) => UsersActions.adminLoadUsersSuccess({ payload: users })),
            catchError((error: any) => of(UsersActions.adminLoadUsersFailure({ error })))
          )
        )
      )
    );

    this.adminCreateUser$ = createEffect(() =>
      this.actions$.pipe(
        ofType(UsersActions.adminCreateUser),
        concatMap(({ payload }) =>
          this.api.adminCreateUser(payload).pipe(
            map((payload) => UsersActions.adminCreateUserSuccess({ payload })),
            catchError((error) => of(UsersActions.adminCreateUserFailure({ error })))
          )
        )
      )
    );

    this.managerLoadUsers$ = createEffect(() =>
      this.actions$.pipe(
        ofType(UsersActions.managerLoadUsers),
        concatMap(({ payload }) =>
          this.api.managerGetUsers(payload).pipe(
            map((payload) => UsersActions.managerLoadUsersSuccess({ payload })),
            catchError((error) => of(UsersActions.managerLoadUsersFailure({ error })))
          )
        )
      )
    );
  }
}
