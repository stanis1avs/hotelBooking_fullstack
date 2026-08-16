import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  HotelDto,
  RoomDto,
  ReservationDto,
  ManagerReservationDto,
  UserDto,
  LoginResponseDto,
  SupportRequestDto,
  SupportMessageDto,
  CreateReservationRequestDto,
  ManagerStatsDto,
  PageDto,
} from '../core/api';

import { ME_QUERY } from './queries/auth.queries';
import { GET_HOTEL, GET_HOTELS } from './queries/hotels.queries';
import { GET_HOTEL_ROOMS } from './queries/rooms.queries';
import { MANAGER_STATS } from './queries/stats.queries';
import { MY_RESERVATIONS, ALL_RESERVATIONS } from './queries/reservations.queries';
import { ADMIN_USERS, MANAGER_USERS } from './queries/users.queries';
import {
  MY_SUPPORT_REQUESTS,
  ALL_SUPPORT_REQUESTS,
  SUPPORT_MESSAGES,
  UNREAD_SUPPORT_COUNT,
} from './queries/support.queries';

import { LOGIN_MUTATION, LOGOUT_MUTATION, REGISTER_MUTATION } from './mutations/auth.mutations';
import { CREATE_RESERVATION, DELETE_RESERVATION } from './mutations/reservations.mutations';
import { ADMIN_CREATE_USER, ADMIN_UPDATE_USER } from './mutations/users.mutations';
import {
  CLOSE_SUPPORT_REQUEST,
  CREATE_SUPPORT_REQUEST,
  MARK_SUPPORT_MESSAGES_READ,
  SEND_SUPPORT_MESSAGE,
} from './mutations/support.mutations';

@Injectable({ providedIn: 'root' })
export class ApolloService {
  constructor(private readonly apollo: Apollo) {}

  // ── Auth ────────────────────────────────────────────────────────────────────

  login(email: string, password: string): Observable<LoginResponseDto> {
    return this.apollo
      .mutate<{ login: { access_token: string; user: UserDto } }>({
        mutation: LOGIN_MUTATION,
        variables: { input: { email, password } },
      })
      .pipe(
        map((res) => {
          // refresh_token сервер кладёт в httpOnly-cookie и в теле не возвращает.
          const { access_token, user } = res.data!.login;
          return { ...user, access_token } as LoginResponseDto;
        }),
      );
  }

  logout(): Observable<void> {
    return this.apollo.mutate<{ logout: boolean }>({ mutation: LOGOUT_MUTATION }).pipe(map(() => undefined));
  }

  register(body: { email: string; password: string; name: string; contactPhone: string }): Observable<UserDto> {
    return this.apollo
      .mutate<{ register: UserDto }>({
        mutation: REGISTER_MUTATION,
        variables: { input: body },
      })
      .pipe(map((res) => res.data!.register));
  }

  getCurrentUser(): Observable<UserDto> {
    return this.apollo
      .query<{ me: UserDto }>({
        query: ME_QUERY,
        fetchPolicy: 'network-only',
      })
      .pipe(map((res) => res.data!.me));
  }

  // Обновление токена делает AuthSession через REST: оно вызывается из
  // HTTP-интерцептора, и маршрутизация его через Apollo дала бы рекурсию.

  // ── Hotels ──────────────────────────────────────────────────────────────────

  getHotels(params: {
    offset: number;
    limit?: number;
    hotel?: string;
    dateArrival: string;
    dateDeparture: string;
  }): Observable<PageDto<HotelDto>> {
    return this.apollo
      .query<{ hotels: PageDto<HotelDto> }>({
        query: GET_HOTELS,
        variables: params,
        fetchPolicy: 'network-only',
      })
      .pipe(map((res) => res.data!.hotels));
  }

  getHotel(id: string): Observable<HotelDto | null> {
    return this.apollo
      .query<{ hotel: HotelDto | null }>({
        query: GET_HOTEL,
        variables: { id },
        fetchPolicy: 'network-only',
      })
      .pipe(map((res) => res.data!.hotel));
  }

  getManagerStats(days = 30): Observable<ManagerStatsDto> {
    return this.apollo
      .query<{ managerStats: ManagerStatsDto }>({
        query: MANAGER_STATS,
        variables: { days },
        fetchPolicy: 'network-only',
      })
      .pipe(map((res) => res.data!.managerStats));
  }

  // ── Rooms ───────────────────────────────────────────────────────────────────

  getRooms(params: { hotel: string; isEnabled?: boolean }): Observable<RoomDto[]> {
    return this.apollo
      .query<{ hotelRooms: RoomDto[] }>({
        query: GET_HOTEL_ROOMS,
        variables: params,
        fetchPolicy: 'network-only',
      })
      .pipe(map((res) => res.data!.hotelRooms));
  }

  // ── Reservations ─────────────────────────────────────────────────────────────

  getReservations(): Observable<ReservationDto[]> {
    return this.apollo
      .query<{ myReservations: ReservationDto[] }>({
        query: MY_RESERVATIONS,
        fetchPolicy: 'network-only',
      })
      .pipe(map((res) => res.data!.myReservations));
  }

  createReservation(payload: CreateReservationRequestDto): Observable<ReservationDto> {
    return this.apollo
      .mutate<{ createReservation: ReservationDto }>({
        mutation: CREATE_RESERVATION,
        variables: { input: payload },
      })
      .pipe(map((res) => res.data!.createReservation));
  }

  deleteReservation(reservationId: string): Observable<void> {
    return this.apollo
      .mutate<{ deleteReservation: boolean }>({
        mutation: DELETE_RESERVATION,
        variables: { id: reservationId },
      })
      .pipe(map(() => undefined));
  }

