import { Resolver, Mutation, Args, Query } from "@nestjs/graphql";
import { UnauthorizedException, UseGuards } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AuthProvider } from "../../Providers/auth.provider";
import { UsersProvider } from "../../Providers/users.provider";
import { AuthPayloadType } from "../types/auth.type";
import { UserType } from "../types/user.type";
import { LoginInput } from "../inputs/login.input";
import { RegisterInput } from "../inputs/register.input";
import { GqlJwtAuthGuard } from "../guards/gql-jwt.guard";
import { CurrentUser } from "../decorators/current-user.decorator";
import { UserToJWTPayload } from "../../Interface/Users";

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authProvider: AuthProvider,
    private readonly usersProvider: UsersProvider,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  @Mutation(() => AuthPayloadType)
  async login(@Args("input") input: LoginInput): Promise<AuthPayloadType> {
    const user = await this.authProvider.validateUser(input.email, input.password);
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }
    const accessTokenData = await this.authProvider.login(user);
    const refreshTokenData = await this.authProvider.validateRefresh(accessTokenData);
    return {
      access_token: accessTokenData.token,
      refresh_token: refreshTokenData.token,
      user: {
        id: String(user.id),
        email: user.email,
        name: user.name,
        contactPhone: user.contactPhone,
        role: user.role,
      },
    };
  }

  @Mutation(() => UserType)
  async register(@Args("input") input: RegisterInput): Promise<UserType> {
    const user = await this.usersProvider.createUser({
      email: input.email,
      password: input.password,
      name: input.name,
      contactPhone: input.contactPhone,
    });
    return {
      id: String(user.id),
      email: user.email,
      name: user.name,
      contactPhone: user.contactPhone,
      role: user.role,
    };
  }

  @Mutation(() => AuthPayloadType)
  async refreshToken(@Args("refreshToken") refreshToken: string): Promise<AuthPayloadType> {
    let payload: UserToJWTPayload;
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get("JWT_TOKEN_SECRET"),
      });
      // refresh token payload is SendUser shape: { id, email, role, name, contactPhone }
      payload = { id: decoded.id, email: decoded.email, role: decoded.role };
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const newAccessTokenData = await this.authProvider.refresh(payload);
    const newRefreshTokenData = await this.authProvider.validateRefresh(newAccessTokenData);
    return {
      access_token: newAccessTokenData.token,
      refresh_token: newRefreshTokenData.token,
      user: {
        id: String(newAccessTokenData.userData.id),
        email: newAccessTokenData.userData.email,
        name: newAccessTokenData.userData.name,
        contactPhone: newAccessTokenData.userData.contactPhone,
        role: newAccessTokenData.userData.role,
      },
    };
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => UserType)
  async me(@CurrentUser() user: UserToJWTPayload): Promise<UserType> {
    const fullUser = await this.usersProvider.getIdUser(user.id);
    return {
      id: String(fullUser.id),
      email: fullUser.email,
      name: fullUser.name,
      contactPhone: fullUser.contactPhone,
      role: fullUser.role,
    };
  }
}
