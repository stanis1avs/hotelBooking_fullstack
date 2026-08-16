import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, isValidObjectId } from "mongoose";
import { Hotel, HotelDocument } from "../Models/Hotels";
import { Room, RoomDocument } from "../Models/Rooms";
import { CreateHotel, UpdateHotelParams, SearchHotelParams, SendHotel } from "../Interface/Hotels";
import { normalizeImageForClient } from "../utils/image.utils";
import { FileStorage } from "../utils/file-storage";

const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 12;

interface PriceInfo {
  minPrice: number;
  roomsCount: number;
}

@Injectable()
export class HotelsProvider {
  constructor(
    @InjectModel(Hotel.name) private hotelModel: Model<HotelDocument>,
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    private readonly storage: FileStorage
  ) {}

  async createHotel(createHotel: CreateHotel): Promise<SendHotel> {
    // Картинка уходит в файл, в документе остаётся путь
    const image = await this.storage.save(createHotel.image, "hotels");
    const createdHotel = new this.hotelModel({
      title: createHotel.title,
      description: createHotel.description,
      city: createHotel.city,
      stars: createHotel.stars ?? 3,
      rating: createHotel.rating ?? 0,
      reviewsCount: createHotel.reviewsCount ?? 0,
      amenities: createHotel.amenities ?? [],
      image,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await createdHotel.save();
    return this.printFormatHotel(createdHotel);
  }

  /** Удалённые записи не участвуют ни в выдаче, ни в подсчётах. */
  private readonly alive = { deletedAt: null };

  private buildQuery(queryParams: SearchHotelParams, reservedHotels: string[] | null): FilterQuery<HotelDocument> {
    const query: FilterQuery<HotelDocument> = { ...this.alive };
    // $nin с null роняет запрос — массив подставляем только когда он непустой.
    if (reservedHotels?.length) query._id = { $nin: reservedHotels };
    if (queryParams.hotel?.trim()) {
      const term = escapeRegex(queryParams.hotel.trim());
      // Поиск и по названию, и по городу: гость чаще ищет направление, а не отель
      query.$or = [{ title: { $regex: term, $options: "i" } }, { city: { $regex: term, $options: "i" } }];
    }
    return query;
  }

  async getAllHotels(queryParams: SearchHotelParams, reservedHotels: string[] | null): Promise<SendHotel[]> {
    const limit = Math.min(queryParams.limit || DEFAULT_LIMIT, MAX_LIMIT);
    const foundHotels = await this.hotelModel
      .find(this.buildQuery(queryParams, reservedHotels))
      .sort({ rating: -1, _id: 1 })
      .skip(queryParams.offset || 0)
      .limit(limit);
    if (!foundHotels.length) return [];

    // Одна агрегация на весь список вместо запроса цен по каждому отелю
    const prices = await this.priceIndex(foundHotels.map((h) => h._id));
    return foundHotels.map((el) => this.printFormatHotel(el, prices.get(String(el._id))));
  }

  /** Минимальная цена и количество доступных номеров по каждому отелю. */
  private async priceIndex(hotelIds: unknown[]): Promise<Map<string, PriceInfo>> {
    const rows = await this.roomModel.aggregate<{ _id: unknown; minPrice: number; roomsCount: number }>([
      { $match: { hotel: { $in: hotelIds }, isEnabled: true, deletedAt: null } },
      { $group: { _id: "$hotel", minPrice: { $min: "$price" }, roomsCount: { $sum: 1 } } },
    ]);
    return new Map(rows.map((r) => [String(r._id), { minPrice: r.minPrice ?? 0, roomsCount: r.roomsCount }]));
  }

  async countHotels(queryParams: SearchHotelParams, reservedHotels: string[] | null): Promise<number> {
    return this.hotelModel.countDocuments(this.buildQuery(queryParams, reservedHotels));
  }

  async editHotel(id: string, data: UpdateHotelParams): Promise<SendHotel> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException("Отель не найден");
    }
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    for (const field of ["title", "description", "city", "stars", "rating", "reviewsCount", "amenities"] as const) {
      if (data[field] !== undefined) patch[field] = data[field];
    }
    // Картинку перезаписываем только если её действительно прислали.
    if (data.image) patch.image = await this.storage.save(data.image, "hotels");

    const edittedHotel = await this.hotelModel.findByIdAndUpdate(id, patch, { new: true });
    if (!edittedHotel) {
      throw new NotFoundException("Отель не найден");
    }
    const prices = await this.priceIndex([edittedHotel._id]);
    return this.printFormatHotel(edittedHotel, prices.get(String(edittedHotel._id)));
  }

  /**
   * @param includeDeleted нужен для карточек в бронированиях: там отель
   *        показывается даже после удаления, иначе история ломается.
   */
  async getIdHotel(id: HotelDocument | string, includeDeleted = false): Promise<HotelDocument> {
    const hotelId = typeof id === "string" ? id : String((id as HotelDocument)?._id ?? id);
    if (!isValidObjectId(hotelId)) {
      throw new NotFoundException("Отель не найден");
    }
    const hotel = await this.hotelModel.findOne({
      _id: hotelId,
      ...(includeDeleted ? {} : this.alive),
    });
    if (!hotel) {
      throw new NotFoundException("Отель не найден");
    }
    return hotel;
  }

  async getHotelCard(id: string): Promise<SendHotel> {
    const hotel = await this.getIdHotel(id);
    const prices = await this.priceIndex([hotel._id]);
    return this.printFormatHotel(hotel, prices.get(String(hotel._id)));
  }

  /** Пакетная загрузка отелей — заменяет запрос на каждый номер в списке (N+1). */
  async getHotelsByIds(ids: Array<unknown>): Promise<Map<string, HotelDocument>> {
    const unique = [...new Set(ids.map((i) => String((i as HotelDocument)?._id ?? i)))]
      .filter((id) => isValidObjectId(id));
    if (!unique.length) return new Map();
    // Без фильтра по deletedAt: в бронированиях удалённый отель
    // всё равно должен показываться, иначе история теряет данные
    const hotels = await this.hotelModel.find({ _id: { $in: unique } });
    return new Map(hotels.map((h) => [String(h._id), h]));
  }

  /**
   * Мягкое удаление: отель пропадает из поиска, но остаётся в базе.
   * Жёсткое удаление обрывало ссылки из бронирований, и список броней
   * у менеджера падал на первой же записи с удалённым отелем.
   */
  async removeHotel(id: string): Promise<void> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException("Отель не найден");
    }
    const deleted = await this.hotelModel.findOneAndUpdate(
      { _id: id, ...this.alive },
      { deletedAt: new Date() }
    );
    if (!deleted) {
      throw new NotFoundException("Отель не найден");
    }
    // Номера удалённого отеля тоже уходят из выдачи
    await this.roomModel.updateMany({ hotel: deleted._id, deletedAt: null }, { deletedAt: new Date() });
  }

  // Нормализация живёт здесь, поэтому create/edit и список отдают картинку в одном формате.
  printFormatHotel(hotel: HotelDocument, price?: PriceInfo): SendHotel {
    return {
      id: hotel._id,
      title: hotel.title,
      description: hotel.description,
      image: normalizeImageForClient(hotel.image),
      city: hotel.city ?? "",
      stars: hotel.stars ?? 3,
      rating: hotel.rating ?? 0,
      reviewsCount: hotel.reviewsCount ?? 0,
      amenities: hotel.amenities ?? [],
      minPrice: price?.minPrice ?? 0,
      roomsCount: price?.roomsCount ?? 0,
    };
  }
}
