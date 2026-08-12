import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, map } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { RoomsActions } from '../../actions/rooms.actions';
import { selectRoomsItems, selectRoomsLoading } from '../../selectors/rooms.selectors';
import { selectAuthUser } from '../../selectors/auth.selectors';
import { ReservationsActions } from '../../actions/reservations.actions';
import { EmptyState } from '../../shared/empty-state';
import { addDays, nightWord, nightsBetween, toLocalIsoDate } from '../../core/date.utils';

@Component({
  selector: 'app-hotel-details',
  imports: [
    AsyncPipe, RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatProgressBarModule, MatFormFieldModule, MatDatepickerModule, EmptyState,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './hotel-details.html',
  styleUrl: './hotel-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);
  private readonly snackBar = inject(MatSnackBar);

  readonly items$ = this.store.select(selectRoomsItems);
  readonly loading$ = this.store.select(selectRoomsLoading);
  readonly user$ = this.store.select(selectAuthUser);
  readonly isClient$ = this.user$.pipe(map((u) => u?.role === 'client'));

  readonly minDate = new Date();

  readonly range = new FormGroup({
    start: new FormControl<Date | null>(new Date(), Validators.required),
    end: new FormControl<Date | null>(new Date(Date.now() + 2 * 86_400_000), Validators.required),
  });

  readonly nights$ = this.range.valueChanges.pipe(
    map(({ start, end }) => {
      if (!start || !end) return null;
      const n = nightsBetween(toLocalIsoDate(start), toLocalIsoDate(end));
      return `${n} ${nightWord(n)}`;
    })
  );

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((p) => p.get('hotelId')),
        distinctUntilChanged(),
        takeUntilDestroyed()
      )
      .subscribe((hotelId) => {
        if (hotelId) this.store.dispatch(RoomsActions.loadRooms({ hotelId }));
      });
  }

  book(roomId: string): void {
    if (this.range.invalid) {
      this.range.markAllAsTouched();
      this.snackBar.open('Выберите даты заезда и выезда', 'OK', { duration: 4000 });
      return;
    }

    const start = this.range.controls.start.value!;
    const end = this.range.controls.end.value!;
    const dateStart = toLocalIsoDate(start);
    const dateEnd = toLocalIsoDate(end) === dateStart ? addDays(1, start) : toLocalIsoDate(end);

    this.store.dispatch(ReservationsActions.createReservation({ payload: { roomId, dateStart, dateEnd } }));
  }
}
