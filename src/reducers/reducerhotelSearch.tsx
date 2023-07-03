import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { recieveSearchInfo, changSearchParams, SendHotel } from './typesHotelRoom'
import { initStateForHotelsList } from './typesCommon'

const initialState: initStateForHotelsList = {
  hotels: [],
  offset: 0,
  hotel: '',
  dateArrival: '',
  dateDeparture: '',
  error: null
};

export const reducerhotelSearch = createSlice({
  name: 'reducerhotelSearch',
  initialState,
  reducers: {
    hotelSearchRequest: (state, action: PayloadAction<recieveSearchInfo>) => ({...state, ...action.payload}),

    hotelSearchSuccess: (state, action: PayloadAction<SendHotel[]>) => ({...state, hotels: action.payload}),

    setParamsHotelSearch: (state, action: PayloadAction<changSearchParams>) => ({...state, ...action.payload}),

    hotelSearchFailure: (state, action: PayloadAction<string>) => ({...state, error: action.payload})
  }
})

export const { hotelSearchRequest, hotelSearchSuccess, hotelSearchFailure, setParamsHotelSearch } = reducerhotelSearch.actions;
export default reducerhotelSearch.reducer;