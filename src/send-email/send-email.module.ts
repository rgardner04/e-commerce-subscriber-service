import { Module } from '@nestjs/common';
import { SendEmailService } from './send-email.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@Module({
  providers: [SendEmailService, Logger, ConfigService],
  exports: [SendEmailService],
})
export class SendEmailModule {}
