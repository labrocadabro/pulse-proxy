import { Test, TestingModule } from '@nestjs/testing';
import { SocketioClientService } from './socketio-client.service';

describe('SocketioClientService', () => {
  let service: SocketioClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SocketioClientService],
    }).compile();

    service = module.get<SocketioClientService>(SocketioClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
