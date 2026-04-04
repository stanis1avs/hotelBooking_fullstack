import { createFeature, createReducer, on } from '@ngrx/store';
import { SupportActions } from '../actions/support.actions';

export const supportFeatureKey = 'support';

export interface State {
  items: unknown[];
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
);

export const supportFeature = createFeature({
  name: supportFeatureKey,
  reducer,
});
