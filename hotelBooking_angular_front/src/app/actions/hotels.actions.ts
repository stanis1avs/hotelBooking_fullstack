import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Amenity, Destination, HotelDto } from '../core/api';

export const HotelsActions = createActionGroup({
  source: 'Hotels',
  events: {
    'Load Hotels': props<{
      params: {
        offset: number;
        limit?: number;
        hotel?: string;
        dateArrival: string;
        dateDeparture: string;
        destinations?: Destination[];
        amenities?: Amenity[];
      };
    }>(),
    'Load Hotels Success': props<{ items: HotelDto[]; total: number }>(),
    'Load Hotels Failure': props<{ error: unknown }>(),

    'Set Search Term': props<{ term: string }>(),
    'Set Dates': props<{ dateArrival: string; dateDeparture: string }>(),
    // Выбранные подборки живут в сторе: они часть условий поиска, а не вида
    'Set Filters': props<{ destinations: Destination[]; amenities: Amenity[] }>(),
  },
});
