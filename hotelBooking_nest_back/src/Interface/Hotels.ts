import * as mongoose from "mongoose";
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsMongoId, IsNumber, IsOptional, IsString, Length, Max, Min } from "class-validator";
import { Transform } from "class-transformer";

export const AMENITIES = ["wifi", "parking", "breakfast", "pool", "spa", "pets"] as const;
export type Amenity = (typeof AMENITIES)[number];

/**
 * Тип направления. Заведён затем, чтобы подборки «К морю» и «В горы» были
 * настоящим фильтром: раньше такая кнопка подставляла в поиск захардкоженный
 * город, и подпись не соответствовала действию.
 */
export const DESTINATIONS = ["sea", "mountains", "city", "countryside", "ski"] as const;
export type Destination = (typeof DESTINATIONS)[number];

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);
const toBool = ({ value }: { value: unknown }) =>
  value === "true" || value === true ? true : value === "false" || value === false ? false : value;
const toNum = ({ value }: { value: unknown }) =>
  value === "" || value === undefined || value === null ? undefined : Number(value);
// FormData передаёт массив либо повторяющимся ключом, либо строкой через запятую
const toArray = ({ value }: { value: unknown }) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(",").map((v) => v.trim()).filter(Boolean);
  return value;
};

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

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(0, 80)
  city?: string;

  @IsOptional()
  @Transform(toNum)
  @IsInt()
  @Min(1)
  @Max(5)
  stars?: number;

  @IsOptional()
  @Transform(toNum)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @Transform(toNum)
  @IsInt()
  @Min(0)
  reviewsCount?: number;

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @ArrayMaxSize(6)
  @IsIn(AMENITIES, { each: true, message: `Допустимые удобства: ${AMENITIES.join(", ")}` })
  amenities?: Amenity[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @ArrayMaxSize(5)
  @IsIn(DESTINATIONS, { each: true, message: `Допустимые направления: ${DESTINATIONS.join(", ")}` })
  destinations?: Destination[];
}

export class UpdateHotelDto extends CreateHotelDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 120)
  declare title: string;
}

export class CreateRoomDto {
  @IsMongoId({ message: "Некорректный идентификатор отеля" })
  hotelId: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(0, 120)
  title?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsOptional()
  @Transform(toNum)
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @Transform(toNum)
  @IsInt()
  @Min(0)
  size?: number;

  @IsOptional()
  @Transform(toNum)
  @IsInt()
  @Min(1)
  @Max(10)
  guests?: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(0, 120)
  bed?: string;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  isEnabled?: boolean;
}

export class UpdateRoomDto extends CreateRoomDto {
  @IsOptional()
  @IsMongoId()
  declare hotelId: string;
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

  /** Любое из выбранных направлений: «к морю» или «в горы» — это ИЛИ. */
  @IsOptional()
  @IsArray()
  @IsIn(DESTINATIONS, { each: true })
  destinations?: Destination[];

  /** Все выбранные удобства сразу: бассейн И спа — это И. */
  @IsOptional()
  @IsArray()
  @IsIn(AMENITIES, { each: true })
  amenities?: Amenity[];
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

export interface CreateHotel extends Omit<CreateHotelDto, "amenities" | "destinations"> {
  image: Buffer;
  amenities?: string[];
  destinations?: string[];
}

export interface UpdateHotelParams extends Partial<Omit<CreateHotelDto, "amenities" | "destinations">> {
  image?: Buffer;
  amenities?: string[];
  destinations?: string[];
}

export interface CreateRoom extends CreateRoomDto {
  images: Buffer[];
}

export interface UpdateRoomParams extends Partial<CreateRoomDto> {
  images?: Buffer[];
}

export class SendRoom {
  id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  price: number;
  size: number;
  guests: number;
  bed: string;
  images: string[];
  isEnabled?: boolean;
  hotel: {
    id: mongoose.Types.ObjectId;
    image: string;
    title: string;
    city?: string;
    description?: string;
  };
}

export class SendHotel {
  id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  image: string;
  city: string;
  stars: number;
  rating: number;
  reviewsCount: number;
  amenities: string[];
  destinations: string[];
  /** Минимальная цена среди доступных номеров — «от N ₽ за ночь» в карточке. */
  minPrice: number;
  roomsCount: number;
}
