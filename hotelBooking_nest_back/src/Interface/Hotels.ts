import * as mongoose from "mongoose";
import { IsBoolean, IsInt, IsMongoId, IsOptional, IsString, Length, Min } from "class-validator";
import { Transform } from "class-transformer";

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);
const toBool = ({ value }: { value: unknown }) =>
  value === "true" || value === true ? true : value === "false" || value === false ? false : value;

export class CreateHotelDto {
  @Transform(trim)
  @IsString()
  @Length(2, 120)
  title: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(0, 2000)
  description?: string;
}

export class UpdateHotelDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 120)
  title?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(0, 2000)
  description?: string;
}

export class CreateRoomDto {
  @IsMongoId({ message: "Некорректный идентификатор отеля" })
  hotelId: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  isEnabled?: boolean;
}

export class UpdateRoomDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  isEnabled?: boolean;
}

export class SearchHotelParams {
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

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(0, 120)
  hotel?: string;

  @IsOptional()
  @IsString()
  dateArrival?: string;

  @IsOptional()
  @IsString()
  dateDeparture?: string;
}

export class SearchRoomsParams {
  @IsMongoId({ message: "Некорректный идентификатор отеля" })
  hotel: string;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  isEnabled?: boolean;
}

/* --- Внутренние типы уровня провайдеров --- */

export interface CreateHotel {
  title: string;
  description?: string;
  image: Buffer;
}

export interface UpdateHotelParams {
  title?: string;
  description?: string;
  image?: Buffer;
}

export interface CreateRoom {
  hotelId: string;
  description?: string;
  images: Buffer[];
  isEnabled?: boolean;
}

export interface UpdateRoomParams {
  description?: string;
  isEnabled?: boolean;
  images?: Buffer[];
}

export class SendRoom {
  id: mongoose.Types.ObjectId;
  description: string;
  images: string[];
  isEnabled?: boolean;
  hotel: {
    id: mongoose.Types.ObjectId;
    image: string;
    title: string;
    description?: string;
  };
}

export class SendHotel {
  id: mongoose.Types.ObjectId;
  description: string;
  title: string;
  image: string;
}
