import { InputType, Field } from "@nestjs/graphql";
import { IsEmail, IsOptional, IsString, Length, MinLength } from "class-validator";

// Поля role здесь нет намеренно: публичная регистрация не должна позволять
// выбрать себе роль. Резолвер дополнительно проставляет "client".
@InputType()
export class RegisterInput {
  @Field()
  @IsEmail({}, { message: "Некорректный адрес электронной почты" })
  email: string;

  @Field()
  @IsString()
  @MinLength(8, { message: "Пароль должен быть не короче 8 символов" })
  password: string;

  @Field()
  @IsString()
  @Length(2, 80)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  contactPhone?: string;
}
