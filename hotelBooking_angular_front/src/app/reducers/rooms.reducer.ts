import { createFeature, createReducer, on } from '@ngrx/store';
import { RoomsActions } from '../actions/rooms.actions';
import { Id, RoomDto } from '../core/api';

export const roomsFeatureKey = 'rooms';

export interface State {
  hotelId: Id | null;
  items: RoomDto[];
  loading: boolean;
  error: unknown | null;
}

export const initialState: State = {
  hotelId: null,
  items: [],
  loading: false,
  error: null,
};

export const reducer = createReducer(
  initialState,
  on(RoomsActions.loadRooms, (state, { hotelId }) => ({ ...state, hotelId, loading: true, error: null })),
  on(RoomsActions.loadRoomsSuccess, (state, { items }) => ({ ...state, loading: false, items })),
  on(RoomsActions.loadRoomsFailure, (state, { error }) => ({ ...state, loading: false, error })),
);

export const roomsFeature = createFeature({
  name: roomsFeatureKey,
  reducer,
});
