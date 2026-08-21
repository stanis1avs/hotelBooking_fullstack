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
import { FileStorage } from "../utils/file-storage";
import { AdminRoomsController } from "../Controllers/adminRooms.controller";
import { AdminHotelsController } from "../Controllers/adminHotels.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hotel.name, schema: HotelSchema },
      { name: Room.name, schema: RoomSchema },
      { name: Reservation.name, schema: ReservationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    // Файлы держим в памяти: дальше они уходят в БД, на диск ничего не пишется.
    // Ограничения размера и типа задаются на уровне интерцепторов — см. utils/upload.options.ts.
    MulterModule.register({ storage: memoryStorage() }),
  ],
  // REST оставлен только под multipart: создание и правка возят файлы,
  // всё остальное чтение и удаление живёт в GraphQL.
  controllers: [AdminHotelsController, AdminRoomsController],
  providers: [FileStorage, HotelsProvider, RoomsProvider, ReservationsProvider, UsersProvider],
})
export class HotelRoomsModule {}
