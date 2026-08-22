import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import { AMENITIES, DESTINATIONS } from "../Interface/Hotels";

@Schema({ versionKey: false })
export class Hotel {
  @Prop({ required: true, trim: true, index: true })
  title: string;

  @Prop({ trim: true })
  description: string;

  // Поля ниже нужны карточке отеля в поиске: без них она показывала
  // только название и описание и не давала гостю ничего для сравнения.
  @Prop({ trim: true, index: true })
  city: string;

  @Prop({ min: 1, max: 5, default: 3 })
  stars: number;

  @Prop({ min: 0, max: 5, default: 0 })
  rating: number;

  @Prop({ min: 0, default: 0 })
  reviewsCount: number;

  @Prop({ type: [String], enum: AMENITIES, default: [] })
  amenities: string[];

  /** Тип направления: море, горы, город. По нему работают подборки в поиске. */
  @Prop({ type: [String], enum: DESTINATIONS, default: [], index: true })
  destinations: string[];

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  /**
   * Мягкое удаление: запись остаётся в базе, но пропадает из выдачи.
   * Жёсткое удаление оставляло брони со ссылкой в никуда, и список
   * бронирований у менеджера падал целиком на первой же такой записи.
   */
  @Prop({ default: null, index: true })
  deletedAt: Date | null;

  // Путь в файловом хранилище (/uploads/hotels/...), а не base64:
  // одна фотография занимала около 2,4 МБ прямо в документе
  @Prop({ required: true })
  image: string;
}

export type HotelDocument = Hotel & mongoose.Document;

export const HotelSchema = SchemaFactory.createForClass(Hotel);

// Поиск идёт по названию и городу
HotelSchema.index({ title: "text", city: "text" });
