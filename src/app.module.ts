import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { RabbitMqModule } from './rabbitmq/rabbitmq.module';
import { EmailVerificationModule } from './email-verification/email-verification.module';
import { SendEmailModule } from './send-email/send-email.module';
import { UserModule } from './user/user.module';
import { VerificationCodeModule } from './verification-code/verification-code.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '../.env'),
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_DB_URI'),
      }),
      inject: [ConfigService],
    }),
    RabbitMqModule,
    EmailVerificationModule,
    SendEmailModule,
    UserModule,
    VerificationCodeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
