import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Round } from './round.entity';
import { RoundController } from './round.controller';
import { RoundService } from './round.service';

@Module({
  imports: [TypeOrmModule.forFeature([Round])],
  controllers: [RoundController],
  providers: [RoundService],
  exports: [RoundService],
})
export class RoundModule {}
