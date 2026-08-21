import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  CreateReservationRequestDto, Id, ManagerReservationDto, ManagerStatsDto, ReservationDto,
} from '../core/api';

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

    // Список менеджера отдельно от клиентского: там страницы, здесь весь список
    'Load Manager Reservations': props<{ offset: number; limit: number }>(),
    'Load Manager Reservations Success': props<{ items: ManagerReservationDto[]; total: number }>(),
    'Load Manager Reservations Failure': props<{ error: unknown }>(),

    'Delete Manager Reservation': props<{ reservationId: Id }>(),
    'Delete Manager Reservation Success': props<{ reservationId: Id }>(),
    'Delete Manager Reservation Failure': props<{ error: unknown }>(),

    'Load Manager Stats': props<{ days: number }>(),
    'Load Manager Stats Success': props<{ stats: ManagerStatsDto }>(),
    'Load Manager Stats Failure': props<{ error: unknown }>(),
  },
});
