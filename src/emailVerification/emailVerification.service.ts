import {
  Injectable,
  Inject,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { RabbitMqService } from 'src/rabbitmq/rabbitmq.service';
import { queues } from '../enums/queues.enum';
import { Channel } from 'amqplib';

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

  private async consumeEmailVerificationMessages() {
    await this.channel.consume(
      queues.EMAIL_VERIFICATION_QUEUE,
      (message) => {
        if (message) {
          this.logger.log(
            `Received new message from ${queues.EMAIL_VERIFICATION_QUEUE}: ${JSON.stringify(message?.content)}`,
          );
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
