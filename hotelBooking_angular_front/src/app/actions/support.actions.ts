import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Id, SupportMessageDto, SupportRequestDto } from '../core/api';

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

    // Выбор обращения и переписка. Раньше это жило в полях компонента,
    // а список и переписка расходились: закрытое обращение оставалось открытым
    // в правой панели, потому что там лежала своя копия объекта.
    'Select Request': props<{ id: Id }>(),
    'Load Messages': props<{ requestId: Id }>(),
    'Load Messages Success': props<{ messages: SupportMessageDto[] }>(),
    'Load Messages Failure': props<{ error: unknown }>(),

    'Send Message': props<{ requestId: Id; text: string }>(),
    'Send Message Success': props<{ message: SupportMessageDto }>(),
    // Текст возвращается в поле ввода, чтобы написанное не пропало
    'Send Message Failure': props<{ error: unknown; text: string }>(),
  },
});
