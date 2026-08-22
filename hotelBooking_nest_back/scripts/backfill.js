/**
 * Заполнение полей, добавленных вместе с новым дизайном.
 *
 * Записи, созданные до этих изменений, не содержат ни города, ни рейтинга,
 * ни цены — карточки отелей будут выглядеть пустыми. Скрипт дописывает
 * недостающие поля, не трогая уже заполненные.
 *
 *   node scripts/backfill.js            структурные значения по умолчанию
 *   node scripts/backfill.js --demo     ещё и правдоподобные демо-данные
 *   node scripts/backfill.js --dry      только показать, что изменится
 *
 * Существующие значения не перезаписываются ни в одном режиме.
 */
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

/** Читаем .env сами, чтобы скрипт не тянул лишних зависимостей. */
function readEnv(key) {
  for (const file of ['.env', '../.env']) {
    const full = path.resolve(__dirname, '..', file);
    if (!fs.existsSync(full)) continue;
    const line = fs
      .readFileSync(full, 'utf8')
      .split(/\r?\n/)
      .find((l) => l.startsWith(`${key}=`));
    if (line) return line.slice(key.length + 1).trim();
  }
  return undefined;
}

const URI = process.env.MONGO_URI || readEnv('MONGO_URI') || 'mongodb://127.0.0.1:27017/nest';
const DB = URI.split('/').pop().split('?')[0] || 'nest';

const demo = process.argv.includes('--demo');
const dry = process.argv.includes('--dry');

const CITIES = [
  'Санкт-Петербург', 'Сочи', 'Москва', 'Казань', 'Калининград',
  'Владивосток', 'Карелия', 'Мурманск', 'Нижний Новгород', 'Суздаль', 'Выборг',
];
const AMENITY_SETS = [
  ['wifi', 'breakfast', 'parking'],
  ['wifi', 'pool', 'spa', 'breakfast'],
  ['wifi', 'parking', 'pets'],
  ['wifi', 'breakfast', 'spa'],
  ['wifi', 'parking', 'breakfast', 'pool'],
];
const ROOM_NAMES = ['Стандарт', 'Улучшенный', 'Полулюкс', 'Люкс', 'Семейный', 'Студия'];
const BEDS = ['Одна двуспальная', 'Две односпальные', 'Двуспальная + диван', 'Две двуспальные'];

/**
 * Направление выводится из города — это единственный признак, по которому
 * его вообще можно определить у существующих записей. У новых отелей
 * направления проставляет администратор в форме.
 */
const DESTINATION_BY_CITY = {
  'Сочи': ['sea'],
  'Калининград': ['sea'],
  'Владивосток': ['sea'],
  'Мурманск': ['sea'],
  'Карелия': ['mountains', 'countryside'],
  'Выборг': ['countryside'],
  'Суздаль': ['countryside'],
  'Москва': ['city'],
  'Санкт-Петербург': ['city'],
  'Казань': ['city'],
  'Нижний Новгород': ['city'],
};

/** Если город назван в самом названии отеля — берём его, а не случайный. */
const CITY_HINTS = [
  [/moscow|москв/i, 'Москва'],
  [/spb|petersburg|петербург|питер/i, 'Санкт-Петербург'],
  [/sochi|сочи/i, 'Сочи'],
  [/kazan|казан/i, 'Казань'],
  [/vladivostok|владивосток/i, 'Владивосток'],
  [/kaliningrad|калининград/i, 'Калининград'],
];
const cityFromTitle = (title) => CITY_HINTS.find(([re]) => re.test(title || ''))?.[1];

/** Детерминированный выбор по идентификатору: повторный запуск даёт тот же результат. */
const pick = (list, id) => {
  const hash = String(id).split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return list[hash % list.length];
};
const num = (id, min, max, salt = 0) => {
  const hash = String(id).split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7 + salt);
  return min + (hash % (max - min + 1));
};

(async () => {
  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db(DB);

  let hotelsTouched = 0;
  let roomsTouched = 0;

  for (const hotel of await db.collection('hotels').find().toArray()) {
    const set = {};
    if (hotel.stars === undefined || hotel.stars === null) set.stars = demo ? num(hotel._id, 3, 5) : 3;
    if (hotel.rating === undefined || hotel.rating === null)
      set.rating = demo ? Number((num(hotel._id, 40, 49, 1) / 10).toFixed(1)) : 0;
    if (hotel.reviewsCount === undefined || hotel.reviewsCount === null)
      set.reviewsCount = demo ? num(hotel._id, 40, 480, 2) : 0;
    if (!hotel.amenities || !hotel.amenities.length)
      set.amenities = demo ? pick(AMENITY_SETS, hotel._id) : [];
    if (!hotel.city && demo) set.city = cityFromTitle(hotel.title) || pick(CITIES, hotel._id);
    // Город берём уже проставленный или тот, что назначили строкой выше
    if (!hotel.destinations || !hotel.destinations.length) {
      set.destinations = DESTINATION_BY_CITY[set.city || hotel.city] || ['city'];
    }

    if (Object.keys(set).length) {
      hotelsTouched++;
      if (dry) console.log(`отель «${hotel.title}» ←`, JSON.stringify(set));
      else await db.collection('hotels').updateOne({ _id: hotel._id }, { $set: set });
    }
  }

  for (const room of await db.collection('rooms').find().toArray()) {
    const set = {};
    if (!room.title) set.title = demo ? pick(ROOM_NAMES, room._id) : 'Номер';
    if (room.price === undefined || room.price === null)
      set.price = demo ? num(room._id, 35, 260, 3) * 100 : 0;
    if (room.size === undefined || room.size === null) set.size = demo ? num(room._id, 18, 56, 4) : 0;
    if (room.guests === undefined || room.guests === null) set.guests = demo ? num(room._id, 2, 4, 5) : 2;
    if (!room.bed) set.bed = demo ? pick(BEDS, room._id) : '';
    if (room.isEnabled === undefined || room.isEnabled === null) set.isEnabled = true;

    if (Object.keys(set).length) {
      roomsTouched++;
      if (dry) console.log(`номер ${room._id} ←`, JSON.stringify(set));
      else await db.collection('rooms').updateOne({ _id: room._id }, { $set: set });
    }
  }

  console.log(
    `\n${dry ? 'Будет обновлено' : 'Обновлено'}: отелей ${hotelsTouched}, номеров ${roomsTouched}` +
      `${demo ? ' (режим --demo)' : ' (значения по умолчанию)'}`
  );
  await client.close();
})().catch((e) => {
  console.error('Ошибка:', e.message);
  process.exit(1);
});
