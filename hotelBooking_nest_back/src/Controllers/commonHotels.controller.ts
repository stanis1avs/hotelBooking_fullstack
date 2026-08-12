import { Controller, Get, Query, Res, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { SearchHotelParams } from "../Interface/Hotels";
import { HotelsProvider } from "../Providers/hotels.provider";
import { ReservationsProvider } from "../Providers/reservations.provider";

@Controller("/api/common/hotels")
export class CommonHotelsController {
  constructor(private hotels: HotelsProvider, private reservations: ReservationsProvider) {}

  @Get("/")
  async getHotels(@Query() query: SearchHotelParams, @Res() res: Response): Promise<void> {
    const reserved = await this.reservations.getReservationsInTime(query.dateArrival, query.dateDeparture);
    const [items, total] = await Promise.all([
      this.hotels.getAllHotels(query, reserved),
      this.hotels.countHotels(query, reserved),
    ]);
    res.status(HttpStatus.OK).set("X-Total-Count", String(total)).send(items);
  }
}
