import { Controller, Get, Post, Body, Req, Res, HttpStatus, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { RolesGuard } from "../Decorators/roles.decorator";
import { Role } from "../Decorators/setmetadata.decorator";
import { AuthGuard } from "@nestjs/passport";
import { SupportProvider } from "../Providers/support.provider";
import { CreateRequest } from "../Interface/Support";

@Controller("/api/client/support-requests")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Role("client")
export class ClientSupportController {
  constructor(private support: SupportProvider) {}

  @Get("/")
  async getRequests(@Req() req, @Res() res: Response): Promise<void> {
    const requests = await this.support.getRequestsforClient(req.user);
    res.status(HttpStatus.OK).send(requests);
  }

  // Создание обращения существовало только как событие WebSocket,
  // поэтому кнопка «Отправить обращение» на фронтенде упиралась в 404.
  @Post("/")
  async createRequest(@Body() body: CreateRequest, @Req() req, @Res() res: Response): Promise<void> {
    const request = await this.support.createRequest(body, req.user);
    res.status(HttpStatus.CREATED).send(request);
  }
}
