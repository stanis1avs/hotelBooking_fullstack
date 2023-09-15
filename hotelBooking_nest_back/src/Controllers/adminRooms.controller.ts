import { Controller, Post, Put, Delete, Body, Param, Res, UseGuards, HttpStatus, UseInterceptors, UploadedFiles } from "@nestjs/common";
import { Response, Express } from "express";
import { RolesGuard } from "../Decorators/roles.decorator";
import { Role } from "../Decorators/setmetadata.decorator";
import { AuthGuard } from "@nestjs/passport";
import { FilesInterceptor } from "@nestjs/platform-express";
import { CreateRoom, UpdateRoomParams } from "../Interface/Hotels";
import { RoomsProvider } from "../Providers/rooms.provider";

@Controller("/api/admin/hotel-rooms")
@UseGuards(RolesGuard)
@UseGuards(AuthGuard("jwt"))
export class AdminRoomsController {
  constructor(private rooms: RoomsProvider) {}

  @Role("admin")
  @Post("/")
  @UseInterceptors(FilesInterceptor("images"))
  async createRoom(@Body() data: CreateRoom, @UploadedFiles() files: Array<Express.Multer.File>, @Res() res: Response): Promise<void> {
    const createdRoom = await this.rooms.createRoom({
      ...data,
      images: files.map((el) => el.buffer),
    });
    res.status(HttpStatus.CREATED).send(createdRoom);
  }

  @Role("admin")
  @Put(":id")
  @UseInterceptors(FilesInterceptor("images"))
  async editRoom(@Param("id") id, @Body() data: UpdateRoomParams, @UploadedFiles() files: Array<Express.Multer.File>, @Res() res: Response): Promise<void> {
    const editedRoom = await this.rooms.editRoom(id, {
      ...data,
      images: files.length !== 0 ? files.map((el) => el.buffer) : data.images,
    });
    res.status(HttpStatus.ACCEPTED).send(editedRoom);
  }

  @Role("admin")
  @Delete(":id")
  async deleteRoom(@Param("id") id, @Res() res: Response): Promise<void> {
    await this.rooms.removeRoom(id);
    res.status(HttpStatus.NO_CONTENT).send();
  }
}
