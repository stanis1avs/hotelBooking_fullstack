import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";

@Schema({ versionKey: false })
export class Hotel {
  @Prop({ required: true, unique: false })
  title: string;

  @Prop({ unique: false })
  description: string;

  @Prop({ required: true, unique: false })
  createdAt: Date;

  @Prop({ required: true, unique: false })
  updatedAt: Date;

  @Prop({ required: true })
  image: string;
}

export type HotelDocument = Hotel & mongoose.Document;

export const HotelSchema = SchemaFactory.createForClass(Hotel);
