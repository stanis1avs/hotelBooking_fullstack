import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SendUser, changeUserSearchParams, NewUser } from './typesManageUsers'
import { initStateForUsersPage } from './typesCommon'

const initialState: initStateForUsersPage = {
  users: [],
  offset: 0,
  name: '',
  email: '',
  contactPhone: '',
  error: null
};

export const reducermanageUsers = createSlice({
  name: 'reducermanageUsers',
  initialState,
  reducers: {
    usersSearchRequest: (state, action: PayloadAction<changeUserSearchParams>) => ({...state, ...action.payload}),

    newUserRequest: (state, action: PayloadAction<NewUser>) => ({...state}),

    newUserSuccess: (state, action: PayloadAction<SendUser>) => ({...state, users: [...state.users, action.payload]}),

    usersSearchSuccess: (state, action: PayloadAction<SendUser[]>) => ({...state, users: action.payload}),

    setParamsManageUsers: (state, action: PayloadAction<changeUserSearchParams>) => ({...state, ...action.payload}),

    usersSeacrhFailure: (state, action: PayloadAction<string>) => ({...state, error: action.payload})
  }
})

export const { usersSearchRequest, newUserRequest,  newUserSuccess, usersSearchSuccess, usersSeacrhFailure, setParamsManageUsers } = reducermanageUsers.actions;
export default reducermanageUsers.reducer;