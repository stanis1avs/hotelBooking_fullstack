export interface SendReservationForClients {
  id: string
  dateStart: string
  dateEnd: string
  room: {
    description: string
    images: string[] | Buffer[]
  }
  hotel: {
    title: string
  }
}

export interface SendReservationForManagers {
  id: string
  dateStart: string
  dateEnd: string
  client: {
    id: string
    name: string
    contactPhone: string
  }
  room: {
    description: string
  }
  hotel: {
    title: string
  }
}

export interface CreateReservation {
  roomId: string
  dateStart: string
  dateEnd: string
}

export interface reservationsUser {
  userId?: string
}

export interface deleteReservation {
  id: string
}

export interface deleteReservation {
  id: string
}

export interface changReservationParams {
  roomId?: string,
  type?: string,
  title?: string,
  imagesRooms?: [string, string],
  offset?: number
}

export interface recieveResevationList {
  offset: number
}