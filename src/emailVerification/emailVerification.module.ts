import { Logger, Module } from '@nestjs/common';
import { EmailVerificationService } from './emailVerification.service';
import { RabbitMqModule } from 'src/rabbitmq/rabbitmq.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [RabbitMqModule],
  providers: [EmailVerificationService, ConfigService, Logger],
})
export class EmailverificationModule {}
