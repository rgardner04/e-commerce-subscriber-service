import {
  Injectable,
  Inject,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { Options } from 'nodemailer/lib/mailer';
import { AuthStage } from 'src/enums/auth-stage.enum';
import { VerificationCodeService } from 'src/verification-code/verification-code.service';

@Injectable()
export class SendEmailService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    private readonly configService: ConfigService,
    private readonly verificationCodeService: VerificationCodeService,
  ) {}

  private transporter: nodemailer.Transporter;

  private getNodeMailerCredentials() {
    const nodeMailerUser =
      this.configService.get<string>('NODE_MAILER_USER') ?? '';
    const nodeMailerPassword =
      this.configService.get<string>('NODE_MAILER_PASSWORD') ?? '';

    if (!nodeMailerUser) {
      throw new Error(
        'NODE_MAILER_USER is not configured in the environment variables.',
      );
    }
    if (!nodeMailerPassword) {
      throw new Error(
        'NODE_MAILER_PASSWORD is not configured in the environment variables.',
      );
    }

    return { nodeMailerUser, nodeMailerPassword };
  }

  private initializeNodeMailerTransporter(): void {
    const { nodeMailerUser, nodeMailerPassword } =
      this.getNodeMailerCredentials();

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: nodeMailerUser,
        pass: nodeMailerPassword,
      },
    });

    this.logger.log('Initialized nodemailer transporter.');
  }

  private getBaseMailOptions(email: string) {
    const { nodeMailerUser } = this.getNodeMailerCredentials();

    const baseMailOptions: Options = {
      from: `"e-commerce-app" ${nodeMailerUser}`,
      to: email,
    };

    return baseMailOptions;
  }

  public async sendVerificationEmail(
    email: string,
    authStage: AuthStage,
  ): Promise<void> {
    try {
      const verificationCode =
        await this.verificationCodeService.createVerificationCodeFromEmail(
          email,
        );

      let emailAuthStage: string;
      switch (authStage) {
        case AuthStage.REGISTER:
          emailAuthStage = 'registration';
          break;
        case AuthStage.LOGIN:
          emailAuthStage = 'login';
          break;
        default:
          emailAuthStage = 'registration';
          break;
      }

      const baseMailOptions = this.getBaseMailOptions(email);
      await this.transporter.sendMail({
        ...baseMailOptions,
        subject: `Please verify your email to complete your ${emailAuthStage} process.`,
        text: `Please enter the following verification code to verify your email: ${verificationCode}`,
      });
    } catch (error) {
      this.logger.error(
        `Couldn't send verification email. Error: ${error instanceof Error ? error?.message : ''}`,
      );
    }
  }

  onModuleInit() {
    try {
      this.initializeNodeMailerTransporter();
    } catch (error) {
      this.logger.error(
        `Couldn't initialize nodemailer transporter. Error: ${error instanceof Error ? error?.message : ''}`,
      );
    }
  }

  onModuleDestroy() {
    if (this.transporter) {
      try {
        this.transporter.close();
      } catch (error) {
        this.logger.error(
          `Couldn't clean up nodemailer transporter. Error: ${error instanceof Error ? error?.message : ''}`,
        );
      }
    }
  }
}
