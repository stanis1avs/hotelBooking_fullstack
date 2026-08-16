import { Body, Controller, HttpStatus, Post, Req, Request, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Throttle } from "@nestjs/throttler";
import { Request as ExpressRequest, Response } from "express";
import { AuthProvider } from "../Providers/auth.provider";
import { LoginDto } from "../Interface/Users";
import { REFRESH_COOKIE, clearRefreshCookie, setRefreshCookie } from "../Auth/refresh-cookie";

@Controller("/api/auth")
export class AuthController {
  constructor(private auth: AuthProvider) {}

  /**
   * Вход. Стратегия Passport local убрана: она была лишним слоем, который
   * вызывал тот же validateUser, но давал второй путь входа со своей
   * обработкой ошибок — REST и GraphQL отвечали по-разному на одну и ту же
   * ситуацию. Теперь оба вызывают провайдер напрямую.
   *
   * Пять попыток в минуту с одного адреса — защита от подбора пароля.
   */
  @Throttle(5, 60)
  @Post("/login")
  async login(@Body() body: LoginDto, @Req() req: ExpressRequest, @Res() res: Response): Promise<void> {
    const user = await this.auth.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException("Неверный адрес или пароль");
    }
    const { access_token, refresh_token, userData } = await this.auth.issueTokens(user);
    setRefreshCookie(res, refresh_token, req);
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
    setRefreshCookie(res, refresh_token, req);
    res.status(HttpStatus.OK).send({ ...userData, access_token });
  }

  @Post("/logout")
  logout(@Req() req: ExpressRequest, @Res() res: Response): void {
    // Отзываем refresh на сервере, иначе украденный токен работал бы до конца TTL.
    this.auth.revokeRefresh(req.cookies?.[REFRESH_COOKIE]);
    clearRefreshCookie(res, req);
    res.status(HttpStatus.NO_CONTENT).send();
  }
}
