import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { UserToJWTPayload } from "../../Interface/Users";

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): UserToJWTPayload => {
  const ctx = GqlExecutionContext.create(context);
  return ctx.getContext().req.user;
});
