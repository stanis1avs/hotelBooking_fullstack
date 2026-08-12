import { Resolver, Mutation, Args, Query, Context } from "@nestjs/graphql";
import { UnauthorizedException, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import { AuthProvider } from "../../Providers/auth.provider";
import { UsersProvider } from "../../Providers/users.provider";
import { AuthPayloadType } from "../types/auth.type";
import { UserType } from "../types/user.type";
import { LoginInput } from "../inputs/login.input";
import { RegisterInput } from "../inputs/register.input";
import { GqlJwtAuthGuard } from "../guards/gql-jwt.guard";
import { CurrentUser } from "../decorators/current-user.decorator";
import { UserToJWTPayload, SendUser } from "../../Interface/Users";
import { REFRESH_COOKIE, clearRefreshCookie, setRefreshCookie } from "../../Auth/refresh-cookie";

interface GqlContext {
  req: Request;
  res: Response;
}

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authProvider: AuthProvider,
    private readonly usersProvider: UsersProvider,
    private readonly configService: ConfigService
  ) {}

  private get isProd(): boolean {
    return this.configService.get("NODE_ENV") === "production";
  }

  private toUserType(user: SendUser): UserType {
    return {
      id: String(user.id),
      email: user.email,
      name: user.name,
      contactPhone: user.contactPhone,
      role: user.role,
    };
  }

  @Mutation(() => AuthPayloadType)
  async login(@Args("input") input: LoginInput, @Context() ctx: GqlContext): Promise<AuthPayloadType> {
    const user = await this.authProvider.validateUser(input.email, input.password);
    if (!user) {
      throw new UnauthorizedException("Неверный адрес или пароль");
    }
    const { access_token, refresh_token, userData } = await this.authProvider.issueTokens(user);
    setRefreshCookie(ctx.res, refresh_token, this.isProd);
    return { access_token, user: this.toUserType(userData) };
  }

  @Mutation(() => UserType)
  async register(@Args("input") input: RegisterInput): Promise<UserType> {
    // В RegisterInput нет поля role — роль назначается принудительно.
    const user = await this.usersProvider.createUser({
      email: input.email,
      password: input.password,
      name: input.name,
      contactPhone: input.contactPhone,
      role: "client",
    });
    return this.toUserType(user);
  }

  /**
   * Refresh-токен читается из httpOnly-cookie. Аргумент оставлен для обратной
   * совместимости со старым клиентом и будет удалён после его обновления.
   */
  @Mutation(() => AuthPayloadType)
  async refreshToken(
    @Context() ctx: GqlContext,
    @Args("refreshToken", { nullable: true }) refreshToken?: string
  ): Promise<AuthPayloadType> {
    const token = ctx.req?.cookies?.[REFRESH_COOKIE] ?? refreshToken;
    if (!token) {
      throw new UnauthorizedException("Refresh-токен не передан");
    }
    const payload = this.authProvider.verifyRefresh(token);
    const fresh = await this.authProvider.refresh(payload);
    setRefreshCookie(ctx.res, fresh.refresh_token, this.isProd);
    return { access_token: fresh.access_token, user: this.toUserType(fresh.userData) };
  }

  @Mutation(() => Boolean)
  async logout(@Context() ctx: GqlContext): Promise<boolean> {
    this.authProvider.revokeRefresh(ctx.req?.cookies?.[REFRESH_COOKIE]);
    clearRefreshCookie(ctx.res, this.isProd);
    return true;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => UserType)
  async me(@CurrentUser() user: UserToJWTPayload): Promise<UserType> {
    return this.toUserType(await this.usersProvider.getIdUser(user.id));
  }
}
