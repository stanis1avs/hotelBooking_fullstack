import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // getAllAndOverride читает метаданные и с метода, и с класса:
    // раньше @Role на уровне контроллера просто игнорировался.
    const roles = this.reflector.getAllAndOverride<string[]>("role", [context.getHandler(), context.getClass()]);

    if (!roles || roles.length === 0) {
      return true;
    }

    const user = context.switchToHttp().getRequest()?.user;
    if (!user) {
      // Раньше здесь было обращение к полю несуществующего объекта — 500 вместо 401.
      throw new UnauthorizedException("Требуется авторизация");
    }
    if (!roles.includes(user.role)) {
      throw new ForbiddenException("Недостаточно прав для этой операции");
    }
    return true;
  }
}
