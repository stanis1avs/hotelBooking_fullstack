import { Req, UseGuards } from '@nestjs/common'
import { SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { CreateRequest, SendSupportRequest } from '../Interface/Support'
import { NewMessage, MessageRead } from '../Interface/Messages'
import { SupportProvider } from '../Providers/support.provider'
import { Server } from 'socket.io';
import { WsGuardforRequest } from '../Auth/wsguardforrequest';
import { WsGuardforSendMesg } from '../Auth/wsguardforsendmesg';

@WebSocketGateway({ namespace: 'support', cors: true })

export class SupportChatGateway {
  constructor(private support: SupportProvider) {}

  @WebSocketServer() server: Server;

  @UseGuards(WsGuardforRequest)
  @SubscribeMessage('requestSupport')
  async requestHandler(@MessageBody() message: CreateRequest, @Req() req): Promise<void> {
    const request = await this.support.createRequest(message, req.handshake.user);
    this.sendRequest(request)
  }

  @UseGuards(WsGuardforSendMesg)
  sendRequest(info: SendSupportRequest): void {
    this.server.emit('createRequest', info);
  }

  @UseGuards(WsGuardforSendMesg)
  @SubscribeMessage('readMessages')
  async readMessages(@MessageBody() data: MessageRead, @Req() req): Promise<void> {
    const messages = await this.support.messagesRead(data.id, req.handshake.user);
    this.server.emit('messagesRead', messages);
  }

  @UseGuards(WsGuardforSendMesg)
  @SubscribeMessage('sendMessage')
  async messageHandler(@MessageBody() data: NewMessage, @Req() req): Promise<void> {
    const message = await this.support.sendMessage(data.id, data.text, req.handshake.user);
    this.server.emit('message', message);
  }
}