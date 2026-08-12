import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import { AMENITIES } from "../Interface/Hotels";

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

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop({ required: true })
  image: string;
}

export type HotelDocument = Hotel & mongoose.Document;

export const HotelSchema = SchemaFactory.createForClass(Hotel);

// Поиск идёт по названию и городу
HotelSchema.index({ title: "text", city: "text" });
