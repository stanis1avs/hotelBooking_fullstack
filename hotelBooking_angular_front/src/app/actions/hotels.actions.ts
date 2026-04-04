import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { HotelDto } from '../core/api';

export const HotelsActions = createActionGroup({
  source: 'Hotels',
  events: {
    'Load Hotels': props<{ params: { offset: number; hotel?: string; dateArrival: string; dateDeparture: string } }>(),
    'Load Hotels Success': props<{ items: HotelDto[] }>(),
    'Load Hotels Failure': props<{ error: unknown }>(),

    'Set Search Term': props<{ term: string }>(),
    'Set Dates': props<{ dateArrival: string; dateDeparture: string }>(),
  },
});
