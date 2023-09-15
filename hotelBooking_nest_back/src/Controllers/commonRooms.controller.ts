import { Controller, Get, Param, Query, Res, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { SearchRoomsParams } from "../Interface/Hotels";
import { RoomsProvider } from "../Providers/rooms.provider";

@Controller("/api/common/hotel-rooms")
export class CommonRoomsController {
  constructor(private rooms: RoomsProvider) {}

  @Get(":id")
  async getRoom(@Param("id") id, @Res() res: Response): Promise<void> {
    const room = await this.rooms.getIdRoom(id);
    res.status(HttpStatus.OK).send(room);
  }

  @Get("/")
  async getRooms(@Query() query: SearchRoomsParams, @Res() res: Response): Promise<void> {
    const rooms = await this.rooms.getAllRooms(query);
    res.status(HttpStatus.OK).send(rooms);
  }
}
