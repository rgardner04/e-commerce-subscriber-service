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

  public async getRabbitMq(): Promise<{
    connection: ChannelModel;
    channel: Channel;
  }> {
    const rabbitMqUrl = this.configService.get<string>('RABBIT_MQ_URL');

    if (!rabbitMqUrl) {
      throw new Error(
        'RABBIT_MQ_URL is not defined in the environment variables.',
      );
    }

    if (this.connection && this.channel) {
      return { connection: this.connection, channel: this.channel };
    }

    this.connection = await connect(encodeURI(rabbitMqUrl));
    this.channel = await this.connection.createChannel();

    this.logger.log('Successfully connected to RabbitMQ.');

    return { connection: this.connection, channel: this.channel };
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry() {
    const maxAttempts = 5;
    let attempts = 0;
    while (attempts < maxAttempts) {
      try {
        await this.getRabbitMq();
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
    if (this.connection) {
      await this.connection.close();
    }
  }
}
