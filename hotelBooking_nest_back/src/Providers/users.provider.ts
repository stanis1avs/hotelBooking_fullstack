import { Injectable, BadRequestException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { genSaltSync, hashSync } from "bcrypt";
import { UserDocument, User } from '../Models/Users';
import { SearchUserParams, CreateUser, SendUser } from '../Interface/Users'

@Injectable()
export class UsersProvider {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createUser(createUser: CreateUser): Promise<SendUser> {
    const createdUser = new this.userModel({
      ...createUser,
      password: hashSync(createUser.password, genSaltSync(10)),
      role: createUser.role ? createUser.role : 'client'
    });
    await createdUser.save();
    return this.printFormatUser(createdUser)
  }

  async getAllUsers(queryParams: SearchUserParams): Promise<SendUser[]>{
    const foundUsers = await this.userModel.find({
      name: { "$regex": queryParams.name, "$options": "i" },
      email: { "$regex": queryParams.email, "$options": "i" },
      contactPhone: { "$regex": queryParams.contactPhone, "$options": "i" },
      role: "client"
    })
      .skip(queryParams.offset)
      .limit(50);
    if(!foundUsers){
      throw new BadRequestException()
    }
    return foundUsers.map(el => this.printFormatUser(el))
  }

  async getIdUser(id: string): Promise<SendUser> {
    const foundUser = await this.userModel.findById(id)
    if(!foundUser){
      throw new BadRequestException()
    }
    return this.printFormatUser(foundUser)
  }

  printFormatUser(user: UserDocument): SendUser {
    return {
      id: user._id,
      email: user.email,
      name: user.name,
      contactPhone: user.contactPhone,
      role: user.role
    }
  }
}