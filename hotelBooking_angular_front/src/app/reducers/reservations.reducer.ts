import { createFeature, createReducer, on } from '@ngrx/store';
import { ReservationsActions } from '../actions/reservations.actions';
import { ReservationDto } from '../core/api';

export const reservationsFeatureKey = 'reservations';

export interface State {
  items: ReservationDto[];
  loading: boolean;
  error: unknown | null;
}

export const initialState: State = {
  items: [],
  loading: false,
  error: null,
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
);

export const reservationsFeature = createFeature({
  name: reservationsFeatureKey,
  reducer,
});
