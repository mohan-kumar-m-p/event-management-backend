import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import * as AWS from 'aws-sdk';
import { AccommodationModule } from './accommodation/accommodation.module';
import { AthleteModule } from './athlete/athlete.module';
import { AuthModule } from './auth/auth.module';
import { BlockModule } from './block/block.module';
import { CoachModule } from './coach/coach.module';
import { DatabaseModule } from './database/database.module';
import { EventModule } from './event/event.module';
import { ManagerModule } from './manager/manager.module';
import { MealModule } from './meal/meal.module';
import { OrganizerModule } from './organizer/organizer.module';
import { RoundModule } from './round/round.module';
import { SchoolModule } from './school/school.module';
import { SharedModule } from './shared/shared.module';
import { WildcardController } from './wildcard.controller';
import { HeatModule } from './heat/heat.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available throughout the app
    }),
    MailerModule.forRoot({
      transport: {
        SES: new AWS.SES({
          apiVersion: process.env.AWS_SES_API_VERSION,
          region: process.env.AWS_SES_REGION,
          accessKeyId: process.env.AWS_IAM_USER_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_IAM_USER_SECRET_ACCESS_KEY,
        }),
      },
      defaults: {
        from: process.env.FROM_EMAIL_ADDRESS,
      },
    }),
    DatabaseModule,
    AthleteModule,
    ManagerModule,
    CoachModule,
    SchoolModule,
    AccommodationModule,
    BlockModule,
    EventModule,
    RoundModule,
    HeatModule,
    MealModule,
    AuthModule,
    OrganizerModule,
    PaymentModule,
    SharedModule,
  ],
  controllers: [WildcardController],
})
export class AppModule {}
