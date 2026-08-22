import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { RevokedToken, RevokedTokenDocument } from "../Models/RevokedTokens";

/**
 * Хранилище отозванных refresh-токенов (по jti).
 *
 * Записи живут в MongoDB и удаляются TTL-индексом, когда истекает сам токен.
 * Прежняя реализация держала их в Map: она терялась при перезапуске, и после
 * каждого деплоя отозванные токены снова начинали работать.
 *
 * Для нескольких экземпляров бэкенда это тоже подходит — база одна на всех,
 * так что отдельное хранилище под отзыв не понадобится. См. F-17 в BACKLOG.md.
 */
@Injectable()
export class TokenBlacklistProvider {
  private readonly logger = new Logger("TokenBlacklist");

  constructor(
    @InjectModel(RevokedToken.name) private readonly revokedModel: Model<RevokedTokenDocument>
  ) {}

  async revoke(jti: string, expiresAtSec: number): Promise<void> {
    if (!jti) return;
    try {
      // upsert: повторный выход тем же токеном не должен падать на уникальном индексе
      await this.revokedModel.updateOne(
        { jti },
        { $set: { jti, expiresAt: new Date(expiresAtSec * 1000) } },
        { upsert: true }
      );
    } catch (e) {
      // Отзыв не должен ронять выход из аккаунта: cookie всё равно очищается
      this.logger.error(`Не удалось отозвать токен ${jti}: ${(e as Error).message}`);
    }
  }

  async isRevoked(jti: string): Promise<boolean> {
    if (!jti) return false;
    return (await this.revokedModel.exists({ jti })) !== null;
  }
}
