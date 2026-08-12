import { ObjectType, Field, ID, Int } from "@nestjs/graphql";

@ObjectType()
export class RoomHotelType {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  image: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  city: string;

  @Field({ nullable: true })
  description: string;
}

@ObjectType()
export class RoomType {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description: string;

  @Field(() => Int)
  price: number;

  @Field(() => Int)
  size: number;

  @Field(() => Int)
  guests: number;

  @Field({ nullable: true })
  bed: string;

  @Field(() => [String])
  images: string[];

  @Field({ nullable: true })
  isEnabled: boolean;

  @Field(() => RoomHotelType)
  hotel: RoomHotelType;
}
