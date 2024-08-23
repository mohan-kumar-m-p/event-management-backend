import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

// Simple controller with one route
@Controller()
class AppController {
  @Get()
  getRoot() {
    return 'Hello, Vercel!';
  }
}

// Simple module with the single controller
@Module({
  controllers: [AppController],
})
class AppModule {}

// Main bootstrap function
async function bootstrap() {
  console.log('Starting minimal NestJS application...');

  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;

  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error('Error during application startup:', err);
});
