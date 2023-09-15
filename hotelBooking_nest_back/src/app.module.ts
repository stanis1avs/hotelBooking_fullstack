import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HotelRoomsModule } from "./Modules/hotelsRooms.module";
import { UserManagementModule } from "./Modules/userManagement.module";
import { ReservationModule } from "./Modules/reservation.module";
import { AuthModule } from "./Modules/auth.module";
import { SupportModule } from "./Modules/support.module";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env", "../.env"],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: `mongodb+srv://${configService.get("DB_NAME")}:${configService.get("DB_PASSWORD")}@hotelbooking.q3qxgry.mongodb.net/nest`,
        useUnifiedTopology: true,
        useNewUrlParser: true,
        // uri: "mongodb://127.0.0.1:27017/nest",
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    HotelRoomsModule,
    ReservationModule,
    UserManagementModule,
    SupportModule,
  ],
})
export class AppModule {}
