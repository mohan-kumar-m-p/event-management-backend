import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiResponse } from '../shared/dto/api-response.dto';
import { AthleteService } from './athlete.service';
import { CreateAthleteDto } from './dto/create-athlete.dto';
import { UpdateAthleteDto } from './dto/update-athlete.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('athlete')
export class AthleteController {
  constructor(private readonly athleteService: AthleteService) {}

  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Body() athleteDto: CreateAthleteDto,
    @UploadedFile() photo: Express.Multer.File,
    @Request() req,
  ): Promise<ApiResponse<any>> {
    const schoolAffiliationNumber = athleteDto.affiliationNumber
      ? athleteDto.affiliationNumber
      : req?.user?.sub;
    const athlete = await this.athleteService.createAthlete(
      athleteDto,
      schoolAffiliationNumber,
      photo,
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

  @Get('school/:id')
  async findAllBySchool(@Param('id') id: string): Promise<ApiResponse<any>> {
    const athletes = await this.athleteService.findAllBySchool(id);
    return ApiResponse.success('Athletes retrieved successfully', athletes);
  }

  @Get(':id')
  async getAthlete(@Param('id') id: string): Promise<ApiResponse<any>> {
    const athlete = await this.athleteService.findOne(id);
    return ApiResponse.success('Athlete retrieved successfully', athlete);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Param('id') id: string,
    @Body() athleteDto: UpdateAthleteDto,
    @UploadedFile() photo: Express.Multer.File,
  ): Promise<ApiResponse<any>> {
    const updatedAthlete = await this.athleteService.updateAthlete(
      id,
      athleteDto,
      photo,
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

  @Get(':id/athletes')
  async getQualifiedAthletesByRound(
    @Param('id') roundId: string,
  ): Promise<ApiResponse<any>> {
    const athletes =
      await this.athleteService.getQualifiedAthletesByRound(roundId);
    return ApiResponse.success('Rounds fetched successfully', athletes);
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

  @Put(':id/update-events')
  async updateAthleteEvents(
    @Param('id') id: string,
    @Body('eventIds') eventIds: string[],
  ): Promise<ApiResponse<any>> {
    const athlete = await this.athleteService.updateAthleteEvents(id, eventIds);
    return ApiResponse.success('Athlete events updated successfully', athlete);
  }

  // TODO Create an new endpoint for get all coaches for this athlete by using the school affiliation number from JWT.Response should be array of objects
  // TODO Create an new endpoint for get all managers for this athlete by using the school affiliation number from JWT. Response should be array of objects
  // TODO Create a new endpoint for get all events for an athlete that are in past and in future. Response should should be an object of 2 objects, past and future
  // TODO Create a new endpoint for win history for an athelete. Win means 1st, 2nd, or 3rd place. Response object should be an object or 2 objects, individual and group
  // TODO For athlete we need to get all accommodation details like name and block details and bed number
}
