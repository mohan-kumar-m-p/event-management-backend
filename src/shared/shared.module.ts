import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Athlete } from '../athlete/athlete.entity';
import { Coach } from '../coach/coach.entity';
import { Manager } from '../manager/manager.entity';
import { MealSummary } from '../meal/mealSummary.entity';
import { School } from '../school/school.entity';
import { EmailService } from './services/email.service';
import { NodeMailerService } from './services/nodeMailer.service';
import { S3Service } from './services/s3.service';
import { SmsService } from './services/sms.service';
import { TaskService } from './services/task.service';
import { HeatService } from '../heat/heat.service';
import { RoundService } from '../round/round.service';
import { Heat } from '../heat/heat.entity';
import { AthleteHeat } from '../athlete-heat/athlete-heat.entity';
import { Round } from '../round/round.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Manager,
      Athlete,
      Coach,
      School,
      MealSummary,
      Round,
      Heat,
      AthleteHeat,
    ]),
  ],
  providers: [
    S3Service,
    SmsService,
    EmailService,
    TaskService,
    NodeMailerService,
    HeatService,
    RoundService,
  ],
  exports: [
    S3Service,
    SmsService,
    EmailService,
    TaskService,
    NodeMailerService,
    HeatService,
    RoundService,
  ],
})
export class SharedModule {}
