import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AthleteService } from './athlete.service';
import { AthleteController } from './athlete.controller';
import { Athlete } from './athlete.entity';
import { School } from '../school/school.entity';
import { Event } from 'src/event/event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Athlete, School, Event])],
  controllers: [AthleteController],
  providers: [AthleteService],
  exports: [AthleteService],
})
export class AthleteModule {}
