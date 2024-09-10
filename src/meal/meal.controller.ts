import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../guards/role.guard';
import { ApiResponse } from '../shared/dto/api-response.dto';
import { OrganizerRole } from '../shared/roles';
import { MealService } from './meal.service';

@UseGuards(AuthGuard('jwt'))
@Controller('meal')
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @Post('generate-qr-code')
  async generateQrCode(
    @Request() req,
    @Body() body?,
  ): Promise<ApiResponse<any>> {
    let athleteId;
    if (body && Object.keys(body).length !== 0) {
      athleteId = body.registrationId;
    }
    const qrCode = await this.mealService.generateQRCode(
      req.user.sub,
      req.user.entity,
      athleteId,
    );
    return ApiResponse.success('QR Code generated successfully', qrCode);
  }

  @UseGuards(RolesGuard([OrganizerRole.MessManager]))
  @Get('verify-meal')
  async verifyMeal(
    @Query('registrationId') registrationId?: string,
    @Query('managerId') managerId?: string,
    @Query('coachId') coachId?: string,
  ): Promise<ApiResponse<any>> {
    try {
      let result;
      if (registrationId) {
        result = await this.mealService.verifyMeal(registrationId, 'athlete');
      } else if (managerId) {
        result = await this.mealService.verifyMeal(managerId, 'manager');
      } else if (coachId) {
        result = await this.mealService.verifyMeal(coachId, 'coach');
      } else {
        throw new NotFoundException('Invalid request');
      }
      return ApiResponse.success('Meal verified and counted', result);
    } catch (error) {
      throw error;
    }
  }

  // to be used by athlete/manager/coach to get their meal details or by manager/coach to get the meal details of the athlete they are managing
  @Get('get-meal-details')
  async getMealDetails(
    @Request() req,
    @Body() body,
  ): Promise<ApiResponse<any>> {
    let athleteId;
    if (body && Object.keys(body).length !== 0) {
      athleteId = body.registrationId;
    }
    const mealCount = await this.mealService.getMealDetails(
      req.user.sub,
      req.user.entity,
      athleteId,
    );
    return ApiResponse.success('Meal count retrieved', mealCount);
  }
}
