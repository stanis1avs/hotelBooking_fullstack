import { Controller, Get, Query, Res, UseGuards, HttpStatus } from '@nestjs/common'
import { Response } from 'express';
import { RolesGuard } from '../Decorators/roles.decorator';
import { Role } from '../Decorators/setmetadata.decorator';
import { AuthGuard } from '@nestjs/passport';
import { SearchUserParams, CreateUser } from '../Interface/Users'
import { UsersProvider} from '../Providers/users.provider'

@Controller('/api/manager/users/')
@UseGuards(RolesGuard)
@UseGuards(AuthGuard('jwt'))
export class ManagerUsersController {
  constructor(private users: UsersProvider) {}

  @Role('manager')
  @Get('/')
  async getUsers(@Query() query: SearchUserParams, @Res() res: Response): Promise<void> {
    const users = await this.users.getAllUsers(query);
    res.status(HttpStatus.OK).send(users);
  }
}