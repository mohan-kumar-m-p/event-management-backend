import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoachService } from './coach.service';
import { CoachController } from './coach.controller';
import { Coach } from './coach.entity';
import { School } from 'src/school/school.entity';
import { Accommodation } from 'src/accommodation/accommodation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Coach, School, Accommodation])],
  controllers: [CoachController],
  providers: [CoachService],
  exports: [CoachService],
})
export class CoachModule {}
