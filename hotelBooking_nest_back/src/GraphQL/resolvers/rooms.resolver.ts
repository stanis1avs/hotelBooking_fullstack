import { Resolver, Query, Args } from "@nestjs/graphql";
import { RoomsProvider } from "../../Providers/rooms.provider";
import { RoomType } from "../types/room.type";
import { SendRoom } from "../../Interface/Hotels";

@Resolver(() => RoomType)
export class RoomsResolver {
  constructor(private readonly roomsProvider: RoomsProvider) {}

  private toType(r: SendRoom): RoomType {
    return {
      id: String(r.id),
      title: r.title,
      description: r.description,
      price: r.price,
      size: r.size,
      guests: r.guests,
      bed: r.bed,
      images: r.images ?? [],
      isEnabled: r.isEnabled,
      hotel: {
        id: String(r.hotel.id),
        image: r.hotel.image,
        title: r.hotel.title,
        city: r.hotel.city,
        description: r.hotel.description,
      },
    };
  }

  @Query(() => [RoomType])
  async hotelRooms(
    @Args("hotel") hotel: string,
    @Args("isEnabled", { nullable: true }) isEnabled?: boolean
  ): Promise<RoomType[]> {
    // Публичный запрос — отключённые номера в выдачу не попадают.
    const rooms = await this.roomsProvider.getAllRooms({ hotel, isEnabled }, true);
    return rooms.map((r) => this.toType(r));
  }

  @Query(() => RoomType, { nullable: true })
  async hotelRoom(@Args("id") id: string): Promise<RoomType | null> {
    const r = await this.roomsProvider.getIdRoom(id);
    return r ? this.toType(r) : null;
  }
}
