import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { SupportProvider } from "../../Providers/support.provider";
import { SupportRequestType, SupportMessageType } from "../types/support.type";
import { GqlJwtAuthGuard } from "../guards/gql-jwt.guard";
import { GqlRolesGuard } from "../guards/gql-roles.guard";
import { Roles } from "../decorators/roles.decorator";
import { CurrentUser } from "../decorators/current-user.decorator";
import { UserToJWTPayload } from "../../Interface/Users";

@Resolver()
export class SupportResolver {
  constructor(private readonly supportProvider: SupportProvider) {}

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles("client")
  @Query(() => [SupportRequestType])
  async mySupportRequests(@CurrentUser() user: UserToJWTPayload): Promise<SupportRequestType[]> {
    const requests = await this.supportProvider.getRequestsforClient(user);
    return requests.map((r) => ({
      id: String(r.id),
      createdAt: r.createdAt,
      title: r.title ? { text: (r.title as any).text } : null,
      isActive: null,
    }));
  }

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles("manager")
  @Query(() => [SupportRequestType])
  async allSupportRequests(): Promise<SupportRequestType[]> {
    const requests = await this.supportProvider.getRequestsforManager();
    return requests.map((r) => ({
      id: String(r.id),
      createdAt: r.createdAt,
      title: r.title ? { text: (r.title as any).text } : null,
      isActive: null,
    }));
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [SupportMessageType])
  async supportMessages(@Args("requestId") requestId: string): Promise<SupportMessageType[]> {
    const messages = await this.supportProvider.getHistory(requestId);
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
  @Roles("manager")
  @Mutation(() => Boolean)
  async closeSupportRequest(@Args("id") id: string): Promise<boolean> {
    await this.supportProvider.makeInactiveRequest({ id });
    return true;
  }
}
