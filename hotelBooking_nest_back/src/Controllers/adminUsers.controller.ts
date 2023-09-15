import { Controller, Post, Body, Get, Query, Res, UseGuards, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { RolesGuard } from "../Decorators/roles.decorator";
import { Role } from "../Decorators/setmetadata.decorator";
import { AuthGuard } from "@nestjs/passport";
import { SearchUserParams, CreateUser } from "../Interface/Users";
import { UsersProvider } from "../Providers/users.provider";

@Controller("/api/admin/users/")
@UseGuards(RolesGuard)
@UseGuards(AuthGuard("jwt"))
export class AdminUsersController {
  constructor(private users: UsersProvider) {}

  @Role("admin")
  @Post("/")
  async createUser(@Body() data: CreateUser, @Res() res: Response): Promise<void> {
    const createdUser = await this.users.createUser(data);
    res.status(HttpStatus.CREATED).send(createdUser);
  }

  @Role("admin")
  @Get("/")
  async getUsers(@Query() query: SearchUserParams, @Res() res: Response): Promise<void> {
    const users = await this.users.getAllUsers(query);
    res.status(HttpStatus.OK).send(users);
  }
}
