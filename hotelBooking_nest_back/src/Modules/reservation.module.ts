import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomSchema, Room } from '../Models/Rooms';
import { HotelSchema, Hotel} from '../Models/Hotels';
import { UserSchema, User } from '../Models/Users';
import { ReservationSchema, Reservation } from '../Models/Reservations';
import { ReservationsProvider } from '../Providers/reservations.provider'
import { UsersProvider } from '../Providers/users.provider'
import { RoomsProvider } from '../Providers/rooms.provider'
import { HotelsProvider } from '../Providers/hotels.provider'
import { ClientReservationsController } from '../Controllers/clientReservations.controller'
import { ManagerReservationsController } from '../Controllers/managerReservations.controller'

@Module({
  imports: [MongooseModule.forFeature([{ name: Reservation.name, schema: ReservationSchema }, { name: Room.name, schema: RoomSchema }, { name: Hotel.name, schema: HotelSchema }, { name: User.name, schema: UserSchema }])],
  controllers: [ClientReservationsController, ManagerReservationsController],
  providers: [ReservationsProvider, RoomsProvider, HotelsProvider, UsersProvider]
})
export class ReservationModule {}