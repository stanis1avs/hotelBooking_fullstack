import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { CreateReservationRequestDto, Id, ReservationDto } from '../core/api';

export const ReservationsActions = createActionGroup({
  source: 'Reservations',
  events: {
    'Load Reservations': emptyProps(),
    'Load Reservations Success': props<{ items: ReservationDto[] }>(),
    'Load Reservations Failure': props<{ error: unknown }>(),

    'Create Reservation': props<{ payload: CreateReservationRequestDto }>(),
    'Create Reservation Success': props<{ item: ReservationDto }>(),
    'Create Reservation Failure': props<{ error: unknown }>(),

    'Delete Reservation': props<{ reservationId: Id }>(),
    'Delete Reservation Success': props<{ reservationId: Id }>(),
    'Delete Reservation Failure': props<{ error: unknown }>(),
  },
});
