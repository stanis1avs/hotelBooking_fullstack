import { Injectable, CanActivate, UnauthorizedException} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets'

@Injectable()
export class WsGuardforRequest implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: any): Promise<boolean> {
    const bearerToken = context.args[0].handshake.headers.authorization.split(' ')[1];
    if(!bearerToken) {
      throw new UnauthorizedException()
      return false
    }

    const decoded = this.jwtService.verify(bearerToken, { secret: process.env.JWT_TOKEN_SECRET || 'hard!to-guess_secret'});
    if(decoded.role !== "client"){
      throw new WsException("Invalid credentials");
      return false
    }

    context.args[0].handshake.user = {
      id: decoded.sub
    }

    return true
  }
}