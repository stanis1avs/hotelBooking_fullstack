import { Controller, Get, Query, Res, UseGuards, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { RolesGuard } from "../Decorators/roles.decorator";
import { Role } from "../Decorators/setmetadata.decorator";
import { AuthGuard } from "@nestjs/passport";
import { SearchUserParams } from "../Interface/Users";
import { UsersProvider } from "../Providers/users.provider";

@Controller("/api/manager/users/")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Role("manager")
export class ManagerUsersController {
  constructor(private users: UsersProvider) {}

  @Get("/")
  async getUsers(@Query() query: SearchUserParams, @Res() res: Response): Promise<void> {
    // Менеджеру доступны только клиенты — ограничение задаётся здесь, а не в провайдере.
    const [items, total] = await Promise.all([
      this.users.getAllUsers(query, "client"),
      this.users.countUsers(query, "client"),
    ]);
    res.status(HttpStatus.OK).set("X-Total-Count", String(total)).send(items);
  }
}
