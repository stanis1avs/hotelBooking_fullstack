import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromAuth from '../reducers/auth.reducer';

export const selectAuthState = createFeatureSelector<fromAuth.State>(fromAuth.authFeatureKey);

export const selectAuthUser = createSelector(selectAuthState, (state) => state.user);
export const selectAuthAccessToken = createSelector(selectAuthState, (state) => state.accessToken);
export const selectAuthRefreshToken = createSelector(selectAuthState, (state) => state.refreshToken);
export const selectAuthLoading = createSelector(selectAuthState, (state) => state.loading);
export const selectAuthError = createSelector(selectAuthState, (state) => state.error);
