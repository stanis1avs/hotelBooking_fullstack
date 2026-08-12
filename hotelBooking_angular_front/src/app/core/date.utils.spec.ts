import { nightWord, nightsBetween, plural, toLocalIsoDate } from './date.utils';

describe('date.utils', () => {
  describe('toLocalIsoDate', () => {
    it('возвращает локальную дату, а не UTC', () => {
      // 23:30 по локальному времени: toISOString() в положительных зонах
      // отдал бы уже следующий день — из-за этого бронь уезжала на сутки.
      const late = new Date(2026, 7, 13, 23, 30, 0);
      expect(toLocalIsoDate(late)).toBe('2026-08-13');
    });

    it('дополняет месяц и день нулями', () => {
      expect(toLocalIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    });
  });

  describe('nightsBetween', () => {
    it('считает количество ночей между датами', () => {
      expect(nightsBetween('2026-08-13', '2026-08-16')).toBe(3);
    });

    it('возвращает минимум одну ночь для совпадающих дат', () => {
      expect(nightsBetween('2026-08-13', '2026-08-13')).toBe(1);
    });
  });

  describe('nightWord', () => {
    it('склоняет по правилам русского языка', () => {
      expect(nightWord(1)).toBe('ночь');
      expect(nightWord(2)).toBe('ночи');
      expect(nightWord(5)).toBe('ночей');
      expect(nightWord(11)).toBe('ночей');
      expect(nightWord(21)).toBe('ночь');
      expect(nightWord(22)).toBe('ночи');
    });
  });

  describe('plural', () => {
    it('выбирает форму по числу', () => {
      expect(plural(1, 'отель', 'отеля', 'отелей')).toBe('отель');
      expect(plural(3, 'отель', 'отеля', 'отелей')).toBe('отеля');
      expect(plural(12, 'отель', 'отеля', 'отелей')).toBe('отелей');
    });
  });
});
