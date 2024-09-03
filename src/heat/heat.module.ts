import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Heat } from './heat.entity';
import { HeatController } from './heat.controller';
import { HeatService } from './heat.service';
import { Round } from 'src/round/round.entity';
import { Athlete } from 'src/athlete/athlete.entity';
import { AthleteHeat } from 'src/athlete-heat/athlete-heat.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Heat, Round, Event, Athlete, AthleteHeat]),
  ],
  controllers: [HeatController],
  providers: [HeatService],
  exports: [HeatService],
})
export class HeatModule {}
