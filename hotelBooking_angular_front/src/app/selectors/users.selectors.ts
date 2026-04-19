import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromUsers from '../reducers/users.reducer';

export const selectUsersState = createFeatureSelector<fromUsers.State>(fromUsers.usersFeatureKey);

export const selectUsers = createSelector(selectUsersState, (state) => state.users);
export const selectUsersLoading = createSelector(selectUsersState, (state) => state.loading);
export const selectUsersError = createSelector(selectUsersState, (state) => state.error);
export const selectUsersSearchParams = createSelector(selectUsersState, (state) => state.searchParams);

export const selectUsersOffset = createSelector(selectUsersSearchParams, (params) => params.offset);
export const selectUsersLimit = createSelector(selectUsersSearchParams, (params) => params.limit);
export const selectUsersSearchEmail = createSelector(selectUsersSearchParams, (params) => params.email);
export const selectUsersSearchName = createSelector(selectUsersSearchParams, (params) => params.name);
export const selectUsersSearchPhone = createSelector(selectUsersSearchParams, (params) => params.contactPhone);

export const selectHasNextPage = createSelector(selectUsers, selectUsersLimit, (users, limit) => users.length === limit);
export const selectHasPrevPage = createSelector(selectUsersOffset, (offset) => offset > 0);
