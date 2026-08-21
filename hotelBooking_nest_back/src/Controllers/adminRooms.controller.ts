import {
  Controller, Post, Put, Body, Param, Res, UseGuards, HttpStatus,
  UseInterceptors, UploadedFiles, BadRequestException,
} from "@nestjs/common";
import { Response, Express } from "express";
import { RolesGuard } from "../Decorators/roles.decorator";
import { Role } from "../Decorators/setmetadata.decorator";
import { AuthGuard } from "@nestjs/passport";
import { FilesInterceptor } from "@nestjs/platform-express";
import { CreateRoomDto, UpdateRoomDto, UpdateRoomParams } from "../Interface/Hotels";
import { RoomsProvider } from "../Providers/rooms.provider";
import { MAX_IMAGES_PER_ROOM, assertRealImage, imageUploadOptions } from "../utils/upload.options";

@Controller("/api/admin/hotel-rooms")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Role("admin")
/**
 * Из REST здесь остались только операции с файлами: чтение и удаление
 * живут в GraphQL (`adminRooms`, `deleteRoom`).
 */
export class AdminRoomsController {
  constructor(private rooms: RoomsProvider) {}

  @Post("/")
  @UseInterceptors(FilesInterceptor("images", MAX_IMAGES_PER_ROOM, imageUploadOptions(MAX_IMAGES_PER_ROOM)))
  async createRoom(
    @Body() data: CreateRoomDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Res() res: Response
  ): Promise<void> {
    if (!files?.length) {
      throw new BadRequestException("Загрузите хотя бы одно изображение номера");
    }
    files.forEach(assertRealImage);
    const createdRoom = await this.rooms.createRoom({ ...data, images: files.map((el) => el.buffer) });
    res.status(HttpStatus.CREATED).send(createdRoom);
  }

  @Put(":id")
  @UseInterceptors(FilesInterceptor("images", MAX_IMAGES_PER_ROOM, imageUploadOptions(MAX_IMAGES_PER_ROOM)))
  async editRoom(
    @Param("id") id: string,
    @Body() data: UpdateRoomDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Res() res: Response
  ): Promise<void> {
    // Без новых файлов поле images не трогаем — старые фотографии остаются на месте.
    const patch: UpdateRoomParams = { ...data };
    if (files?.length) {
      files.forEach(assertRealImage);
      patch.images = files.map((el) => el.buffer);
    }
    const editedRoom = await this.rooms.editRoom(id, patch);
    res.status(HttpStatus.OK).send(editedRoom);
  }
}
