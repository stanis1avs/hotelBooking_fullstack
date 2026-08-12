import { Controller, Post, Res, HttpStatus, UseGuards, Request, Req } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Throttle } from "@nestjs/throttler";
import { ConfigService } from "@nestjs/config";
import { Request as ExpressRequest, Response } from "express";
import { AuthProvider } from "../Providers/auth.provider";
import { REFRESH_COOKIE, clearRefreshCookie, setRefreshCookie } from "../Auth/refresh-cookie";

@Controller("/api/auth")
export class AuthController {
  constructor(private auth: AuthProvider, private config: ConfigService) {}

  private get isProd(): boolean {
    return this.config.get("NODE_ENV") === "production";
  }

  // Пять попыток входа в минуту с одного адреса — защита от подбора пароля.
  @Throttle(5, 60)
  @UseGuards(AuthGuard("local"))
  @Post("/login")
  async login(@Request() req, @Res() res: Response): Promise<void> {
    const { access_token, refresh_token, userData } = await this.auth.issueTokens(req.user);
    setRefreshCookie(res, refresh_token, this.isProd);
    res.status(HttpStatus.OK).send({ ...userData, access_token });
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("/user")
  async getUserByToken(@Request() req, @Res() res: Response): Promise<void> {
    res.status(HttpStatus.OK).send({ ...req.user });
  }

  @Throttle(30, 60)
  @UseGuards(AuthGuard("jwt-refresh-token"))
  @Post("/refresh")
  async refresh(@Request() req, @Res() res: Response): Promise<void> {
    const { access_token, refresh_token, userData } = await this.auth.refresh(req.user);
    setRefreshCookie(res, refresh_token, this.isProd);
    res.status(HttpStatus.OK).send({ ...userData, access_token });
  }

  @Post("/logout")
  logout(@Req() req: ExpressRequest, @Res() res: Response): void {
    // Отзываем refresh на сервере, иначе украденный токен работал бы до конца TTL.
    this.auth.revokeRefresh(req.cookies?.[REFRESH_COOKIE]);
    clearRefreshCookie(res, this.isProd);
    res.status(HttpStatus.NO_CONTENT).send();
  }
}
