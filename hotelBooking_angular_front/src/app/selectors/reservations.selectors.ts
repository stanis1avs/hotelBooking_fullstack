import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromReservations from '../reducers/reservations.reducer';

export const selectReservationsState = createFeatureSelector<fromReservations.State>(
  fromReservations.reservationsFeatureKey,
);

export const selectReservationsItems = createSelector(selectReservationsState, (state) => state.items);
export const selectReservationsLoading = createSelector(selectReservationsState, (state) => state.loading);
export const selectReservationsError = createSelector(selectReservationsState, (state) => state.error);

// ── Раздел менеджера
export const selectManagerReservations = createSelector(selectReservationsState, (s) => s.managerItems);
export const selectManagerTotal = createSelector(selectReservationsState, (s) => s.managerTotal);
export const selectManagerLoading = createSelector(selectReservationsState, (s) => s.managerLoading);
export const selectManagerStats = createSelector(selectReservationsState, (s) => s.stats);
export const selectManagerLimit = createSelector(selectReservationsState, (s) => s.limit);
/** mat-paginator считает страницы с нуля. */
export const selectManagerPageIndex = createSelector(selectReservationsState, (s) =>
  Math.floor(s.offset / s.limit),
);
