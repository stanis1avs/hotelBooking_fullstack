import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type Id = string;

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
  name: string;
  contactPhone: string;
  role?: string;
}

export interface UserDto {
  id: Id;
  email: string;
  name: string;
  contactPhone: string;
  role?: string;
}

export interface LoginResponseDto extends UserDto {
  access_token: string;
}

export interface SupportRequestDto {
  id: Id;
  isActive: boolean;
  createdAt: string;
  /** Текст первого сообщения. Раньше сервер отдавал сюда весь документ сообщения. */
  title?: string;
  user?: { name: string; contactPhone: string };
}

export interface SupportMessageDto {
  id: Id;
  text: string;
  createdAt: string;
  readAt: string | null;
  author: Id;
}

export interface ManagerReservationDto {
  id: Id;
  dateStart: string;
  dateEnd: string;
  room: { description: string; images: string[] };
  hotel: { title: string };
  user?: { name: string; contactPhone: string };
}

export type Amenity = 'wifi' | 'parking' | 'breakfast' | 'pool' | 'spa' | 'pets';

export interface HotelDto {
  id: Id;
  title: string;
  description: string;
  image: string;
  city: string;
  stars: number;
  rating: number;
  reviewsCount: number;
  amenities: Amenity[];
  /** Минимальная цена среди доступных номеров, ₽ за ночь */
  minPrice: number;
  roomsCount: number;
}

export interface RoomDto {
  id: Id;
  title: string;
  description: string;
  price: number;
  size: number;
  guests: number;
  bed: string;
  images: string[];
  isEnabled?: boolean;
  hotel: {
    id: Id;
    image: string;
    title: string;
    city?: string;
    description?: string;
  };
}

export interface MetricDto {
  value: number;
  delta: number;
  series: number[];
}

export interface ManagerStatsDto {
  days: number;
  revenue: MetricDto;
  bookings: MetricDto;
  upcoming: MetricDto;
  staying: MetricDto;
}

export interface CreateReservationRequestDto {
  roomId: Id;
  dateStart: string;
  dateEnd: string;
}

export interface ReservationDto {
  id: Id;
  dateStart: string;
  dateEnd: string;
  room: {
    description: string;
    images: string[];
  };
  hotel: {
    title: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class Api {
  private readonly host = environment.api.host;
  private readonly e = environment.api.endpoints;

  constructor(private readonly http: HttpClient) {}

  // Чтение и мутации данных идут через ApolloService.
  // Здесь остаётся только то, что GraphQL не покрывает: загрузка файлов и удаление.

  createHotel(body: FormData) {
    return this.http.post<HotelDto>(`${this.host}/api/admin/hotels`, body);
  }

  updateHotel(hotelId: Id, body: FormData) {
    return this.http.put<HotelDto>(`${this.host}/api/admin/hotels/${hotelId}`, body);
  }

  deleteHotel(hotelId: Id) {
    return this.http.delete<void>(`${this.host}/api/admin/hotels/${hotelId}`);
  }

  createRoom(body: FormData) {
    return this.http.post<RoomDto>(`${this.host}/api/admin/hotel-rooms`, body);
  }

  updateRoom(roomId: Id, body: FormData) {
    return this.http.put<RoomDto>(`${this.host}/api/admin/hotel-rooms/${roomId}`, body);
  }

  deleteRoom(roomId: Id) {
    return this.http.delete<void>(`${this.host}/api/admin/hotel-rooms/${roomId}`);
  }

  /**
   * Полный список отелей для админки — без фильтра по датам.
   * Раньше сюда подставлялись фиктивные даты 2024 года, из-за чего админ видел
   * только первые десять отелей, да ещё и отфильтрованных по броням того года.
   */
  getAllHotels(params: { offset?: number; limit?: number; hotel?: string } = {}) {
    return this.http.get<HotelDto[]>(`${this.host}${this.e.getHotels}`, {
      params: {
        offset: params.offset ?? 0,
        limit: params.limit ?? 50,
        ...(params.hotel ? { hotel: params.hotel } : {}),
      },
      observe: 'response',
    });
  }

  /** Номера для админки — включая отключённые. */
  getAdminRooms(params: { hotel: Id }) {
    return this.http.get<RoomDto[]>(`${this.host}/api/admin/hotel-rooms`, { params: { hotel: params.hotel } });
  }
}
