import { Controller, Post, Body, Res, HttpStatus } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Response } from "express";
import { RegisterUserDto } from "../Interface/Users";
import { UsersProvider } from "../Providers/users.provider";

@Controller("/api/client/register")
export class ClientAuthController {
  constructor(private users: UsersProvider) {}

  @Throttle(5, 60)
  @Post("/")
  async createUserClient(@Body() data: RegisterUserDto, @Res() res: Response): Promise<void> {
    // RegisterUserDto не содержит поля role, а глобальный ValidationPipe работает
    // с forbidNonWhitelisted — попытка передать "role" вернёт 400.
    // Роль дополнительно фиксируем здесь, чтобы не зависеть только от настроек пайпа.
    const createdUser = await this.users.createUser({ ...data, role: "client" });
    res.status(HttpStatus.CREATED).send(createdUser);
  }
}
