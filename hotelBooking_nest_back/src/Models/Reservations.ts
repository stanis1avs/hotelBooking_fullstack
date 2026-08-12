import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";

@Schema({ versionKey: false })
export class Reservation {
  @Prop({ required: true, index: true })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true, index: true })
  hotelId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true, index: true })
  roomId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true })
  dateStart: Date;

  @Prop({ required: true })
  dateEnd: Date;
}

export type ReservationDocument = Reservation & mongoose.Document;

export const ReservationSchema = SchemaFactory.createForClass(Reservation);

// Поиск пересечений идёт по номеру и обеим датам — без составного индекса
// это полный перебор коллекции на каждое бронирование и на каждый поиск отелей.
ReservationSchema.index({ roomId: 1, dateStart: 1, dateEnd: 1 });
ReservationSchema.index({ dateStart: 1, dateEnd: 1 });
