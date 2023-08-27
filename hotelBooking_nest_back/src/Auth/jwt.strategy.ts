import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserToJWTPayload } from '../Interface/Users'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      usernameField: 'email',
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_TOKEN_SECRET || 'hard!to-guess_secret'
    });
  }

  async validate(payload: any): Promise<UserToJWTPayload>  {
    return { id: payload.sub, role: payload.role, email: payload.email };
  }
}