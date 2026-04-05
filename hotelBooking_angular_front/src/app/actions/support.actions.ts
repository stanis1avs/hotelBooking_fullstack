import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Id, SupportRequestDto } from '../core/api';

export const SupportActions = createActionGroup({
  source: 'Support',
  events: {
    'Load Support Requests': emptyProps(),
    'Load Support Requests Success': props<{ items: SupportRequestDto[] }>(),
    'Load Support Requests Failure': props<{ error: unknown }>(),

    'Close Support Request': props<{ id: Id }>(),
    'Close Support Request Success': props<{ id: Id }>(),
    'Close Support Request Failure': props<{ error: unknown }>(),

    'Create Support Request': props<{ text: string }>(),
    'Create Support Request Success': props<{ item: SupportRequestDto }>(),
    'Create Support Request Failure': props<{ error: unknown }>(),
  },
});
