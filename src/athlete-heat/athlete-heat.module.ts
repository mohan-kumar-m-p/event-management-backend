import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AthleteHeat } from './athlete-heat.entity';
import { Athlete } from 'src/athlete/athlete.entity';
import { Heat } from 'src/heat/heat.entity';
import { AthleteHeatController } from './athlete-heat.controller';
import { AthleteHeatService } from './athlete-heat.service';

@Module({
  imports: [TypeOrmModule.forFeature([AthleteHeat, Athlete, Heat])],
  controllers: [AthleteHeatController],
  providers: [AthleteHeatService, JwtService],
  exports: [AthleteHeatService],
})
export class AthleteHeatModule {}
