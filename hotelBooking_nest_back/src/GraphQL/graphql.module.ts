import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { Hotel, HotelSchema } from "../Models/Hotels";
import { Room, RoomSchema } from "../Models/Rooms";
import { Reservation, ReservationSchema } from "../Models/Reservations";
import { User, UserSchema } from "../Models/Users";
import { Support, SupportSchema } from "../Models/Support";
import { Message, MessageSchema } from "../Models/Messages";

import { HotelsProvider } from "../Providers/hotels.provider";
import { RoomsProvider } from "../Providers/rooms.provider";
import { ReservationsProvider } from "../Providers/reservations.provider";
import { UsersProvider } from "../Providers/users.provider";
import { AuthProvider } from "../Providers/auth.provider";
import { SupportProvider } from "../Providers/support.provider";

import { JwtStrategy } from "../Auth/jwt.strategy";

import { AuthResolver } from "./resolvers/auth.resolver";
import { HotelsResolver } from "./resolvers/hotels.resolver";
import { RoomsResolver } from "./resolvers/rooms.resolver";
import { ReservationsResolver } from "./resolvers/reservations.resolver";
import { UsersResolver } from "./resolvers/users.resolver";
import { SupportResolver } from "./resolvers/support.resolver";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hotel.name, schema: HotelSchema },
      { name: Room.name, schema: RoomSchema },
      { name: Reservation.name, schema: ReservationSchema },
      { name: User.name, schema: UserSchema },
      { name: Support.name, schema: SupportSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get("JWT_TOKEN_SECRET"),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    // Domain providers
    HotelsProvider,
    RoomsProvider,
    ReservationsProvider,
    UsersProvider,
    AuthProvider,
    SupportProvider,
    // JWT strategy — needed by GqlJwtAuthGuard (AuthGuard('jwt'))
    JwtStrategy,
    // Resolvers
    AuthResolver,
    HotelsResolver,
    RoomsResolver,
    ReservationsResolver,
    UsersResolver,
    SupportResolver,
  ],
})
export class AppGraphQLModule {}
