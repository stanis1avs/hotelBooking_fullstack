import { FileStorage } from "./file-storage";
import { detectMime } from "./upload.options";

/**
 * Приводит изображение к виду, пригодному для клиента.
 *
 * Основной путь — путь в файловом хранилище: он отдаётся как есть, браузер
 * запрашивает файл по адресу и кэширует его.
 *
 * Ветка с base64 оставлена для записей, созданных до переезда на файлы
 * (см. V-8 в BACKLOG.md) — она позволяет приложению работать до того,
 * как отработает scripts/migrate-images.js.
 */
export const normalizeImageForClient = (image: unknown): string => {
  if (!image) return "";

  // Новый формат: путь вида /uploads/hotels/<hash>.jpg
  if (FileStorage.isStoredPath(image)) return image;

  if (typeof image === "string") {
    return image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;
  }

  const buffer = toBuffer(image);
  if (buffer?.length) {
    return `data:${detectMime(buffer)};base64,${buffer.toString("base64")}`;
  }

  return "";
};

function toBuffer(value: unknown): Buffer | null {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);

  // BSON Binary из драйвера MongoDB хранит данные в поле buffer
  const inner = (value as { buffer?: unknown })?.buffer;
  if (Buffer.isBuffer(inner)) return inner;
  if (inner instanceof Uint8Array) return Buffer.from(inner);

  return null;
}
