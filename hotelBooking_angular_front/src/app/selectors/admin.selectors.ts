import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromAdmin from '../reducers/admin.reducer';

export const selectAdminState = createFeatureSelector<fromAdmin.State>(fromAdmin.adminFeatureKey);

export const selectAdminHotels = createSelector(selectAdminState, (s) => s.hotels);
export const selectAdminHotelsLoading = createSelector(selectAdminState, (s) => s.hotelsLoading);
export const selectAdminRooms = createSelector(selectAdminState, (s) => s.rooms);
export const selectAdminRoomsLoading = createSelector(selectAdminState, (s) => s.roomsLoading);
export const selectAdminSelectedHotelId = createSelector(selectAdminState, (s) => s.selectedHotelId);
export const selectAdminSaving = createSelector(selectAdminState, (s) => s.saving);
