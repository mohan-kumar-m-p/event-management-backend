import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class SmsService {
  private readonly sns: AWS.SNS;
  private readonly logger = new Logger(SmsService.name);

  constructor() {
    this.sns = new AWS.SNS({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_IAM_USER_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_IAM_USER_SECRET_ACCESS_KEY,
    });
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<void> {
    const params = {
      Message: `Your one time password is: ${otp}`,
      PhoneNumber: phoneNumber,
    };

    try {
      const result = await this.sns.publish(params).promise();
      this.logger.log(
        `OTP sent successfully to ${phoneNumber}, MessageId: ${result.MessageId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${phoneNumber}`, error.stack);
      throw new Error('Failed to send OTP');
    }
  }
}
