import {
  Injectable,
  Inject,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChannelModel, Channel, connect } from 'amqplib';

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly configService: ConfigService,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  private async getRabbitMqConnection(): Promise<ChannelModel> {
    if (this.connection) return this.connection;

    const rabbitMqUrl = this.configService.get<string>('RABBIT_MQ_URL');

    if (!rabbitMqUrl) {
      throw new Error(
        'RABBIT_MQ_URL is not configured in the environment variables.',
      );
    }

    this.connection = await connect(encodeURI(rabbitMqUrl));
    this.logger.log(`Connected to RabbitMQ at ${rabbitMqUrl}`);

    return this.connection;
  }

  public async getRabbitMqChannel(): Promise<Channel> {
    if (this.channel) return this.channel;

    if (!this.connection) {
      await this.getRabbitMqConnection();
    }

    this.channel = await this.connection!.createChannel();
    this.logger.log(`Created RabbitMQ channel.`);

    return this.channel;
  }

  public async initializeRabbitMq(): Promise<void> {
    await this.getRabbitMqConnection();
    await this.getRabbitMqChannel();
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry() {
    const maxAttempts = 5;
    let attempts = 0;
    while (attempts < maxAttempts) {
      try {
        await this.initializeRabbitMq();
        return;
      } catch (error) {
        this.logger.warn(
          `Connection to RabbitMQ attempt ${attempts + 1} failed. Error: ${error instanceof Error ? error?.message : ''} Retrying in 5 seconds...`,
        );
        attempts++;

        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
    this.logger.error('Could not connect to RabbitMQ after maximum attempts.');
  }

  async onModuleDestroy() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (error) {
      this.logger.error(
        `Could not cleanup RabbitMQ instance. Error: ${error instanceof Error ? error?.message : ''}`,
      );
    }
  }
}
