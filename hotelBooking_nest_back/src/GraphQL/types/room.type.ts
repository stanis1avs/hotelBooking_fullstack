import { ObjectType, Field, ID } from "@nestjs/graphql";

@ObjectType()
export class HotelInRoomType {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  image: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description: string;
}

@ObjectType()
export class RoomType {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  description: string;

  @Field(() => [String])
  images: string[];

  @Field({ nullable: true })
  isEnabled: boolean;

  @Field(() => HotelInRoomType)
  hotel: HotelInRoomType;
}
