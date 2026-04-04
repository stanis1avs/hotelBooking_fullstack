import { createFeature, createReducer, on } from '@ngrx/store';
import { HotelsActions } from '../actions/hotels.actions';
import { HotelDto } from '../core/api';

export const hotelsFeatureKey = 'hotels';

export interface State {
  items: HotelDto[];
  loading: boolean;
  error: unknown | null;
  offset: number;
  term: string;
  dateArrival: string;
  dateDeparture: string;
}

function toIsoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const today = new Date();
const in7days = new Date(today);
in7days.setDate(today.getDate() + 7);

export const initialState: State = {
  items: [],
  loading: false,
  error: null,
  offset: 0,
  term: '',
  dateArrival: toIsoDate(today),
  dateDeparture: toIsoDate(in7days),
};

export const reducer = createReducer(
  initialState,
  on(HotelsActions.setSearchTerm, (state, { term }) => ({ ...state, term })),
  on(HotelsActions.setDates, (state, { dateArrival, dateDeparture }) => ({ ...state, dateArrival, dateDeparture })),

  on(HotelsActions.loadHotels, (state) => ({ ...state, loading: true, error: null })),
  on(HotelsActions.loadHotelsSuccess, (state, { items }) => ({ ...state, loading: false, items })),
  on(HotelsActions.loadHotelsFailure, (state, { error }) => ({ ...state, loading: false, error })),
);

export const hotelsFeature = createFeature({
  name: hotelsFeatureKey,
  reducer,
});
