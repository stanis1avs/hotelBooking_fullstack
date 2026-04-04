import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { ReservationsActions } from '../../actions/reservations.actions';
import { selectReservationsItems, selectReservationsLoading } from '../../selectors/reservations.selectors';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-reservations',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './reservations.html',
})
export class Reservations {
  readonly items$;
  readonly loading$;

  constructor(private readonly store: Store) {
    this.items$ = this.store.select(selectReservationsItems);
    this.loading$ = this.store.select(selectReservationsLoading);
    this.store.dispatch(ReservationsActions.loadReservations());
  }

  reload() {
    this.store.dispatch(ReservationsActions.loadReservations());
  }

  deleteReservation(reservationId: string) {
    this.store.dispatch(ReservationsActions.deleteReservation({ reservationId }));
  }
}
