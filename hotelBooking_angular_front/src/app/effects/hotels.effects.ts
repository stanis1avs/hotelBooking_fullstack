import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { catchError, concatMap, map, of } from 'rxjs';
import { HotelsActions } from '../actions/hotels.actions';
import { ApolloService } from '../graphql/apollo.service';

@Injectable()
export class HotelsEffects {
  readonly loadHotels$;

  constructor(private actions$: Actions, private apolloService: ApolloService) {
    this.loadHotels$ = createEffect(() =>
      this.actions$.pipe(
        ofType(HotelsActions.loadHotels),
        concatMap(({ params }) =>
          this.apolloService.getHotels(params).pipe(
            map((items) => HotelsActions.loadHotelsSuccess({ items })),
            catchError((error) => of(HotelsActions.loadHotelsFailure({ error })))
          )
        )
      )
    );
  }
}
