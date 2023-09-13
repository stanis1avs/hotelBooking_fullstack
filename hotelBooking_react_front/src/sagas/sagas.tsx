import { takeEvery, put, spawn, fork, call } from 'redux-saga/effects'
import { type PayloadAction } from '@reduxjs/toolkit'
import {
  hotelSearchRequest,
  hotelSearchSuccess, hotelSearchFailure
} from '../reducers/reducerhotelSearch'
import {
  hotelPageRequest, deletehotelRequest, deleteroomRequest, newhotelRequest, newroomRequest, edithotelRequest, editroomRequest,
  hotelPageSuccess, hotelIdSuccess, newroomSuccess, hotelPageFailure
} from '../reducers/reducerhotelPage'
import {
  type deleteRoom, type createRoom, type updateRoom,
  type deleteHotel, type createHotel, type updateHotel,
  type recieveHotelPage, type recieveSearchInfo
} from '../reducers/typesHotelRoom'
import {
  usersSearchRequest, newUserRequest,
  newUserSuccess, usersSearchSuccess, usersSeacrhFailure
} from '../reducers/reducermanageUsers'
import {
  newClientRequest, loginRequest, userInfoByTokenRequest, logoutRequest,
  authSuccess, deleteUserData, needRunAuth, authFailure
} from '../reducers/reducerauthClient'
import {
  type NewUser, type NewClient, type UserAuth,
  type changeUserSearchParams
} from '../reducers/typesManageUsers'
import {
  reservationsUserRequest, deleteReservationByManagerRequest, deleteReservationByClientRequest, createReservationRequest, reservationPageRequest,
  reservationsFilter, reservationsUserSuccess, reservationForManagerSuccess, reservationPageFailure
} from '../reducers/reducerreservationPage'
import {
  type deleteReservation,
  type CreateReservation,
  type recieveResevationList
} from '../reducers/typesReservationPage'
import {
  clientRequestsRequest, managerRequestsRequest, getHistoryRequest, makeInactiveRequest,
  sendDataWS, socketConnect, recieveSocket,
  requestsSearchSuccess, messagesSearchSuccess, supportChatFailure
} from '../reducers/reducersupportChat'
import {
  type historyRequest, type disableRequest,
  type socketConnectType, type sendDataWSType
} from '../reducers/typesSupportChat'
import { fetchRequestGet, fetchRequestPost, fetchRequestPut, fetchRequestDelete, sendEvent } from '../api/fetchRequest'
import { io } from 'socket.io-client'

function * watchHotelSearchSaga (): Generator<any, void, unknown> {
  yield takeEvery(hotelSearchRequest.type, handleHotelSearch)
}

function * watchHotelPageSaga (): Generator<any, void, unknown> {
  yield takeEvery(hotelPageRequest.type, handleHotelPage)
}

function * watchNewHotelSaga (): Generator<any, void, unknown> {
  yield takeEvery(newhotelRequest.type, handleAccessToken, handleNewHotel)
}

function * watchNewRoomSaga (): Generator<any, void, unknown> {
  yield takeEvery(newroomRequest.type, handleAccessToken, handleNewRoom)
}

function * watchEditHotelSaga (): Generator<any, void, unknown> {
  yield takeEvery(edithotelRequest.type, handleAccessToken, handleEditHotel)
}

function * watchEditRoomSaga (): Generator<any, void, unknown> {
  yield takeEvery(editroomRequest.type, handleAccessToken, handleEditRoom)
}

function * watchDeleteHotelSaga (): Generator<any, void, unknown> {
  yield takeEvery(deletehotelRequest.type, handleAccessToken, handleDeleteHotel)
}

function * watchDeleteRoomSaga (): Generator<any, void, unknown> {
  yield takeEvery(deleteroomRequest.type, handleAccessToken, handleDeleteRoom)
}

function * watchNewUserSaga (): Generator<any, void, unknown> {
  yield takeEvery(newUserRequest.type, handleAccessToken, handleNewUser)
}

