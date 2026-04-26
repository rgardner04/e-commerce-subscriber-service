import {
  Injectable,
  Inject,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { RabbitMqService } from 'src/rabbitmq/rabbitmq.service';
import { queues } from '../enums/queues.enum';
import { events } from '../enums/events.enum';
import { Channel, ConsumeMessage } from 'amqplib';
import { Event } from 'src/dtos/event.dto';
import { SendVerificationEmailEvent } from 'src/dtos/sendVerificationEmailEvent.dto';

@Injectable()
export class EmailVerificationService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly rabbitmqService: RabbitMqService,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  private channel: Channel;

  private async getChannel(): Promise<void> {
    const { channel } = await this.rabbitmqService.getRabbitMq();
    this.channel = channel;

    this.logger.log('RabbitMQ channel configured in EmailverificationService');
  }

  private async assertEmailVerificationQueue(): Promise<void> {
    await this.channel.assertQueue(queues.EMAIL_VERIFICATION_QUEUE, {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum',
      },
    });

    this.logger.log(
      `${queues.EMAIL_VERIFICATION_QUEUE} setup in EmailverificationService`,
    );
  }

  private async sendVerificationEmail(
    eventData: SendVerificationEmailEvent,
  ): Promise<void> {
    const email = eventData.data.email;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  private async consumeEmailVerificationMessages() {
    await this.channel.consume(
      queues.EMAIL_VERIFICATION_QUEUE,
      (message: ConsumeMessage) => {
        if (message && message.content) {
          this.logger.log(
            `Received new message from ${queues.EMAIL_VERIFICATION_QUEUE}: ${JSON.stringify(message.content)}`,
          );

          const eventData: Event = JSON.parse(message.content.toString());

          switch (eventData.name) {
            case events.SEND_VERIFICATION_EMAIL as string:
              break;
          }
        }
      },
      {
        noAck: true,
      },
    );
  }

  async onModuleInit() {
    try {
      await this.getChannel();
      await this.assertEmailVerificationQueue();
      await this.consumeEmailVerificationMessages();
    } catch (error) {
      this.logger.error(
        `Failed to configure ${queues.EMAIL_VERIFICATION_QUEUE} subscriber. Error: ${error instanceof Error ? error?.message : ''}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.channel.close();
  }
}
