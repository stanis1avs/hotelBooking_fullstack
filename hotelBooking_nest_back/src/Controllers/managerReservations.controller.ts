import { Controller, Get, Delete, Param, Query, Res, UseGuards, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { RolesGuard } from "../Decorators/roles.decorator";
import { Role } from "../Decorators/setmetadata.decorator";
import { AuthGuard } from "@nestjs/passport";
import { ReservationsProvider } from "../Providers/reservations.provider";
import { ReservationParams } from "../Interface/Reservations";

@Controller("/api/manager/reservations")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Role("manager")
export class ManagerReservationsController {
  constructor(private reservations: ReservationsProvider) {}

  @Get("/")
  async getReservations(@Query() query: ReservationParams, @Res() res: Response): Promise<void> {
    const [items, total] = await Promise.all([
      this.reservations.getReservations(query),
      this.reservations.countReservations(),
    ]);
    res.status(HttpStatus.OK).set("X-Total-Count", String(total)).send(items);
  }

  @Delete(":id")
  async deleteIdReservation(@Param("id") id: string, @Res() res: Response): Promise<void> {
    await this.reservations.removeReservation(id);
    res.status(HttpStatus.NO_CONTENT).send();
  }
}
