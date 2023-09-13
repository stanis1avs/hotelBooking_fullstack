import { SendUser } from "./Users"
import { Message } from "../Models/Messages"

export class CreateRequest {
  text: string
}

export class SendSupportRequest {
  id: string
  createdAt: string
  title: Message
  messages?: any
}

export class DisableRequest{
  id: string
}