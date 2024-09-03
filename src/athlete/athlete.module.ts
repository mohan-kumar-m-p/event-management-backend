import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../event/event.entity';
import { School } from '../school/school.entity';
import { AthleteController } from './athlete.controller';
import { Athlete } from './athlete.entity';
import { AthleteService } from './athlete.service';
import { Round } from 'src/round/round.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Athlete, School, Event, Round])],
  controllers: [AthleteController],
  providers: [AthleteService, JwtService],
  exports: [AthleteService],
})
export class AthleteModule {}
