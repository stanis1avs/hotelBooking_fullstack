/**
 * Перенос изображений из документов Mongo в файловое хранилище.
 *
 * До этого картинка лежала прямо в записи строкой base64: одна фотография
 * отеля занимала около 2,4 МБ при лимите документа 16 МБ, список отелей
 * тянул все изображения в каждом ответе, а браузер не мог их кэшировать.
 *
 *   node scripts/migrate-images.js --dry   показать, что будет перенесено
 *   node scripts/migrate-images.js         выполнить перенос
 *
 * Скрипт идемпотентен: записи, где уже стоит путь /uploads/..., пропускаются.
 * Имя файла — хэш содержимого, поэтому одинаковые картинки не дублируются.
 */
const { MongoClient } = require('mongodb');
const { createHash } = require('crypto');
const fs = require('fs');
const path = require('path');

function readEnv(key) {
  for (const file of ['.env', '../.env']) {
    const full = path.resolve(__dirname, '..', file);
    if (!fs.existsSync(full)) continue;
    const line = fs.readFileSync(full, 'utf8').split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
    if (line) return line.slice(key.length + 1).trim();
  }
  return undefined;
}

const URI = process.env.MONGO_URI || readEnv('MONGO_URI') || 'mongodb://127.0.0.1:27017/nest';
const DB = URI.split('/').pop().split('?')[0] || 'nest';
const ROOT = path.resolve(__dirname, '..', 'uploads');
const dry = process.argv.includes('--dry');

const SIGNATURES = [
  { ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { ext: 'webp', test: (b) => b.slice(0, 4).toString('ascii') === 'RIFF' && b.slice(8, 12).toString('ascii') === 'WEBP' },
];

/** Значение в базе может быть base64-строкой, Buffer или BSON Binary. */
function toBuffer(value) {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value;
  if (value.buffer && Buffer.isBuffer(value.buffer)) return value.buffer;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === 'string') {
    if (value.startsWith('/uploads/')) return null; // уже перенесено
    const clean = value.startsWith('data:') ? value.slice(value.indexOf(',') + 1) : value;
    try {
      return Buffer.from(clean, 'base64');
    } catch {
      return null;
    }
  }
  return null;
}

function store(buffer, folder) {
  const ext = SIGNATURES.find((s) => s.test(buffer))?.ext ?? 'jpg';
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 32);
  const name = `${hash}.${ext}`;
  const dir = path.join(ROOT, folder);
  const full = path.join(dir, name);
  if (!dry) {
    fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(full)) fs.writeFileSync(full, buffer);
  }
  return { url: `/uploads/${folder}/${name}`, bytes: buffer.length };
}

(async () => {
  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db(DB);

  let hotels = 0;
  let rooms = 0;
  let images = 0;
  let freed = 0;

  for (const hotel of await db.collection('hotels').find().toArray()) {
    const buffer = toBuffer(hotel.image);
    if (!buffer) continue;
    const { url, bytes } = store(buffer, 'hotels');
    freed += String(hotel.image).length;
    images++;
    hotels++;
    console.log(`отель «${hotel.title}» → ${url} (${Math.round(bytes / 1024)} КБ)`);
    if (!dry) await db.collection('hotels').updateOne({ _id: hotel._id }, { $set: { image: url } });
  }

  for (const room of await db.collection('rooms').find().toArray()) {
    const source = Array.isArray(room.images) ? room.images : [];
    const migrated = [];
    let touched = false;

    for (const item of source) {
      const buffer = toBuffer(item);
      if (!buffer) {
        // Уже путь — оставляем как есть
        if (typeof item === 'string' && item.startsWith('/uploads/')) migrated.push(item);
        continue;
      }
      const { url } = store(buffer, 'rooms');
      freed += typeof item === 'string' ? item.length : buffer.length;
      migrated.push(url);
      images++;
      touched = true;
    }

    if (touched) {
      rooms++;
      console.log(`номер ${room._id} → ${migrated.length} файл(ов)`);
      if (!dry) await db.collection('rooms').updateOne({ _id: room._id }, { $set: { images: migrated } });
    }
  }

  console.log(
    `\n${dry ? 'Будет перенесено' : 'Перенесено'}: изображений ${images} ` +
      `(отелей ${hotels}, номеров ${rooms}). Освобождается в документах примерно ` +
      `${Math.round(freed / 1024 / 1024)} МБ.`
  );
  if (dry) console.log('Это пробный запуск, база и диск не изменялись.');

  await client.close();
})().catch((e) => {
  console.error('Ошибка:', e.message);
  process.exit(1);
});
