export interface SendRequests {
  id: string
  createdAt: string
  title: any
  hasNewMessages: boolean
}

export interface SendMessages {
  id: string
  createdAt: string
  text: string
  readAt?: string
  author: string
}

export interface historyRequest {
  id: string
  requests: []
}

export interface recieveSocketType {
  socket: any
}

export interface socketConnectType {
  id?: string
}

export interface sendDataWSType {
  event: string
  socket: any
  data: {
    text: string
    id?: string
  }
}
