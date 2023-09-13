import { Injectable, CanActivate, UnauthorizedException} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupportProvider } from '../Providers/support.provider'
import { WsException } from '@nestjs/websockets'
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WsGuardforSendMesg implements CanActivate {
  constructor(
    private supportService: SupportProvider,
    private configService: ConfigService,
    private jwtService: JwtService) {}

  async canActivate(context: any): Promise<boolean> {
    const bearerToken = context.args[0].handshake.headers.authorization.split(' ')[1];
    if(!bearerToken) {
      throw new UnauthorizedException()
      return false
    }
    const supportRequestId = context.args[0].handshake.query.id;
    const supportRequest = await this.supportService.getRequestById(supportRequestId)

    const decoded = this.jwtService.verify(bearerToken, { secret: this.configService.get('JWT_TOKEN_SECRET')});
    if(decoded.role !== "manager" && decoded.role !== "client"){
      throw new WsException("Invalid credentials");
      return false
    }

    if(decoded.role !== "manager" && decoded.sub != supportRequest.user){
      throw new WsException("Invalid credentials");
      return false
    }

    context.args[0].handshake.user = {
      id: decoded.sub
    }

    return true
  }
}