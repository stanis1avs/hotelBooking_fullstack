import { ObjectType, Field } from "@nestjs/graphql";
import { UserType } from "./user.type";

@ObjectType()
export class AuthPayloadType {
  @Field()
  access_token: string;

  // Refresh уходит в httpOnly-cookie и в теле ответа больше не передаётся:
  // токен, недоступный JavaScript, нельзя выгрузить через XSS (C-7 в BACKLOG.md).
  @Field({ nullable: true, deprecationReason: "Refresh-токен передаётся в httpOnly-cookie" })
  refresh_token?: string;

  @Field(() => UserType)
  user: UserType;
}
