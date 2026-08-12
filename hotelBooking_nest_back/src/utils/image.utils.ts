import { detectMime } from "./upload.options";

/**
 * Приводит изображение из БД к data-URL для клиента.
 *
 * Прежняя версия перебирала семь вариантов представления и в конце гадала по
 * первому попавшемуся полю объекта — это было следствием того, что формат
 * хранения не был зафиксирован. Сейчас в базу пишется только base64-строка
 * (Hotel.image) или Buffer (Room.images), поэтому веток достаточно двух.
 * Buffer из Mongo может прийти как BSON Binary — его распознаёт `.buffer`.
 *
 * MIME определяется по сигнатуре файла, а не подставляется как image/jpeg:
 * из-за жёсткого значения PNG и WebP отдавались с неверным типом.
 */
export const normalizeImageForClient = (image: unknown): string => {
  if (!image) return "";

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
