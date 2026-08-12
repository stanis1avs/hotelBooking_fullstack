import { IsMongoId, IsString, Length } from "class-validator";
import { Transform } from "class-transformer";

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);

export class SendMessage {
  id: string;
  createdAt: string;
  text: string;
  readAt?: string;
  author: string;
  requestId: string;
}

export class NewMessage {
  @IsMongoId({ message: "Некорректный идентификатор обращения" })
  id: string;

  @Transform(trim)
  @IsString()
  @Length(1, 5000)
  text: string;
}

export class MessageRead {
  @IsMongoId({ message: "Некорректный идентификатор обращения" })
  id: string;
}
