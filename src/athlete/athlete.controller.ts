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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.athleteService.deleteAthlete(id);
  }
}
