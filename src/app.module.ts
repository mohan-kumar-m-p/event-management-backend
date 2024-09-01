import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { SchoolModule } from './school/school.module';
import { WildcardController } from './wildcard.controller';
import { RoundModule } from './round/round.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available throughout the app
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
    MealModule,
    AuthModule,
    OrganizerModule,
  ],
  controllers: [WildcardController],
})
export class AppModule {}
