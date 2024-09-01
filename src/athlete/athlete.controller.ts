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
import { AthleteService } from './athlete.service';
import { CreateAthleteDto } from './dto/create-athlete.dto';
import { UpdateAthleteDto } from './dto/update-athlete.dto';
import { Request } from '@nestjs/common';

@UseGuards(AuthGuard('jwt'))
@Controller('athlete')
export class AthleteController {
  constructor(private readonly athleteService: AthleteService) {}

  @Post()
  async create(
    @Body() athleteDto: CreateAthleteDto,
    @Request() req,
  ): Promise<ApiResponse<any>> {
    const athlete = await this.athleteService.createAthlete(
      athleteDto,
      req.user.sub,
    );
    return ApiResponse.success(
      'Athlete created successfully',
      athlete,
      HttpStatus.CREATED,
    );
  }

  @Get()
  async findAll(): Promise<ApiResponse<any>> {
    const athletes = await this.athleteService.findAll();
    return ApiResponse.success('Athletes retrieved successfully', athletes);
  }

  @Get(':id')
  async getAthlete(@Param('id') id: string): Promise<ApiResponse<any>> {
    const athlete = await this.athleteService.findOne(id);
    return ApiResponse.success('Athlete retrieved successfully', athlete);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() athleteDto: UpdateAthleteDto,
  ): Promise<ApiResponse<any>> {
    const updatedAthlete = await this.athleteService.updateAthlete(
      id,
      athleteDto,
    );
    return ApiResponse.success('Athlete updated successfully', updatedAthlete);
  }

  @Get(':id/eligible-events')
  async findEligibleEvents(
    @Param('id') athleteId: string,
  ): Promise<ApiResponse<any>> {
    const events = await this.athleteService.findEligibleEvents(athleteId);
    return ApiResponse.success(
      'Eligible events retrieved successfully',
      events,
    );
  }

  @Post(':id/events')
  async assignEvents(
    @Param('id') athleteId: string,
    @Body('eventIds') eventIds: string[],
  ): Promise<ApiResponse<any>> {
    const athlete = await this.athleteService.assignEvents(athleteId, eventIds);
    return ApiResponse.success('Events assigned successfully', athlete);
  }

  @Get(':id/events')
  async findAssignedEvents(
    @Param('id') athleteId: string,
  ): Promise<ApiResponse<any>> {
    const events = await this.athleteService.findAssignedEvents(athleteId);
    return ApiResponse.success(
      'Assigned events retrieved successfully',
      events,
    );
  }

  @Delete(':id/events')
  async unassignEvents(
    @Param('id') athleteId: string,
    @Body('eventIds') eventIds: string[],
  ): Promise<ApiResponse<any>> {
    const athlete = await this.athleteService.unassignEvents(
      athleteId,
      eventIds,
    );
    return ApiResponse.success('Events unassigned successfully', athlete);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponse<any>> {
    await this.athleteService.deleteAthlete(id);
    return ApiResponse.success('Athlete deleted successfully');
  }
}
