import { Module } from '@nestjs/common';
// import { WebSocketModule } from '@nestjs/websockets';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt'
import { SupportSchema, Support } from '../Models/Support';
import { MessageSchema, Message } from '../Models/Messages';
import { UserSchema, User } from '../Models/Users';
import { SupportProvider } from '../Providers/support.provider'
import { UsersProvider } from '../Providers/users.provider'
import { SupportChatGateway } from '../Providers/supportChat.gateway'
import { ClientSupportController } from '../Controllers/clientSupport.controller'
import { ManagerSupportController } from '../Controllers/managerSupport.controller'
import { CommonSupportController } from '../Controllers/commonSupport.controller'
import { WsGuardforRequest } from '../Auth/wsguardforrequest';
import { WsGuardforSendMesg } from '../Auth/wsguardforsendmesg';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Support.name, schema: SupportSchema }, { name: Message.name, schema: MessageSchema }, { name: User.name, schema: UserSchema }]),
    JwtModule.register({
      secret: 'hard!to-guess_secret'
    })
  ],
  controllers: [CommonSupportController, ClientSupportController, ManagerSupportController],
  providers: [SupportProvider, UsersProvider, SupportChatGateway, WsGuardforSendMesg, WsGuardforRequest]
})
export class SupportModule {}