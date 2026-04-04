import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromRooms from '../reducers/rooms.reducer';

export const selectRoomsState = createFeatureSelector<fromRooms.State>(fromRooms.roomsFeatureKey);

export const selectRoomsItems = createSelector(selectRoomsState, (state) => state.items);
export const selectRoomsLoading = createSelector(selectRoomsState, (state) => state.loading);
export const selectRoomsError = createSelector(selectRoomsState, (state) => state.error);
export const selectRoomsHotelId = createSelector(selectRoomsState, (state) => state.hotelId);
