import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { DatabaseModule } from './database/database.module';
import { WildcardController } from './wildcard.controller';
import { AthleteModule } from './athlete/athlete.module';
import { ManagerModule } from './manager/manager.module';
import { CoachModule } from './coach/coach.module';
import { AccommodationModule } from './accommodation/accommodation.module';
import { BlockModule } from './block/block.module';
import { EventModule } from './event/event.module';
import { SchoolModule } from './school/school.module';
import { MealModule } from './meal/meal.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available throughout the app
    }),
    // DatabaseModule,
    AthleteModule,
    ManagerModule,
    CoachModule,
    SchoolModule,
    AccommodationModule,
    BlockModule,
    EventModule,
    MealModule,
  ],
  controllers: [WildcardController],
})
export class AppModule {}
