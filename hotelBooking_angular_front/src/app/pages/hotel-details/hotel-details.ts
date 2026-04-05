import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, distinctUntilChanged } from 'rxjs';
import { RoomsActions } from '../../actions/rooms.actions';
import { selectRoomsItems, selectRoomsLoading } from '../../selectors/rooms.selectors';
import { selectAuthUser } from '../../selectors/auth.selectors';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReservationsActions } from '../../actions/reservations.actions';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-hotel-details',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './hotel-details.html',
})
export class HotelDetails {
  readonly hotelId$;
  readonly items$;
  readonly loading$;
  readonly user$;

  readonly form = new FormGroup({
    dateStart: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    dateEnd: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor(private readonly route: ActivatedRoute, private readonly store: Store) {
    this.hotelId$ = this.route.paramMap.pipe(
      map((p) => p.get('hotelId')),
      distinctUntilChanged(),
    );

    this.items$ = this.store.select(selectRoomsItems);
    this.loading$ = this.store.select(selectRoomsLoading);
    this.user$ = this.store.select(selectAuthUser);

    const today = new Date();
    const end = new Date();
    end.setDate(today.getDate() + 7);
    this.form.patchValue({
      dateStart: today.toISOString().slice(0, 10),
      dateEnd: end.toISOString().slice(0, 10),
    });

    this.hotelId$.subscribe((hotelId) => {
      if (!hotelId) {
        return;
      }
      this.store.dispatch(RoomsActions.loadRooms({ hotelId }));
    });
  }

  book(roomId: string) {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.store.dispatch(
      ReservationsActions.createReservation({
        payload: {
          roomId,
          dateStart: this.form.controls.dateStart.value,
          dateEnd: this.form.controls.dateEnd.value,
        },
      })
    );
  }
}
