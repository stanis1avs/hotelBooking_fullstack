import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromSupport from '../reducers/support.reducer';

export const selectSupportState = createFeatureSelector<fromSupport.State>(
  fromSupport.supportFeatureKey,
);

export const selectSupportItems = createSelector(selectSupportState, (state) => state.items);
export const selectSupportLoading = createSelector(selectSupportState, (state) => state.loading);
export const selectSupportError = createSelector(selectSupportState, (state) => state.error);

export const selectSupportSelectedId = createSelector(selectSupportState, (state) => state.selectedId);
export const selectSupportMessages = createSelector(selectSupportState, (state) => state.messages);
export const selectMessagesLoading = createSelector(selectSupportState, (state) => state.messagesLoading);

/** Само обращение достаётся из списка по идентификатору — одна копия на всё. */
export const selectSelectedRequest = createSelector(
  selectSupportItems,
  selectSupportState,
  (items, state) => items.find((i) => i.id === state.selectedId) ?? null,
);
