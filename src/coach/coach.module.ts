import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Accommodation } from '../accommodation/accommodation.entity';
import { School } from '../school/school.entity';
import { CoachController } from './coach.controller';
import { Coach } from './coach.entity';
import { CoachService } from './coach.service';

@Module({
  imports: [TypeOrmModule.forFeature([Coach, School, Accommodation])],
  controllers: [CoachController],
  providers: [CoachService, JwtService],
  exports: [CoachService],
})
export class CoachModule {}
