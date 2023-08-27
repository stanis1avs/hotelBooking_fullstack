import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema({ versionKey: false })
export class Message{
    @Prop({required: true, unique: false})
    author: mongoose.Schema.Types.ObjectId;

    @Prop({required: true, unique: false})
    sentAt: Date;

    @Prop({required: true, unique: false})
    text: string;

    @Prop({unique: false})
    readAt: Date;
}


export type MessageDocument = Message & mongoose.Document ;

export const MessageSchema = SchemaFactory.createForClass(Message);

export const MessageModel = mongoose.model<MessageDocument>('Message', MessageSchema);
