import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, isValidObjectId } from "mongoose";
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
      user: new mongoose.Types.ObjectId(currUser.id),
      createdAt: new Date(),
      isActive: true,
      messages: [message],
    });
    await createdRequest.save();
    return this.printFormatSupport(createdRequest);
  }

  async getRequestById(id: string): Promise<SupportDocument> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException("Обращение не найдено");
    }
    const supportRequest = await this.supportModel.findById(id);
    if (!supportRequest) {
      throw new NotFoundException("Обращение не найдено");
    }
    return supportRequest;
  }

  /**
   * Единственная точка проверки доступа к обращению.
   *
   * Раньше её не было вовсе: и REST-эндпоинт, и GraphQL-резолвер отдавали переписку
   * по одному только идентификатору, поэтому любой авторизованный клиент мог
   * перебором ObjectId читать чужие обращения.
   */
  async getOwnedRequest(id: string, currUser: UserToJWTPayload): Promise<SupportDocument> {
    const request = await this.getRequestById(id);
    if (currUser.role !== "manager" && String(request.user) !== String(currUser.id)) {
      throw new ForbiddenException("Это обращение принадлежит другому пользователю");
    }
    return request;
  }

  async getRequestsforManager(): Promise<SendSupportRequest[]> {
    const found = await this.supportModel.find({ isActive: true }).sort({ createdAt: -1 });
    return found.map((el) => this.printFormatSupport(el));
  }

  async getRequestsforClient(currUser: UserToJWTPayload): Promise<SendSupportRequest[]> {
    if (!isValidObjectId(currUser.id)) return [];
    const found = await this.supportModel
      .find({ user: new mongoose.Types.ObjectId(currUser.id) })
      .sort({ createdAt: -1 });
    return found.map((el) => this.printFormatSupport(el));
  }

  /**
   * Непрочитанные сообщения собеседника — для счётчика в меню.
   *
   * Считается одной агрегацией: сообщения лежат внутри документа обращения,
   * поэтому вытаскивать переписки на сервер приложения ради подсчёта не нужно.
   */
  async countUnread(currUser: UserToJWTPayload): Promise<number> {
    if (!isValidObjectId(currUser.id)) return 0;
    const userId = new mongoose.Types.ObjectId(currUser.id);
    // Менеджер отвечает на все открытые обращения, клиент видит только свои.
    const scope = currUser.role === "manager" ? { isActive: true } : { user: userId };

    const [row] = await this.supportModel.aggregate<{ total: number }>([
      { $match: scope },
      {
        $project: {
          unread: {
            $size: {
              $filter: {
                input: { $ifNull: ["$messages", []] },
                as: "m",
                cond: {
                  $and: [
                    { $ne: ["$$m.author", userId] },
                    { $eq: [{ $ifNull: ["$$m.readAt", null] }, null] },
                  ],
                },
              },
            },
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$unread" } } },
    ]);
    return row?.total ?? 0;
  }

  async getHistory(id: string, currUser: UserToJWTPayload): Promise<SendMessage[]> {
    const supportRequest = await this.getOwnedRequest(id, currUser);
    return (supportRequest.messages ?? []).map((el) => this.printFormatMessage(el, String(supportRequest._id)));
  }

  async makeInactiveRequest(data: DisableRequest): Promise<SendSupportRequest[]> {
    const updated = await this.supportModel.findByIdAndUpdate(data.id, { isActive: false }, { new: true });
    if (!updated) {
      throw new NotFoundException("Обращение не найдено");
    }
    return this.getRequestsforManager();
  }

  async newMessage(textMessage: string, currUser: UserToJWTPayload): Promise<MessageDocument> {
    const message = new this.messagesModel({
      author: new mongoose.Types.ObjectId(currUser.id),
      sentAt: new Date(),
      text: textMessage,
    });
    return message.save();
  }

  async messagesRead(id: string, currUser: UserToJWTPayload): Promise<SendMessage[]> {
    const supportRequest = await this.getOwnedRequest(id, currUser);
    const now = new Date();

    // Точечное обновление отметок вместо перезаписи всего массива:
    // так параллельно пришедшее сообщение не затирается.
    await this.supportModel.updateOne(
      { _id: supportRequest._id },
      { $set: { "messages.$[unread].readAt": now } },
      {
        arrayFilters: [
          { "unread.author": { $ne: new mongoose.Types.ObjectId(currUser.id) }, "unread.readAt": { $exists: false } },
        ],
      }
    );

    const fresh = await this.supportModel.findById(id);
    return (fresh.messages ?? []).map((el) => this.printFormatMessage(el, String(fresh._id)));
  }

  async sendMessage(id: string, text: string, currUser: UserToJWTPayload): Promise<SendMessage> {
    const supportRequest = await this.getOwnedRequest(id, currUser);
    if (!supportRequest.isActive) {
      throw new BadRequestException("Обращение закрыто — создайте новое");
    }
    const message = await this.newMessage(text, currUser);
    // $push атомарен: одновременные сообщения клиента и менеджера не перетирают друг друга.
    await this.supportModel.updateOne({ _id: supportRequest._id }, { $push: { messages: message } });
    return this.printFormatMessage(message, String(supportRequest._id));
  }

  printFormatSupport(request: SupportDocument): SendSupportRequest {
    const first: any = request.messages?.[0];
    return {
      id: String(request._id),
      createdAt: new Date(request.createdAt).toISOString(),
      // Раньше сюда попадал весь документ сообщения, и фронтенду приходилось
      // доставать текст через приведение типов.
      title: first?.text ?? "",
      isActive: request.isActive ?? false,
    };
  }

  printFormatMessage(message: any, requestId: string): SendMessage {
    return {
      id: String(message._id),
      createdAt: new Date(message.sentAt).toISOString(),
      text: message.text,
      readAt: message.readAt ? new Date(message.readAt).toISOString() : undefined,
      author: String(message.author),
      requestId,
    };
  }
}
