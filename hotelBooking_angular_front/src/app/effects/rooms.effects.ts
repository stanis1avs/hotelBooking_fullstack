import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { catchError, concatMap, map, of } from 'rxjs';
import { RoomsActions } from '../actions/rooms.actions';
import { ApolloService } from '../graphql/apollo.service';

@Injectable()
export class RoomsEffects {
  readonly loadRooms$;

  constructor(private actions$: Actions, private apolloService: ApolloService) {
    this.loadRooms$ = createEffect(() =>
      this.actions$.pipe(
        ofType(RoomsActions.loadRooms),
        concatMap(({ hotelId }) =>
          this.apolloService.getRooms({ hotel: hotelId }).pipe(
            map((items) => RoomsActions.loadRoomsSuccess({ items })),
            catchError((error) => of(RoomsActions.loadRoomsFailure({ error })))
          )
        )
      )
    );
  }
}
