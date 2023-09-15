import { Controller, Post, Res, HttpStatus, UseGuards, Request } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Response } from "express";
import { AuthProvider } from "../Providers/auth.provider";

@Controller("/api/auth")
export class AuthController {
  constructor(private auth: AuthProvider) {}

  @UseGuards(AuthGuard("local"))
  @Post("/login")
  async login(@Request() req, @Res() res: Response): Promise<void> {
    const dataMain = await this.auth.login(req.user);
    const dataReserve = await this.auth.validateRefresh(dataMain);
    res
      .status(HttpStatus.OK)
      // .cookie("access_token", dataMain.token, { httpOnly: true, secure: false, maxAge: 2 * 24 * 60 * 60 * 1000 })
      // .cookie("refresh_token", dataReserve.token, { httpOnly: true, secure: false, maxAge: 10 * 24 * 60 * 60 * 1000 })
      .send({
        ...dataMain.userData,
        access_token: dataMain.token,
        refresh_token: dataReserve.token,
      });
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("/user")
  async getUserByToken(@Request() req, @Res() res: Response): Promise<void> {
    res.status(HttpStatus.OK).send({ ...req.user });
  }

  // @Post('/logout')
  // logout(@Res() res: Response): void {
  //   res
  //   .status(HttpStatus.NO_CONTENT)
  //   .clearCookie("access_token", { httpOnly: true, secure: false })
  //   .clearCookie("refresh_token", { httpOnly: true, secure: false })
  //   .send();
  // }

  @UseGuards(AuthGuard("jwt-refresh-token"))
  @Post("/refresh")
  async refresh(@Request() req, @Res() res: Response): Promise<void> {
    const data = await this.auth.refresh(req.user);
    res.status(HttpStatus.OK).send({ ...data.userData, access_token: data.token });
  }
}
