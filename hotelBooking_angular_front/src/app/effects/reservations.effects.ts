import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { catchError, concatMap, map, of } from 'rxjs';
import { ReservationsActions } from '../actions/reservations.actions';
import { Api } from '../core/api';

@Injectable()
export class ReservationsEffects {
  readonly loadReservations$;
  readonly createReservation$;
  readonly deleteReservation$;

  constructor(private actions$: Actions, private api: Api) {
    this.loadReservations$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ReservationsActions.loadReservations),
        concatMap(() =>
          this.api.getReservations().pipe(
            map((items) => ReservationsActions.loadReservationsSuccess({ items })),
            catchError((error) => of(ReservationsActions.loadReservationsFailure({ error })))
          )
        )
      )
    );

    this.createReservation$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ReservationsActions.createReservation),
        concatMap(({ payload }) =>
          this.api.createReservation(payload).pipe(
            map((item) => ReservationsActions.createReservationSuccess({ item })),
            catchError((error) => of(ReservationsActions.createReservationFailure({ error })))
          )
        )
      )
    );

    this.deleteReservation$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ReservationsActions.deleteReservation),
        concatMap(({ reservationId }) =>
          this.api.deleteReservation(reservationId).pipe(
            map(() => ReservationsActions.deleteReservationSuccess({ reservationId })),
            catchError((error) => of(ReservationsActions.deleteReservationFailure({ error })))
          )
        )
      )
    );
  }
}
