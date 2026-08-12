/**
 * Дата в формате ГГГГ-ММ-ДД по ЛОКАЛЬНОМУ времени.
 *
 * Раньше использовался `toISOString().slice(0, 10)`, который возвращает дату в UTC:
 * для пользователя в UTC+3 после 21:00 подставлялся завтрашний день,
 * а в UTC-5 утром — вчерашний. Бронирование уезжало на сутки.
 */
export function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function today(): string {
  return toLocalIsoDate(new Date());
}

export function addDays(days: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return toLocalIsoDate(d);
}

export function nightsBetween(from: string, to: string): number {
  const a = new Date(from);
  const b = new Date(to);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

/** «1 ночь», «3 ночи», «7 ночей» */
export function nightWord(n: number): string {
  const last = n % 10;
  const twoLast = n % 100;
  if (last === 1 && twoLast !== 11) return 'ночь';
  if (last >= 2 && last <= 4 && (twoLast < 12 || twoLast > 14)) return 'ночи';
  return 'ночей';
}

export function plural(n: number, one: string, few: string, many: string): string {
  const last = n % 10;
  const twoLast = n % 100;
  if (last === 1 && twoLast !== 11) return one;
  if (last >= 2 && last <= 4 && (twoLast < 12 || twoLast > 14)) return few;
  return many;
}
