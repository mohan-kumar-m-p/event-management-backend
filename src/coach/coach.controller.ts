import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CoachDto } from './coach.dto';
import { CoachService } from './coach.service';

@Controller('coach')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Post()
  create(@Body() coachDto: CoachDto) {
    return this.coachService.createCoach(coachDto);
  }

  @Get()
  findAll() {
    return this.coachService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coachService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() coachDto: CoachDto) {
    return this.coachService.updateCoach(id, coachDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coachService.deleteCoach(id);
  }
}
