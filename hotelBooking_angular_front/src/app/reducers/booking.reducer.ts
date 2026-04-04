import { createFeature, createReducer, on } from '@ngrx/store';
import { BookingActions } from '../actions/booking.actions';

export const bookingFeatureKey = 'booking';

export interface State {}

export const initialState: State = {};

export const reducer = createReducer(
  initialState,
  on(BookingActions.loadBookings, (state) => state),
);

export const bookingFeature = createFeature({
  name: bookingFeatureKey,
  reducer,
});
