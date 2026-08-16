import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { ThrottlerModule } from "@nestjs/throttler";
import { GqlThrottlerGuard } from "./Auth/gql-throttler.guard";
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
    // Базовый потолок запросов; на login/register навешан отдельный жёсткий лимит.
    // В @nestjs/throttler v4 ttl задаётся в секундах.
    ThrottlerModule.forRoot({ ttl: 60, limit: 120 }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>("MONGO_URI") ?? "mongodb://127.0.0.1:27017/nest",
      }),
      inject: [ConfigService],
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProd = configService.get("NODE_ENV") === "production";
        return {
          // В собранном образе папки src нет: схему держим в памяти,
          // иначе запись файла роняет старт контейнера.
          autoSchemaFile: isProd ? true : join(process.cwd(), "src/schema.gql"),
          sortSchema: true,
          context: ({ req, res }) => ({ req, res }),
          // В проде схему наружу не показываем и песочницу не поднимаем.
          introspection: !isProd,
          playground: !isProd,
          formatError: (error) => {
            // ValidationPipe кладёт причины в extensions.originalError.message,
            // а наружу уходило бесполезное «Bad Request Exception».
            const original = error.extensions?.originalError as { message?: string | string[] } | undefined;
            const detail = original?.message;
            return {
              message: Array.isArray(detail) ? detail.join(". ") : detail ?? error.message,
              path: error.path,
              code: error.extensions?.code,
            };
          },
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    HotelRoomsModule,
    ReservationModule,
    UserManagementModule,
    SupportModule,
    AppGraphQLModule,
  ],
  // Базовый ThrottlerGuard не понимает GraphQL-контекст — см. GqlThrottlerGuard
  providers: [{ provide: APP_GUARD, useClass: GqlThrottlerGuard }],
})
export class AppModule {}
