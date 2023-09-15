import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { SupportDocument, Support } from "../Models/Support";
import { MessageDocument, Message } from "../Models/Messages";
import { SendMessage } from "../Interface/Messages";
import { UserToJWTPayload } from "../Interface/Users";
import { SendSupportRequest, CreateRequest, DisableRequest } from "../Interface/Support";

@Injectable()
export class SupportProvider {
  constructor(
    @InjectModel(Support.name) private supportModel: Model<SupportDocument>,
    @InjectModel(Message.name) private messagesModel: Model<MessageDocument>
  ) {}

  async createRequest(createRequest: CreateRequest, currUser: UserToJWTPayload): Promise<SendSupportRequest> {
    const message = await this.newMessage(createRequest.text, currUser);
    const createdRequest = new this.supportModel({
      user: currUser.id,
      createdAt: new Date().toISOString(),
      isActive: true,
      messages: [message],
    });
    await createdRequest.save();
    return this.printFormatSupport(createdRequest);
  }

  async getRequestById(id: string): Promise<SupportDocument> {
    const supportRequest = await this.supportModel.findById(id);
    if (!supportRequest) {
      throw new BadRequestException();
    }
    return supportRequest;
  }

  async getRequestsforManager(): Promise<SendSupportRequest[]> {
    const foundSupportRequest = await this.supportModel.find({
      isActive: true,
    });
    if (!foundSupportRequest) {
      throw new BadRequestException();
    }
    return foundSupportRequest.map((el) => {
      return {
        ...this.printFormatSupport(el),
      };
    });
  }

  async getRequestsforClient(currUser: UserToJWTPayload): Promise<SendSupportRequest[]> {
    const foundSupportRequest = await this.supportModel.find({
      isActive: true,
      user: currUser.id,
    });
    if (!foundSupportRequest) {
      throw new BadRequestException();
    }
    return foundSupportRequest.map((el) => {
      return {
        ...this.printFormatSupport(el),
      };
    });
  }

  async getHistory(id: string): Promise<SendMessage[]> {
    const supportRequest = await this.getRequestById(id);
    return supportRequest.messages.map((el) => this.printFormatMessage(el, supportRequest._id));
  }

  async makeInactiveRequest(data: DisableRequest): Promise<SendSupportRequest[]> {
    await this.supportModel.findByIdAndUpdate(data.id, { isActive: false });
    return await this.getRequestsforManager();
  }

  async newMessage(textMessage: string, currUser: UserToJWTPayload): Promise<MessageDocument> {
    const message = new this.messagesModel({
      author: currUser.id,
      sentAt: new Date().toISOString(),
      text: textMessage,
    });
    return await message.save();
  }

  async messagesRead(id: string, currUser: UserToJWTPayload): Promise<SendMessage[]> {
    const supportRequest = await this.getRequestById(id);
    supportRequest.messages.forEach((el: any) => {
      if (el.author.toString() != currUser.id && !el.readAt) {
        el.readAt = new Date().toISOString();
      }
    });
    await this.supportModel.findByIdAndUpdate(id, {
      messages: [...supportRequest.messages],
    });
    return supportRequest.messages.map((el) => this.printFormatMessage(el, supportRequest._id));
  }

  async sendMessage(id: string, text: string, currUser: UserToJWTPayload): Promise<SendMessage> {
    const message = await this.newMessage(text, currUser);
    const supportRequest = await this.getRequestById(id);
    await this.supportModel.findByIdAndUpdate(id, {
      messages: [...supportRequest.messages, message],
    });
    return this.printFormatMessage(message, supportRequest._id);
  }

  printFormatSupport(counter: SupportDocument): SendSupportRequest {
    return {
      id: counter.id,
      createdAt: new Date(counter.createdAt).toISOString(),
      title: counter.messages[0],
    };
  }

  printFormatMessage(message: any, requestId: string): SendMessage {
    return {
      id: message._id,
      createdAt: new Date(message.sentAt).toISOString(),
      text: message.text,
      readAt: message.readAt ?? undefined,
      author: message.author,
      requestId,
    };
  }
}
