import { Injectable, Inject, BadRequestException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { UsersProvider } from "./users.provider"
import { SupportDocument, Support } from '../Models/Support';
import { MessageDocument, Message } from '../Models/Messages';
import { SendSupportRequest, CreateRequest, SendSupportRequestFull } from '../Interface/Support'
import { SendMessage } from '../Interface/Messages'
import { UserToJWTPayload, SendUser } from '../Interface/Users'

@Injectable()
export class SupportProvider {
  constructor(
    @InjectModel(Support.name) private supportModel: Model<SupportDocument>,
    @InjectModel(Message.name) private messagesModel: Model<MessageDocument>,
    @Inject(UsersProvider) readonly usersProvider: UsersProvider
  ) {}

  async createRequest(createRequest: CreateRequest, currUser: UserToJWTPayload): Promise<SendSupportRequest> {
    const message = await this.newMessage(createRequest.text, currUser)
    const createdRequest = new this.supportModel({
      user: currUser.id,
      createdAt: new Date().toISOString(),
      isActive: true,
      messages: [message]
    });
    await createdRequest.save();
    return this.printFormatSupport(createdRequest, 1)
  }

  async getRequestById(id: string): Promise<SupportDocument> {
    const supportRequest = await this.supportModel.findById(id)
    if(!supportRequest){
      throw new BadRequestException()
    }
    return supportRequest
  }

  async getRequestsforManager(): Promise<any>{
    const foundSupportRequest = await this.supportModel.find({
      isActive: true,
    })
    if(!foundSupportRequest){
      throw new BadRequestException()
    }
    return foundSupportRequest.map(async (el) => {
      const user = await this.usersProvider.getIdUser(el.user.toString())
      return {
        ...this.printFormatSupport(el, el.messages.length),
        // hasNewMessages: el.messages.some( (e) => e.readAt !== undefined),
        }
        // client: user}
    })
  }

  async getRequestsforClient(currUser: UserToJWTPayload): Promise<SendSupportRequest[]>{
    const foundSupportRequest = await this.supportModel.find({
      isActive: true,
      user: currUser.id
    })
    if(!foundSupportRequest){
      throw new BadRequestException()
    }
    return foundSupportRequest.map(el => {
      return {
        ...this.printFormatSupport(el, el.messages.length),
        // hasNewMessages: el.messages.some( (e) => e.readAt !== undefined)
      }
    })
  }


  async getHistory(id: string, currUser: UserToJWTPayload): Promise<SendMessage[]>{
    const supportRequest = await this.getRequestById(id)
    return supportRequest.messages.map(el => this.printFormatHistoryMesg(supportRequest, el))
  }

  async newMessage(textMessage: string, currUser: UserToJWTPayload): Promise<MessageDocument> {
    const message = new this.messagesModel({
      author: currUser.id,
      sentAt: new Date().toISOString(),
      text: textMessage,
    })
    return await message.save();
  }

  async messagesRead(id: string): Promise<void> {
    const supportRequest = await this.getRequestById(id)
    supportRequest.messages.forEach((el) => {
      if(!el.readAt) {
        readAt: new Date().toISOString()
      }
    })
  }

  async sendMessage(id: string, text: string, currUser: UserToJWTPayload): Promise<SendMessage> {
    const message = await this.newMessage(text, currUser)
    const supportRequest = await this.getRequestById(id)
    await this.supportModel.findByIdAndUpdate(id, {messages: [...supportRequest.messages, message]})
    return this.printFormatHistoryMesg(supportRequest, message)
  }

  printFormatSupport(counter: SupportDocument, numberMessages: number): SendSupportRequest {
    return {
      id: counter.id,
      createdAt: new Date(counter.createdAt).toISOString(),
      hasNewMessages: true,
      // hasNewMessages: (numberMessages == 1 ? false : true),
      title: counter.messages[0]
    }
  }

  printFormatHistoryMesg(supportRequest: SupportDocument, message: any): SendMessage {
    return {
      id: message._id,
      createdAt: new Date(supportRequest.createdAt).toISOString(),
      text: message.text,
      readAt: message.read ? new Date(message.readAt).toISOString() : undefined,
      author: message.author
    }
  }
}