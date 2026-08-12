import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UserToJWTPayload } from "../Interface/Users";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("JWT_TOKEN_SECRET"),
    });
  }

  async validate(payload: any): Promise<UserToJWTPayload> {
    // Refresh-токен подписан другим секретом и сюда не дойдёт, но проверка типа
    // страхует от возврата к общему секрету в будущем.
    if (payload?.type !== "access") {
      throw new UnauthorizedException("Ожидался access-токен");
    }
    if (!payload.sub) {
      throw new UnauthorizedException("В токене нет идентификатора пользователя");
    }
    return { id: String(payload.sub), role: payload.role, email: payload.email };
  }
}
