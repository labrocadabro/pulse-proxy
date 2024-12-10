import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { SocketioClientService } from './socketio-client/socketio-client.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly socketioClientService: SocketioClientService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

@Controller('command')
export class CommandController {
  constructor(
    private readonly appService: AppService,
    private readonly socketioClientService: SocketioClientService,
  ) {}

  @Post()
  command(@Body() data: any) {
    console.log(data);
    this.socketioClientService.emit('command', data);
  }
}