function * watchUserSeacrhSaga (): Generator<any, void, unknown> {
  yield takeEvery(usersSearchRequest.type, handleAccessToken, handleUserSearch)
}

function * watchNewClientSaga (): Generator<any, void, unknown> {
  yield takeEvery(newClientRequest.type, handleAccessToken, handleNewClient)
}

function * watchLoginSaga (): Generator<any, void, unknown> {
  yield takeEvery(loginRequest.type, handleLogin)
}

function * watchUserInfoSaga (): Generator<any, void, unknown> {
  yield takeEvery(userInfoByTokenRequest.type, handleAccessToken, handleUserInfo)
}

function * watchLogoutSaga (): Generator<any, void, unknown> {
  yield takeEvery(logoutRequest.type, handleAccessToken, handleLogout)
}

function * watchReservationsIdSaga (): Generator<any, void, unknown> {
  yield takeEvery(reservationsUserRequest.type, handleAccessToken, handleReservationsId)
}

function * watchDelReservByClientSaga (): Generator<any, void, unknown> {
  yield takeEvery(deleteReservationByClientRequest.type, handleAccessToken, handleDeleteReservByClient)
}

function * watchDelReservByManagerSaga (): Generator<any, void, unknown> {
  yield takeEvery(deleteReservationByManagerRequest.type, handleAccessToken, handleDeleteReservByManager)
}

function * watchCreateReservationSaga (): Generator<any, void, unknown> {
  yield takeEvery(createReservationRequest.type, handleAccessToken, handleCreateReservation)
}

function * watchReservationPageSaga (): Generator<any, void, unknown> {
  yield takeEvery(reservationPageRequest.type, handleAccessToken, handleReservationsPage)
}

function * watchRequestsClientSaga (): Generator<any, void, unknown> {
  yield takeEvery(clientRequestsRequest.type, handleAccessToken, handleRequestsClient)
}

function * watchRequestsManagerSaga (): Generator<any, void, unknown> {
  yield takeEvery(managerRequestsRequest.type, handleAccessToken, handleRequestsManager)
}

function * watchHistoryChatSaga (): Generator<any, void, unknown> {
  yield takeEvery(getHistoryRequest.type, handleAccessToken, handleHistoryChat)
}

function * watchInactiveRequestsSaga (): Generator<any, void, unknown> {
  yield takeEvery(makeInactiveRequest.type, handleAccessToken, handleInactiveRequest)
}

function * watchSocketConnectSaga (): Generator<any, void, unknown> {
  yield takeEvery(socketConnect.type, handleAccessToken, handleSocketConnect)
}

function * watchSendDataWSSaga (): Generator<any, void, unknown> {
  yield takeEvery(sendDataWS.type, handleAccessToken, handleSendDataWS)
}

function * handleAccessToken (handleSagaLogic: any, action: any): Generator<any, void, any> {
  const cookies = document.cookie.split(';')
  const accessTokenCookie = cookies.find((cookie) => cookie.trim().startsWith('access_token='))
  const accessToken = accessTokenCookie ? accessTokenCookie.split('=')[1] : null

  if (accessToken) {
    yield fork(handleSagaLogic, action, accessToken)
  } else {
    const refreshTokenCookie = cookies.find((cookie) => cookie.trim().startsWith('refresh_token='))
    const refreshToken = refreshTokenCookie ? refreshTokenCookie.split('=')[1] : null
    if (refreshToken) {
      yield fork(handleRefresh, refreshToken)
    } else {
      yield put(needRunAuth(true))
    }
  }
}

function * handleHotelSearch (action: PayloadAction<recieveSearchInfo>): Generator<any, void, any> {
  try {
    const query =
    `?hotel=${action.payload.hotel}&offset=${action.payload.offset}&dateArrival=${action.payload.dateArrival}&dateDeparture=${action.payload.dateDeparture}`
    const data = yield call(fetchRequestGet, '/api/common/hotels', null, query)
    yield put(hotelSearchSuccess(data))
  } catch (error: any) {
    yield put(hotelSearchFailure(error.message))
  }
}

