import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { HotelSchema, Hotel } from "../Models/Hotels";
import { UserSchema, User } from "../Models/Users";
import { RoomSchema, Room } from "../Models/Rooms";
import { ReservationSchema, Reservation } from "../Models/Reservations";
import { RoomsProvider } from "../Providers/rooms.provider";
import { UsersProvider } from "../Providers/users.provider";
import { ReservationsProvider } from "../Providers/reservations.provider";
import { HotelsProvider } from "../Providers/hotels.provider";
import { AdminRoomsController } from "../Controllers/adminRooms.controller";
import { CommonRoomsController } from "../Controllers/commonRooms.controller";
import { AdminHotelsController } from "../Controllers/adminHotels.controller";
import { CommonHotelsController } from "../Controllers/commonHotels.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hotel.name, schema: HotelSchema },
      { name: Room.name, schema: RoomSchema },
      { name: Reservation.name, schema: ReservationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [AdminHotelsController, AdminRoomsController, CommonRoomsController, CommonHotelsController],
  providers: [HotelsProvider, RoomsProvider, ReservationsProvider, UsersProvider],
})
export class HotelRoomsModule {}
