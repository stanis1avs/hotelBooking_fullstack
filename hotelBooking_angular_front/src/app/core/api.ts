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
  refresh_token: string;
}

export interface HotelDto {
  id: Id;
  title: string;
  description: string;
  image: string;
}

export interface RoomDto {
  id: Id;
  description: string;
  images: string[];
  isEnabled?: boolean;
  hotel: {
    id: Id;
    image: string;
    title: string;
    description?: string;
  };
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

  authLogin(body: LoginRequestDto) {
    return this.http.post<LoginResponseDto>(`${this.host}${this.e.authLogin}`, body);
  }

  authLogout() {
    return this.http.post<void>(`${this.host}${this.e.authLogout}`, {});
  }

  register(body: RegisterRequestDto) {
    return this.http.post<UserDto>(`${this.host}${this.e.register}`, body);
  }

  getHotels(params: { offset: number; hotel?: string; dateArrival: string; dateDeparture: string }) {
    return this.http.get<HotelDto[]>(`${this.host}${this.e.getHotels}`, { params });
  }

  getRooms(params: { hotel: Id; isEnabled?: boolean }) {
    return this.http.get<RoomDto[]>(`${this.host}${this.e.getRooms}`, { params: params as any });
  }

  getRoomById(roomId: Id) {
    return this.http.get<RoomDto>(`${this.host}${this.e.getRooms}${roomId}`);
  }

  editHotel(hotelId: Id, body: unknown) {
    return this.http.put<unknown>(`${this.host}${this.e.editHotels}${hotelId}`, body);
  }

  editRoom(roomId: Id, body: unknown) {
    return this.http.put<unknown>(`${this.host}${this.e.editRooms}${roomId}`, body);
  }

  getReservations() {
    return this.http.get<ReservationDto[]>(`${this.host}${this.e.reservationsOut}`);
  }

  createReservation(body: CreateReservationRequestDto) {
    return this.http.post<ReservationDto>(`${this.host}${this.e.reservationsIn}`, body);
  }

  deleteReservation(reservationId: Id) {
    return this.http.delete<void>(`${this.host}${this.e.reservationsOut}${reservationId}`);
  }

  getSupportRequests() {
    return this.http.get<unknown[]>(`${this.host}${this.e.support}`);
  }
}
