import * as mongoose from "mongoose";

export class CreateReservation {
  roomId: string;
  dateStart: string;
  dateEnd: string;
}

export class SendReservationForClients {
  id: mongoose.Types.ObjectId;
  dateStart: string;
  dateEnd: string;
  room: {
    description: string;
    images: string[] | Buffer[];
  };
  hotel: {
    title: string;
  };
}

export class SendReservationForManagers {
  id: mongoose.Types.ObjectId;
  dateStart: string;
  dateEnd: string;
  client: {
    id: string;
    name: string;
    contactPhone: string;
  };
  room: {
    description: string;
  };
  hotel: {
    title: string;
  };
}

export class ReservationParams {
  offset: number;
}
