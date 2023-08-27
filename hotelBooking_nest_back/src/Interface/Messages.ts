export class SendMessage {
  id: string
  createdAt: string
  text: string
  readAt?: string
  author: string
}

export class NewMessage {
  text: string
  id: string
}