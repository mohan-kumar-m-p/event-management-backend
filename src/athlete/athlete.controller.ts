import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { AthleteDto } from './athlete.dto';
import { AthleteService } from './athlete.service';
import { Athlete } from './athlete.entity';
import { Event } from 'src/event/event.entity';

@Controller('athlete')
export class AthleteController {
  constructor(private readonly athleteService: AthleteService) {}

  @Post()
  create(@Body() athleteDto: AthleteDto) {
    return this.athleteService.createAthlete(athleteDto);
  }

  @Get()
  findAll() {
    return this.athleteService.findAll();
  }

  @Get(':id')
  getAthlete(@Param('id') id: string) {
    return this.athleteService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() athleteDto: AthleteDto) {
    return this.athleteService.updateAthlete(id, athleteDto);
  }

  @Get(':id/eligible-events')
  findEligibleEvents(@Param('id') athleteId: string): Promise<Event[]> {
    return this.athleteService.findEligibleEvents(athleteId);
  }

  @Post(':id/events')
  async assignEvents(
    @Param('id') athleteId: string,
    @Body('eventIds') eventIds: string[],
  ): Promise<Athlete> {
    return this.athleteService.assignEvents(athleteId, eventIds);
  }

  @Get(':id/events')
  async findAssignedEvents(@Param('id') athleteId: string): Promise<Event[]> {
    return this.athleteService.findAssignedEvents(athleteId);
  }

  @Delete(':id/events')
  async unassignEvents(
    @Param('id') athleteId: string,
    @Body('eventIds') eventIds: string[],
  ): Promise<Athlete> {
    return this.athleteService.unassignEvents(athleteId, eventIds);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.athleteService.deleteAthlete(id);
  }
}
