import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const BookingActions = createActionGroup({
  source: 'Booking',
  events: {
    'Load Bookings': emptyProps(),
  },
});
