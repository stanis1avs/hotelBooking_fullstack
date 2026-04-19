import { ObjectType, Field, ID } from "@nestjs/graphql";

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
