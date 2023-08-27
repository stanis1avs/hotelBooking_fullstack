import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common'
import { Response } from 'express';
import { SearchUserParams, CreateUser } from '../Interface/Users'
import { UsersProvider } from '../Providers/users.provider'

@Controller('/api/client/register')
export class ClientAuthController {
  constructor(private users: UsersProvider) {}

  @Post('/')
  async createUserClient(@Body() data: CreateUser, @Res() res: Response): Promise<void> {
    const createdUser = await this.users.createUser(data);
    res.status(HttpStatus.CREATED).send(createdUser);
  }
}