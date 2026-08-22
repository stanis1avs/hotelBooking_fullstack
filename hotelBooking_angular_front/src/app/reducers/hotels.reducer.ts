import { createFeature, createReducer, on } from '@ngrx/store';
import { HotelsActions } from '../actions/hotels.actions';
import { Amenity, Destination, HotelDto } from '../core/api';

export const hotelsFeatureKey = 'hotels';

export interface State {
  items: HotelDto[];
  /** Всего отелей по текущему фильтру — приходит с сервера вместе со страницей. */
  total: number;
  loading: boolean;
  error: unknown | null;
  offset: number;
  limit: number;
  term: string;
  dateArrival: string;
  dateDeparture: string;
  destinations: Destination[];
  amenities: Amenity[];
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
  total: 0,
  loading: false,
  error: null,
  offset: 0,
  limit: 12,
  term: '',
  destinations: [],
  amenities: [],
  dateArrival: toIsoDate(today),
  dateDeparture: toIsoDate(in7days),
};

export const reducer = createReducer(
  initialState,
  on(HotelsActions.setSearchTerm, (state, { term }) => ({ ...state, term })),
  on(HotelsActions.setDates, (state, { dateArrival, dateDeparture }) => ({ ...state, dateArrival, dateDeparture })),
  on(HotelsActions.setFilters, (state, { destinations, amenities }) => ({ ...state, destinations, amenities })),

  // Смещение и размер страницы держим в сторе: по ним пагинатор
  // восстанавливает своё положение после каждой загрузки.
  on(HotelsActions.loadHotels, (state, { params }) => ({
    ...state,
    loading: true,
    error: null,
    offset: params.offset,
    limit: params.limit ?? state.limit,
  })),
  on(HotelsActions.loadHotelsSuccess, (state, { items, total }) => ({ ...state, loading: false, items, total })),
  on(HotelsActions.loadHotelsFailure, (state, { error }) => ({ ...state, loading: false, error })),
);

export const hotelsFeature = createFeature({
  name: hotelsFeatureKey,
  reducer,
});
