import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Athlete } from 'src/athlete/athlete.entity';
import { Coach } from 'src/coach/coach.entity';
import { CulturalProgram } from 'src/cultural-program/cultural-program.entity';
import { Event } from 'src/event/event.entity';
import { Manager } from 'src/manager/manager.entity';
import { MealSummary } from 'src/meal/mealSummary.entity';
import { School } from 'src/school/school.entity';
import { OrganizerController } from './organizer.controller';
import { Organizer } from './organizer.entity';
import { OrganizerService } from './organizer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organizer,
      Athlete,
      Manager,
      Coach,
      Event,
      School,
      MealSummary,
      CulturalProgram,
    ]),
  ],
  providers: [OrganizerService],
  controllers: [OrganizerController],
  exports: [OrganizerService],
})
export class OrganizerModule {}
