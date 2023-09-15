import * as mongoose from "mongoose";

export class CreateRoom {
  description: string;
  hotelId: string;
  images: Buffer[];
  isEnabled?: boolean;
}

export class SendRoom {
  id: mongoose.Types.ObjectId;
  description: string;
  images: string[] | Buffer[];
  isEnabled?: boolean;
  hotel: {
    id: mongoose.Types.ObjectId;
    image: string;
    title: string;
    description?: string;
  };
}

export class CreateHotel {
  description: string;
  title: string;
  image: Buffer;
}

export class SendHotel {
  id: mongoose.Types.ObjectId;
  description: string;
  title: string;
  image: string;
}

export class SearchHotelParams {
  offset: number;
  hotel?: string;
  dateArrival: string;
  dateDeparture: string;
}

export class UpdateHotelParams {
  title?: string;
  description?: string;
  image?: string | Buffer;
}

export class UpdateRoomParams {
  isEnabled?: boolean;
  description?: string;
  images?: string[] | Buffer[];
}

export class SearchRoomsParams {
  hotel: string;
  isEnabled?: boolean;
}
