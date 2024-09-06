import {
  Body,
  Controller,
  NotFoundException,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../guards/role.guard';
import { OrganizerRole } from '../shared/roles';
import { ApiResponse } from '../shared/dto/api-response.dto';
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
    const schoolAffiliationNumber = body?.affiliationNumber
      ? body.affiliationNumber
      : req?.user?.affiliationNumber;
    const qrCode = await this.mealService.generateQRCode(
      req.user.sub,
      schoolAffiliationNumber,
    );
    return ApiResponse.success('QR Code generated successfully', qrCode);
  }

  @UseGuards(RolesGuard([OrganizerRole.MessManager]))
  @Post()
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
}
