console.log('Starting NestJS application...');

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('Bootstrap function entered.');
  const app = await NestFactory.create(AppModule);
  console.log('NestFactory created.');
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch(err => console.error('Error during bootstrap:', err));
