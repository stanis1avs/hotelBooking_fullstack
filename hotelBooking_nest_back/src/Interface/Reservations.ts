import * as mongoose from "mongoose";
import { IsDateString, IsInt, IsMongoId, IsOptional, Min } from "class-validator";
import { Transform } from "class-transformer";

export class CreateReservation {
  @IsMongoId({ message: "Некорректный идентификатор номера" })
  roomId: string;

  @IsDateString({}, { message: "Дата заезда должна быть в формате ГГГГ-ММ-ДД" })
  dateStart: string;

  @IsDateString({}, { message: "Дата выезда должна быть в формате ГГГГ-ММ-ДД" })
  dateEnd: string;
}

export class ReservationParams {
  @IsOptional()
  @Transform(({ value }) => Number(value) || 0)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  limit?: number;
}

export class SendReservationForClients {
  id: mongoose.Types.ObjectId;
  dateStart: string;
  dateEnd: string;
  room: {
    description: string;
    images: string[];
  };
  hotel: {
    title: string;
  };
}

export class SendReservationForManagers {
  id: mongoose.Types.ObjectId;
  dateStart: string;
  dateEnd: string;
  client: {
    id: string;
    name: string;
    contactPhone: string;
  };
  room: {
    description: string;
  };
  hotel: {
    title: string;
  };
}
