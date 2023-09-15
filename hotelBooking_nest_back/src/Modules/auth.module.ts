import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UserSchema, User } from "../Models/Users";
import { AuthProvider } from "../Providers/auth.provider";
import { UsersProvider } from "../Providers/users.provider";
import { LocalStrategy } from "../Auth/local.strategy";
import { JwtStrategy } from "../Auth/jwt.strategy";
import { JwtRefreshStrategy } from "../Auth/jwt-refresh.strategy";
import { AuthController } from "../Controllers/auth.controller";
import { ClientAuthController } from "../Controllers/clientAuth.controller";
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
  controllers: [AuthController, ClientAuthController],
  providers: [AuthProvider, UsersProvider, LocalStrategy, JwtStrategy, JwtRefreshStrategy],
})
export class AuthModule {}
