import { Module } from '@nestjs/common';
import { SubscriberService } from './subscriber.service';
import { RabbitmqModule } from 'src/rabbitmq/rabbitmq.module';

@Module({
  imports: [RabbitmqModule],
  providers: [SubscriberService],
})
export class SubscriberModule {}
