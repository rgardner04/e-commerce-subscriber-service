import { Module } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@Module({
  providers: [RabbitmqService, Logger, ConfigService],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
