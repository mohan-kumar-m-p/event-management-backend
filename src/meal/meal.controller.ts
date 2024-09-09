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
    } catch (error) {
      throw error;
    }
  }

  @Get('get-meal-details')
  async getMealDetails(@Request() req, @Body() body): Promise<ApiResponse<any>> {
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
