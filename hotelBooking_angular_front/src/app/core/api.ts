import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type Id = string;

/**
 * Страница выдачи. Общее количество приходит с сервера: без него
 * `mat-paginator` не может показать ни номер последней страницы, ни «N из M»,
 * а наличие следующей приходилось угадывать по совпадению размера ответа с лимитом.
 */
export interface PageDto<T> {
  items: T[];
  total: number;
}

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
/** Тип направления: по нему работают подборки в поиске. */
export type Destination = 'sea' | 'mountains' | 'city' | 'countryside' | 'ski';

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
  destinations: Destination[];
  /** Минимальная цена среди доступных номеров, ₽ за ночь */
  minPrice: number;
  roomsCount: number;
  /** Свободно на выбранные даты — из этого числа берётся указание остатка */
  freeRooms?: number;
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

  constructor(private readonly http: HttpClient) {}

  /**
   * Единственное, что осталось за REST, — загрузка файлов.
   *
   * Всё чтение, удаление и остальные мутации живут в GraphQL. Здесь multipart:
   * Apollo Client в этой сборке файлы не возит, а тащить ради двух форм
   * graphql-upload с его серверной частью — обмен худший, чем два HTTP-вызова.
   */
  createHotel(body: FormData) {
    return this.http.post<HotelDto>(`${this.host}/api/admin/hotels`, body);
  }

  updateHotel(hotelId: Id, body: FormData) {
    return this.http.put<HotelDto>(`${this.host}/api/admin/hotels/${hotelId}`, body);
  }

  createRoom(body: FormData) {
    return this.http.post<RoomDto>(`${this.host}/api/admin/hotel-rooms`, body);
  }

  updateRoom(roomId: Id, body: FormData) {
    return this.http.put<RoomDto>(`${this.host}/api/admin/hotel-rooms/${roomId}`, body);
  }
}
