import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromSupport from '../reducers/support.reducer';

export const selectSupportState = createFeatureSelector<fromSupport.State>(
  fromSupport.supportFeatureKey,
);

export const selectSupportItems = createSelector(selectSupportState, (state) => state.items);
export const selectSupportLoading = createSelector(selectSupportState, (state) => state.loading);
export const selectSupportError = createSelector(selectSupportState, (state) => state.error);
