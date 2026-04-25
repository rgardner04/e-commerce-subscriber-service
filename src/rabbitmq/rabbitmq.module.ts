import { Module } from '@nestjs/common';
import { RabbitMqService } from './rabbitmq.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@Module({
  providers: [RabbitMqService, Logger, ConfigService],
  exports: [RabbitMqService],
})
export class RabbitMqModule {}
