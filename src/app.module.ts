import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController, CommandController } from './app.controller';
import { AppService } from './app.service';
import { SocketioClientService } from './socketio-client/socketio-client.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController, CommandController],
  providers: [AppService, SocketioClientService],
})
export class AppModule {}
