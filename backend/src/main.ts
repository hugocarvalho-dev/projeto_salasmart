import "./config/load-env";

import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.NODE_ENV === "production"
        ? ["error", "warn", "log"]
        : ["error", "warn", "log", "debug", "verbose"],
  });
  const config = app.get(ConfigService);
  const logger = new Logger("Bootstrap");
  const isProd = config.get<string>("NODE_ENV") === "production";

  if (isProd) {
    app.set("trust proxy", 1);
  }

  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            useDefaults: true,
            directives: {
              "script-src": ["'self'"],
              "frame-src": ["'self'"],
              "connect-src": ["'self'"],
              "img-src": ["'self'", "data:"],
              "style-src": ["'self'", "'unsafe-inline'"],
              "font-src": ["'self'"],
              "frame-ancestors": ["'none'"],
              "object-src": ["'none'"],
              "base-uri": ["'self'"],
              "form-action": ["'self'"],
              "upgrade-insecure-requests": [],
            },
          }
        : false,
      hsts: isProd ? { maxAge: 15552000, includeSubDomains: true } : false,
    }),
  );

  app.use(cookieParser());

  app.useBodyParser("json", { limit: "1mb" });
  app.useBodyParser("urlencoded", { limit: "1mb", extended: true });

  app.setGlobalPrefix("api");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const corsOrigin = config.get<string>("CORS_ORIGIN")?.trim();
  if (isProd && !corsOrigin) {
    throw new Error("CORS_ORIGIN é obrigatório em produção.");
  }
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(",").map((o) => o.trim()) : true,
    credentials: true,
  });

  const swaggerEnabled = !isProd || config.get<string>("SWAGGER_ENABLED") === "true";
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Sala de Reunião API")
      .setDescription("API do sistema Sala de Reunião")
      .setVersion("0.1.0")
      .addBearerAuth()
      .build();
    SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swaggerConfig));
  }

  app.enableShutdownHooks();

  const port = config.get<number>("PORT") ?? 3000;
  await app.listen(port);
  logger.log(`API em http://localhost:${port}/api${swaggerEnabled ? "  ·  docs em /docs" : ""}`);
}

void bootstrap();
