import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";

/**
 * Отозванные refresh-токены.
 *
 * Хранились в памяти процесса, и это давало не только неудобство при
 * масштабировании, но и дыру в обычной работе: список обнулялся при каждом
 * перезапуске. После деплоя токен, которым пользователь вышел из аккаунта,
 * снова становился действительным до конца своего срока — а это 30 дней.
 *
 * Redis для этого не нужен: MongoDB уже общая для всех процессов и умеет
 * удалять записи по сроку сама.
 */
@Schema({ versionKey: false })
export class RevokedToken {
  @Prop({ required: true, unique: true })
  jti: string;

  /** Момент истечения самого токена: после него запись бессмысленна. */
  @Prop({ required: true })
  expiresAt: Date;
}

export type RevokedTokenDocument = RevokedToken & mongoose.Document;

export const RevokedTokenSchema = SchemaFactory.createForClass(RevokedToken);

// expireAfterSeconds: 0 — Mongo удаляет запись, когда наступает expiresAt.
// Чистка идёт фоновым процессом раз в минуту, то есть срок соблюдается
// с точностью до минуты — для записи, которая и так уже недействительна,
// этого достаточно.
RevokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
