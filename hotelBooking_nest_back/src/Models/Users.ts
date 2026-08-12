import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import { ROLES } from "../Interface/Users";

@Schema({ versionKey: false })
export class User {
  // unique гарантирует, что два аккаунта с одним адресом не появятся даже при гонке:
  // без него findOne при входе выбирал бы произвольную из дублирующихся записей.
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  contactPhone: string;

  @Prop({ required: true, default: "client", enum: ROLES, index: true })
  role: string;
}

export type UserDocument = User & mongoose.Document;

export const UserSchema = SchemaFactory.createForClass(User);
