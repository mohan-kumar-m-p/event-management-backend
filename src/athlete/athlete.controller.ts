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
import { RolesGuard } from '../guards/role.guard';
import { OrganizerRole, SchoolRole } from '../shared/roles';

@UseGuards(AuthGuard('jwt'))
@Controller('athlete')
export class AthleteController {
  constructor(private readonly athleteService: AthleteService) {}

  @Post()
  @UseGuards(
    RolesGuard([OrganizerRole.RegistrationInCharge, SchoolRole.School]),
  )
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
  @UseGuards(
    RolesGuard([OrganizerRole.RegistrationInCharge, SchoolRole.School]),
  )
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
  @UseGuards(
    RolesGuard([OrganizerRole.RegistrationInCharge, SchoolRole.School]),
  )
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
  @UseGuards(
    RolesGuard([OrganizerRole.RegistrationInCharge, SchoolRole.School]),
  )
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
  @UseGuards(
    RolesGuard([OrganizerRole.RegistrationInCharge, SchoolRole.School]),
  )
  async remove(@Param('id') id: string): Promise<ApiResponse<any>> {
    await this.athleteService.deleteAthlete(id);
    return ApiResponse.success('Athlete deleted successfully');
  }

  @Put(':id/update-events')
  @UseGuards(
    RolesGuard([OrganizerRole.RegistrationInCharge, SchoolRole.School]),
  )
  async updateAthleteEvents(
    @Param('id') id: string,
    @Body('eventIds') eventIds: string[],
  ): Promise<ApiResponse<any>> {
    const athlete = await this.athleteService.updateAthleteEvents(id, eventIds);
    return ApiResponse.success('Athlete events updated successfully', athlete);
  }

  @Get(':id/past-events')
  async findPastEvents(@Param('id') id: string): Promise<ApiResponse<any>> {
    const events = await this.athleteService.findPastEvents(id);
    return ApiResponse.success(
      `Past events for athlete with ID ${id} retrieved successfully`,
      events,
    );
  }

  @Get(':id/upcoming-events')
  async findUpcomingEvents(@Param('id') id: string): Promise<ApiResponse<any>> {
    const events = await this.athleteService.findUpcomingEvents(id);
    return ApiResponse.success(
      `Upcoming events for athlete with ID ${id} retrieved successfully`,
      events,
    );
  }
}
