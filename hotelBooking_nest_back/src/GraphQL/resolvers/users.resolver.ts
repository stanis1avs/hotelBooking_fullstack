import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { UsersProvider } from "../../Providers/users.provider";
import { UserType } from "../types/user.type";
import { SearchUsersArgs } from "../inputs/search-users.args";
import { CreateUserInput } from "../inputs/create-user.input";
import { GqlJwtAuthGuard } from "../guards/gql-jwt.guard";
import { GqlRolesGuard } from "../guards/gql-roles.guard";
import { Roles } from "../decorators/roles.decorator";

@Resolver(() => UserType)
export class UsersResolver {
  constructor(private readonly usersProvider: UsersProvider) {}

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles("admin")
  @Query(() => [UserType])
  async adminUsers(@Args() args: SearchUsersArgs): Promise<UserType[]> {
    const users = await this.usersProvider.getAllUsers({
      limit: args.limit,
      offset: args.offset,
      email: args.email ?? "",
      name: args.name ?? "",
      contactPhone: args.contactPhone ?? "",
    });
    return users.map((u) => ({
      id: String(u.id),
      email: u.email,
      name: u.name,
      contactPhone: u.contactPhone,
      role: u.role,
    }));
  }

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles("manager")
  @Query(() => [UserType])
  async managerUsers(@Args() args: SearchUsersArgs): Promise<UserType[]> {
    const users = await this.usersProvider.getAllUsers({
      limit: args.limit,
      offset: args.offset,
      email: args.email ?? "",
      name: args.name ?? "",
      contactPhone: args.contactPhone ?? "",
    });
    return users.map((u) => ({
      id: String(u.id),
      email: u.email,
      name: u.name,
      contactPhone: u.contactPhone,
      role: u.role,
    }));
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
