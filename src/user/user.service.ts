import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  public async getUserIdByEmail(email: string) {
    const user = await this.userModel
      .findOne({ email: email })
      .select({ _id: 1 })
      .lean();

    if (!user) {
      throw new Error(`Could not find user with email: ${email}`);
    }

    this.logger.log(`Retrieved user ID for email: ${email}`);
    return user?._id;
  }
}
