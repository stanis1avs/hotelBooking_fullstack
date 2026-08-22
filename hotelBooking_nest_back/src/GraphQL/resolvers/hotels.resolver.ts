import { Resolver, Query, Mutation, Args, Int } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { HotelsProvider } from "../../Providers/hotels.provider";
import { ReservationsProvider } from "../../Providers/reservations.provider";
import { HotelType, HotelsPageType } from "../types/hotel.type";
import { SearchHotelsArgs } from "../inputs/search-hotels.args";
import { SendHotel } from "../../Interface/Hotels";
import { GqlJwtAuthGuard } from "../guards/gql-jwt.guard";
import { GqlRolesGuard } from "../guards/gql-roles.guard";
import { Roles } from "../decorators/roles.decorator";

@Resolver(() => HotelType)
export class HotelsResolver {
  constructor(
    private readonly hotelsProvider: HotelsProvider,
    private readonly reservationsProvider: ReservationsProvider
  ) {}

  private toType(h: SendHotel, booked = 0): HotelType {
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
      destinations: h.destinations,
      minPrice: h.minPrice,
      roomsCount: h.roomsCount,
      freeRooms: Math.max(0, h.roomsCount - booked),
    };
  }

  @Query(() => HotelsPageType)
  async hotels(@Args() args: SearchHotelsArgs): Promise<HotelsPageType> {
    const [reservedHotelIds, booked] = await Promise.all([
      this.reservationsProvider.getReservationsInTime(args.dateArrival, args.dateDeparture),
      this.reservationsProvider.bookedRoomsByHotel(args.dateArrival, args.dateDeparture),
    ]);
    const params = {
      offset: args.offset ?? 0,
      limit: args.limit ?? undefined,
      hotel: args.hotel,
      dateArrival: args.dateArrival,
      dateDeparture: args.dateDeparture,
      destinations: args.destinations,
      amenities: args.amenities,
    };
    // Оба запроса идут по одному условию, поэтому считаем их параллельно.
    const [hotels, total] = await Promise.all([
      this.hotelsProvider.getAllHotels(params, reservedHotelIds),
      this.hotelsProvider.countHotels(params, reservedHotelIds),
    ]);
    return { items: hotels.map((h) => this.toType(h, booked?.get(String(h.id)) ?? 0)), total };
  }

  /**
   * Админский список отелей.
   *
   * Отдельно от `hotels`, потому что тому обязательны даты: он отсеивает занятое
   * на период. Админке нужен весь фонд независимо от брони — раньше страница
   * управления подставляла ради этого выдуманные даты 2024 года и теряла отели.
   */
  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles("admin")
  @Query(() => HotelsPageType)
  async adminHotels(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("search", { nullable: true }) search?: string
  ): Promise<HotelsPageType> {
    const params = { offset: offset ?? 0, limit, hotel: search, dateArrival: "", dateDeparture: "" };
    const [hotels, total] = await Promise.all([
      this.hotelsProvider.getAllHotels(params, null),
      this.hotelsProvider.countHotels(params, null),
    ]);
    return { items: hotels.map((h) => this.toType(h)), total };
  }

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles("admin")
  @Mutation(() => Boolean)
  async deleteHotel(@Args("id") id: string): Promise<boolean> {
    await this.hotelsProvider.removeHotel(id);
    return true;
  }

  /** Карточка отеля для страницы с номерами. */
  @Query(() => HotelType, { nullable: true })
  async hotel(@Args("id") id: string): Promise<HotelType | null> {
    const hotel = await this.hotelsProvider.getHotelCard(id);
    return hotel ? this.toType(hotel) : null;
  }
}
