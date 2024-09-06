import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from 'src/shared/dto/api-response.dto';
import { TransportDetailsDto } from './dto/transport-details.dto';
import { School } from './school.entity';
import { SchoolService } from './school.service';

@UseGuards(AuthGuard('jwt'))
@Controller('school')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Get()
  async findAll(): Promise<ApiResponse<any>> {
    const schools = await this.schoolService.findAll();
    return ApiResponse.success('Schools retrieved successfully', schools);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const school = await this.schoolService.findOne(id);
    return ApiResponse.success('School retrieved successfully', school);
  }

  @Patch(':id/transport-details')
  async updateTransportDetails(
    @Param('id') id: string,
    @Body() transportDetails: TransportDetailsDto,
  ): Promise<ApiResponse<School>> {
    const updatedSchool = await this.schoolService.updateTransportDetails(
      id,
      transportDetails,
    );
    return ApiResponse.success(
      'Transport details updated successfully',
      updatedSchool,
    );
  }

  @Patch(':id/accommodation')
  async updateAccommodationRequirement(
    @Param('id') id: string,
    @Body('accommodationRequired') accommodationRequired: boolean,
  ): Promise<ApiResponse<any>> {
    await this.schoolService.updateAccommodationRequirement(
      id,
      accommodationRequired,
    );
    return ApiResponse.success(
      'Accommodation requirement updated successfully',
    );
  }
}
