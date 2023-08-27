import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Hotel, HotelDocument } from "./Hotels"

@Schema({ versionKey: false })
export class Room {
    @Prop({type: mongoose.Schema.Types.ObjectId, ref: "Hotel"})
    hotel: HotelDocument;

    @Prop({unique: false})
    description: string;

    @Prop({unique: false})
    images: [Buffer];

    @Prop({required: true, unique: false})
    createdAt: Date;

    @Prop({required: true, unique: false})
    updatedAt: Date;

    @Prop({required: true, unique: false, default: true})
    isEnabled: boolean;
}

export type RoomDocument = Room & mongoose.Document;

export const RoomSchema = SchemaFactory.createForClass(Room);