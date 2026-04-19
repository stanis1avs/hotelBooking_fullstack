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

export interface SupportRequestDto {
  id: Id;
  isActive: boolean;
  createdAt: string;
  title?: { text: string };
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

  getCurrentUser() {
    return this.http.post<UserDto>(`${this.host}/api/auth/user`, {});
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
    return this.http.delete<void>(`${this.host}${this.e.reservationsOut}/${reservationId}`);
  }

  getClientSupportRequests() {
    return this.http.get<SupportRequestDto[]>(`${this.host}/api/client/support-requests`);
  }

  getManagerSupportRequests() {
    return this.http.get<SupportRequestDto[]>(`${this.host}/api/manager/support-requests`);
  }

  getSupportMessages(requestId: Id) {
    return this.http.get<SupportMessageDto[]>(`${this.host}/api/common/support-requests/${requestId}/messages`);
  }

  sendSupportMessage(requestId: Id, text: string) {
    return this.http.post<SupportMessageDto>(`${this.host}/api/common/support-requests/${requestId}/messages`, { text });
  }

  closeSupportRequest(requestId: Id) {
    return this.http.put<void>(`${this.host}/api/manager/support-requests`, { id: requestId, isActive: false });
  }

  createSupportRequest(text: string) {
    return this.http.post<SupportRequestDto>(`${this.host}/api/client/support-requests`, { text });
  }

  getManagerReservations(params?: { offset?: number; limit?: number }) {
    return this.http.get<ManagerReservationDto[]>(`${this.host}/api/manager/reservations`, { params: params as any });
  }

  deleteManagerReservation(reservationId: Id) {
    return this.http.delete<void>(`${this.host}/api/manager/reservations/${reservationId}`);
  }

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

  getAllHotels() {
    return this.http.get<HotelDto[]>(`${this.host}/api/common/hotels`, { params: { offset: 0, dateArrival: '2024-01-01', dateDeparture: '2024-12-31' } });
  }

  adminGetUsers(params: { limit: number; offset: number; email?: string; name?: string; contactPhone?: string }) {
    return this.http.get<UserDto[]>(`${this.host}/api/admin/users`, { params });
  }

  adminCreateUser(body: { email: string; password: string; name: string; contactPhone: string; role?: string }) {
    return this.http.post<UserDto>(`${this.host}/api/admin/users`, body);
  }

  managerGetUsers(params: { limit: number; offset: number; email?: string; name?: string; contactPhone?: string }) {
    return this.http.get<UserDto[]>(`${this.host}/api/manager/users`, { params });
  }
}
