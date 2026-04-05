import { createFeature, createReducer, on } from '@ngrx/store';
import { SupportActions } from '../actions/support.actions';
import { SupportRequestDto } from '../core/api';

export const supportFeatureKey = 'support';

export interface State {
  items: SupportRequestDto[];
  loading: boolean;
  error: unknown | null;
}

export const initialState: State = {
  items: [],
  loading: false,
  error: null,
};

export const reducer = createReducer(
  initialState,
  on(SupportActions.loadSupportRequests, (state) => ({ ...state, loading: true, error: null })),
  on(SupportActions.loadSupportRequestsSuccess, (state, { items }) => ({ ...state, loading: false, items })),
  on(SupportActions.loadSupportRequestsFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(SupportActions.closeSupportRequest, (state) => ({ ...state, loading: true })),
  on(SupportActions.closeSupportRequestSuccess, (state, { id }) => ({
    ...state,
    loading: false,
    items: state.items.filter((x) => x.id !== id),
  })),
  on(SupportActions.closeSupportRequestFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(SupportActions.createSupportRequest, (state) => ({ ...state, loading: true })),
  on(SupportActions.createSupportRequestSuccess, (state, { item }) => ({
    ...state,
    loading: false,
    items: [...state.items, item],
  })),
  on(SupportActions.createSupportRequestFailure, (state, { error }) => ({ ...state, loading: false, error })),
);

export const supportFeature = createFeature({
  name: supportFeatureKey,
  reducer,
});
