import { Module, Logger } from '@nestjs/common';
import { SendEmailService } from './send-email.service';
import { ConfigService } from '@nestjs/config';
import { VerificationCodeModule } from 'src/verification-code/verification-code.module';
import { VerificationCodeService } from 'src/verification-code/verification-code.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VerificationCode,
  VerificationCodeSchema,
} from '../schemas/verification-code.schema';
import { User, UserSchema } from 'src/schemas/user.schema';

@Module({
  imports: [
    VerificationCodeModule,
    MongooseModule.forFeature([
      { name: VerificationCode.name, schema: VerificationCodeSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [SendEmailService, Logger, ConfigService, VerificationCodeService],
  exports: [SendEmailService],
})
export class SendEmailModule {}
