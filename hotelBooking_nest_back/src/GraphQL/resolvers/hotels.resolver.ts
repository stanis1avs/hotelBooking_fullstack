import { Resolver, Query, Args } from "@nestjs/graphql";
import { HotelsProvider } from "../../Providers/hotels.provider";
import { ReservationsProvider } from "../../Providers/reservations.provider";
import { HotelType } from "../types/hotel.type";
import { SearchHotelsArgs } from "../inputs/search-hotels.args";

@Resolver(() => HotelType)
export class HotelsResolver {
  constructor(
    private readonly hotelsProvider: HotelsProvider,
    private readonly reservationsProvider: ReservationsProvider
  ) {}

  @Query(() => [HotelType])
  async hotels(@Args() args: SearchHotelsArgs): Promise<HotelType[]> {
    const reservedHotelIds = await this.reservationsProvider.getReservationsInTime(args.dateArrival, args.dateDeparture);
    const hotels = await this.hotelsProvider.getAllHotels(
      {
        offset: args.offset ?? 0,
        hotel: args.hotel,
        dateArrival: args.dateArrival,
        dateDeparture: args.dateDeparture,
      },
      reservedHotelIds
    );
    return hotels.map((h) => ({
      id: String(h.id),
      title: h.title,
      description: h.description,
      image: h.image,
    }));
  }
}
