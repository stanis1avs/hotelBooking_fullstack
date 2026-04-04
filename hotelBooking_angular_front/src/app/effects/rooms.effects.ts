import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { catchError, concatMap, map, of } from 'rxjs';
import { RoomsActions } from '../actions/rooms.actions';
import { Api } from '../core/api';

@Injectable()
export class RoomsEffects {
  readonly loadRooms$;

  constructor(private actions$: Actions, private api: Api) {
    this.loadRooms$ = createEffect(() =>
      this.actions$.pipe(
        ofType(RoomsActions.loadRooms),
        concatMap(({ hotelId }) =>
          this.api.getRooms({ hotel: hotelId }).pipe(
            map((items) => RoomsActions.loadRoomsSuccess({ items })),
            catchError((error) => of(RoomsActions.loadRoomsFailure({ error })))
          )
        )
      )
    );
  }
}
