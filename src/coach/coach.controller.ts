import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CoachDto } from './coach.dto';
import { CoachService } from './coach.service';
import { ApiResponse } from 'src/shared/dto/api-response.dto';

@Controller('coach')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Post()
  async create(@Body() coachDto: CoachDto): Promise<ApiResponse<any>> {
    const coach = await this.coachService.createCoach(coachDto);
    return ApiResponse.success(
      'Coach created successfully',
      coach,
      HttpStatus.CREATED,
    );
  }

  @Get()
  async findAll(): Promise<ApiResponse<any>> {
    const coaches = await this.coachService.findAll();
    return ApiResponse.success('Coaches retrieved successfully', coaches);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const coach = await this.coachService.findOne(id);
    return ApiResponse.success('Coach retrieved successfully', coach);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() coachDto: CoachDto,
  ): Promise<ApiResponse<any>> {
    const updatedCoach = await this.coachService.updateCoach(id, coachDto);
    return ApiResponse.success('Coach updated successfully', updatedCoach);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponse<any>> {
    await this.coachService.deleteCoach(id);
    return ApiResponse.success('Coach deleted successfully');
  }
}
