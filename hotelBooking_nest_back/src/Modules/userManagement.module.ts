import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserSchema, User } from "../Models/Users";
import { UsersProvider } from "../Providers/users.provider";

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [],
  providers: [UsersProvider],
})
export class UserManagementModule {}
