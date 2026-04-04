import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromReservations from '../reducers/reservations.reducer';

export const selectReservationsState = createFeatureSelector<fromReservations.State>(
  fromReservations.reservationsFeatureKey,
);

export const selectReservationsItems = createSelector(selectReservationsState, (state) => state.items);
export const selectReservationsLoading = createSelector(selectReservationsState, (state) => state.loading);
export const selectReservationsError = createSelector(selectReservationsState, (state) => state.error);
