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
} from '../core/api';

import { ME_QUERY } from './queries/auth.queries';
import { GET_HOTELS } from './queries/hotels.queries';
import { GET_HOTEL_ROOMS } from './queries/rooms.queries';
import { MY_RESERVATIONS, ALL_RESERVATIONS } from './queries/reservations.queries';
import { ADMIN_USERS, MANAGER_USERS } from './queries/users.queries';
import { MY_SUPPORT_REQUESTS, ALL_SUPPORT_REQUESTS, SUPPORT_MESSAGES } from './queries/support.queries';

import { LOGIN_MUTATION, REGISTER_MUTATION, REFRESH_TOKEN_MUTATION } from './mutations/auth.mutations';
import { CREATE_RESERVATION, DELETE_RESERVATION } from './mutations/reservations.mutations';
import { ADMIN_CREATE_USER } from './mutations/users.mutations';
import { CLOSE_SUPPORT_REQUEST } from './mutations/support.mutations';

@Injectable({ providedIn: 'root' })
export class ApolloService {
  constructor(private readonly apollo: Apollo) {}

  // ── Auth ────────────────────────────────────────────────────────────────────

  login(email: string, password: string): Observable<LoginResponseDto> {
    return this.apollo
      .mutate<{ login: { access_token: string; refresh_token: string; user: UserDto } }>({
        mutation: LOGIN_MUTATION,
        variables: { input: { email, password } },
      })
      .pipe(
        map((res) => {
          const { access_token, refresh_token, user } = res.data!.login;
          return { ...user, access_token, refresh_token } as LoginResponseDto;
        }),
      );
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

  refreshToken(refreshToken: string): Observable<{ access_token: string; refresh_token: string }> {
    return this.apollo
      .mutate<{ refreshToken: { access_token: string; refresh_token: string; user: UserDto } }>({
        mutation: REFRESH_TOKEN_MUTATION,
        variables: { refreshToken },
      })
      .pipe(
        map((res) => ({
          access_token: res.data!.refreshToken.access_token,
          refresh_token: res.data!.refreshToken.refresh_token,
        })),
      );
  }

  // ── Hotels ──────────────────────────────────────────────────────────────────

  getHotels(params: { offset: number; hotel?: string; dateArrival: string; dateDeparture: string }): Observable<HotelDto[]> {
    return this.apollo
      .query<{ hotels: HotelDto[] }>({
        query: GET_HOTELS,
        variables: params,
        fetchPolicy: 'network-only',
      })
      .pipe(map((res) => res.data!.hotels));
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

  getManagerReservations(params?: { offset?: number }): Observable<ManagerReservationDto[]> {
    return this.apollo
      .query<{ allReservations: Array<{ id: string; dateStart: string; dateEnd: string; client: { id: string; name: string; contactPhone: string }; room: { description: string; images: string[] }; hotel: { title: string } }> }>({
        query: ALL_RESERVATIONS,
        variables: { offset: params?.offset ?? 0 },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((res) =>
          res.data!.allReservations.map((r) => ({
            id: r.id,
            dateStart: r.dateStart,
            dateEnd: r.dateEnd,
            room: r.room,
            hotel: r.hotel,
            user: { name: r.client.name, contactPhone: r.client.contactPhone },
          })),
        ),
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

  adminGetUsers(params: { limit: number; offset: number; email?: string; name?: string; contactPhone?: string }): Observable<UserDto[]> {
    return this.apollo
      .query<{ adminUsers: UserDto[] }>({
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

  managerGetUsers(params: { limit: number; offset: number; email?: string; name?: string; contactPhone?: string }): Observable<UserDto[]> {
    return this.apollo
      .query<{ managerUsers: UserDto[] }>({
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

  getSupportMessages(requestId: string): Observable<SupportMessageDto[]> {
    return this.apollo
      .query<{ supportMessages: SupportMessageDto[] }>({
        query: SUPPORT_MESSAGES,
        variables: { requestId },
        fetchPolicy: 'network-only',
      })
      .pipe(map((res) => res.data!.supportMessages));
  }

  closeSupportRequest(requestId: string): Observable<void> {
    return this.apollo
      .mutate<{ closeSupportRequest: boolean }>({
        mutation: CLOSE_SUPPORT_REQUEST,
        variables: { id: requestId },
      })
      .pipe(map(() => undefined));
  }
}
