import { InputType, Field } from "@nestjs/graphql";
import { IsDateString, IsMongoId } from "class-validator";

@InputType()
export class CreateReservationInput {
  @Field()
  @IsMongoId({ message: "Некорректный идентификатор номера" })
  roomId: string;

  @Field()
  @IsDateString({}, { message: "Дата заезда должна быть в формате ГГГГ-ММ-ДД" })
  dateStart: string;

  @Field()
  @IsDateString({}, { message: "Дата выезда должна быть в формате ГГГГ-ММ-ДД" })
  dateEnd: string;
}
