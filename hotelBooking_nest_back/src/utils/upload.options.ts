import { BadRequestException } from "@nestjs/common";
import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES_PER_ROOM = 10;

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

/** Сигнатуры файлов: MIME из запроса подделывается, первые байты — нет. */
const SIGNATURES: Array<{ mime: string; test: (b: Buffer) => boolean }> = [
  { mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: "image/webp", test: (b) => b.slice(0, 4).toString("ascii") === "RIFF" && b.slice(8, 12).toString("ascii") === "WEBP" },
];

export function imageUploadOptions(maxFiles = 1): MulterOptions {
  return {
    limits: { fileSize: MAX_IMAGE_BYTES, files: maxFiles },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_MIME.includes(file.mimetype)) {
        return cb(new BadRequestException("Допустимы только изображения JPEG, PNG или WebP"), false);
      }
      cb(null, true);
    },
  };
}

/** Вторая линия проверки: содержимое должно быть картинкой, а не переименованным файлом. */
export function assertRealImage(file: { buffer: Buffer; mimetype: string } | undefined): void {
  if (!file?.buffer || file.buffer.length < 12) {
    throw new BadRequestException("Файл пуст или повреждён");
  }
  if (!SIGNATURES.some((s) => s.test(file.buffer))) {
    throw new BadRequestException("Содержимое файла не является изображением");
  }
}

export function detectMime(buffer: Buffer): string {
  return SIGNATURES.find((s) => s.test(buffer))?.mime ?? "image/jpeg";
}
