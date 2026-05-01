import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  VerificationCode,
  VerificationCodeDocument,
} from 'src/schemas/verification-code.schema';
import { User, UserDocument } from 'src/schemas/user.schema';
import { Types } from 'mongoose';
import { VerificationCodeStatusEnum } from 'src/enums/verification-code-status.enum';
import { randomInt } from 'node:crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VerificationCodeService {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    @InjectModel(VerificationCode.name)
    private readonly verificationCodeModel: Model<VerificationCodeDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  private generateVerificationCode(): number {
    const verificationCodeMaxNumber: number = parseInt(
      this.configService.get<string>('VERIFICATION_CODE_MAX_NUMBER') ??
        '999999',
    );

    return randomInt(0, verificationCodeMaxNumber);
  }

  private getVerificationCodeExpiresAt(): Date {
    return new Date(new Date().getTime() + 60 * 10 * 1000);
  }

  public async createVerificationCodeFromEmail(email: string): Promise<number> {
    const user = await this.userModel.findOne({ email }).lean();

    if (!user) {
      throw new Error(`Couldn't find user with email: ${email}`);
    }

    const pendingVerificationCodes = await this.verificationCodeModel
      .find({
        userId: new Types.ObjectId(user._id),
        status: VerificationCodeStatusEnum.PENDING,
      })
      .select({ _id: 1 })
      .exec();

    if (pendingVerificationCodes && pendingVerificationCodes.length) {
      const pendingVerificationCodeIds = pendingVerificationCodes.map(
        (p) => p._id,
      );
      const invalidatedVerificationCodes =
        await this.verificationCodeModel.updateMany(
          { _id: { $in: [pendingVerificationCodeIds] } },
          {
            $set: { status: VerificationCodeStatusEnum.INVALIDATED },
          },
        );

      if (
        invalidatedVerificationCodes &&
        invalidatedVerificationCodes.modifiedCount > 0
      ) {
        this.logger.log(
          `Invalidated ${invalidatedVerificationCodes.modifiedCount} previous verification codes for user ID: ${user._id.toString()}`,
        );
      }
    }

    const verificationCode = this.generateVerificationCode();

    await this.verificationCodeModel.create({
      userId: user._id,
      verificationCode: verificationCode,
      expiresAt: this.getVerificationCodeExpiresAt(),
      status: VerificationCodeStatusEnum.PENDING,
    });

    this.logger.log(
      `Created verification code with status ${VerificationCodeStatusEnum.PENDING} for user ID: ${user._id.toString()}`,
    );

    return verificationCode;
  }
}
