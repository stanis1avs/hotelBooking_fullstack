import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { join } from "path";
import { json } from "express";
import * as cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./Filters/all-exceptions.filter";
import { UPLOADS_URL_PREFIX } from "./utils/file-storage";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const isProd = config.get("NODE_ENV") === "production";

  /**
   * Потолок на тело запроса. Дешёвая защита от запроса с тысячами алиасов:
   * до разбора и подсчёта сложности дело даже не доходит. Столько же ставит
   * body-parser по умолчанию, но здесь это записано явно — чтобы предел
   * был виден и не уехал при смене версии.
   *
   * Загрузку фотографий это не задевает: multipart разбирает multer
   * со своими ограничениями, а перед ним стоит client_max_body_size в nginx.
   */
  app.use(json({ limit: "100kb" }));

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

  // Изображения отдаются файлами и кэшируются браузером на год: имя файла
  // содержит хэш содержимого, поэтому изменение картинки меняет и адрес.
  app.useStaticAssets(join(process.cwd(), "uploads"), {
    prefix: `${UPLOADS_URL_PREFIX}/`,
    maxAge: "1y",
    immutable: true,
    index: false,
    fallthrough: false,
  });

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
