import { ObjectType, Field, ID } from "@nestjs/graphql";

@ObjectType()
export class SupportRequestType {
  @Field(() => ID)
  id: string;

  @Field()
  createdAt: string;

  // Текст первого сообщения. Раньше здесь был вложенный объект, потому что
  // провайдер отдавал в title весь документ сообщения целиком.
  @Field({ nullable: true })
  title: string;

  @Field()
  isActive: boolean;
}

@ObjectType()
export class SupportMessageType {
  @Field(() => ID)
  id: string;

  @Field()
  text: string;

  @Field()
  createdAt: string;

  @Field({ nullable: true })
  readAt: string;

  @Field()
  author: string;

  @Field()
  requestId: string;
}
