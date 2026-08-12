import { InputType, Field } from "@nestjs/graphql";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

@InputType()
export class LoginInput {
  @Field()
  @IsEmail({}, { message: "Некорректный адрес электронной почты" })
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty({ message: "Введите пароль" })
  password: string;
}
