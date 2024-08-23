import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Athlete } from '../athlete/athlete.entity';
import { Manager } from '../manager/manager.entity';
import { Coach } from '../coach/coach.entity';
import { MealService } from './meal.service';
import { MealController } from './meal.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Athlete, Manager, Coach])],
  providers: [MealService],
  controllers: [MealController],
})
export class MealModule {}
