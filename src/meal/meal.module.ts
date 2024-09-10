import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Athlete } from '../athlete/athlete.entity';
import { Coach } from '../coach/coach.entity';
import { Manager } from '../manager/manager.entity';
import { School } from '../school/school.entity';
import { MealController } from './meal.controller';
import { MealService } from './meal.service';
import { MealSummary } from './mealSummary.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Athlete, Manager, Coach, School, MealSummary]),
  ],
  providers: [MealService],
  controllers: [MealController],
})
export class MealModule {}
