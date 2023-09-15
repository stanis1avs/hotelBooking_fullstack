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
    const reservations = await this.reservations.getReservationsInTime(query.dateArrival, query.dateDeparture);
    const hotels = await this.hotels.getAllHotels(query, reservations);
    res.status(HttpStatus.OK).send(hotels);
  }
}
