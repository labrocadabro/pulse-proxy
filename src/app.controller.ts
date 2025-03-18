import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { Socket } from 'socket.io-client';
import { SocketioClientService } from './socketio-client/socketio-client.service';



@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly socketioClientService: SocketioClientService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

@Controller('command')
export class CommandController {
  constructor(private readonly appService: AppService, private readonly socketioClientService: SocketioClientService) {}
  private socket: Socket; 

  @Post()
  command(@Body() body: any): void {
    console.log(body)
    this.socketioClientService.emit('command', body);
  }
}