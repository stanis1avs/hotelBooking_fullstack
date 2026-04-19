import { ObjectType, Field, ID } from "@nestjs/graphql";

@ObjectType()
export class HotelType {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description: string;

  @Field({ nullable: true })
  image: string;
}
