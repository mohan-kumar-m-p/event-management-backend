import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Athlete } from '../athlete/athlete.entity';
import { Coach } from '../coach/coach.entity';
import { Manager } from '../manager/manager.entity';
import { EmailService } from './services/email.service';
import { NodeMailerService } from './services/nodeMailer.service';
import { S3Service } from './services/s3.service';
import { SmsService } from './services/sms.service';
import { TaskService } from './services/task.service';

@Module({
  imports: [TypeOrmModule.forFeature([Manager, Athlete, Coach])],
  providers: [
    S3Service,
    SmsService,
    EmailService,
    TaskService,
    NodeMailerService,
  ],
  exports: [
    S3Service,
    SmsService,
    EmailService,
    TaskService,
    NodeMailerService,
  ],
})
export class SharedModule {}
