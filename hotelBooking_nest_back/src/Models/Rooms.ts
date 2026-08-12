import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import { HotelDocument } from "./Hotels";

@Schema({ versionKey: false })
export class Room {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Hotel", index: true })
  hotel: HotelDocument;

  @Prop()
  description: string;

  @Prop()
  images: [Buffer];

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop({ required: true, default: true })
  isEnabled: boolean;
}

export type RoomDocument = Room & mongoose.Document;

export const RoomSchema = SchemaFactory.createForClass(Room);

// Публичная выдача всегда фильтрует по отелю и признаку доступности.
RoomSchema.index({ hotel: 1, isEnabled: 1 });
