import { ExecutionContext, Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { GqlContextType, GqlExecutionContext } from "@nestjs/graphql";

/**
 * ThrottlerGuard, умеющий работать с GraphQL и WebSocket.
 *
 * Базовая реализация достаёт запрос через `context.switchToHttp()`. Для GraphQL
 * там undefined, поэтому обращение к `req.ip` при подсчёте лимита роняло
 * КАЖДЫЙ запрос к /graphql. Регистрация guard-а глобально (APP_GUARD) делала
 * неработоспособным весь GraphQL-слой, а на нём держится чтение данных.
 */
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const type = context.getType<GqlContextType>();
    // У WebSocket-обработчиков своя аутентификация и нет http-запроса,
    // считать для них лимит по IP нечем.
    if (type === "ws" || type === "rpc") {
      return true;
    }
    return super.canActivate(context);
  }

  protected getRequestResponse(context: ExecutionContext): { req: Record<string, any>; res: Record<string, any> } {
    // Тип контекста проверяем явно: для обычного HTTP-запроса
    // GqlExecutionContext возвращает третий аргумент обработчика,
    // и попытка достать из него res давала undefined уже на HTTP-маршрутах.
    if (context.getType<GqlContextType>() === "graphql") {
      const gqlContext = GqlExecutionContext.create(context).getContext();
      if (gqlContext?.req && gqlContext?.res) {
        return { req: gqlContext.req, res: gqlContext.res };
      }
    }
    return super.getRequestResponse(context);
  }
}
