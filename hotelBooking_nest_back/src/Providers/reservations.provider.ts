import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { ReservationDocument, Reservation } from "../Models/Reservations";
import { RoomsProvider } from "./rooms.provider";
import { UsersProvider } from "./users.provider";
import { SendRoom } from "../Interface/Hotels";
import { SendUser } from "../Interface/Users";
import { Injectable, Inject, BadRequestException, ForbiddenException } from "@nestjs/common";
import { CreateReservation, ReservationParams, SendReservationForClients, SendReservationForManagers } from "../Interface/Reservations";

@Injectable()
export class ReservationsProvider {
  constructor(
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
    @Inject(RoomsProvider) readonly roomsProvider: RoomsProvider,
    @Inject(UsersProvider) readonly usersProvider: UsersProvider
  ) {}

  async createReservation(createReservation: CreateReservation, userId: string): Promise<void> {
    const reservationedRoom = await this.getHotelandRoom(createReservation.roomId);
    const createdReservation = new this.reservationModel({
      ...createReservation,
      dateStart: new Date(createReservation.dateStart).toISOString(),
      dateEnd: new Date(createReservation.dateEnd).toISOString(),
      userId: userId,
      hotelId: reservationedRoom.hotel.id,
    });
    await createdReservation.save();
  }

  async getReservations(queryParams: ReservationParams): Promise<SendReservationForManagers[]> {
    const foundReservations = await this.reservationModel.find().skip(queryParams.offset).limit(50);
    if (!foundReservations) {
      throw new BadRequestException();
    }
    return await Promise.all(
      foundReservations.map(async (el) => {
        const reservationedRoom = await this.getHotelandRoom(el.roomId);
        const reservationedUser = await this.getClient(el.userId);
        return this.printFormatReservationforManager(el, reservationedRoom, reservationedUser);
      })
    );
  }

  async getReservationById(id: string): Promise<SendReservationForClients[]> {
    const foundReservations = await this.reservationModel.find({
      userId: new mongoose.Types.ObjectId(id),
    });
    if (!foundReservations) {
      throw new BadRequestException();
    }
    return await Promise.all(
      foundReservations.map(async (el) => {
        const reservationedRoom = await this.getHotelandRoom(el.roomId);
        return this.printFormatReservationUser(el, reservationedRoom);
      })
    );
  }

  async getReservationsInTime(dateArrival: string, dateDeparture: string): Promise<string[] | null> {
    if (dateArrival && dateDeparture) {
      const foundReservations = await this.reservationModel.find({
        $and: [
          { dateStart: { $lt: dateDeparture } }, // dateStart > dateDeparture
          { dateEnd: { $gt: dateArrival } }, // dateEnd < dateArrival
        ],
      });
      const hotelsWithSingleRoomId = Object.entries(
        foundReservations.reduce((acc, item) => {
          const hotelId = item.hotelId.toString();
          const roomId = item.roomId.toString();
          if (!acc[hotelId]) {
            acc[hotelId] = [roomId];
          } else if (!acc[hotelId].includes(roomId)) {
            acc[hotelId].push(roomId);
          }
          return acc;
        }, {})
      )
        // eslint-disable-next-line
        .filter(([_, roomIds]: [any, string[]]) => roomIds.length === 2)
        // eslint-disable-next-line
        .map(([hotelId, _]: [string, any]) => hotelId);
      return hotelsWithSingleRoomId;
    }
    return null;
  }

  async removeReservation(id: string, userId: string | null = null): Promise<void> {
    const reservation = await this.reservationModel.findById(id);
    if (!reservation) {
      throw new BadRequestException();
    }
    if (userId && reservation.userId.toString() != userId) {
      throw new ForbiddenException();
    }
    await this.reservationModel.findByIdAndDelete(id);
  }

  async getHotelandRoom(id: any): Promise<SendRoom> {
    return await this.roomsProvider.getIdRoom(id);
  }

  async getClient(id: any): Promise<SendUser> {
    return await this.usersProvider.getIdUser(id);
  }

  printFormatReservationUser(reservation: ReservationDocument, reservationedRoom: SendRoom): SendReservationForClients {
    return {
      id: reservation._id,
      dateStart: new Date(reservation.dateStart).toISOString(),
      dateEnd: new Date(reservation.dateEnd).toISOString(),
      room: {
        description: reservationedRoom.description,
        images: reservationedRoom.images,
      },
      hotel: {
        title: reservationedRoom.hotel.title,
      },
    };
  }

  printFormatReservationforManager(reservation: ReservationDocument, reservationedRoom: SendRoom, reservationedUser: SendUser): SendReservationForManagers {
    return {
      id: reservation._id,
      dateStart: new Date(reservation.dateStart).toISOString(),
      dateEnd: new Date(reservation.dateEnd).toISOString(),
      client: {
        id: reservationedUser.id,
        name: reservationedUser.name,
        contactPhone: reservationedUser.contactPhone,
      },
      room: {
        description: reservationedRoom.description,
      },
      hotel: {
        title: reservationedRoom.hotel.title,
      },
    };
  }
}
