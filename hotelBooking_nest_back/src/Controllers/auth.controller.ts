import { Controller, HttpStatus, Post, Req, Request, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Throttle } from "@nestjs/throttler";
import { Request as ExpressRequest, Response } from "express";
import { AuthProvider } from "../Providers/auth.provider";
import { REFRESH_COOKIE, clearRefreshCookie, setRefreshCookie } from "../Auth/refresh-cookie";

/**
 * Единственный REST-контроллер аутентификации, и остался он не по недосмотру.
 *
 * Вход, регистрация и текущий пользователь переехали в GraphQL — здесь их больше
 * нет. А вот обновление токена увести туда нельзя: его вызывает HTTP-интерцептор
 * в ответ на 401, и запрос через Apollo уходил бы в тот же интерцептор,
 * то есть в рекурсию. Выход рядом с обновлением по той же причине: обе операции
 * работают с httpOnly-cookie, которую слой данных не видит вовсе.
 */
@Controller("/api/auth")
export class AuthController {
  constructor(private auth: AuthProvider) {}

  @Throttle(30, 60)
  @UseGuards(AuthGuard("jwt-refresh-token"))
  @Post("/refresh")
  async refresh(@Request() req, @Res() res: Response): Promise<void> {
    const { access_token, refresh_token, userData } = await this.auth.refresh(req.user);
    setRefreshCookie(res, refresh_token, req);
    res.status(HttpStatus.OK).send({ ...userData, access_token });
  }

  @Post("/logout")
  async logout(@Req() req: ExpressRequest, @Res() res: Response): Promise<void> {
    // Отзываем refresh на сервере, иначе украденный токен работал бы до конца TTL.
    await this.auth.revokeRefresh(req.cookies?.[REFRESH_COOKIE]);
    clearRefreshCookie(res, req);
    res.status(HttpStatus.NO_CONTENT).send();
  }
}
