export class SendMessage {
  id: string
  createdAt: string
  text: string
  readAt?: string
  author: string
  requestId: string
}

export class NewMessage {
  text: string
  id: string
}

export class MessageRead {
  id: string
}