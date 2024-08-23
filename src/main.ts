import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

const expressApp = express();

async function createNestServer() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );
  app.enableCors(); // Enable CORS if needed
  await app.init();
  return expressApp;
}

let cachedServer;

export default async function handler(req, res) {
  if (!cachedServer) {
    cachedServer = await createNestServer();
  }
  return cachedServer(req, res);
}
