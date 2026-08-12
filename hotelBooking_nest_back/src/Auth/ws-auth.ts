import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import { ConfigService } from "@nestjs/config";
import { Socket } from "socket.io";
import { UserToJWTPayload } from "../Interface/Users";

/** Достаёт и проверяет JWT из handshake сокета. Бросает WsException, а не роняет процесс. */
export function authenticateSocket(
  client: Socket,
  jwtService: JwtService,
  configService: ConfigService
): UserToJWTPayload {
  const header = client.handshake?.headers?.authorization;
  const fromAuth = client.handshake?.auth?.token as string | undefined;
  const raw = header?.startsWith("Bearer ") ? header.slice(7) : fromAuth;

  // Раньше здесь безусловно вызывался .split(" ") — без заголовка это был TypeError,
  // а не понятная ошибка авторизации.
  if (!raw) {
    throw new WsException("Требуется авторизация");
  }

  let decoded: any;
  try {
    decoded = jwtService.verify(raw, { secret: configService.get("JWT_TOKEN_SECRET") });
  } catch {
    throw new WsException("Токен недействителен или истёк");
  }
  if (decoded?.type !== "access" || !decoded.sub) {
    throw new WsException("Ожидался access-токен");
  }
  return { id: String(decoded.sub), role: decoded.role, email: decoded.email };
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService, private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();
    const user = authenticateSocket(client, this.jwtService, this.configService);
    (client as any).user = user;
    return true;
  }
}
