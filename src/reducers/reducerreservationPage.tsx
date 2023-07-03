import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  SendReservationForClients, SendReservationForManagers, CreateReservation, deleteReservation,
  recieveResevationList, changReservationParams } from './typesReservationPage'
import { initStateForReservationList } from './typesCommon'

const initialState: initStateForReservationList = {
  reservations: [],
  offset: 0,
  roomId: '',
  type: '',
  title: '',
  imagesRooms: [null, null],
  dateStart: '',
  dateEnd: '',
  error: null
};

export const reducerreservationPage = createSlice({
  name: 'reducerreservationPage',
  initialState,
  reducers: {
    createReservationRequest: (state, action: PayloadAction<CreateReservation>) => ({...state, ...action.payload}),

    deleteReservationByClientRequest: (state, action: PayloadAction<deleteReservation>) => ({...state, ...action.payload}),

    deleteReservationByManagerRequest: (state, action: PayloadAction<deleteReservation>) => ({...state, ...action.payload}),

    reservationsUserRequest: (state) => ({...state}),

    reservationPageRequest: (state, action: PayloadAction<recieveResevationList>) => ({...state, ...action.payload}),

    setParamsReservation: (state, action: PayloadAction<changReservationParams>) => ({...state, ...action.payload}),

    reservationsFilter: (state, action: PayloadAction<string>) => ({...state, reservations: state.reservations.filter((e: any) => e.id !== action.payload)}),

    reservationsUserSuccess: (state, action: PayloadAction<SendReservationForClients[]>) => ({...state, reservations: action.payload}),

    reservationForManagerSuccess: (state, action: PayloadAction<SendReservationForManagers[]>) => ({...state, reservations: action.payload}),

    reservationPageFailure: (state, action: PayloadAction<string>) => ({...state, error: action.payload})
  }
})

export const {
  createReservationRequest, deleteReservationByManagerRequest, deleteReservationByClientRequest, reservationsUserRequest, reservationPageRequest,
  reservationsFilter, reservationsUserSuccess, reservationForManagerSuccess, setParamsReservation, reservationPageFailure
} = reducerreservationPage.actions;
export default reducerreservationPage.reducer;