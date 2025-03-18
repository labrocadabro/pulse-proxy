import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SocketioClientService } from './socketio-client/socketio-client.service';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3004);
}
bootstrap();


