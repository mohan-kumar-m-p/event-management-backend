import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Accommodation } from './accommodation.entity';
import { Block } from 'src/block/block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Accommodation, Block])],
  exports: [TypeOrmModule],
})
export class AccommodationModule {}
