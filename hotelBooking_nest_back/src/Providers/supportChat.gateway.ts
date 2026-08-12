import { Logger, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ConfigService } from "@nestjs/config";
import { CreateRequest } from "../Interface/Support";
import { NewMessage, MessageRead } from "../Interface/Messages";
import { SupportProvider } from "./support.provider";
import { WsAuthGuard, authenticateSocket } from "../Auth/ws-auth";
import { JwtService } from "@nestjs/jwt";
import { UserToJWTPayload } from "../Interface/Users";

const MANAGERS_ROOM = "managers";
const requestRoom = (id: string) => `request:${id}`;

@WebSocketGateway({
  namespace: "support",
  cors: { origin: (process.env.CORS_ORIGINS ?? "http://localhost:4200").split(","), credentials: true },
})
@UseGuards(WsAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class SupportChatGateway {
  private readonly logger = new Logger("SupportChat");

  constructor(
    private support: SupportProvider,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  @WebSocketServer() server: Server;

  /** Аутентифицируем на подключении: неавторизованный сокет не попадает в namespace. */
  handleConnection(client: Socket): void {
    try {
      const user = authenticateSocket(client, this.jwtService, this.configService);
      (client as any).user = user;
      if (user.role === "manager") client.join(MANAGERS_ROOM);
    } catch (e) {
      this.logger.warn(`Отклонено подключение: ${(e as Error).message}`);
      client.disconnect(true);
    }
  }

  private user(client: Socket): UserToJWTPayload {
    const user = (client as any).user as UserToJWTPayload;
    if (!user) throw new WsException("Требуется авторизация");
    return user;
  }

  @SubscribeMessage("requestSupport")
  async requestHandler(@MessageBody() message: CreateRequest, @ConnectedSocket() client: Socket): Promise<void> {
    const user = this.user(client);
    if (user.role !== "client") {
      throw new WsException("Создавать обращения могут только клиенты");
    }
    const request = await this.support.createRequest(message, user);
    client.join(requestRoom(request.id));
    client.emit("createRequest", request);
    // Новое обращение видят только менеджеры, а не все подключённые.
    this.server.to(MANAGERS_ROOM).emit("createRequest", request);
  }

  /** Подписка на конкретное обращение с проверкой прав. */
  @SubscribeMessage("joinRequest")
  async joinRequest(@MessageBody() data: MessageRead, @ConnectedSocket() client: Socket): Promise<void> {
    const user = this.user(client);
    await this.support.getOwnedRequest(data.id, user);
    client.join(requestRoom(data.id));
  }

  @SubscribeMessage("readMessages")
  async readMessages(@MessageBody() data: MessageRead, @ConnectedSocket() client: Socket): Promise<void> {
    const user = this.user(client);
    // Права проверяются по тому же id, который используется дальше.
    const messages = await this.support.messagesRead(data.id, user);
    this.server.to(requestRoom(data.id)).emit("messagesRead", messages);
  }

  @SubscribeMessage("sendMessage")
  async messageHandler(@MessageBody() data: NewMessage, @ConnectedSocket() client: Socket): Promise<void> {
    const user = this.user(client);

    // Ключевая правка: раньше guard проверял идентификатор обращения из параметров
    // подключения (handshake.query.id), а обработчик писал в data.id из тела события.
    // Достаточно было подключиться со своим обращением, чтобы писать в любое чужое.
    const message = await this.support.sendMessage(data.id, data.text, user);

    client.join(requestRoom(data.id));
    // Рассылка только участникам обращения и менеджерам вместо broadcast по namespace.
    this.server.to(requestRoom(data.id)).emit("message", message);
    this.server.to(MANAGERS_ROOM).emit("message", message);
  }
}
