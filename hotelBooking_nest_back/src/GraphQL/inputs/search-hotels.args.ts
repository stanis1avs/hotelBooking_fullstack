import { ArgsType, Field, Int } from "@nestjs/graphql";
import { IsArray, IsDateString, IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";
import { AMENITIES, Amenity, DESTINATIONS, Destination } from "../../Interface/Hotels";

/**
 * Глобальный ValidationPipe работает с whitelist и forbidNonWhitelisted,
 * поэтому поля без декораторов class-validator вырезаются и запрос падает
 * с Bad Request. Для GraphQL-аргументов декораторы обязательны так же,
 * как для тела REST-запроса.
 */
@ArgsType()
export class SearchHotelsArgs {
  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 120)
  hotel?: string;

  @Field()
  @IsDateString({}, { message: "Дата заезда должна быть в формате ГГГГ-ММ-ДД" })
  dateArrival: string;

  @Field()
  @IsDateString({}, { message: "Дата выезда должна быть в формате ГГГГ-ММ-ДД" })
  dateDeparture: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsIn(DESTINATIONS, { each: true })
  destinations?: Destination[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsIn(AMENITIES, { each: true })
  amenities?: Amenity[];
}
