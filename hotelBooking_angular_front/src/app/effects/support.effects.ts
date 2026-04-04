import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { catchError, concatMap, map, of } from 'rxjs';
import { SupportActions } from '../actions/support.actions';
import { Api } from '../core/api';

@Injectable()
export class SupportEffects {
  readonly loadSupportRequests$;

  constructor(private actions$: Actions, private api: Api) {
    this.loadSupportRequests$ = createEffect(() =>
      this.actions$.pipe(
        ofType(SupportActions.loadSupportRequests),
        concatMap(() =>
          this.api.getSupportRequests().pipe(
            map((items) => SupportActions.loadSupportRequestsSuccess({ items })),
            catchError((error) => of(SupportActions.loadSupportRequestsFailure({ error })))
          )
        )
      )
    );
  }
}
