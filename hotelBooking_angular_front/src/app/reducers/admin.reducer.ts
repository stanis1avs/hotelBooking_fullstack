import { createFeature, createReducer, on } from '@ngrx/store';
import { AdminActions } from '../actions/admin.actions';
import { HotelDto, Id, RoomDto } from '../core/api';

export const adminFeatureKey = 'admin';

export interface State {
  hotels: HotelDto[];
  hotelsLoading: boolean;
  rooms: RoomDto[];
  roomsLoading: boolean;
  selectedHotelId: Id | null;
  saving: boolean;
  error: unknown | null;
}

export const initialState: State = {
  hotels: [],
  hotelsLoading: false,
  rooms: [],
  roomsLoading: false,
  selectedHotelId: null,
  saving: false,
  error: null,
};

export const reducer = createReducer(
  initialState,

  on(AdminActions.loadHotels, (state) => ({ ...state, hotelsLoading: true, error: null })),
  on(AdminActions.loadHotelsSuccess, (state, { items }) => ({ ...state, hotelsLoading: false, hotels: items })),
  on(AdminActions.loadHotelsFailure, (state, { error }) => ({ ...state, hotelsLoading: false, error })),

  on(AdminActions.selectHotel, (state, { id }) => ({ ...state, selectedHotelId: id })),

  on(AdminActions.loadRooms, (state) => ({ ...state, roomsLoading: true, error: null })),
  on(AdminActions.loadRoomsSuccess, (state, { items }) => ({ ...state, roomsLoading: false, rooms: items })),
  on(AdminActions.loadRoomsFailure, (state, { error }) => ({ ...state, roomsLoading: false, error })),

  // Сохранение общее для отеля и номера: полоса загрузки в интерфейсе одна
  on(AdminActions.saveHotel, AdminActions.saveRoom, (state) => ({ ...state, saving: true, error: null })),
  on(AdminActions.saveHotelSuccess, AdminActions.saveRoomSuccess, (state) => ({ ...state, saving: false })),
  on(AdminActions.saveHotelFailure, AdminActions.saveRoomFailure, (state, { error }) => ({
    ...state,
    saving: false,
    error,
  })),

  // Удаление мягкое, но из выдачи запись пропадает сразу — ждать перезагрузки списка незачем
  on(AdminActions.deleteHotelSuccess, (state, { id }) => ({
    ...state,
    hotels: state.hotels.filter((h) => h.id !== id),
    selectedHotelId: state.selectedHotelId === id ? null : state.selectedHotelId,
  })),
  on(AdminActions.deleteRoomSuccess, (state, { id }) => ({
    ...state,
    rooms: state.rooms.filter((r) => r.id !== id),
  })),
  on(AdminActions.deleteHotelFailure, AdminActions.deleteRoomFailure, (state, { error }) => ({ ...state, error })),
);

export const adminFeature = createFeature({ name: adminFeatureKey, reducer });
