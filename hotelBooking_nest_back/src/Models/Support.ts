import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import { Message } from "./Messages";

@Schema({ versionKey: false })
export class Support {
  @Prop({ required: true, index: true })
  user: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true })
  createdAt: Date;

  @Prop()
  messages: [Message];

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export type SupportDocument = Support & mongoose.Document;

export const SupportSchema = SchemaFactory.createForClass(Support);

// Списки обращений: клиент фильтрует по себе, менеджер — по активности.
SupportSchema.index({ user: 1, isActive: 1 });
