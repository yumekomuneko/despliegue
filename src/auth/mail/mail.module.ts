import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  providers: [MailService],
  controllers: [MailController],
  exports: [MailService],
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async(ConfigService: ConfigService) => ({
        transport: {
          host: ConfigService.get('MAIL_HOST'), // Por ejemplo: 'smtp.gmail.com'
          port: ConfigService.get('MAIL_PORT'), // Por ejemplo: 587 o 465
          secure: ConfigService.get('MAIL_PORT') == 465, // true si 465, false si 587/2525
          auth: {
            user: ConfigService.get('MAIL_USER'),
            pass: ConfigService.get('MAIL_PASS'),
          },
          tls: {
            rejectUnauthorized: process.env.NODE_ENV != 'development',
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class MailModule {}
