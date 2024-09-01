import { Controller, Get, Param } from '@nestjs/common';
import { ApiResponse } from 'src/shared/dto/api-response.dto';
import { AccommodationService } from './accommodation.service';

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
}
