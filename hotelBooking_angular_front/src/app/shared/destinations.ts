import { Destination } from '../core/api';

/**
 * Направления поездки — отдельный признак отеля, а не поиск по городу.
 *
 * Раньше кнопка «К морю» подставляла в строку поиска слово «Сочи»: подпись
 * не соответствовала действию, и Сочи был лишь одним из городов у моря.
 * Теперь у отеля есть поле `destinations`, и фильтр работает по нему.
 */
export const DESTINATION_META: Record<Destination, { icon: string; label: string }> = {
  sea: { icon: 'beach_access', label: 'К морю' },
  mountains: { icon: 'landscape', label: 'В горы' },
  city: { icon: 'apartment', label: 'В город' },
  countryside: { icon: 'forest', label: 'За город' },
  ski: { icon: 'downhill_skiing', label: 'На лыжи' },
};

export const DESTINATION_LIST = Object.entries(DESTINATION_META).map(([value, meta]) => ({
  value: value as Destination,
  ...meta,
}));
