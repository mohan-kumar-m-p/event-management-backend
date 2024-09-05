import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Athlete } from 'src/athlete/athlete.entity';
import { School } from '../school/school.entity';
import { SharedModule } from '../shared/shared.module';
import { CulturalProgramController } from './cultural-program.controller';
import { CulturalProgram } from './cultural-program.entity';
import { CulturalProgramService } from './cultural-program.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CulturalProgram, Athlete, School]),
    SharedModule,
  ],
  controllers: [CulturalProgramController],
  providers: [CulturalProgramService, JwtService],
  exports: [CulturalProgramService],
})
export class CulturalProgramModule {}
