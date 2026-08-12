import { ObjectType, Field, ID, Int, Float } from "@nestjs/graphql";

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

  // Поля карточки: без них в поиске нечего показывать кроме названия
  @Field({ nullable: true })
  city: string;

  @Field(() => Int)
  stars: number;

  @Field(() => Float)
  rating: number;

  @Field(() => Int)
  reviewsCount: number;

  @Field(() => [String])
  amenities: string[];

  /** Минимальная цена среди доступных номеров, ₽ за ночь */
  @Field(() => Int)
  minPrice: number;

  @Field(() => Int)
  roomsCount: number;
}