function * handleHotelPage (action: PayloadAction<recieveHotelPage>): Generator<any, void, any> {
  try {
    const query = `?hotel=${action.payload.id}`
    const data = yield call(fetchRequestGet, '/api/common/hotel-rooms', null, query)
    yield put(hotelPageSuccess(data))
  } catch (error: any) {
    yield put(hotelPageFailure(error.message))
  }
}

function * handleNewHotel (action: PayloadAction<createHotel>, accessToken: string): Generator<any, void, any> {
  const formData = new FormData()
  formData.append('title', action.payload.nameHotel)
  formData.append('description', action.payload.descriptionHotel)
  formData.append('image', action.payload.imageHotel)
  try {
    const data = yield call(fetchRequestPost, '/api/admin/hotels', accessToken, formData)
    yield put(hotelIdSuccess(data))
  } catch (error: any) {
    yield put(hotelPageFailure(error.message))
  }
}

function * handleNewRoom (action: PayloadAction<createRoom>, accessToken: string): Generator<any, void, any> {
  const formData = new FormData()
  formData.append('hotelId', action.payload.id)
  formData.append('description', action.payload.descriptionRoom)
  formData.append('images', action.payload.imagesRoom[0])
  formData.append('images', action.payload.imagesRoom[1])
  try {
    const data = yield call(fetchRequestPost, '/api/admin/hotel-rooms', accessToken, formData)
    yield put(newroomSuccess(data))
  } catch (error: any) {
    yield put(hotelPageFailure(error.message))
  }
}

function * handleEditHotel (action: PayloadAction<updateHotel>, accessToken: string): Generator<any, void, any> {
  const formData = new FormData()
  formData.append('title', action.payload.nameHotel)
  formData.append('description', action.payload.descriptionHotel)
  formData.append('image', action.payload.imageHotel)
  try {
    const data = yield call(fetchRequestPut, '/api/admin/hotels', accessToken, formData, action.payload.id)
    yield put(hotelIdSuccess(data))
  } catch (error: any) {
    yield put(hotelPageFailure(error.message))
  }
}

function * handleEditRoom (action: PayloadAction<updateRoom>, accessToken: string): Generator<any, void, any> {
  const formData = new FormData()
  formData.append('description', action.payload.descriptionRoom)
  formData.append('images', action.payload.imagesRoom[0])
  formData.append('images', action.payload.imagesRoom[1])
  try {
    const data = yield call(fetchRequestPut, '/api/admin/hotel-rooms', accessToken, formData, action.payload.roomId)
    yield put(newroomSuccess(data))
  } catch (error: any) {
    yield put(hotelPageFailure(error.message))
  }
}

function * handleDeleteHotel (action: PayloadAction<deleteHotel>, accessToken: string): Generator<any, void, any> {
  try {
    yield call(fetchRequestDelete, '/api/admin/hotels', accessToken, action.payload.id)
  } catch (error: any) {
    yield put(hotelPageFailure(error.message))
  }
}

function * handleDeleteRoom (action: PayloadAction<deleteRoom>, accessToken: string): Generator<any, void, any> {
  try {
    yield call(fetchRequestDelete, '/api/admin/hotel-rooms', accessToken, action.payload.roomId)
  } catch (error: any) {
    yield put(hotelPageFailure(error.message))
  }
}

function * handleNewUser (action: PayloadAction<NewUser>, accessToken: string): Generator<any, void, any> {
  try {
    const data = yield call(fetchRequestPost, '/api/admin/users', accessToken, JSON.stringify(action.payload))
    yield put(newUserSuccess(data))
  } catch (error: any) {
    yield put(usersSeacrhFailure(error.message))
  }
}

