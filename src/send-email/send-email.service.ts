import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class SendEmailService {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {}

  private transport;

  private createTransporter(): void {}
}
