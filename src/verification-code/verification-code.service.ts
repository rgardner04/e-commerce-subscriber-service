import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  VerificationCode,
  VerificationCodeDocument,
} from 'src/schemas/verification-code.schema';
import { UserService } from 'src/user/user.service';
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
    private readonly userService: UserService,
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
    const userId = await this.userService.getUserIdByEmail(email);

    const pendingVerificationCodes = await this.verificationCodeModel
      .find({
        userId: new Types.ObjectId(userId),
        status: VerificationCodeStatusEnum.PENDING,
      })
      .select({ _id: 1 })
      .exec();

    if (pendingVerificationCodes && pendingVerificationCodes.length) {
      const pendingVerificationCodeIds = pendingVerificationCodes.map(
        (p) => p._id,
      );
      await this.verificationCodeModel.updateMany(
        { _id: { $in: [pendingVerificationCodeIds] } },
        {
          $set: { status: VerificationCodeStatusEnum.INVALIDATED },
        },
      );

      this.logger.log(
        `Successfully invalidated previous verification codes for user ID: ${userId.toString()}`,
      );
    }

    const verificationCode = this.generateVerificationCode();

    await this.verificationCodeModel.create({
      userId: userId,
      verificationCode: verificationCode,
      expiresAt: this.getVerificationCodeExpiresAt(),
      status: VerificationCodeStatusEnum.PENDING,
    });

    this.logger.log('Successfully created verification code.');

    return verificationCode;
  }
}
