import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NewClient, UserAuth, SendUser } from './typesManageUsers'
import { initStateForClientAuth } from './typesCommon'

const initialState: initStateForClientAuth = {
  id: null,
  email: null,
  name: null,
  contactPhone: null,
  role: null,
  needAuth: false,
  error: null
};

export const reducerauthClient = createSlice({
  name: 'reducerauthClient',
  initialState,
  reducers: {
    newClientRequest: (state, action: PayloadAction<NewClient>) => ({...state, ...action.payload}),

    loginRequest: (state, action: PayloadAction<UserAuth>) => ({...state, ...action.payload}),

    userInfoByTokenRequest: (state) => ({...state}),

    logoutRequest: (state) => ({...state}),

    needRunAuth: (state, action: PayloadAction<boolean>) => ({...state, needAuth: action.payload}),

    authSuccess: (state, action: PayloadAction<SendUser>) => ({...state, ...action.payload}),

    deleteUserData: (state) => ({...initialState}),

    authFailure: (state, action: PayloadAction<string>) => ({...state, error: action.payload})
  }
})

export const { newClientRequest, loginRequest, userInfoByTokenRequest, logoutRequest, needRunAuth, authSuccess, deleteUserData, authFailure } = reducerauthClient.actions;
export default reducerauthClient.reducer;