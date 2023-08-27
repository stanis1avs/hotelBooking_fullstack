import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema({ versionKey: false })
export class Reservation {
    @Prop({required: true, unique: false})
    userId: mongoose.Schema.Types.ObjectId;

    @Prop({required: true, unique: false})
    hotelId: mongoose.Schema.Types.ObjectId;

    @Prop({required: true, unique: false})
    roomId: mongoose.Schema.Types.ObjectId;

    @Prop({required: true, unique: false})
    dateStart: Date;

    @Prop({required: true, unique: false})
    dateEnd: Date;
}

export type ReservationDocument = Reservation & mongoose.Document;

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
