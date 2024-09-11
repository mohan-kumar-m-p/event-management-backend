import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Round } from './round.entity';
import { RoundController } from './round.controller';
import { RoundService } from './round.service';
import { Athlete } from 'src/athlete/athlete.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Round, Athlete])],
  controllers: [RoundController],
  providers: [RoundService],
  exports: [RoundService],
})
export class RoundModule {}
