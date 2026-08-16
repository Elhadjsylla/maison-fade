import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // rawBody: true expose req.rawBody (Buffer) sur chaque requête — requis
  // pour vérifier la signature UnitechPay sur le corps brut (CDC §5.4),
  // jamais sur le JSON reparsé.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Dev : le frontend statique est servi depuis une autre origine (port
  // différent). Pas de cookies impliqués (Bearer token), donc origin ouverte.
  app.enableCors();

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
