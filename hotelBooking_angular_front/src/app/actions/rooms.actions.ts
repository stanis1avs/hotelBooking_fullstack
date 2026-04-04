import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Id, RoomDto } from '../core/api';

export const RoomsActions = createActionGroup({
  source: 'Rooms',
  events: {
    'Load Rooms': props<{ hotelId: Id }>(),
    'Load Rooms Success': props<{ items: RoomDto[] }>(),
    'Load Rooms Failure': props<{ error: unknown }>(),
  },
});
