import { Injectable} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { compareSync } from "bcrypt";
import { UserDocument, User } from '../Models/Users';
import { SendUser, UserToJWTPayload, ValidatedToken } from '../Interface/Users'
import { ConfigModule, ConfigService } from '@nestjs/config';

@Injectable()
export class AuthProvider {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async validateUser(email: string, pass: string): Promise<SendUser | null> {
    const user = await this.userModel.findOne({email: email});
    if (user && compareSync(pass, user.password)) {
      return this.printFormatUser(user);
    }
    return null;
  }

  async login(userData: SendUser): Promise<ValidatedToken> {
    return {
      token: this.jwtService.sign(
        { email: userData.email, role: userData.role, sub: userData.id },
        { secret: this.configService.get('JWT_TOKEN_SECRET'), expiresIn: "2 days" }),
      userData
    };
  }

  async validateRefresh(userData: ValidatedToken): Promise<{token: string}> {
    return {
      token: this.jwtService.sign(userData.userData, { secret: this.configService.get('JWT_TOKEN_SECRET'), expiresIn: "10 days" })
    };
  }

  async refresh(userDataShort: UserToJWTPayload): Promise<ValidatedToken> {
    const user = await this.userModel.findById(userDataShort.id)
    const userDataFull = this.printFormatUser(user)
    return await this.login(userDataFull)
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