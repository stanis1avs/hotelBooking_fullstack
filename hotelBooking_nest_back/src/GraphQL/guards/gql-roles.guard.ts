import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";

@Injectable()
export class GqlRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>("roles", context.getHandler());
    if (!roles || roles.length === 0) {
      return true;
    }
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;
    return user && roles.includes(user.role);
  }
}
