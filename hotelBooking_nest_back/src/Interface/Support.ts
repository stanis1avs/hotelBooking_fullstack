import { SendUser } from "./Users"
import { Message } from "../Models/Messages"

export class CreateRequest {
  text: string
}

export class SendSupportRequest {
  id: string
  createdAt: string
  title: Message
  hasNewMessages: boolean
  messages?: any
}

export class SendSupportRequestFull{
  id: string
  createdAt: string
  isActive: boolean
  hasNewMessages: boolean
  client: any
}