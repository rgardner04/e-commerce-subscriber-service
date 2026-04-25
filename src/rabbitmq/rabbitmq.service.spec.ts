import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMqService } from './rabbitmq.service';

describe('RabbitmqService', () => {
  let service: RabbitMqService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RabbitMqService],
    }).compile();

    service = module.get<RabbitMqService>(RabbitMqService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
