import { createFeature, createReducer, on } from '@ngrx/store';
import { ReservationsActions } from '../actions/reservations.actions';
import { ManagerReservationDto, ManagerStatsDto, ReservationDto } from '../core/api';

export const reservationsFeatureKey = 'reservations';

export interface State {
  items: ReservationDto[];
  loading: boolean;
  error: unknown | null;

  /** Раздел менеджера: страницы и сводка дашборда. */
  managerItems: ManagerReservationDto[];
  managerTotal: number;
  managerLoading: boolean;
  offset: number;
  limit: number;
  stats: ManagerStatsDto | null;
}

export const initialState: State = {
  items: [],
  loading: false,
  error: null,
  managerItems: [],
  managerTotal: 0,
  managerLoading: false,
  offset: 0,
  limit: 25,
  stats: null,
};

export const reducer = createReducer(
  initialState,
  on(ReservationsActions.loadReservations, (state) => ({ ...state, loading: true, error: null })),
  on(ReservationsActions.loadReservationsSuccess, (state, { items }) => ({ ...state, loading: false, items })),
  on(ReservationsActions.loadReservationsFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(ReservationsActions.createReservation, (state) => ({ ...state, loading: true, error: null })),
  on(ReservationsActions.createReservationSuccess, (state, { item }) => ({
    ...state,
    loading: false,
    items: [item, ...state.items],
  })),
  on(ReservationsActions.createReservationFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(ReservationsActions.deleteReservation, (state) => ({ ...state, loading: true, error: null })),
  on(ReservationsActions.deleteReservationSuccess, (state, { reservationId }) => ({
    ...state,
    loading: false,
    items: state.items.filter((x) => String(x.id) !== String(reservationId)),
  })),
  on(ReservationsActions.deleteReservationFailure, (state, { error }) => ({ ...state, loading: false, error })),

  // ── Раздел менеджера
  on(ReservationsActions.loadManagerReservations, (state, { offset, limit }) => ({
    ...state,
    managerLoading: true,
    error: null,
    offset,
    limit,
  })),
  on(ReservationsActions.loadManagerReservationsSuccess, (state, { items, total }) => ({
    ...state,
    managerLoading: false,
    managerItems: items,
    managerTotal: total,
  })),
  on(ReservationsActions.loadManagerReservationsFailure, (state, { error }) => ({
    ...state,
    managerLoading: false,
    error,
  })),

  on(ReservationsActions.deleteManagerReservationSuccess, (state, { reservationId }) => ({
    ...state,
    managerItems: state.managerItems.filter((x) => String(x.id) !== String(reservationId)),
    managerTotal: Math.max(0, state.managerTotal - 1),
  })),
  on(ReservationsActions.deleteManagerReservationFailure, (state, { error }) => ({ ...state, error })),

  on(ReservationsActions.loadManagerStatsSuccess, (state, { stats }) => ({ ...state, stats })),
  // Сводка не критична: при ошибке страница остаётся рабочей без плиток
  on(ReservationsActions.loadManagerStatsFailure, (state) => ({ ...state, stats: null })),
);

export const reservationsFeature = createFeature({
  name: reservationsFeatureKey,
  reducer,
});
