import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { SupportSchema, Support } from "../Models/Support";
import { MessageSchema, Message } from "../Models/Messages";
import { UserSchema, User } from "../Models/Users";
import { SupportProvider } from "../Providers/support.provider";
import { SupportChatGateway } from "../Providers/supportChat.gateway";
import { WsAuthGuard } from "../Auth/ws-auth";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Support.name, schema: SupportSchema },
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get("JWT_TOKEN_SECRET"),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [SupportProvider, SupportChatGateway, WsAuthGuard],
})
export class SupportModule {}
