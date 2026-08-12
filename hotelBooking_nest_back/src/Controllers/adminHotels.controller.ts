import {
  Controller, Post, Put, Delete, Body, Param, Res, UseGuards, HttpStatus,
  UseInterceptors, UploadedFile, BadRequestException,
} from "@nestjs/common";
import { Response, Express } from "express";
import { RolesGuard } from "../Decorators/roles.decorator";
import { Role } from "../Decorators/setmetadata.decorator";
import { AuthGuard } from "@nestjs/passport";
import { CreateHotelDto, UpdateHotelDto, UpdateHotelParams } from "../Interface/Hotels";
import { FileInterceptor } from "@nestjs/platform-express";
import { HotelsProvider } from "../Providers/hotels.provider";
import { assertRealImage, imageUploadOptions } from "../utils/upload.options";

// Один @UseGuards с явным порядком: аутентификация, затем проверка роли.
// Двумя отдельными декораторами порядок держался на том, что они применяются снизу вверх.
@Controller("/api/admin/hotels")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Role("admin")
export class AdminHotelsController {
  constructor(private hotels: HotelsProvider) {}

  @Post("/")
  @UseInterceptors(FileInterceptor("image", imageUploadOptions(1)))
  async create(@Body() data: CreateHotelDto, @UploadedFile() file: Express.Multer.File, @Res() res: Response): Promise<void> {
    if (!file) {
      throw new BadRequestException("Загрузите изображение отеля");
    }
    assertRealImage(file);
    const createdHotel = await this.hotels.createHotel({ ...data, image: file.buffer });
    res.status(HttpStatus.CREATED).send(createdHotel);
  }

  @Put(":id")
  @UseInterceptors(FileInterceptor("image", imageUploadOptions(1)))
  async editHotel(
    @Param("id") id: string,
    @Body() data: UpdateHotelDto,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response
  ): Promise<void> {
    // Ключ image добавляем ТОЛЬКО когда пришёл новый файл.
    // Раньше сюда уходил undefined, и Buffer.from(undefined) валил запрос с 500 —
    // из-за этого нельзя было отредактировать название, не перезаливая фотографию.
    const patch: UpdateHotelParams = { ...data };
    if (file) {
      assertRealImage(file);
      patch.image = file.buffer;
    }
    const editedHotel = await this.hotels.editHotel(id, patch);
    res.status(HttpStatus.OK).send(editedHotel);
  }

  @Delete(":id")
  async deleteHotel(@Param("id") id: string, @Res() res: Response): Promise<void> {
    await this.hotels.removeHotel(id);
    res.status(HttpStatus.NO_CONTENT).send();
  }
}
