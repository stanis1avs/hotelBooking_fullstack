import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport';
import { UserSchema, User } from '../Models/Users';
import { AuthProvider } from '../Providers/auth.provider'
// import { AuthMiddleware } from '../Middlewares/auth.middleware'
import { UsersProvider } from '../Providers/users.provider'
import { LocalStrategy } from '../Auth/local.strategy'
import { JwtStrategy } from '../Auth/jwt.strategy'
import { JwtRefreshStrategy } from '../Auth/jwt-refresh.strategy'
import { AuthController } from '../Controllers/auth.controller'
import { ClientAuthController } from '../Controllers/clientAuth.controller'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    JwtModule.register({
      secret: 'hard!to-guess_secret'
    })],
  controllers: [AuthController, ClientAuthController],
  providers: [AuthProvider, UsersProvider, LocalStrategy, JwtStrategy, JwtRefreshStrategy]
})
export class AuthModule {}