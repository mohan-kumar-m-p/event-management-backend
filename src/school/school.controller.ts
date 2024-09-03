import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiResponse } from 'src/shared/dto/api-response.dto';
import { SchoolService } from './school.service';
import { TransportDetailsDto } from './dto/transport-details.dto';
import { School } from './school.entity';

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
}
