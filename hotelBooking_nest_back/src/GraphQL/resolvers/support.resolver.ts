import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { SupportProvider } from "../../Providers/support.provider";
import { SupportRequestType, SupportMessageType } from "../types/support.type";
import { GqlJwtAuthGuard } from "../guards/gql-jwt.guard";
import { GqlRolesGuard } from "../guards/gql-roles.guard";
import { Roles } from "../decorators/roles.decorator";
import { CurrentUser } from "../decorators/current-user.decorator";
import { UserToJWTPayload } from "../../Interface/Users";
import { SendSupportRequest } from "../../Interface/Support";

@Resolver()
export class SupportResolver {
  constructor(private readonly supportProvider: SupportProvider) {}

  private toType(r: SendSupportRequest): SupportRequestType {
    return { id: String(r.id), createdAt: r.createdAt, title: r.title, isActive: r.isActive };
  }

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles("client")
  @Query(() => [SupportRequestType])
  async mySupportRequests(@CurrentUser() user: UserToJWTPayload): Promise<SupportRequestType[]> {
    const requests = await this.supportProvider.getRequestsforClient(user);
    return requests.map((r) => this.toType(r));
  }

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles("manager")
  @Query(() => [SupportRequestType])
  async allSupportRequests(): Promise<SupportRequestType[]> {
    const requests = await this.supportProvider.getRequestsforManager();
    return requests.map((r) => this.toType(r));
  }

  /**
   * Раньше здесь стоял только GqlJwtAuthGuard, а переписка отдавалась по одному
   * идентификатору: любой авторизованный пользователь мог прочитать чужое обращение.
   * Теперь провайдер сверяет владельца (менеджеру доступны все).
   */
  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles("client", "manager")
  @Query(() => [SupportMessageType])
  async supportMessages(
    @Args("requestId") requestId: string,
    @CurrentUser() user: UserToJWTPayload
  ): Promise<SupportMessageType[]> {
    const messages = await this.supportProvider.getHistory(requestId, user);
    return messages.map((m) => ({
      id: String(m.id),
      text: m.text,
      createdAt: m.createdAt,
      readAt: m.readAt ?? null,
      author: String(m.author),
      requestId: String(m.requestId),
    }));
  }

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles("client")
  @Mutation(() => SupportRequestType)
  async createSupportRequest(
    @Args("text") text: string,
    @CurrentUser() user: UserToJWTPayload
  ): Promise<SupportRequestType> {
    return this.toType(await this.supportProvider.createRequest({ text }, user));
  }

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles("client", "manager")
  @Mutation(() => SupportMessageType)
  async sendSupportMessage(
    @Args("requestId") requestId: string,
    @Args("text") text: string,
    @CurrentUser() user: UserToJWTPayload
  ): Promise<SupportMessageType> {
    const m = await this.supportProvider.sendMessage(requestId, text, user);
    return {
      id: String(m.id),
      text: m.text,
      createdAt: m.createdAt,
      readAt: m.readAt ?? null,
      author: String(m.author),
      requestId: String(m.requestId),
    };
  }

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles("manager")
  @Mutation(() => Boolean)
  async closeSupportRequest(@Args("id") id: string): Promise<boolean> {
    await this.supportProvider.makeInactiveRequest({ id });
    return true;
  }
}
