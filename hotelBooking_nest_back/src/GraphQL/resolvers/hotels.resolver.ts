import { Resolver, Query, Args } from "@nestjs/graphql";
import { HotelsProvider } from "../../Providers/hotels.provider";
import { ReservationsProvider } from "../../Providers/reservations.provider";
import { HotelType } from "../types/hotel.type";
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

  @Query(() => [HotelType])
  async hotels(@Args() args: SearchHotelsArgs): Promise<HotelType[]> {
    const reservedHotelIds = await this.reservationsProvider.getReservationsInTime(
      args.dateArrival,
      args.dateDeparture
    );
    const hotels = await this.hotelsProvider.getAllHotels(
      {
        offset: args.offset ?? 0,
        limit: args.limit ?? undefined,
        hotel: args.hotel,
        dateArrival: args.dateArrival,
        dateDeparture: args.dateDeparture,
      },
      reservedHotelIds
    );
    return hotels.map((h) => this.toType(h));
  }

  /** Карточка отеля для страницы с номерами. */
  @Query(() => HotelType, { nullable: true })
  async hotel(@Args("id") id: string): Promise<HotelType | null> {
    const hotel = await this.hotelsProvider.getHotelCard(id);
    return hotel ? this.toType(hotel) : null;
  }
}
