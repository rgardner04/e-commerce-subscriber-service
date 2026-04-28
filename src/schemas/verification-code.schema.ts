import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';
import { VerificationCodeStatusEnum } from 'src/enums/verification-code-status.enum';

export type VerificationCodeDocument = HydratedDocument<VerificationCode>;

@Schema({ timestamps: true })
export class VerificationCode {
  @Prop({ required: true, index: true, type: Types.ObjectId })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  verificationCode: number;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({
    required: true,
    enum: {
      values: Object.values(VerificationCodeStatusEnum),
      message: '{VALUE} is not a valid verification code status.',
    },
  })
  status: string;
}

export const VerificationCodeSchema =
  SchemaFactory.createForClass(VerificationCode);
