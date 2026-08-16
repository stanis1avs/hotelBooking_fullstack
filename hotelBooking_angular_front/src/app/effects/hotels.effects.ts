import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { catchError, map, of, switchMap } from 'rxjs';
import { HotelsActions } from '../actions/hotels.actions';
import { ApolloService } from '../graphql/apollo.service';

@Injectable()
export class HotelsEffects {
  readonly loadHotels$;

  constructor(private actions$: Actions, private apolloService: ApolloService) {
    this.loadHotels$ = createEffect(() =>
      this.actions$.pipe(
        ofType(HotelsActions.loadHotels),
        // switchMap, а не concatMap: поиск уходит по вводу и по смене дат,
        // и нужен результат последнего запроса — промежуточные только мигали выдачей.
        switchMap(({ params }) =>
          this.apolloService.getHotels(params).pipe(
            map((page) => HotelsActions.loadHotelsSuccess({ items: page.items, total: page.total })),
            catchError((error) => of(HotelsActions.loadHotelsFailure({ error })))
          )
        )
      )
    );
  }
}
