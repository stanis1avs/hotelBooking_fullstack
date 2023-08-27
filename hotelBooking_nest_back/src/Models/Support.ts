import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import {Message} from "./Messages"

@Schema({ versionKey: false })
export class Support{
    @Prop({required: true, unique: false})
    user: mongoose.Schema.Types.ObjectId;

    @Prop({required: true, unique: false})
    createdAt: Date;

    @Prop({unique: false})
    messages: [Message];

    @Prop({unique: false})
    isActive: boolean;
}

export type SupportDocument = Support & mongoose.Document;

export const SupportSchema = SchemaFactory.createForClass(Support);
