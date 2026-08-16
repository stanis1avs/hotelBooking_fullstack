import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, isValidObjectId } from "mongoose";
import { ReservationDocument, Reservation } from "../Models/Reservations";
import { RoomsProvider } from "./rooms.provider";
import { UsersProvider } from "./users.provider";
import { SendRoom } from "../Interface/Hotels";
import { Injectable, Inject, BadRequestException, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { CreateReservation, ReservationParams, SendReservationForClients, SendReservationForManagers } from "../Interface/Reservations";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

@Injectable()
export class ReservationsProvider {
  constructor(
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
    @Inject(RoomsProvider) readonly roomsProvider: RoomsProvider,
    @Inject(UsersProvider) readonly usersProvider: UsersProvider
  ) {}

  async createReservation(createReservation: CreateReservation, userId: string): Promise<SendReservationForClients> {
    const dateStart = new Date(createReservation.dateStart);
    const dateEnd = new Date(createReservation.dateEnd);

    if (Number.isNaN(dateStart.getTime()) || Number.isNaN(dateEnd.getTime())) {
      throw new BadRequestException("Некорректные даты бронирования");
    }
    if (dateStart >= dateEnd) {
      throw new BadRequestException("Дата выезда должна быть позже даты заезда");
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateStart < today) {
      throw new BadRequestException("Нельзя забронировать номер задним числом");
    }

    const reservationedRoom = await this.roomsProvider.getIdRoom(createReservation.roomId);
    if (reservationedRoom.isEnabled === false) {
      throw new BadRequestException("Этот номер сейчас недоступен для бронирования");
    }

    // Проверка пересечения: интервалы конфликтуют, если начало одного строго раньше
    // конца другого и наоборот. Без неё один номер бронировался несколько раз на те же даты.
    const overlapping = await this.reservationModel.exists({
      roomId: new mongoose.Types.ObjectId(createReservation.roomId),
      dateStart: { $lt: dateEnd },
      dateEnd: { $gt: dateStart },
    });
    if (overlapping) {
      throw new ConflictException("Номер уже забронирован на выбранные даты");
    }

    const createdReservation = new this.reservationModel({
      roomId: new mongoose.Types.ObjectId(createReservation.roomId),
      userId: new mongoose.Types.ObjectId(userId),
      hotelId: reservationedRoom.hotel.id,
      dateStart,
      dateEnd,
    });
    await createdReservation.save();
    return this.printFormatReservationUser(createdReservation, reservationedRoom);
  }

  async getReservations(queryParams: ReservationParams): Promise<SendReservationForManagers[]> {
    const limit = Math.min(queryParams.limit || DEFAULT_LIMIT, MAX_LIMIT);
    const foundReservations = await this.reservationModel
      .find()
      .sort({ dateStart: -1 })
      .skip(queryParams.offset || 0)
      .limit(limit);
    if (!foundReservations.length) return [];

    // Два пакетных запроса вместо трёх запросов на каждую бронь.
    const [rooms, users] = await Promise.all([
      this.roomsProvider.getRoomsByIds(foundReservations.map((r) => r.roomId)),
      this.usersProvider.getUsersByIds(foundReservations.map((r) => String(r.userId))),
    ]);

    return foundReservations.map((el) =>
      this.printFormatReservationforManager(el, rooms.get(String(el.roomId)), users.get(String(el.userId)))
    );
  }

  async countReservations(): Promise<number> {
    return this.reservationModel.countDocuments();
  }

  async getReservationById(id: string): Promise<SendReservationForClients[]> {
    if (!isValidObjectId(id)) return [];
    const foundReservations = await this.reservationModel
      .find({ userId: new mongoose.Types.ObjectId(id) })
      .sort({ dateStart: -1 });
    if (!foundReservations.length) return [];

    const rooms = await this.roomsProvider.getRoomsByIds(foundReservations.map((r) => r.roomId));
    return foundReservations.map((el) => this.printFormatReservationUser(el, rooms.get(String(el.roomId))));
  }

  /**
   * Возвращает отели, в которых на период не осталось свободных номеров.
   *
   * Раньше условием было `roomIds.length === 2` — предположение «в каждом отеле
   * ровно два номера». Отель с тремя занятыми номерами снова считался свободным,
   * а отель с одним номером не исчезал из выдачи никогда.
   * Теперь количество занятых номеров сравнивается с реальным числом номеров отеля.
   */
  async getReservationsInTime(dateArrival: string, dateDeparture: string): Promise<string[] | null> {
    const booked = await this.bookedRoomsByHotel(dateArrival, dateDeparture);
    if (booked === null) return null;
    if (!booked.size) return [];

    const hotelIds = [...booked.keys()];
    const totals = await Promise.all(hotelIds.map((id) => this.roomsProvider.countRoomsInHotel(id)));

    return hotelIds.filter((id, i) => totals[i] > 0 && booked.get(id) >= totals[i]);
  }

  /**
   * Сколько номеров занято в каждом отеле на период.
   *
   * Тем же счётом пользуется и признак «мест нет», и указание остатка
   * на карточке: гость должен видеть одно и то же число в обоих местах.
   *
   * @returns null, если период не задан или задан неразборчиво
   */
  async bookedRoomsByHotel(dateArrival: string, dateDeparture: string): Promise<Map<string, number> | null> {
    if (!dateArrival || !dateDeparture) return null;

    const from = new Date(dateArrival);
    const to = new Date(dateDeparture);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;

    const overlapping = await this.reservationModel.find({
      dateStart: { $lt: to },
      dateEnd: { $gt: from },
    });

    // Через множество: одна и та же комната может быть занята несколькими
    // бронями подряд внутри периода, но занимает она всё равно одну единицу.
    const roomsByHotel = new Map<string, Set<string>>();
    for (const item of overlapping) {
      const hotelId = String(item.hotelId);
      if (!roomsByHotel.has(hotelId)) roomsByHotel.set(hotelId, new Set());
      roomsByHotel.get(hotelId).add(String(item.roomId));
    }

    return new Map([...roomsByHotel].map(([hotelId, rooms]) => [hotelId, rooms.size]));
  }

  async removeReservation(id: string, userId: string | null = null): Promise<void> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException("Бронирование не найдено");
    }
    const reservation = await this.reservationModel.findById(id);
    if (!reservation) {
      throw new NotFoundException("Бронирование не найдено");
    }
    if (userId && String(reservation.userId) !== String(userId)) {
      throw new ForbiddenException("Это бронирование принадлежит другому пользователю");
    }
    await this.reservationModel.findByIdAndDelete(id);
  }

  printFormatReservationUser(reservation: ReservationDocument, room: SendRoom | undefined): SendReservationForClients {
    return {
      id: reservation._id,
      dateStart: new Date(reservation.dateStart).toISOString(),
      dateEnd: new Date(reservation.dateEnd).toISOString(),
      room: {
        description: room?.description ?? "Номер удалён",
        images: room?.images ?? [],
      },
      hotel: { title: room?.hotel?.title ?? "Отель удалён" },
    };
  }

  printFormatReservationforManager(
    reservation: ReservationDocument,
    room: SendRoom | undefined,
    user: { id: string; name: string; contactPhone: string } | undefined
  ): SendReservationForManagers {
    return {
      id: reservation._id,
      dateStart: new Date(reservation.dateStart).toISOString(),
      dateEnd: new Date(reservation.dateEnd).toISOString(),
      client: {
        id: user?.id ? String(user.id) : "",
        name: user?.name ?? "Пользователь удалён",
        contactPhone: user?.contactPhone ?? "",
      },
      room: { description: room?.description ?? "Номер удалён" },
      hotel: { title: room?.hotel?.title ?? "Отель удалён" },
    };
  }
}
