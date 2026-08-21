import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UserSchema, User } from "../Models/Users";
import { AuthProvider } from "../Providers/auth.provider";
import { UsersProvider } from "../Providers/users.provider";
import { TokenBlacklistProvider } from "../Providers/tokenBlacklist.provider";
import { JwtStrategy } from "../Auth/jwt.strategy";
import { JwtRefreshStrategy } from "../Auth/jwt-refresh.strategy";
import { AuthController } from "../Controllers/auth.controller";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get("JWT_TOKEN_SECRET"),
      }),
      inject: [ConfigService],
    }),
  ],
  // Из REST остались только refresh и logout: их вызывает HTTP-интерцептор,
  // и увести их в Apollo нельзя — получилась бы рекурсия на обновлении токена.
  controllers: [AuthController],
  providers: [AuthProvider, UsersProvider, TokenBlacklistProvider, JwtStrategy, JwtRefreshStrategy],
  // Blacklist общий на всё приложение: GraphQL-модуль переиспользует тот же экземпляр.
  exports: [AuthProvider, TokenBlacklistProvider],
})
export class AuthModule {}
