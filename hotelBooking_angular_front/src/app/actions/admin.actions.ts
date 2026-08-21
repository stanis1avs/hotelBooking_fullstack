import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { HotelDto, Id, RoomDto } from '../core/api';

/**
 * Управление отелями и номерами.
 *
 * Отдельно от слайса `hotels`: тот обслуживает гостевой поиск и хранит строку
 * запроса с датами. Админке нужен весь фонд без дат и состояние сохранения —
 * складывать это в один слайс значило бы мешать два разных сценария.
 */
export const AdminActions = createActionGroup({
  source: 'Admin',
  events: {
    'Load Hotels': emptyProps(),
    'Load Hotels Success': props<{ items: HotelDto[] }>(),
    'Load Hotels Failure': props<{ error: unknown }>(),

    // FormData, потому что форма возит файл: это единственное, что осталось за REST
    'Save Hotel': props<{ id: Id | null; payload: FormData }>(),
    'Save Hotel Success': props<{ wasEditing: boolean }>(),
    'Save Hotel Failure': props<{ error: unknown }>(),

    'Delete Hotel': props<{ id: Id }>(),
    'Delete Hotel Success': props<{ id: Id }>(),
    'Delete Hotel Failure': props<{ error: unknown }>(),

    'Select Hotel': props<{ id: Id }>(),

    'Load Rooms': props<{ hotelId: Id }>(),
    'Load Rooms Success': props<{ items: RoomDto[] }>(),
    'Load Rooms Failure': props<{ error: unknown }>(),

    'Save Room': props<{ id: Id | null; payload: FormData }>(),
    'Save Room Success': props<{ wasEditing: boolean }>(),
    'Save Room Failure': props<{ error: unknown }>(),

    'Delete Room': props<{ id: Id }>(),
    'Delete Room Success': props<{ id: Id }>(),
    'Delete Room Failure': props<{ error: unknown }>(),
  },
});
