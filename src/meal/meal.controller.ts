import {
  Controller,
  NotFoundException,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from 'src/shared/dto/api-response.dto';
import { MealService } from './meal.service';
import { Request } from '@nestjs/common';

@UseGuards(AuthGuard('jwt'))
@Controller('meal')
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @Post('generate-qr-code')
  async generateQrCode(@Request() req): Promise<ApiResponse<any>> {
    const qrCode = await this.mealService.generateQRCode(
      req.user.sub,
      req.user.entity,
    );
    return ApiResponse.success('QR Code generated successfully', qrCode);
  }

  @Post()
  async verifyMeal(
    @Query('registrationId') registrationId?: string,
    @Query('managerId') managerId?: string,
    @Query('coachId') coachId?: string,
  ): Promise<ApiResponse<any>> {
    if (registrationId) {
      await this.mealService.verifyMeal(registrationId, 'athlete');
    } else if (managerId) {
      await this.mealService.verifyMeal(managerId, 'manager');
    } else if (coachId) {
      await this.mealService.verifyMeal(coachId, 'coach');
    } else {
      throw new NotFoundException('Invalid request');
    }

    return ApiResponse.success('Meal verified and counted');
  }
}