function * handleUserSearch (action: PayloadAction<changeUserSearchParams>, accessToken: string): Generator<any, void, any> {
  try { // have other url
    const query =
    `?name=${action.payload.name}&email=${action.payload.email}&contactPhone=${action.payload.contactPhone}&offset=${action.payload.offset}`
    const data = yield call(fetchRequestGet, '/api/admin/users', accessToken, query)
    yield put(usersSearchSuccess(data))
  } catch (error: any) {
    yield put(usersSeacrhFailure(error.message))
  }
}

function * handleNewClient (action: PayloadAction<NewClient>, accessToken: string): Generator<any, void, any> {
  try {
    const data = yield call(fetchRequestPost, '/api/client/register', accessToken, JSON.stringify(action.payload), { 'Content-Type': 'application/json' })
    yield put(newUserSuccess(data))
  } catch (error: any) {
    yield put(authFailure(error.message))
  }
}

function * handleLogin (action: PayloadAction<UserAuth>): Generator<any, void, any> {
  try {
    const { id, email, name, contactPhone, role, access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN } = yield call(fetchRequestPost, '/api/auth/login', null, JSON.stringify(action.payload), { 'Content-Type': 'application/json' })
    yield put(authSuccess({ id, email, name, contactPhone, role }))
    document.cookie = `access_token=${ACCESS_TOKEN};max-age=${2 * 24 * 60 * 60}`
    document.cookie = `refresh_token=${REFRESH_TOKEN};max-age=${10 * 24 * 60 * 60}`
  } catch (error: any) {
    yield put(authFailure(error.message))
  }
}

function * handleUserInfo (_: any, accessToken: string): Generator<any, void, any> {
  try {
    const data = yield call(fetchRequestPost, '/api/auth/user', accessToken)
    yield put(authSuccess(data))
  } catch (error: any) {
    yield put(authFailure(error.message))
  }
}

function * handleLogout (): Generator<any, void, any> {
  try {
    // yield call(fetchRequestPost, "/api/auth/logout", accessToken);
    document.cookie = 'access_token=;expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    document.cookie = 'refresh_token=;expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    yield put(deleteUserData())
  } catch (error: any) {
    yield put(authFailure(error.message))
  }
}

function * handleRefresh (refreshToken: string): Generator<any, void, any> {
  try {
    const { access_token: ACCESS_TOKEN } = yield call(fetchRequestPost, '/api/auth/refresh', refreshToken)
    document.cookie = `access_token=${ACCESS_TOKEN};max-age=${2 * 24 * 60 * 60}`
  } catch (error: any) {
    yield put(authFailure(error.message))
  }
}

function * handleReservationsId (_: any, accessToken: string): Generator<any, void, any> {
  try {
    const data = yield call(fetchRequestGet, '/api/client/reservations', accessToken)
    yield put(reservationsUserSuccess(data))
  } catch (error: any) {
    yield put(reservationPageFailure(error.message))
  }
}

function * handleDeleteReservByClient (action: PayloadAction<deleteReservation>, accessToken: string): Generator<any, void, any> {
  try {
    yield call(fetchRequestDelete, '/api/client/reservations', accessToken, action.payload.id)
    yield put(reservationsFilter(action.payload.id))
  } catch (error: any) {
    yield put(reservationPageFailure(error.message))
  }
}

function * handleDeleteReservByManager (action: PayloadAction<deleteReservation>, accessToken: string): Generator<any, void, any> {
  try {
    yield call(fetchRequestDelete, '/api/manager/reservations', accessToken, action.payload.id)
    yield put(reservationsFilter(action.payload.id))
  } catch (error: any) {
    yield put(reservationPageFailure(error.message))
  }
}

function * handleCreateReservation (action: PayloadAction<CreateReservation>, accessToken: string): Generator<any, void, any> {
  try {
    yield call(fetchRequestPost, '/api/client/reservations', accessToken, JSON.stringify(action.payload), { 'Content-Type': 'application/json' })
  } catch (error: any) {
    yield put(reservationPageFailure(error.message))
  }
}