  getManagerReservations(params?: { offset?: number; limit?: number }): Observable<PageDto<ManagerReservationDto>> {
    type Row = {
      id: string;
      dateStart: string;
      dateEnd: string;
      client: { id: string; name: string; contactPhone: string };
      room: { description: string; images: string[] };
      hotel: { title: string };
    };
    return this.apollo
      .query<{ allReservations: PageDto<Row> }>({
        query: ALL_RESERVATIONS,
        variables: { offset: params?.offset ?? 0, limit: params?.limit },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((res) => ({
          total: res.data!.allReservations.total,
          items: res.data!.allReservations.items.map((r) => ({
            id: r.id,
            dateStart: r.dateStart,
            dateEnd: r.dateEnd,
            room: r.room,
            hotel: r.hotel,
            user: { name: r.client.name, contactPhone: r.client.contactPhone },
          })),
        })),
      );
  }

  deleteManagerReservation(reservationId: string): Observable<void> {
    return this.apollo
      .mutate<{ deleteReservation: boolean }>({
        mutation: DELETE_RESERVATION,
        variables: { id: reservationId },
      })
      .pipe(map(() => undefined));
  }

  // ── Users ───────────────────────────────────────────────────────────────────

  adminGetUsers(params: {
    limit: number;
    offset: number;
    email?: string;
    name?: string;
    contactPhone?: string;
    role?: string;
  }): Observable<PageDto<UserDto>> {
    return this.apollo
      .query<{ adminUsers: PageDto<UserDto> }>({
        query: ADMIN_USERS,
        variables: params,
        fetchPolicy: 'network-only',
      })
      .pipe(map((res) => res.data!.adminUsers));
  }

  adminCreateUser(body: { email: string; password: string; name: string; contactPhone: string; role?: string }): Observable<UserDto> {
    return this.apollo
      .mutate<{ adminCreateUser: UserDto }>({
        mutation: ADMIN_CREATE_USER,
        variables: { input: body },
      })
      .pipe(map((res) => res.data!.adminCreateUser));
  }

  adminUpdateUser(id: string, input: { name?: string; contactPhone?: string; role?: string }): Observable<UserDto> {
    return this.apollo
      .mutate<{ adminUpdateUser: UserDto }>({
        mutation: ADMIN_UPDATE_USER,
        variables: { id, input },
      })
      .pipe(map((res) => res.data!.adminUpdateUser));
  }

  managerGetUsers(params: {
    limit: number;
    offset: number;
    email?: string;
    name?: string;
    contactPhone?: string;
  }): Observable<PageDto<UserDto>> {
    return this.apollo
      .query<{ managerUsers: PageDto<UserDto> }>({
        query: MANAGER_USERS,
        variables: params,
        fetchPolicy: 'network-only',
      })
      .pipe(map((res) => res.data!.managerUsers));
  }

  // ── Support ─────────────────────────────────────────────────────────────────

  getClientSupportRequests(): Observable<SupportRequestDto[]> {
    return this.apollo
      .query<{ mySupportRequests: SupportRequestDto[] }>({
        query: MY_SUPPORT_REQUESTS,
        fetchPolicy: 'network-only',
      })
      .pipe(map((res) => res.data!.mySupportRequests));
  }

  getManagerSupportRequests(): Observable<SupportRequestDto[]> {
    return this.apollo
      .query<{ allSupportRequests: SupportRequestDto[] }>({
        query: ALL_SUPPORT_REQUESTS,
        fetchPolicy: 'network-only',
      })
      .pipe(map((res) => res.data!.allSupportRequests));
  }

  getUnreadSupportCount(): Observable<number> {
    return this.apollo
      .query<{ unreadSupportCount: number }>({
        query: UNREAD_SUPPORT_COUNT,
        fetchPolicy: 'network-only',
      })
      .pipe(map((res) => res.data!.unreadSupportCount));
  }

  getSupportMessages(requestId: string): Observable<SupportMessageDto[]> {
    return this.apollo
      .query<{ supportMessages: SupportMessageDto[] }>({
        query: SUPPORT_MESSAGES,
        variables: { requestId },
        fetchPolicy: 'network-only',
      })
      .pipe(map((res) => res.data!.supportMessages));
  }

  /** Возвращает оставшееся число непрочитанных по всем обращениям. */
  markSupportMessagesRead(requestId: string): Observable<number> {
    return this.apollo
      .mutate<{ markSupportMessagesRead: number }>({
        mutation: MARK_SUPPORT_MESSAGES_READ,
        variables: { requestId },
      })
      .pipe(map((res) => res.data!.markSupportMessagesRead));
  }

  closeSupportRequest(requestId: string): Observable<void> {
    return this.apollo
      .mutate<{ closeSupportRequest: boolean }>({
        mutation: CLOSE_SUPPORT_REQUEST,
        variables: { id: requestId },
      })
      .pipe(map(() => undefined));
  }

  createSupportRequest(text: string): Observable<SupportRequestDto> {
    return this.apollo
      .mutate<{ createSupportRequest: SupportRequestDto }>({
        mutation: CREATE_SUPPORT_REQUEST,
        variables: { text },
      })
      .pipe(map((res) => res.data!.createSupportRequest));
  }

  sendSupportMessage(requestId: string, text: string): Observable<SupportMessageDto> {
    return this.apollo
      .mutate<{ sendSupportMessage: SupportMessageDto }>({
        mutation: SEND_SUPPORT_MESSAGE,
        variables: { requestId, text },
      })
      .pipe(map((res) => res.data!.sendSupportMessage));
  }
}
