import { Module, Logger } from '@nestjs/common';
import { VerificationCodeService } from './verification-code.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VerificationCode,
  VerificationCodeSchema,
} from 'src/schemas/verification-code.schema';
import { ConfigService } from '@nestjs/config';
import { User, UserSchema } from 'src/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VerificationCode.name, schema: VerificationCodeSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [VerificationCodeService, ConfigService, Logger],
  exports: [VerificationCodeService],
})
export class VerificationCodeModule {}
