import { Logger, Module } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import { RabbitMqModule } from 'src/rabbitmq/rabbitmq.module';
import { ConfigService } from '@nestjs/config';
import { SendEmailModule } from 'src/send-email/send-email.module';
import { SendEmailService } from 'src/send-email/send-email.service';
import {
  VerificationCode,
  VerificationCodeSchema,
} from 'src/schemas/verification-code.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from 'src/user/user.module';
import { VerificationCodeModule } from 'src/verification-code/verification-code.module';

@Module({
  imports: [
    RabbitMqModule,
    SendEmailModule,
    UserModule,
    VerificationCodeModule,
    MongooseModule.forFeature([
      { name: VerificationCode.name, schema: VerificationCodeSchema },
    ]),
  ],
  providers: [
    EmailVerificationService,
    ConfigService,
    Logger,
    SendEmailService,
  ],
})
export class EmailVerificationModule {}
