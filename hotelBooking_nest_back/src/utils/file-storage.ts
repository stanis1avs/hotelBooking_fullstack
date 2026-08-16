import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";
import { promises as fs } from "fs";
import { join } from "path";
import { detectMime } from "./upload.options";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Публичный префикс: по нему отдаются файлы и по нему же они узнаются в БД. */
export const UPLOADS_URL_PREFIX = "/uploads";

/**
 * Хранение изображений в файлах вместо base64 внутри документов Mongo.
 *
 * Раньше картинка лежала прямо в записи: одна фотография отеля занимала
 * около 2,4 МБ в виде base64 при лимите документа 16 МБ. Список отелей
 * тянул все изображения в каждом ответе, а браузер не мог их кэшировать,
 * потому что у data-URL нет адреса.
 *
 * Имя файла — хэш содержимого, поэтому одна и та же картинка не дублируется,
 * а запись в базе хранит только путь.
 */
@Injectable()
export class FileStorage {
  private readonly logger = new Logger("FileStorage");
  private readonly root = join(process.cwd(), "uploads");

  async save(buffer: Buffer, folder: "hotels" | "rooms"): Promise<string> {
    const mime = detectMime(buffer);
    const ext = EXT_BY_MIME[mime] ?? "jpg";
    const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 32);
    const name = `${hash}.${ext}`;

    const dir = join(this.root, folder);
    await fs.mkdir(dir, { recursive: true });

    const fullPath = join(dir, name);
    // Файл с тем же содержимым уже лежит — второй раз не пишем
    try {
      await fs.access(fullPath);
    } catch {
      await fs.writeFile(fullPath, buffer);
    }

    return `${UPLOADS_URL_PREFIX}/${folder}/${name}`;
  }

  async saveMany(buffers: Buffer[], folder: "hotels" | "rooms"): Promise<string[]> {
    return Promise.all(buffers.map((b) => this.save(b, folder)));
  }

  /**
   * Удаление не выполняется: одно и то же изображение может быть у нескольких
   * записей из-за дедупликации по хэшу. Чистка осиротевших файлов — отдельная
   * задача обслуживания, которую безопаснее делать пакетно.
   */
  async remove(publicPath: string): Promise<void> {
    this.logger.debug(`Файл ${publicPath} оставлен на диске: удаление отключено`);
  }

  /** Путь ли это в хранилище (в отличие от старой base64-строки). */
  static isStoredPath(value: unknown): value is string {
    return typeof value === "string" && value.startsWith(`${UPLOADS_URL_PREFIX}/`);
  }
}
