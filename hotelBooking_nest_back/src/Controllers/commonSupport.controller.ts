import { Controller, Param, Get, Post, Body, Req, Res, HttpStatus, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { RolesGuard } from "../Decorators/roles.decorator";
import { Role } from "../Decorators/setmetadata.decorator";
import { AuthGuard } from "@nestjs/passport";
import { SupportProvider } from "../Providers/support.provider";
import { CreateRequest } from "../Interface/Support";

@Controller("/api/common/support-requests")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Role("manager", "client")
export class CommonSupportController {
  constructor(private support: SupportProvider) {}

  @Get("/:id/messages")
  async getHistory(@Param("id") id: string, @Req() req, @Res() res: Response): Promise<void> {
    // Передаём текущего пользователя: провайдер отклонит чужое обращение.
    const history = await this.support.getHistory(id, req.user);
    res.status(HttpStatus.OK).send(history);
  }

  // Эндпоинта не существовало: фронтенд слал сюда POST и получал 404,
  // из-за чего отправка сообщений из интерфейса не работала вообще.
  @Post("/:id/messages")
  async sendMessage(
    @Param("id") id: string,
    @Body() body: CreateRequest,
    @Req() req,
    @Res() res: Response
  ): Promise<void> {
    const message = await this.support.sendMessage(id, body.text, req.user);
    res.status(HttpStatus.CREATED).send(message);
  }

  @Post("/:id/read")
  async markRead(@Param("id") id: string, @Req() req, @Res() res: Response): Promise<void> {
    const messages = await this.support.messagesRead(id, req.user);
    res.status(HttpStatus.OK).send(messages);
  }
}
