import { Resolver, Query, Args } from "@nestjs/graphql";
import { RoomsProvider } from "../../Providers/rooms.provider";
import { RoomType } from "../types/room.type";

@Resolver(() => RoomType)
export class RoomsResolver {
  constructor(private readonly roomsProvider: RoomsProvider) {}

  @Query(() => [RoomType])
  async hotelRooms(
    @Args("hotel") hotel: string,
    @Args("isEnabled", { nullable: true }) isEnabled?: boolean
  ): Promise<RoomType[]> {
    const rooms = await this.roomsProvider.getAllRooms({ hotel, isEnabled });
    return rooms.map((r) => ({
      id: String(r.id),
      description: r.description,
      images: (r.images as string[]) ?? [],
      isEnabled: r.isEnabled,
      hotel: {
        id: String(r.hotel.id),
        image: r.hotel.image,
        title: r.hotel.title,
        description: r.hotel.description,
      },
    }));
  }

  @Query(() => RoomType, { nullable: true })
  async hotelRoom(@Args("id") id: string): Promise<RoomType | null> {
    const r = await this.roomsProvider.getIdRoom(id);
    if (!r) return null;
    return {
      id: String(r.id),
      description: r.description,
      images: (r.images as string[]) ?? [],
      isEnabled: r.isEnabled,
      hotel: {
        id: String(r.hotel.id),
        image: r.hotel.image,
        title: r.hotel.title,
        description: r.hotel.description,
      },
    };
  }
}
