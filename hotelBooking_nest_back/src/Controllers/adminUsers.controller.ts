import { Controller, Post, Body, Get, Query, Res, UseGuards, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { RolesGuard } from "../Decorators/roles.decorator";
import { Role } from "../Decorators/setmetadata.decorator";
import { AuthGuard } from "@nestjs/passport";
import { SearchUserParams, CreateUserDto } from "../Interface/Users";
import { UsersProvider } from "../Providers/users.provider";

@Controller("/api/admin/users/")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Role("admin")
export class AdminUsersController {
  constructor(private users: UsersProvider) {}

  @Post("/")
  async createUser(@Body() data: CreateUserDto, @Res() res: Response): Promise<void> {
    const createdUser = await this.users.createUser(data);
    res.status(HttpStatus.CREATED).send(createdUser);
  }

  @Get("/")
  async getUsers(@Query() query: SearchUserParams, @Res() res: Response): Promise<void> {
    // Администратор видит все роли — раньше фильтр role: "client" был вшит
    // в провайдер, и созданный менеджер не появлялся в списке.
    const [items, total] = await Promise.all([
      this.users.getAllUsers(query),
      this.users.countUsers(query),
    ]);
    res.status(HttpStatus.OK).set("X-Total-Count", String(total)).send(items);
  }
}
