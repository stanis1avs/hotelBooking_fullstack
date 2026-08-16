import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { FilterQuery, Model, isValidObjectId } from "mongoose";
import { Room, RoomDocument } from "../Models/Rooms";
import { HotelDocument } from "../Models/Hotels";
import { HotelsProvider } from "./hotels.provider";
import { CreateRoom, UpdateRoomParams, SearchRoomsParams, SendRoom } from "../Interface/Hotels";
import { normalizeImageForClient } from "../utils/image.utils";
import { FileStorage } from "../utils/file-storage";

@Injectable()
export class RoomsProvider {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    @Inject(HotelsProvider) readonly hotelsProvider: HotelsProvider,
    private readonly storage: FileStorage
  ) {}

  async createRoom(createRoom: CreateRoom): Promise<SendRoom> {
    // Проверяем существование отеля до вставки, иначе получим номер-сироту.
    // В удалённый отель добавить номер нельзя — includeDeleted не передаём.
    const hotel = await this.hotelsProvider.getIdHotel(createRoom.hotelId);
    const createdRoom = new this.roomModel({
      title: createRoom.title ?? "",
      description: createRoom.description,
      price: createRoom.price ?? 0,
      size: createRoom.size ?? 0,
      guests: createRoom.guests ?? 2,
      bed: createRoom.bed ?? "",
      // Файлы на диск, в документе — пути
      images: await this.storage.saveMany(createRoom.images, "rooms"),
      isEnabled: createRoom.isEnabled ?? true,
      hotel: new mongoose.Types.ObjectId(createRoom.hotelId),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await createdRoom.save();
    return this.formatRoom(createdRoom, hotel, true, true);
  }

  async editRoom(id: string, data: UpdateRoomParams): Promise<SendRoom> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException("Номер не найден");
    }
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    for (const field of ["title", "description", "price", "size", "guests", "bed", "isEnabled"] as const) {
      if (data[field] !== undefined) patch[field] = data[field];
    }
    if (data.images?.length) patch.images = await this.storage.saveMany(data.images, "rooms");

    const editedRoom = await this.roomModel.findByIdAndUpdate(id, patch, { new: true });
    if (!editedRoom) {
      throw new NotFoundException("Номер не найден");
    }
    const hotel = await this.hotelsProvider.getIdHotel(editedRoom.hotel, true);
    return this.formatRoom(editedRoom, hotel, true, true);
  }

  /**
   * @param onlyEnabled true для публичных запросов: отключённые номера
   *        не должны попадать в выдачу и быть доступными к бронированию.
   */
  async getAllRooms(queryParams: SearchRoomsParams, onlyEnabled = false): Promise<SendRoom[]> {
    if (!isValidObjectId(queryParams.hotel)) {
      throw new NotFoundException("Отель не найден");
    }
    const query: FilterQuery<RoomDocument> = {
      hotel: new mongoose.Types.ObjectId(queryParams.hotel),
      deletedAt: null,
    };
    if (onlyEnabled) query.isEnabled = true;
    else if (queryParams.isEnabled !== undefined) query.isEnabled = queryParams.isEnabled;

    const foundRooms = await this.roomModel.find(query).sort({ price: 1, _id: 1 });
    if (!foundRooms.length) return [];

    // Один запрос за отелями на весь список вместо запроса на каждый номер.
    const hotels = await this.hotelsProvider.getHotelsByIds(foundRooms.map((r) => r.hotel));
    return foundRooms.map((el) => this.formatRoom(el, hotels.get(String(el.hotel)), !onlyEnabled, true));
  }

  async countRoomsInHotel(hotelId: string | mongoose.Types.ObjectId): Promise<number> {
    return this.roomModel.countDocuments({
      hotel: new mongoose.Types.ObjectId(String(hotelId)),
      isEnabled: true,
      deletedAt: null,
    });
  }

  async getIdRoom(id: string): Promise<SendRoom> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException("Номер не найден");
    }
    const foundRoom = await this.roomModel.findOne({ _id: id, deletedAt: null });
    if (!foundRoom) {
      throw new NotFoundException("Номер не найден");
    }
    const hotel = await this.hotelsProvider.getIdHotel(foundRoom.hotel, true);
    return this.formatRoom(foundRoom, hotel, true, true);
  }

  /** Номера пачкой по id — используется в списках бронирований. */
  async getRoomsByIds(ids: Array<unknown>): Promise<Map<string, SendRoom>> {
    const unique = [...new Set(ids.map(String))].filter((id) => isValidObjectId(id));
    if (!unique.length) return new Map();
    // Удалённые номера остаются доступны для чтения: на них ссылаются брони
    const rooms = await this.roomModel.find({ _id: { $in: unique } });
    const hotels = await this.hotelsProvider.getHotelsByIds(rooms.map((r) => r.hotel));
    return new Map(rooms.map((r) => [String(r._id), this.formatRoom(r, hotels.get(String(r.hotel)), true, true)]));
  }

  /** Мягкое удаление — бронирования по этому номеру остаются читаемыми. */
  async removeRoom(id: string): Promise<void> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException("Номер не найден");
    }
    const deleted = await this.roomModel.findOneAndUpdate({ _id: id, deletedAt: null }, { deletedAt: new Date() });
    if (!deleted) {
      throw new NotFoundException("Номер не найден");
    }
  }

  private formatRoom(
    room: RoomDocument,
    hotel: HotelDocument | undefined,
    withEnabled: boolean,
    withHotelDescription: boolean
  ): SendRoom {
    return {
      id: room._id,
      title: room.title || "Номер",
      description: room.description,
      price: room.price ?? 0,
      size: room.size ?? 0,
      guests: room.guests ?? 2,
      bed: room.bed ?? "",
      images: (room.images ?? []).map((img: any) => normalizeImageForClient(img)).filter(Boolean),
      isEnabled: withEnabled ? room.isEnabled : undefined,
      hotel: {
        id: hotel?._id,
        image: normalizeImageForClient(hotel?.image),
        title: hotel?.title,
        city: hotel?.city,
        description: withHotelDescription ? hotel?.description : undefined,
      },
    };
  }
}
