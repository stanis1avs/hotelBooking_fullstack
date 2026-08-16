import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromUsers from '../reducers/users.reducer';

export const selectUsersState = createFeatureSelector<fromUsers.State>(fromUsers.usersFeatureKey);

export const selectUsers = createSelector(selectUsersState, (state) => state.users);
export const selectUsersTotal = createSelector(selectUsersState, (state) => state.total);
export const selectUsersLoading = createSelector(selectUsersState, (state) => state.loading);
export const selectUsersError = createSelector(selectUsersState, (state) => state.error);
export const selectUsersSearchParams = createSelector(selectUsersState, (state) => state.searchParams);

export const selectUsersOffset = createSelector(selectUsersSearchParams, (p) => p.offset);
export const selectUsersLimit = createSelector(selectUsersSearchParams, (p) => p.limit);
export const selectUsersRole = createSelector(selectUsersSearchParams, (p) => p.role ?? 'all');

/** mat-paginator считает страницы с нуля. */
export const selectUsersPageIndex = createSelector(selectUsersOffset, selectUsersLimit, (o, l) => Math.floor(o / l));
