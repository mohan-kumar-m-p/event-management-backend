import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Accommodation } from './accommodation.entity';
import { Block } from 'src/block/block.entity';
import { AccommodationController } from './accommodation.controller';
import { AccommodationService } from './accommodation.service';
import { Athlete } from 'src/athlete/athlete.entity';
import { Manager } from 'src/manager/manager.entity';
import { Coach } from 'src/coach/coach.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Accommodation, Block, Athlete, Manager, Coach]),
  ],
  controllers: [AccommodationController],
  providers: [AccommodationService],
  exports: [TypeOrmModule],
})
export class AccommodationModule {}
