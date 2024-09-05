import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../shared/shared.module';
import { ExperienceZoneController } from './experience-zone.controller';
import { ExperienceZone } from './experience-zone.entity';
import { ExperienceZoneService } from './experience-zone.service';

@Module({
  imports: [TypeOrmModule.forFeature([ExperienceZone]), SharedModule],
  controllers: [ExperienceZoneController],
  providers: [ExperienceZoneService, JwtService],
  exports: [ExperienceZoneService],
})
export class ExperienceZoneModule {}
