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

  /** Свободно на выбранные даты — из этого числа берётся указание остатка в карточке. */
  @Field(() => Int)
  freeRooms: number;
}

/**
 * Страница выдачи. Без общего количества клиент не может показать
 * ни номер последней страницы, ни «N из M» — приходилось угадывать наличие
 * следующей по тому, что размер ответа совпал с лимитом.
 */
@ObjectType()
export class HotelsPageType {
  @Field(() => [HotelType])
  items: HotelType[];

  @Field(() => Int)
  total: number;
}
