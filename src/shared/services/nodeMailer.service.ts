import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NodeMailerService {
  private logger = new Logger(NodeMailerService.name);
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.NODEMAILER_MAIL_USER,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });
  }

  async sendEmail(email: string, otp: string): Promise<void> {
    const mailOptions = {
      from: '"PSSEM School" pssemrschool@gmail.com',
      to: email,
      subject: 'Your OTP Code',
      text: `Your one time password is ${otp}`,
      html: `<p>Your one time password is <strong>${otp}</strong></p>`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`OTP sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${email}`, error.stack);
      throw error;
    }
  }
}
