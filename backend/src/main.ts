import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { createMobileSwaggerDocument, createWebappSwaggerDocument } from './docs/swagger-docs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(ConfigService);
  const prefix = config.get<string>('APP_GLOBAL_PREFIX', 'api');
  const bodyLimit = config.get<string>('APP_BODY_LIMIT', '10mb');

  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));
  app.setGlobalPrefix(prefix);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const webappDocument = createWebappSwaggerDocument(app, prefix);
  const mobileDocument = createMobileSwaggerDocument(app, prefix);
  const docsBasePath = `${prefix}/docs`;
  const webappDocsPath = `${docsBasePath}/webapp`;
  const mobileDocsPath = `${docsBasePath}/mobile`;
  SwaggerModule.setup(webappDocsPath, app, webappDocument);
  SwaggerModule.setup(mobileDocsPath, app, mobileDocument);

  const port = config.get<number>('APP_PORT', 3000);
  await app.listen(port);
  console.log(`Server:  http://localhost:${port}/${prefix}`);
  console.log(`Swagger webapp: http://localhost:${port}/${webappDocsPath}/`);
  console.log(`Swagger mobile: http://localhost:${port}/${mobileDocsPath}/`);
}

void bootstrap();
