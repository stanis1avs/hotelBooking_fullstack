import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, concatMap, map, of, switchMap, take } from 'rxjs';
import { SupportActions } from '../actions/support.actions';
import { Api } from '../core/api';
import { selectAuthUser } from '../selectors/auth.selectors';

@Injectable()
export class SupportEffects {
  readonly loadSupportRequests$;
  readonly closeSupportRequest$;
  readonly createSupportRequest$;

  constructor(private actions$: Actions, private api: Api, private store: Store) {
    this.loadSupportRequests$ = createEffect(() =>
      this.actions$.pipe(
        ofType(SupportActions.loadSupportRequests),
        switchMap(() =>
          this.store.select(selectAuthUser).pipe(
            take(1),
            concatMap((user) => {
              const call$ = user?.role === 'manager'
                ? this.api.getManagerSupportRequests()
                : this.api.getClientSupportRequests();
              return call$.pipe(
                map((items) => SupportActions.loadSupportRequestsSuccess({ items })),
                catchError((error) => of(SupportActions.loadSupportRequestsFailure({ error })))
              );
            })
          )
        )
      )
    );

    this.closeSupportRequest$ = createEffect(() =>
      this.actions$.pipe(
        ofType(SupportActions.closeSupportRequest),
        concatMap(({ id }) =>
          this.api.closeSupportRequest(id).pipe(
            map(() => SupportActions.closeSupportRequestSuccess({ id })),
            catchError((error) => of(SupportActions.closeSupportRequestFailure({ error })))
          )
        )
      )
    );

    this.createSupportRequest$ = createEffect(() =>
      this.actions$.pipe(
        ofType(SupportActions.createSupportRequest),
        concatMap(({ text }) =>
          this.api.createSupportRequest(text).pipe(
            map((item) => SupportActions.createSupportRequestSuccess({ item })),
            catchError((error) => of(SupportActions.createSupportRequestFailure({ error })))
          )
        )
      )
    );
  }
}
