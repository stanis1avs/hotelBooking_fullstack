import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { UsersProvider } from "../../Providers/users.provider";
import { UserType, UsersPageType } from "../types/user.type";
import { SearchUsersArgs } from "../inputs/search-users.args";
import { CreateUserInput } from "../inputs/create-user.input";
import { UpdateUserInput } from "../inputs/update-user.input";
import { CurrentUser } from "../decorators/current-user.decorator";
import { UserToJWTPayload } from "../../Interface/Users";
import { GqlJwtAuthGuard } from "../guards/gql-jwt.guard";
import { GqlRolesGuard } from "../guards/gql-roles.guard";
import { Roles } from "../decorators/roles.decorator";

@Resolver(() => UserType)
export class UsersResolver {
  constructor(private readonly usersProvider: UsersProvider) {}

  private toArgs(args: SearchUsersArgs) {
    return {
      limit: args.limit,
      offset: args.offset,
      email: args.email ?? "",
      name: args.name ?? "",
      contactPhone: args.contactPhone ?? "",
      // Роль здесь терялась, и фильтр по роли на странице «Пользователи»
      // не имел никакого эффекта: выдача всегда приходила полная.
      role: args.role,
    };
  }

  private toType(u: { id: unknown; email: string; name: string; contactPhone: string; role?: string }): UserType {
    return { id: String(u.id), email: u.email, name: u.name, contactPhone: u.contactPhone, role: u.role };
  }

  /** Страница выдачи вместе с общим количеством — по нему клиент нумерует страницы. */
  private async page(args: SearchUsersArgs, roleScope: string | null): Promise<UsersPageType> {
    const params = this.toArgs(args);
    const [users, total] = await Promise.all([
      this.usersProvider.getAllUsers(params, roleScope),
      this.usersProvider.countUsers(params, roleScope),
    ]);
    return { items: users.map((u) => this.toType(u)), total };
  }

  // Администратор видит все роли — включая только что созданных менеджеров.
  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles("admin")
  @Query(() => UsersPageType)
  async adminUsers(@Args() args: SearchUsersArgs): Promise<UsersPageType> {
    return this.page(args, null);
  }

  // Менеджеру доступны только клиенты.
  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles("manager")
  @Query(() => UsersPageType)
  async managerUsers(@Args() args: SearchUsersArgs): Promise<UsersPageType> {
    return this.page(args, "client");
  }

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles("admin")
  @Mutation(() => UserType)
  async adminUpdateUser(
    @Args("id") id: string,
    @Args("input") input: UpdateUserInput,
    @CurrentUser() actor: UserToJWTPayload
  ): Promise<UserType> {
    return this.toType(await this.usersProvider.updateUser(id, input, actor.id));
  }

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles("admin")
  @Mutation(() => UserType)
  async adminCreateUser(@Args("input") input: CreateUserInput): Promise<UserType> {
    const user = await this.usersProvider.createUser({
      email: input.email,
      password: input.password,
      name: input.name,
      contactPhone: input.contactPhone,
      role: input.role,
    });
    return {
      id: String(user.id),
      email: user.email,
      name: user.name,
      contactPhone: user.contactPhone,
      role: user.role,
    };
  }
}
