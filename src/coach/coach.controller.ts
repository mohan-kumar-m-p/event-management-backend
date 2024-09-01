import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from '../shared/dto/api-response.dto';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';
import { CoachService } from './coach.service';
import { Request } from '@nestjs/common';

@UseGuards(AuthGuard('jwt'))
@Controller('coach')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Post()
  async create(
    @Body() coachDto: CreateCoachDto,
    @Request() req,
  ): Promise<ApiResponse<any>> {
    const schoolAffiliationNumber = req?.user?.entity || null;
    const coach = await this.coachService.createCoach(
      coachDto,
      schoolAffiliationNumber,
    );
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
    return ApiResponse.success(
      `Coach with ID ${id} retrieved successfully`,
      coach,
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() coachDto: UpdateCoachDto,
  ): Promise<ApiResponse<any>> {
    const updatedCoach = await this.coachService.updateCoach(id, coachDto);
    return ApiResponse.success(
      `Coach with ID ${id} updated successfully`,
      updatedCoach,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponse<any>> {
    await this.coachService.deleteCoach(id);
    return ApiResponse.success(`Coach with ID ${id} deleted successfully`);
  }
}
