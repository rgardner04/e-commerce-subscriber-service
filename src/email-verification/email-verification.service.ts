import {
  Injectable,
  Inject,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { RabbitMqService } from 'src/rabbitmq/rabbitmq.service';
import { QueueEnum } from '../enums/queue.enum';
import { EventEnum } from '../enums/event.enum';
import { Channel, ConsumeMessage } from 'amqplib';
import {
  EmailEvent,
  SendVerificationEmailEvent,
} from 'src/dtos/email-verification-event.dto';
import { SendEmailService } from 'src/send-email/send-email.service';

@Injectable()
export class EmailVerificationService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly rabbitmqService: RabbitMqService,
    @Inject(Logger) private readonly logger: Logger,
    private readonly sendEmailService: SendEmailService,
  ) {}

  private channel: Channel;

  private async getChannel(): Promise<void> {
    const { channel } = await this.rabbitmqService.getRabbitMq();
    this.channel = channel;

    this.logger.log('RabbitMQ channel configured in EmailVerificationService');
  }

  private async assertEmailVerificationQueue(): Promise<void> {
    await this.channel.assertQueue(QueueEnum.EMAIL_VERIFICATION_QUEUE, {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum',
      },
    });

    this.logger.log(
      `${QueueEnum.EMAIL_VERIFICATION_QUEUE} setup in EmailVerificationService`,
    );
  }

  private async sendVerificationEmail(
    eventData: SendVerificationEmailEvent,
  ): Promise<void> {
    try {
      const email = eventData.data.email;

      await this.sendEmailService.sendVerificationEmail(email);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email. Error: ${error instanceof Error ? error?.message : ''}`,
      );
    }
  }

  private async consumeEmailVerificationMessages() {
    await this.channel.consume(
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
      await this.getChannel();
      await this.assertEmailVerificationQueue();
      await this.consumeEmailVerificationMessages();
    } catch (error) {
      this.logger.error(
        `Failed to configure ${QueueEnum.EMAIL_VERIFICATION_QUEUE} subscriber. Error: ${error instanceof Error ? error?.message : ''}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.channel.close();
  }
}
