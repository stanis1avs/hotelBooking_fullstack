import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, {Model} from 'mongoose';
import { Room, RoomDocument} from '../Models/Rooms'
import { HotelDocument} from '../Models/Hotels'
import { HotelsProvider } from './hotels.provider'
import { CreateRoom, UpdateRoomParams, SearchRoomsParams, SendRoom} from '../Interface/Hotels'

@Injectable()
export class RoomsProvider {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    @Inject(HotelsProvider) readonly hotelsProvider: HotelsProvider,
  ){}

  async createRoom(createRoom: CreateRoom): Promise<SendRoom> {
    const createdRoom = new this.roomModel({
      ...createRoom,
      hotel: new mongoose.Types.ObjectId(createRoom.hotelId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await createdRoom.save();
    return await this.printFormatRoom(createdRoom, createRoom.hotelId, true, true);
  }

  async editRoom(id: string, data: UpdateRoomParams): Promise<SendRoom> {
    const editedRoom = await this.roomModel.findByIdAndUpdate(id, {
      ...data,
      updatedAt: new Date().toISOString()
    }, {returnDocument: 'after'})
    if(!editedRoom){
      throw new BadRequestException()
    }
    return this.printFormatRoom(editedRoom, editedRoom.hotel, true, true)
  }

  async getAllRooms(queryParams: SearchRoomsParams): Promise<SendRoom[]>{
    const foundRooms = await this.roomModel.find(
      {hotel: new mongoose.Types.ObjectId(queryParams.hotel)});
    if(!foundRooms){
      throw new BadRequestException()
    }
    return await Promise.all(
      foundRooms.map(async (el) => await this.printFormatRoom(el, el.hotel, false, true))
    )
  }

  async getIdRoom(id: string): Promise<SendRoom> {
    const foundRoom = await this.roomModel.findById(id);
    if(!foundRoom){
      throw new BadRequestException()
    }
    return await this.printFormatRoom(foundRoom, foundRoom.hotel, false, true)
  }


  async removeRoom(id: string): Promise<void> {
    await this.roomModel.findByIdAndDelete(id)
  }

  async printFormatRoom(room: RoomDocument, hotelId: HotelDocument | string, isEnabl: boolean, isHotelDeskr: boolean): Promise<SendRoom>{
    const {_id, title, description, image} = await this.hotelsProvider.getIdHotel(hotelId)
    return {
      id: room._id,
      description: room.description,
      images: room.images,
      isEnabled: isEnabl ? room.isEnabled : undefined,
      hotel: {
        id: _id,
        image,
        title,
        description: isHotelDeskr ? description : undefined
      }
    }
  }
}