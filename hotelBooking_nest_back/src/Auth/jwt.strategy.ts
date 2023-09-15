import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { UserToJWTPayload } from "../Interface/Users";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(private configService: ConfigService) {
    super({
      usernameField: "email",
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("JWT_TOKEN_SECRET"),
    });
  }

  async validate(payload: any): Promise<UserToJWTPayload> {
    return { id: payload.sub, role: payload.role, email: payload.email };
  }
}
