import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from 'src/shared/dto/api-response.dto';
import { AccommodationService } from './accommodation.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('accommodation')
export class AccommodationController {
  constructor(private readonly accommodationService: AccommodationService) {}

  @Get()
  async findAll(): Promise<ApiResponse<any>> {
    const accommodations = await this.accommodationService.findAll();
    return ApiResponse.success(
      'Accommodations retrieved successfully',
      accommodations,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const accommodation = await this.accommodationService.findOne(id);
    return ApiResponse.success(
      'Accommodation retrieved successfully',
      accommodation,
    );
  }

  @Post(':id/assign')
  async assignAccommodation(
    @Param('id') accommodationId: string,
    @Query('registrationId') registrationId?: string,
    @Query('managerId') managerId?: string,
    @Query('coachId') coachId?: string,
  ): Promise<ApiResponse<any>> {
    let updatedAccommodation;
    if (registrationId) {
      updatedAccommodation =
        await this.accommodationService.assignAccommodation(
          accommodationId,
          registrationId,
          'athlete',
        );
    } else if (managerId) {
      updatedAccommodation =
        await this.accommodationService.assignAccommodation(
          accommodationId,
          managerId,
          'manager',
        );
    } else if (coachId) {
      updatedAccommodation =
        await this.accommodationService.assignAccommodation(
          accommodationId,
          coachId,
          'coach',
        );
    } else {
      throw new BadRequestException('Invalid request: No valid ID provided');
    }
    return ApiResponse.success(
      'Accommodation assigned successfully',
      updatedAccommodation,
    );
  }

  @Post('unassign')
  async unassignAccommodation(
    @Query('registrationId') registrationId?: string,
    @Query('managerId') managerId?: string,
    @Query('coachId') coachId?: string,
  ): Promise<ApiResponse<any>> {
    let updatedAccommodation;
    if (registrationId) {
      updatedAccommodation =
        await this.accommodationService.unassignAccommodation(
          registrationId,
          'athlete',
        );
    } else if (managerId) {
      updatedAccommodation =
        await this.accommodationService.unassignAccommodation(
          managerId,
          'manager',
        );
    } else if (coachId) {
      updatedAccommodation =
        await this.accommodationService.unassignAccommodation(coachId, 'coach');
    } else {
      throw new BadRequestException('Invalid request: No valid ID provided');
    }
    return ApiResponse.success(
      'Accommodation unassigned successfully',
      updatedAccommodation,
    );
  }
}
