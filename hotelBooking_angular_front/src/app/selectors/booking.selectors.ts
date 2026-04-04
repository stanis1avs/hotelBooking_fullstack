import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromBooking from '../reducers/booking.reducer';

export const selectBookingState = createFeatureSelector<fromBooking.State>(
  fromBooking.bookingFeatureKey,
);
