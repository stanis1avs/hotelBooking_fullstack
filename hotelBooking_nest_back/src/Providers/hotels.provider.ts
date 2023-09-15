import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Hotel, HotelDocument } from "../Models/Hotels";
import { CreateHotel, UpdateHotelParams, SearchHotelParams, SendHotel } from "../Interface/Hotels";

@Injectable()
export class HotelsProvider {
  constructor(@InjectModel(Hotel.name) private hotelModel: Model<HotelDocument>) {}

  async createHotel(createHotel: CreateHotel): Promise<SendHotel> {
    const createdHotel = new this.hotelModel({
      ...createHotel,
      image: Buffer.from(createHotel.image).toString("base64").toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await createdHotel.save();
    return this.printFormatHotel(createdHotel);
  }

  async getAllHotels(queryParams: SearchHotelParams, reservedHotels: string[] | null): Promise<SendHotel[]> {
    const foundHotels = await this.hotelModel
      .find({
        _id: { $nin: reservedHotels },
        title: { $regex: queryParams.hotel, $options: "i" },
      })
      .skip(queryParams.offset)
      .limit(10);
    if (!foundHotels) {
      throw new BadRequestException();
    }
    return foundHotels.map((el) => this.printFormatHotel(el));
  }

  async editHotel(id: string, data: UpdateHotelParams): Promise<SendHotel> {
    const edittedHotel = await this.hotelModel.findByIdAndUpdate(
      id,
      {
        ...data,
        image: typeof data.image == "string" ? data.image : Buffer.from(data.image).toString("base64").toString(),
        updatedAt: new Date().toISOString(),
      },
      { returnDocument: "after" }
    );
    if (!edittedHotel) {
      throw new BadRequestException();
    }
    return this.printFormatHotel(edittedHotel);
  }

  async getIdHotel(id: HotelDocument | string): Promise<HotelDocument> {
    const hotel = await this.hotelModel.findById(id);
    if (!hotel) {
      throw new BadRequestException();
    }
    return hotel;
  }

  async removeHotel(id: string): Promise<void> {
    await this.hotelModel.findByIdAndDelete(id);
  }

  printFormatHotel(hotel: HotelDocument): SendHotel {
    return {
      id: hotel._id,
      title: hotel.title,
      description: hotel.description,
      image: hotel.image,
    };
  }
}
