import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";

@Schema({ versionKey: false })
export class User {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true, unique: false })
  password: string;

  @Prop({ required: true, unique: false })
  name: string;

  @Prop({ unique: false })
  contactPhone: string;

  @Prop({ required: true, unique: false, default: "client" })
  role: string;
}

export type UserDocument = User & mongoose.Document;

export const UserSchema = SchemaFactory.createForClass(User);
