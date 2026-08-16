import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import { HotelDocument } from "./Hotels";

@Schema({ versionKey: false })
export class Room {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Hotel", index: true })
  hotel: HotelDocument;

  // Раньше у номера не было даже названия: интерфейс подставлял «Стандарт»
  // первому номеру и «Люкс» всем остальным по индексу в массиве.
  @Prop({ trim: true, default: "" })
  title: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ min: 0, default: 0, index: true })
  price: number;

  @Prop({ min: 0, default: 0 })
  size: number;

  @Prop({ min: 1, max: 10, default: 2 })
  guests: number;

  @Prop({ trim: true, default: "" })
  bed: string;

  // Пути в файловом хранилище вместо base64-строк: изображение больше
  // не лежит в документе (V-8 в BACKLOG.md)
  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop({ required: true, default: true })
  isEnabled: boolean;
}

export type RoomDocument = Room & mongoose.Document;

export const RoomSchema = SchemaFactory.createForClass(Room);

// Публичная выдача всегда фильтрует по отелю и признаку доступности,
// а минимальная цена отеля считается сортировкой по price.
RoomSchema.index({ hotel: 1, isEnabled: 1, price: 1 });
