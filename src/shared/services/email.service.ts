import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { EmailOptions } from '../interfaces/emailOptions.interface';

@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendEmail(emailOptions: EmailOptions) {
    try {
      await this.mailerService.sendMail({
        to: emailOptions.to,
        subject: emailOptions.subject,
        html: emailOptions.body,
      });
    } catch (error) {
      throw error;
    }
  }
}
