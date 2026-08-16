import { Test } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { BadRequestException, ConflictException, ForbiddenException } from "@nestjs/common";
import { ReservationsProvider } from "./reservations.provider";
import { RoomsProvider } from "./rooms.provider";
import { UsersProvider } from "./users.provider";
import { Reservation } from "../Models/Reservations";

const ROOM_ID = "507f1f77bcf86cd799439011";
const USER_ID = "507f1f77bcf86cd799439012";

const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

function build(model: Record<string, unknown>, rooms: Partial<RoomsProvider> = {}) {
  return Test.createTestingModule({
    providers: [
      ReservationsProvider,
      { provide: getModelToken(Reservation.name), useValue: model },
      {
        provide: RoomsProvider,
        useValue: {
          getIdRoom: jest.fn().mockResolvedValue({
            id: ROOM_ID,
            isEnabled: true,
            description: "Номер",
            images: [],
            hotel: { id: "h1", title: "Отель" },
          }),
          getRoomsByIds: jest.fn().mockResolvedValue(new Map()),
          countRoomsInHotel: jest.fn().mockResolvedValue(2),
          ...rooms,
        },
      },
      { provide: UsersProvider, useValue: { getUsersByIds: jest.fn().mockResolvedValue(new Map()) } },
    ],
  })
    .compile()
    .then((m) => m.get(ReservationsProvider));
}

function reservationModel(overrides: Record<string, unknown> = {}) {
  function Model(this: any, doc: Record<string, unknown>) {
    Object.assign(this, doc, { _id: "r1" });
    this.save = () => Promise.resolve(this);
  }
  Object.assign(Model, {
    exists: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    findByIdAndDelete: jest.fn().mockResolvedValue({}),
    countDocuments: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue([]),
    ...overrides,
  });
  return Model;
}

describe("ReservationsProvider", () => {
  describe("createReservation", () => {
    it("отклоняет пересечение с существующей бронью", async () => {
      const provider = await build(reservationModel({ exists: jest.fn().mockResolvedValue({ _id: "busy" }) }) as never);

      await expect(
        provider.createReservation({ roomId: ROOM_ID, dateStart: tomorrow(), dateEnd: inDays(3) }, USER_ID)
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("не принимает выезд раньше заезда", async () => {
      const provider = await build(reservationModel() as never);

      await expect(
        provider.createReservation({ roomId: ROOM_ID, dateStart: inDays(5), dateEnd: inDays(2) }, USER_ID)
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("не принимает даты задним числом", async () => {
      const provider = await build(reservationModel() as never);

      await expect(
        provider.createReservation({ roomId: ROOM_ID, dateStart: inDays(-5), dateEnd: inDays(-2) }, USER_ID)
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("отклоняет бронирование отключённого номера", async () => {
      const provider = await build(reservationModel() as never, {
        getIdRoom: jest.fn().mockResolvedValue({
          id: ROOM_ID,
          isEnabled: false,
          description: "Номер",
          images: [],
          hotel: { id: "h1", title: "Отель" },
        }),
      });

      await expect(
        provider.createReservation({ roomId: ROOM_ID, dateStart: tomorrow(), dateEnd: inDays(3) }, USER_ID)
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("getReservationsInTime", () => {
    it("считает отель занятым только когда заняты все его номера", async () => {
      // В отеле два номера, забронирован один — отель остаётся в выдаче.
      // Раньше здесь стояло сравнение с числом 2, зашитым в код.
      const provider = await build(
        reservationModel({
          find: jest.fn().mockResolvedValue([{ hotelId: "h1", roomId: "r1" }]),
        }) as never,
        { countRoomsInHotel: jest.fn().mockResolvedValue(2) }
      );

      const busy = await provider.getReservationsInTime(tomorrow(), inDays(3));
      expect(busy).toEqual([]);
    });

    it("исключает отель, когда занят каждый номер", async () => {
      const provider = await build(
        reservationModel({
          find: jest.fn().mockResolvedValue([
            { hotelId: "h1", roomId: "r1" },
            { hotelId: "h1", roomId: "r2" },
            { hotelId: "h1", roomId: "r3" },
          ]),
        }) as never,
        { countRoomsInHotel: jest.fn().mockResolvedValue(3) }
      );

      const busy = await provider.getReservationsInTime(tomorrow(), inDays(3));
      expect(busy).toEqual(["h1"]);
    });

    it("возвращает null без дат", async () => {
      const provider = await build(reservationModel() as never);
      expect(await provider.getReservationsInTime("", "")).toBeNull();
    });
  });

  describe("removeReservation", () => {
    it("не даёт удалить чужую бронь", async () => {
      const provider = await build(
        reservationModel({
          findById: jest.fn().mockResolvedValue({ _id: "r1", userId: "someone-else" }),
        }) as never
      );

      await expect(provider.removeReservation("507f1f77bcf86cd799439013", USER_ID)).rejects.toBeInstanceOf(
        ForbiddenException
      );
    });

    it("менеджер удаляет любую бронь: владелец не передан", async () => {
      const model = reservationModel({
        findById: jest.fn().mockResolvedValue({ _id: "r1", userId: "someone-else" }),
      });
      const provider = await build(model as never);

      await expect(provider.removeReservation("507f1f77bcf86cd799439013", null)).resolves.toBeUndefined();
      expect((model as never as { findByIdAndDelete: jest.Mock }).findByIdAndDelete).toHaveBeenCalled();
    });
  });
});
