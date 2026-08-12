import { Amenity } from '../core/api';

/** Иконка и подпись для каждого удобства — единый словарь на все экраны. */
export const AMENITY_META: Record<Amenity, { icon: string; label: string }> = {
  wifi: { icon: 'wifi', label: 'Wi-Fi' },
  parking: { icon: 'local_parking', label: 'Парковка' },
  breakfast: { icon: 'free_breakfast', label: 'Завтрак' },
  pool: { icon: 'pool', label: 'Бассейн' },
  spa: { icon: 'spa', label: 'СПА' },
  pets: { icon: 'pets', label: 'Можно с питомцем' },
};

export const AMENITY_LIST = Object.entries(AMENITY_META).map(([value, meta]) => ({
  value: value as Amenity,
  ...meta,
}));
