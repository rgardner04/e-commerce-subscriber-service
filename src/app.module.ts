import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { RabbitMqModule } from './rabbitmq/rabbitmq.module';
import { EmailverificationModule } from './email-verification/email-verification.module';
import { SendEmailModule } from './send-email/send-email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '../.env'),
      isGlobal: true,
    }),
    RabbitMqModule,
    EmailverificationModule,
    SendEmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
