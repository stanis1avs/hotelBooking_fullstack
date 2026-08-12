import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./Filters/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const isProd = config.get("NODE_ENV") === "production";

  // GraphQL-песочница подтягивает скрипты с CDN, поэтому CSP включаем только в проде.
  app.use(
    helmet({
      contentSecurityPolicy: isProd ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.enableCors({
    origin: (config.get<string>("CORS_ORIGINS") ?? "http://localhost:4200")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    credentials: true,
  });

  app.use(cookieParser(config.get("COOKIE_SECRET")));

  // whitelist срезает поля, которых нет в DTO, forbidNonWhitelisted отвечает 400 при их наличии.
  // Именно это закрывает подстановку "role": "admin" в теле регистрации.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const port = Number(config.get("SERVER_PORT")) || 7000;
  await app.listen(port);
  new Logger("Bootstrap").log(`Сервер слушает порт ${port}`);
}

bootstrap();
