import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { MatSnackBar } from '@angular/material/snack-bar';

import { catchError, concatMap, map, of, tap } from 'rxjs';
import { ReservationsActions } from '../actions/reservations.actions';
import { ApolloService } from '../graphql/apollo.service';

@Injectable()
export class ReservationsEffects {
  readonly loadReservations$;
  readonly createReservation$;
  readonly createReservationSuccess$;
  readonly deleteReservation$;
  readonly deleteReservationSuccess$;
  readonly deleteReservationFailure$;

  constructor(
    private actions$: Actions,
    private apolloService: ApolloService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.loadReservations$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ReservationsActions.loadReservations),
        concatMap(() =>
          this.apolloService.getReservations().pipe(
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
          this.apolloService.createReservation(payload).pipe(
            map((item) => ReservationsActions.createReservationSuccess({ item })),
            catchError((error) => of(ReservationsActions.createReservationFailure({ error })))
          )
        )
      )
    );

    this.createReservationSuccess$ = createEffect(
      () =>
        this.actions$.pipe(
          ofType(ReservationsActions.createReservationSuccess),
          tap(() => {
            this.snackBar.open('Бронирование успешно создано', 'OK', { duration: 3000 });
            this.router.navigateByUrl('/reservations');
          })
        ),
      { dispatch: false }
    );

    this.deleteReservation$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ReservationsActions.deleteReservation),
        concatMap(({ reservationId }) =>
          this.apolloService.deleteReservation(reservationId).pipe(
            map(() => ReservationsActions.deleteReservationSuccess({ reservationId })),
            catchError((error) => of(ReservationsActions.deleteReservationFailure({ error })))
          )
        )
      )
    );

    this.deleteReservationSuccess$ = createEffect(
      () =>
        this.actions$.pipe(
          ofType(ReservationsActions.deleteReservationSuccess),
          tap(() => this.snackBar.open('Бронирование удалено', 'OK', { duration: 3000 }))
        ),
      { dispatch: false }
    );

    this.deleteReservationFailure$ = createEffect(
      () =>
        this.actions$.pipe(
          ofType(ReservationsActions.deleteReservationFailure),
          tap(() => this.snackBar.open('Ошибка удаления бронирования', 'OK', { duration: 3000 }))
        ),
      { dispatch: false }
    );
  }
}
