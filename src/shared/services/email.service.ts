import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { EmailOptions } from '../interfaces/emailOptions.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(private mailerService: MailerService) {}

  async sendEmail(emailOptions: EmailOptions) {
    try {
      const result = await this.mailerService.sendMail({
        to: emailOptions.to,
        subject: emailOptions.subject,
        html: emailOptions.body,
      });
      this.logger.log(`Email sent to ${emailOptions.to}, MessageId: ${result.messageId}`);
    } catch (error) {
      throw error;
    }
  }
}
