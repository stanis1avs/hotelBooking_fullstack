import { IsMongoId, IsString, Length } from "class-validator";
import { Transform } from "class-transformer";

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);

export class CreateRequest {
  @Transform(trim)
  @IsString()
  @Length(3, 5000, { message: "Сообщение должно быть от 3 до 5000 символов" })
  text: string;
}

export class DisableRequest {
  @IsMongoId({ message: "Некорректный идентификатор обращения" })
  id: string;
}

export class SendSupportRequest {
  id: string;
  createdAt: string;
  title: string;
  isActive: boolean;
  user?: { id: string; name: string; contactPhone: string };
}
