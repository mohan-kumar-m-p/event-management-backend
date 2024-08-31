import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from 'src/shared/dto/api-response.dto';
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
}
