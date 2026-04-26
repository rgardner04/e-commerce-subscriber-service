import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { Options } from 'nodemailer/lib/mailer';
import { VerificationCodeService } from 'src/verification-code/verification-code.service';

@Injectable()
export class SendEmailService {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    private readonly configService: ConfigService,
    private readonly verificationCodeService: VerificationCodeService,
  ) {}

  private transporter: nodemailer.Transporter;

  private getNodemailerCredentials() {
    const nodemailerUser =
      this.configService.get<string>('NODEMAILER_USER') ?? '';
    const nodemailerPass =
      this.configService.get<string>('NODEMAILER_PASS') ?? '';

    return { nodemailerUser, nodemailerPass };
  }

  private createTransporter(): void {
    const { nodemailerUser, nodemailerPass } = this.getNodemailerCredentials();

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: nodemailerUser,
        pass: nodemailerPass,
      },
    });

    this.logger.log('Nodemailer transporter initialized');
  }

  private getBasicMailOptions(email: string) {
    const { nodemailerUser } = this.getNodemailerCredentials();

    const basicMailOptions: Options = {
      from: `"e-commerce-app" ${nodemailerUser}`,
      to: email,
    };

    return basicMailOptions;
  }

  public async sendVerificationEmail(email: string): Promise<void> {
    try {
      const verificationCode =
        await this.verificationCodeService.createVerificationCodeFromEmail(
          email,
        );

      const basicMailOptions = this.getBasicMailOptions(email);
      await this.transporter.sendMail({
        ...basicMailOptions,
        subject: 'Please verify your email to complete your registration.',
        text: `Please enter the following verification code to verify your email: ${verificationCode}`,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send verification email. Error: ${error instanceof Error ? error?.message : ''}`,
      );
    }
  }
}
