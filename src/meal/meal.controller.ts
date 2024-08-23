import { Controller, Post, NotFoundException, Query } from '@nestjs/common';
import { MealService } from './meal.service';

@Controller('verify-meal')
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @Post()
  async verifyMeal(
    @Query('registrationId') registrationId?: string,
    @Query('managerId') managerId?: string,
    @Query('coachId') coachId?: string,
  ): Promise<{ message: string }> {
    if (registrationId) {
      await this.mealService.verifyMeal(registrationId, 'athlete');
    } else if (managerId) {
      await this.mealService.verifyMeal(managerId, 'manager');
    } else if (coachId) {
      await this.mealService.verifyMeal(coachId, 'coach');
    } else {
      throw new NotFoundException('Invalid request');
    }

    return { message: 'Meal verified and counted' };
  }
}
