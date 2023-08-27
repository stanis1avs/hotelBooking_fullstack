import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema, User } from '../Models/Users';
import { UsersProvider } from '../Providers/users.provider'
import { AdminUsersController } from '../Controllers/adminUsers.controller'
import { ManagerUsersController } from '../Controllers/managerUsers.controller'

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [AdminUsersController, ManagerUsersController],
  providers: [UsersProvider]
})
export class UserManagementModule {}