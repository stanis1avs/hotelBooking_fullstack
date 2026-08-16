import { InputType, Field } from "@nestjs/graphql";
import { IsIn, IsOptional, IsString, Length } from "class-validator";
import { ROLES, Role } from "../../Interface/Users";

/**
 * Изменение учётной записи. Почты и пароля здесь нет намеренно:
 * почта — идентификатор входа и меняется с подтверждением адреса,
 * пароль — отдельной операцией.
 */
@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(2, 80)
  name?: string;

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
