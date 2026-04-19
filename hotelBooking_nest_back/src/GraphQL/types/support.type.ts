import { ObjectType, Field, ID } from "@nestjs/graphql";

@ObjectType()
export class SupportFirstMessageType {
  @Field({ nullable: true })
  text: string;
}

@ObjectType()
export class SupportRequestType {
  @Field(() => ID)
  id: string;

  @Field()
  createdAt: string;

  @Field(() => SupportFirstMessageType, { nullable: true })
  title: SupportFirstMessageType;

  @Field({ nullable: true })
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
