import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Response } from "express";

/**
 * Единая точка обработки ошибок HTTP-слоя.
 * Наружу отдаёт только безопасное сообщение, стек пишет в лог.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("Exception");

  catch(exception: unknown, host: ArgumentsHost): void {
    // GraphQL-запросы обрабатывает Apollo, у них нет http-контекста
    if (host.getType<string>() !== "http") {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = isHttp ? exception.getResponse() : "Внутренняя ошибка сервера";

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`${req.method} ${req.url}`, exception instanceof Error ? exception.stack : String(exception));
    }

    res.status(status).json(
      typeof payload === "string"
        ? { statusCode: status, message: payload }
        : { statusCode: status, ...(payload as Record<string, unknown>) }
    );
  }
}
