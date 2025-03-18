import { Module } from '@nestjs/common';
import { AppController, CommandController } from './app.controller';
import { AppService } from './app.service';
import { SocketioClientService } from './socketio-client/socketio-client.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(),],
  controllers: [AppController, CommandController],
  providers: [AppService, SocketioClientService],
})
export class AppModule {}
