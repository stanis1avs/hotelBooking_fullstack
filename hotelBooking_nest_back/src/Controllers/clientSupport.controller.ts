import { Controller, Get, Req, Res, HttpStatus, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { RolesGuard } from "../Decorators/roles.decorator";
import { Role } from "../Decorators/setmetadata.decorator";
import { AuthGuard } from "@nestjs/passport";
import { SupportProvider } from "../Providers/support.provider";

@Controller("/api/client/support-requests")
@UseGuards(RolesGuard)
@UseGuards(AuthGuard("jwt"))
export class ClientSupportController {
  constructor(private support: SupportProvider) {}

  @Role("client")
  @Get("/")
  async getRequests(@Req() req, @Res() res: Response): Promise<void> {
    const requests = await this.support.getRequestsforClient(req.user);
    res.status(HttpStatus.OK).send(requests);
  }
}
