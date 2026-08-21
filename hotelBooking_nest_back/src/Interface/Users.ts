import { IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches, Min, MinLength } from "class-validator";
import { Transform } from "class-transformer";

export const ROLES = ["client", "manager", "admin"] as const;
export type Role = (typeof ROLES)[number];

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);
const lower = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim().toLowerCase() : value);

/**
 * Публичная регистрация. Поля `role` здесь нет намеренно:
 * вместе с `forbidNonWhitelisted` это отклоняет попытку выдать себе роль администратора.
 */
export class RegisterUserDto {
  @Transform(lower)
  @IsEmail({}, { message: "Некорректный адрес электронной почты" })
  email: string;

  @IsString()
  @MinLength(8, { message: "Пароль должен быть не короче 8 символов" })
  password: string;

  @Transform(trim)
  @IsString()
  @Length(2, 80, { message: "Имя должно быть от 2 до 80 символов" })
  name: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Matches(/^[\d\s()+-]{5,20}$/, { message: "Некорректный номер телефона" })
  contactPhone?: string;
}

/** Создание пользователя администратором — здесь роль задавать можно. */
export class CreateUserDto extends RegisterUserDto {
  @IsOptional()
  @IsIn(ROLES, { message: `Роль должна быть одной из: ${ROLES.join(", ")}` })
  role?: Role;
}

/**
 * Изменение учётной записи администратором.
 *
 * Почты здесь нет намеренно: это идентификатор входа, и его смена —
 * отдельная операция с подтверждением адреса. Пароль тоже меняется отдельно,
 * чтобы случайное сохранение формы не сбрасывало его.
 */
export class UpdateUserDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 80, { message: "Имя должно быть от 2 до 80 символов" })
  name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Matches(/^[\d\s()+-]{5,20}$/, { message: "Некорректный номер телефона" })
  contactPhone?: string;

  @IsOptional()
  @IsIn(ROLES, { message: `Роль должна быть одной из: ${ROLES.join(", ")}` })
  role?: Role;
}

/** Внутренний тип: то, что уходит в провайдер после разбора DTO. */
export interface CreateUser {
  email: string;
  password: string;
  name: string;
  contactPhone?: string;
  role?: Role;
}

export class SearchUserParams {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(0, 100)
  email?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(0, 100)
  name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(0, 100)
  contactPhone?: string;

  @IsOptional()
  @IsIn(ROLES)
  role?: Role;
}

export class UserToJWTPayload {
  id: string;
  email: string;
  role: string;
}

export class SendUser {
  id: string;
  email: string;
  name: string;
  contactPhone: string;
  role?: string;
}

export class ValidatedToken {
  token: string;
  userData: SendUser;
}
