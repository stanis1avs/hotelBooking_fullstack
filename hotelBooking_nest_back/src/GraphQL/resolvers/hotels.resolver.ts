import { Resolver, Query, Args } from "@nestjs/graphql";
import { HotelsProvider } from "../../Providers/hotels.provider";
import { ReservationsProvider } from "../../Providers/reservations.provider";
import { HotelType, HotelsPageType } from "../types/hotel.type";
import { SearchHotelsArgs } from "../inputs/search-hotels.args";
import { SendHotel } from "../../Interface/Hotels";

@Resolver(() => HotelType)
export class HotelsResolver {
  constructor(
    private readonly hotelsProvider: HotelsProvider,
    private readonly reservationsProvider: ReservationsProvider
  ) {}

  private toType(h: SendHotel): HotelType {
    return {
      id: String(h.id),
      title: h.title,
      description: h.description,
      image: h.image,
      city: h.city,
      stars: h.stars,
      rating: h.rating,
      reviewsCount: h.reviewsCount,
      amenities: h.amenities,
      minPrice: h.minPrice,
      roomsCount: h.roomsCount,
    };
  }

  @Query(() => HotelsPageType)
  async hotels(@Args() args: SearchHotelsArgs): Promise<HotelsPageType> {
    const reservedHotelIds = await this.reservationsProvider.getReservationsInTime(
      args.dateArrival,
      args.dateDeparture
    );
    const params = {
      offset: args.offset ?? 0,
      limit: args.limit ?? undefined,
      hotel: args.hotel,
      dateArrival: args.dateArrival,
      dateDeparture: args.dateDeparture,
    };
    // Оба запроса идут по одному условию, поэтому считаем их параллельно.
    const [hotels, total] = await Promise.all([
      this.hotelsProvider.getAllHotels(params, reservedHotelIds),
      this.hotelsProvider.countHotels(params, reservedHotelIds),
    ]);
    return { items: hotels.map((h) => this.toType(h)), total };
  }

  /** Карточка отеля для страницы с номерами. */
  @Query(() => HotelType, { nullable: true })
  async hotel(@Args("id") id: string): Promise<HotelType | null> {
    const hotel = await this.hotelsProvider.getHotelCard(id);
    return hotel ? this.toType(hotel) : null;
  }
}
