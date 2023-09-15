import { Controller, Post, Put, Delete, Body, Param, Res, UseGuards, HttpStatus, UseInterceptors, UploadedFile } from "@nestjs/common";
import { Response, Express } from "express";
import { RolesGuard } from "../Decorators/roles.decorator";
import { Role } from "../Decorators/setmetadata.decorator";
import { AuthGuard } from "@nestjs/passport";
import { CreateHotel, UpdateHotelParams } from "../Interface/Hotels";
import { FileInterceptor } from "@nestjs/platform-express";
import { HotelsProvider } from "../Providers/hotels.provider";

@Controller("/api/admin/hotels")
@UseGuards(RolesGuard)
@UseGuards(AuthGuard("jwt"))
export class AdminHotelsController {
  constructor(private hotels: HotelsProvider) {}

  @Role("admin")
  @Post("/")
  @UseInterceptors(FileInterceptor("image"))
  async create(@Body() data: CreateHotel, @UploadedFile() file: Express.Multer.File, @Res() res: Response): Promise<void> {
    const createdHotel = await this.hotels.createHotel({
      ...data,
      image: file.buffer,
    });
    res.status(HttpStatus.CREATED).send(createdHotel);
  }

  @Role("admin")
  @Put(":id")
  @UseInterceptors(FileInterceptor("image"))
  async editHotel(@Param("id") id, @Body() data: UpdateHotelParams, @UploadedFile() file: Express.Multer.File, @Res() res: Response): Promise<void> {
    const editedHotel = await this.hotels.editHotel(id, {
      ...data,
      image: file ? file.buffer : data.image,
    });
    res.status(HttpStatus.ACCEPTED).send(editedHotel);
  }

  @Role("admin")
  @Delete(":id")
  async deleteHotel(@Param("id") id, @Res() res: Response): Promise<void> {
    await this.hotels.removeHotel(id);
    res.status(HttpStatus.NO_CONTENT).send();
  }
}
