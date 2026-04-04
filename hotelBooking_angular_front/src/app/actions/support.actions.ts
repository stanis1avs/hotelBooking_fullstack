import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const SupportActions = createActionGroup({
  source: 'Support',
  events: {
    'Load Support Requests': emptyProps(),
    'Load Support Requests Success': props<{ items: unknown[] }>(),
    'Load Support Requests Failure': props<{ error: unknown }>(),
  },
});
