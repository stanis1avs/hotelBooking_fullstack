import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { UserToJWTPayload } from "../Interface/Users";
import { TokenBlacklistProvider } from "../Providers/tokenBlacklist.provider";

export type RefreshPayload = UserToJWTPayload & { jti?: string; exp?: number };

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh-token") {
  constructor(private configService: ConfigService, private blacklist: TokenBlacklistProvider) {
    super({
      // Токен берём из httpOnly-cookie, а заголовок оставляем как запасной путь
      // на время перехода фронтенда (см. C-7 в BACKLOG.md).
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refresh_token ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => req?.body?.refresh_token ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get("JWT_REFRESH_SECRET") ?? configService.get("JWT_TOKEN_SECRET"),
    });
  }

  async validate(payload: any): Promise<RefreshPayload> {
    if (payload?.type !== "refresh") {
      throw new UnauthorizedException("Ожидался refresh-токен");
    }
    if (payload.jti && this.blacklist.isRevoked(payload.jti)) {
      throw new UnauthorizedException("Refresh-токен отозван");
    }
    return { id: String(payload.sub), role: payload.role, email: payload.email, jti: payload.jti, exp: payload.exp };
  }
}
