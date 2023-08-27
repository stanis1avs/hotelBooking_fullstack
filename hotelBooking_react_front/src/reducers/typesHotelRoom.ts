export interface SendRoom {
  id: string
  description: string
  images: string[]
  isEnabled?: boolean
  hotel: SendHotel
}

export interface SendHotel {
  id: string
  description: string
  title: string
  image: string
}

export interface deleteRoom {
  roomId: string
}

export interface deleteHotel {
  id: string
}

export interface recieveHotelPage {
  id: string
}

export interface createHotel {
  nameHotel: string
  descriptionHotel: string
  imageHotel: Blob
}

export interface updateHotel {
  nameHotel: string
  descriptionHotel: string
  imageHotel: Blob | string
  id: string
}

export interface createRoom {
  descriptionRoom: string
  imagesRoom: any
  // imagesRoom: [Blob, Blob],
  id: string
}

export interface updateRoom {
  descriptionRoom: string
  imagesRoom: any
  // imagesRoom: [Blob | string, Blob | string],
  roomId: string
}

export interface changeStateWithoutRequestType {
  id?: string
  nameHotel?: string
  descriptionHotel?: string
  imageHotel?: string | Blob | null
  descriptionRooms?: [string, string]
  imagesRooms?: {
    standart: [Blob | string, Blob | string | null]
    lux: [Blob | string, Blob | string | null]
  }
  roomsId?: [string | null, string | null]
}

export interface recieveSearchInfo {
  offset: number
  hotel: string
  dateArrival: string
  dateDeparture: string
}

export interface changSearchParams {
  offset?: number
  hotel?: string
  dateArrival?: string
  dateDeparture?: string
}
