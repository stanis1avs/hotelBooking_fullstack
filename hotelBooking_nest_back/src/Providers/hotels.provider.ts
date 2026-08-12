import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, isValidObjectId } from "mongoose";
import { Hotel, HotelDocument } from "../Models/Hotels";
import { CreateHotel, UpdateHotelParams, SearchHotelParams, SendHotel } from "../Interface/Hotels";
import { normalizeImageForClient } from "../utils/image.utils";

const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

@Injectable()
export class HotelsProvider {
  constructor(@InjectModel(Hotel.name) private hotelModel: Model<HotelDocument>) {}

  async createHotel(createHotel: CreateHotel): Promise<SendHotel> {
    const createdHotel = new this.hotelModel({
      title: createHotel.title,
      description: createHotel.description,
      image: createHotel.image.toString("base64"),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await createdHotel.save();
    return this.printFormatHotel(createdHotel);
  }

  private buildQuery(queryParams: SearchHotelParams, reservedHotels: string[] | null): FilterQuery<HotelDocument> {
    const query: FilterQuery<HotelDocument> = {};
    // $nin с null роняет запрос — массив подставляем только когда он непустой.
    if (reservedHotels?.length) query._id = { $nin: reservedHotels };
    if (queryParams.hotel?.trim()) {
      query.title = { $regex: escapeRegex(queryParams.hotel.trim()), $options: "i" };
    }
    return query;
  }

  async getAllHotels(queryParams: SearchHotelParams, reservedHotels: string[] | null): Promise<SendHotel[]> {
    const limit = Math.min(queryParams.limit || DEFAULT_LIMIT, MAX_LIMIT);
    const foundHotels = await this.hotelModel
      .find(this.buildQuery(queryParams, reservedHotels))
      .sort({ _id: 1 })
      .skip(queryParams.offset || 0)
      .limit(limit);
    return foundHotels.map((el) => this.printFormatHotel(el));
  }

  async countHotels(queryParams: SearchHotelParams, reservedHotels: string[] | null): Promise<number> {
    return this.hotelModel.countDocuments(this.buildQuery(queryParams, reservedHotels));
  }

  async editHotel(id: string, data: UpdateHotelParams): Promise<SendHotel> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException("Отель не найден");
    }
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    // Картинку перезаписываем только если её действительно прислали.
    if (data.image) patch.image = data.image.toString("base64");

    const edittedHotel = await this.hotelModel.findByIdAndUpdate(id, patch, { new: true });
    if (!edittedHotel) {
      throw new NotFoundException("Отель не найден");
    }
    return this.printFormatHotel(edittedHotel);
  }

  async getIdHotel(id: HotelDocument | string): Promise<HotelDocument> {
    const hotelId = typeof id === "string" ? id : String((id as HotelDocument)?._id ?? id);
    if (!isValidObjectId(hotelId)) {
      throw new NotFoundException("Отель не найден");
    }
    const hotel = await this.hotelModel.findById(hotelId);
    if (!hotel) {
      throw new NotFoundException("Отель не найден");
    }
    return hotel;
  }

  /** Пакетная загрузка отелей — заменяет запрос на каждый номер в списке (N+1). */
  async getHotelsByIds(ids: Array<unknown>): Promise<Map<string, HotelDocument>> {
    const unique = [...new Set(ids.map((i) => String((i as HotelDocument)?._id ?? i)))]
      .filter((id) => isValidObjectId(id));
    if (!unique.length) return new Map();
    const hotels = await this.hotelModel.find({ _id: { $in: unique } });
    return new Map(hotels.map((h) => [String(h._id), h]));
  }

  async removeHotel(id: string): Promise<void> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException("Отель не найден");
    }
    const deleted = await this.hotelModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundException("Отель не найден");
    }
  }

  // Нормализация живёт здесь, поэтому create/edit и список отдают картинку в одном формате.
  printFormatHotel(hotel: HotelDocument): SendHotel {
    return {
      id: hotel._id,
      title: hotel.title,
      description: hotel.description,
      image: normalizeImageForClient(hotel.image),
    };
  }
}
