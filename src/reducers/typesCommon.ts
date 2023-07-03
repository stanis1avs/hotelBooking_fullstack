import { SendRoom, SendHotel } from './typesHotelRoom'
import { SendUser } from './typesManageUsers'
import { SendReservationForManagers, SendReservationForClients } from './typesReservationPage'
import { SendRequests, SendMessages } from './typesSupportChat'

export interface initStateForHotelsList {
  hotels: SendHotel[],
  offset: number,
  hotel: string,
  dateArrival: string,
  dateDeparture: string,
  error: any
}

export interface initStateForHotelPage {
  rooms: SendRoom[],
  id: string,
  nameHotel: string,
  descriptionHotel: string,
  imageHotel: string | Blob | null,
  descriptionRooms: [string, string],
  imagesRooms: {
    standart: [Blob | string | null, Blob | string | null],
    lux: [Blob | string | null, Blob | string | null]
  },
  descriptionRoom: string,
  imagesRoom: [Blob | string, Blob | string],
  roomsId: [string | null, string | null],
  roomId: string,
  error: any
}

export interface initStateForUsersPage {
  users: SendUser[],
  offset: number,
  name: string,
  email: string,
  contactPhone: string,
  error: any
}

export interface initStateForClientAuth {
  id: string | null,
  email: string | null,
  name: string | null,
  contactPhone: string | null,
  role: string | null,
  needAuth: boolean,
  error: any
}

export interface initStateForReservationList {
  // reservations: SendReservationForManagers[] | SendReservationForClients[],
  reservations: any,
  offset: number,
  roomId: string,
  type: string,
  title: string,
  imagesRooms: [string | null, string | null],
  dateStart: string,
  dateEnd: string,
  error: any
}

export interface initStateForSupportChat {
  requests: SendRequests[],
  messages: SendMessages[],
  socket: any,
  data: any,
  event: string,
  id: string,
  error: any
}