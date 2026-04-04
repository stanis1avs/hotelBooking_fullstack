import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromHotels from '../reducers/hotels.reducer';

export const selectHotelsState = createFeatureSelector<fromHotels.State>(
  fromHotels.hotelsFeatureKey,
);

export const selectHotelsItems = createSelector(selectHotelsState, (state) => state.items);
export const selectHotelsLoading = createSelector(selectHotelsState, (state) => state.loading);
export const selectHotelsError = createSelector(selectHotelsState, (state) => state.error);

export const selectHotelsTerm = createSelector(selectHotelsState, (state) => state.term);
export const selectHotelsDateArrival = createSelector(selectHotelsState, (state) => state.dateArrival);
export const selectHotelsDateDeparture = createSelector(selectHotelsState, (state) => state.dateDeparture);
