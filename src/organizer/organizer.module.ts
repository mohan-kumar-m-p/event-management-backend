import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organizer } from './organizer.entity';
import { OrganizerService } from './organizer.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Organizer])],
  providers: [OrganizerService],
  exports: [OrganizerService],
})
export class OrganizerModule {}
