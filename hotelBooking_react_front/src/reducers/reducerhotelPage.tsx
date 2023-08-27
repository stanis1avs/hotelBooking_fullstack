import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import {
  type SendRoom, type deleteRoom, type createRoom, type updateRoom,
  type SendHotel, type deleteHotel, type createHotel, type updateHotel,
  type changeStateWithoutRequestType,
  type recieveHotelPage
} from './typesHotelRoom'
import { type initStateForHotelPage } from './typesCommon'

const initialState: initStateForHotelPage = {
  rooms: [],
  id: '',
  nameHotel: '',
  descriptionHotel: '',
  imageHotel: null,
  descriptionRooms: ['', ''],
  imagesRooms: {
    standart: [null, null],
    lux: [null, null]
  },
  descriptionRoom: '',
  imagesRoom: ['', ''],
  roomsId: [null, null],
  roomId: '',
  error: null
}

export const reducerhotelPage = createSlice({
  name: 'reducerhotelPage',
  initialState,
  reducers: {
    hotelPageRequest: (state, action: PayloadAction<recieveHotelPage>) => ({ ...state, ...action.payload }),

    newhotelRequest: (state, action: PayloadAction<createHotel>) => ({ ...state, ...action.payload }),

    newroomRequest: (state, action: PayloadAction<createRoom>) => ({ ...state, ...action.payload }),

    edithotelRequest: (state, action: PayloadAction<updateHotel>) => ({ ...state, ...action.payload }),

    editroomRequest: (state, action: PayloadAction<updateRoom>) => ({ ...state, ...action.payload }),

    deletehotelRequest: (state, action: PayloadAction<deleteHotel>) => ({ ...state, ...action.payload }),

    deleteroomRequest: (state, action: PayloadAction<deleteRoom>) => ({ ...state, ...action.payload }),

    hotelPageSuccess: (state, action: PayloadAction<SendRoom[]>) => ({ ...state, rooms: action.payload }),

    newroomSuccess: (state, action: PayloadAction<SendRoom>) => ({ ...state, rooms: [...state.rooms, action.payload] }),

    hotelIdSuccess: (state, action: PayloadAction<SendHotel>) => ({ ...state, ...action.payload }),

    changeStateWithoutRequest: (state, action: PayloadAction<changeStateWithoutRequestType>) => ({ ...state, ...action.payload }),

    hotelPageFailure: (state, action: PayloadAction<string>) => ({ ...state, error: action.payload })
  }
})

export const {
  hotelPageRequest, deletehotelRequest, deleteroomRequest, edithotelRequest, newhotelRequest, editroomRequest, newroomRequest,
  hotelPageSuccess, newroomSuccess, hotelIdSuccess,
  changeStateWithoutRequest,
  hotelPageFailure
} = reducerhotelPage.actions

export default reducerhotelPage.reducer
