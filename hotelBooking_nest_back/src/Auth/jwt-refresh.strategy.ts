import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserToJWTPayload } from '../Interface/Users'

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh-token') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_TOKEN_SECRET || 'hard!to-guess_secret'
    });
  }

  async validate(payload: any): Promise<UserToJWTPayload>  {
    return { id: payload.id, role: payload.role, email: payload.email };
  }
}