import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from 'src/shared/dto/api-response.dto';
import { ExperienceZoneService } from './experience-zone.service';

@UseGuards(AuthGuard('jwt'))
@Controller('experience-zone')
export class ExperienceZoneController {
  constructor(private readonly experienceZoneService: ExperienceZoneService) {}

  @Get()
  async findAll(): Promise<ApiResponse<any>> {
    const experienceZones = await this.experienceZoneService.findAll();
    return ApiResponse.success(
      'Discovery sessions fetched successfully',
      experienceZones,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const experienceZone = await this.experienceZoneService.findOne(id);
    return ApiResponse.success(
      'Experience zone fetched successfully',
      experienceZone,
    );
  }
}
