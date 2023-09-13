import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import {
  type SendRequests, type historyRequest, type disableRequest,
  type SendMessages,
  type recieveSocketType, type socketConnectType, type sendDataWSType
} from './typesSupportChat'
import { type initStateForSupportChat } from './typesCommon'

const initialState: initStateForSupportChat = {
  requests: [],
  messages: [],
  socket: null,
  data: null,
  event: '',
  id: '',
  error: null
}

export const reducersupportChat = createSlice({
  name: 'reducersupportChat',
  initialState,
  reducers: {
    clientRequestsRequest: (state) => ({ ...state }),

    managerRequestsRequest: (state) => ({ ...state }),

    getHistoryRequest: (state, action: PayloadAction<historyRequest>) => ({ ...state, ...action.payload }),

    socketConnect: (state, action: PayloadAction<socketConnectType>) => ({ ...state, ...action.payload }),

    recieveSocket: (state, action: PayloadAction<recieveSocketType>) => ({ ...state, ...action.payload }),

    sendDataWS: (state, action: PayloadAction<sendDataWSType>) => ({ ...state, ...action.payload }),

    makeInactiveRequest: (state, action: PayloadAction<disableRequest>) => ({ ...state, ...action.payload }),

    resetChat: (state) => ({ ...initialState }),

    requestsSearchSuccess: (state, action: PayloadAction<SendRequests[]>) => ({ ...state, requests: action.payload }),

    messagesSearchSuccess: (state, action: PayloadAction<SendMessages[]>) => ({ ...state, messages: action.payload }),

    messageEvent: (state, action: PayloadAction<SendMessages>) => ({ ...state, messages: [...state.messages, action.payload] }),

    requestEvent: (state, action: PayloadAction<SendRequests>) => ({ ...state, requests: [...state.requests, action.payload] }),

    supportChatFailure: (state, action: PayloadAction<string>) => ({ ...state, error: action.payload })
  }
})

export const {
  clientRequestsRequest, managerRequestsRequest, getHistoryRequest, makeInactiveRequest,
  socketConnect, recieveSocket, sendDataWS, resetChat,
  requestsSearchSuccess, messagesSearchSuccess, messageEvent, requestEvent, supportChatFailure
} = reducersupportChat.actions
export default reducersupportChat.reducer
