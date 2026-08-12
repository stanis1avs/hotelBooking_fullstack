import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromAuth from '../reducers/auth.reducer';

export const selectAuthState = createFeatureSelector<fromAuth.State>(fromAuth.authFeatureKey);

export const selectAuthUser = createSelector(selectAuthState, (state) => state.user);
export const selectAuthLoading = createSelector(selectAuthState, (state) => state.loading);
export const selectAuthError = createSelector(selectAuthState, (state) => state.error);
export const selectAuthRegistered = createSelector(selectAuthState, (state) => state.registered);
export const selectAuthRole = createSelector(selectAuthUser, (user) => user?.role ?? null);
export const selectIsAuthenticated = createSelector(selectAuthUser, (user) => user !== null);
