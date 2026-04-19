import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";
import { HotelRoomsModule } from "./Modules/hotelsRooms.module";
import { UserManagementModule } from "./Modules/userManagement.module";
import { ReservationModule } from "./Modules/reservation.module";
import { AuthModule } from "./Modules/auth.module";
import { SupportModule } from "./Modules/support.module";
import { AppGraphQLModule } from "./GraphQL/graphql.module";
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
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
      context: ({ req }) => ({ req }),
    }),
    AuthModule,
    HotelRoomsModule,
    ReservationModule,
    UserManagementModule,
    SupportModule,
    AppGraphQLModule,
  ],
})
export class AppModule {}
