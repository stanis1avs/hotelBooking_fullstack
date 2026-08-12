import { InputType, Field } from "@nestjs/graphql";
import { IsEmail, IsIn, IsOptional, IsString, Length, MinLength } from "class-validator";
import { ROLES, Role } from "../../Interface/Users";

@InputType()
export class CreateUserInput {
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

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(ROLES, { message: `Роль должна быть одной из: ${ROLES.join(", ")}` })
  role?: Role;
}
