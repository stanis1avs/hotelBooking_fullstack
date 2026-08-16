import { ObjectType, Field, ID, Int } from "@nestjs/graphql";

@ObjectType()
export class UserType {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  contactPhone: string;

  @Field({ nullable: true })
  role: string;
}

/** См. HotelsPageType: общее количество нужно клиенту для нумерации страниц. */
@ObjectType()
export class UsersPageType {
  @Field(() => [UserType])
  items: UserType[];

  @Field(() => Int)
  total: number;
}
