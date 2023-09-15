import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { SupportSchema, Support } from "../Models/Support";
import { MessageSchema, Message } from "../Models/Messages";
import { UserSchema, User } from "../Models/Users";
import { SupportProvider } from "../Providers/support.provider";
import { SupportChatGateway } from "../Providers/supportChat.gateway";
import { ClientSupportController } from "../Controllers/clientSupport.controller";
import { ManagerSupportController } from "../Controllers/managerSupport.controller";
import { CommonSupportController } from "../Controllers/commonSupport.controller";
import { WsGuardforRequest } from "../Auth/wsguardforrequest";
import { WsGuardforSendMesg } from "../Auth/wsguardforsendmesg";
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
  controllers: [CommonSupportController, ClientSupportController, ManagerSupportController],
  providers: [SupportProvider, SupportChatGateway, WsGuardforSendMesg, WsGuardforRequest],
})
export class SupportModule {}
