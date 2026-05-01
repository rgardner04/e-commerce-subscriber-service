import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMqService } from 'src/rabbitmq/rabbitmq.service';
import { QueueEnum } from '../enums/queue.enum';
import { EventEnum } from '../enums/event.enum';
import { AuthStage } from 'src/enums/auth-stage.enum';
import { ConsumeMessage } from 'amqplib';
import {
  EmailEvent,
  SendVerificationEmailEvent,
} from 'src/dtos/email-verification-event.dto';
import { SendEmailService } from 'src/send-email/send-email.service';

@Injectable()
export class EmailVerificationService implements OnModuleInit {
  constructor(
    private readonly rabbitmqService: RabbitMqService,
    @Inject(Logger) private readonly logger: Logger,
    private readonly sendEmailService: SendEmailService,
  ) {}

  private async initializeEmailVerificationQueue(): Promise<void> {
    const channel = await this.rabbitmqService.getRabbitMqChannel();
    await channel.assertQueue(QueueEnum.EMAIL_VERIFICATION_QUEUE, {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum',
      },
    });

    this.logger.log(`Initialized ${QueueEnum.EMAIL_VERIFICATION_QUEUE}.`);
  }

  private async sendVerificationEmail(
    eventData: SendVerificationEmailEvent,
  ): Promise<void> {
    const { email, authStage } = eventData.data;

    if (!email || !authStage) {
      throw new Error(
        `Couldn't send verification email. Invalid ${EventEnum.SEND_VERIFICATION_EMAIL} data provided: ${JSON.stringify(eventData)}`,
      );
    }

    await this.sendEmailService.sendVerificationEmail(email, authStage);
  }

  private async consumeEmailVerificationMessages() {
    const channel = await this.rabbitmqService.getRabbitMqChannel();
    await channel.consume(
      QueueEnum.EMAIL_VERIFICATION_QUEUE,
      (message: ConsumeMessage | null) => {
        if (message && message.content) {
          this.handleMessage(message).catch((error) =>
            this.logger.error(
              `Error while processing ${QueueEnum.EMAIL_VERIFICATION_QUEUE} message. Error: ${error instanceof Error ? error?.message : ''}`,
            ),
          );
        }
      },
      {
        noAck: true,
      },
    );
  }

  private async handleMessage(message: ConsumeMessage): Promise<void> {
    try {
      const content = message.content.toString();
      this.logger.log(`Received email verification message: ${content}`);

      const eventData = JSON.parse(content) as EmailEvent;

      switch (eventData.type) {
        case EventEnum.SEND_VERIFICATION_EMAIL:
          await this.sendVerificationEmail(eventData);
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle email verification message. Error: ${error instanceof Error ? error?.message : ''}`,
      );
    }
  }

  async onModuleInit() {
    try {
      await this.initializeEmailVerificationQueue();
      await this.consumeEmailVerificationMessages();
    } catch (error) {
      this.logger.error(
        `Failed to configure ${QueueEnum.EMAIL_VERIFICATION_QUEUE} subscriber. Error: ${error instanceof Error ? error?.message : ''}`,
      );
    }
  }
}