function * handleReservationsPage (action: PayloadAction<recieveResevationList>, accessToken: string): Generator<any, void, any> {
  try {
    const query = `?offset=${action.payload.offset}`
    const data = yield call(fetchRequestGet, '/api/manager/reservations', accessToken, query)
    yield put(reservationForManagerSuccess(data))
  } catch (error: any) {
    yield put(reservationPageFailure(error.message))
  }
}

function * handleRequestsClient (_: any, accessToken: string): Generator<any, void, any> {
  try {
    const data = yield call(fetchRequestGet, '/api/client/support-requests', accessToken)
    yield put(requestsSearchSuccess(data))
  } catch (error: any) {
    yield put(supportChatFailure(error.message))
  }
}

function * handleRequestsManager (_: any, accessToken: string): Generator<any, void, any> {
  try {
    const data = yield call(fetchRequestGet, '/api/manager/support-requests', accessToken)
    yield put(requestsSearchSuccess(data))
  } catch (error: any) {
    yield put(supportChatFailure(error.message))
  }
}

function * handleHistoryChat (action: PayloadAction<historyRequest>, accessToken: string): Generator<any, void, any> {
  try {
    const data = yield call(fetchRequestGet, `/api/common/support-requests/${action.payload.id}/messages`, accessToken)
    yield put(messagesSearchSuccess(data))
  } catch (error: any) {
    yield put(supportChatFailure(error.message))
  }
}

function * handleInactiveRequest (action: PayloadAction<disableRequest>, accessToken: string): Generator<any, void, any> {
  try {
    const data = yield call(fetchRequestPut, '/api/manager/support-requests', accessToken, JSON.stringify(action.payload), null, { 'Content-Type': 'application/json' })
    yield put(requestsSearchSuccess(data))
  } catch (error: any) {
    yield put(supportChatFailure(error.message))
  }
}

function * handleSocketConnect (action: PayloadAction<socketConnectType>, accessToken: string): Generator<any, void, any> {
  try {
    const query = action.payload.id
    const socket = io(`${process.env.REACT_APP_HOST}/support`, {
      extraHeaders: {
        Authorization: `Bearer ${accessToken}`
      },
      query: {
        id: query ?? undefined
      }
    })
    yield put(recieveSocket({ socket }))
  } catch (error: any) {
    yield put(supportChatFailure(error.message))
  }
}

function * handleSendDataWS (action: PayloadAction<sendDataWSType>, accessToken: string): Generator<any, void, any> {
  try {
    yield call(sendEvent, action.payload.socket, accessToken, action.payload.event, action.payload.data)
  } catch (error: any) {
    yield put(supportChatFailure(error.message))
  }
}

export default function * saga () {
  yield spawn(watchHotelSearchSaga)
  yield spawn(watchHotelPageSaga)
  yield spawn(watchNewHotelSaga)
  yield spawn(watchNewRoomSaga)
  yield spawn(watchEditHotelSaga)
  yield spawn(watchEditRoomSaga)
  yield spawn(watchDeleteHotelSaga)
  yield spawn(watchDeleteRoomSaga)
  yield spawn(watchNewUserSaga)
  yield spawn(watchUserSeacrhSaga)
  yield spawn(watchNewClientSaga)
  yield spawn(watchLoginSaga)
  yield spawn(watchLogoutSaga)
  yield spawn(watchUserInfoSaga)
  yield spawn(watchReservationsIdSaga)
  yield spawn(watchDelReservByClientSaga)
  yield spawn(watchDelReservByManagerSaga)
  yield spawn(watchCreateReservationSaga)
  yield spawn(watchReservationPageSaga)
  yield spawn(watchRequestsClientSaga)
  yield spawn(watchRequestsManagerSaga)
  yield spawn(watchHistoryChatSaga)
  yield spawn(watchInactiveRequestsSaga)
  yield spawn(watchSocketConnectSaga)
  yield spawn(watchSendDataWSSaga)
}
