import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

import { ReservationsActions } from '../../actions/reservations.actions';
import { selectReservationsItems, selectReservationsLoading } from '../../selectors/reservations.selectors';
import { EmptyState } from '../../shared/empty-state';
import { confirmAction } from '../../shared/confirm-dialog';
import { nightWord, nightsBetween } from '../../core/date.utils';

@Component({
  selector: 'app-reservations',
  imports: [
    AsyncPipe, DatePipe, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule, EmptyState,
  ],
  templateUrl: './reservations.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reservations implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);

  readonly items$ = this.store.select(selectReservationsItems);
  readonly loading$ = this.store.select(selectReservationsLoading);

  ngOnInit(): void {
    this.store.dispatch(ReservationsActions.loadReservations());
  }

  reload(): void {
    this.store.dispatch(ReservationsActions.loadReservations());
  }

  nights(from: string, to: string): string {
    const n = nightsBetween(from, to);
    return `${n} ${nightWord(n)}`;
  }

  /** Раньше бронь удалялась по одному клику без подтверждения. */
  deleteReservation(reservationId: string, hotel: string): void {
    confirmAction(this.dialog, {
      title: 'Отменить бронирование?',
      message: `Бронь в «${hotel}» будет отменена, номер вернётся в продажу. Деньги возвращаются в течение 5 рабочих дней.`,
      confirmLabel: 'Отменить бронь',
      cancelLabel: 'Оставить',
      destructive: true,
    }).subscribe((confirmed) => {
      if (confirmed) this.store.dispatch(ReservationsActions.deleteReservation({ reservationId }));
    });
  }
}
