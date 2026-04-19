import { ObjectType, Field, ID } from "@nestjs/graphql";

@ObjectType()
export class ReservationRoomType {
  @Field({ nullable: true })
  description: string;

  @Field(() => [String])
  images: string[];
}

@ObjectType()
export class ReservationHotelType {
  @Field()
  title: string;
}

@ObjectType()
export class ReservationClientType {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  name: string;

  @Field({ nullable: true })
  contactPhone: string;
}

@ObjectType()
export class ClientReservationType {
  @Field(() => ID)
  id: string;

  @Field()
  dateStart: string;

  @Field()
  dateEnd: string;

  @Field(() => ReservationRoomType)
  room: ReservationRoomType;

  @Field(() => ReservationHotelType)
  hotel: ReservationHotelType;
}

@ObjectType()
export class ManagerReservationType {
  @Field(() => ID)
  id: string;

  @Field()
  dateStart: string;

  @Field()
  dateEnd: string;

  @Field(() => ReservationClientType)
  client: ReservationClientType;

  @Field(() => ReservationRoomType)
  room: ReservationRoomType;

  @Field(() => ReservationHotelType)
  hotel: ReservationHotelType;
}
